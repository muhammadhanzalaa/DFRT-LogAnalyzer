/**
 * Log Management Routes
 * Handles file upload, retrieval, and log management endpoints
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { asyncHandler, AppError } = require('../middleware/error.middleware');
const { uploadSingle, uploadMultiple } = require('../middleware/upload.middleware');
const { authenticateJWT } = require('../middleware/security.middleware');
const dbService = require('../services/database.service');
const { validators } = require('../utils/validation');

/**
 * POST /api/logs/upload
 * Upload a single log file
 */
router.post('/upload', uploadSingle, asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }

  try {
    // Insert into database
    const logId = await dbService.insert(
      `INSERT INTO logs (filename, filePath, fileSize, status) VALUES (?, ?, ?, ?)`,
      [req.file.originalname, req.file.path, req.file.size, 'uploaded']
    );

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        id: logId,
        filename: req.file.originalname,
        filepath: req.file.path,
        size: req.file.size,
        uploadedAt: new Date()
      }
    });
  } catch (err) {
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    throw err;
  }
}));

/**
 * POST /api/logs/upload-multiple
 * Upload multiple log files
 */
router.post('/upload-multiple', uploadMultiple, asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new AppError('No files uploaded', 400);
  }

  const uploadedLogs = [];
  const errors = [];

  for (const file of req.files) {
    try {
      const logId = await dbService.insert(
        `INSERT INTO logs (filename, filePath, fileSize, status) VALUES (?, ?, ?, ?)`,
        [file.originalname, file.path, file.size, 'uploaded']
      );
      uploadedLogs.push({
        id: logId,
        filename: file.originalname,
        size: file.size
      });
    } catch (err) {
      errors.push({
        filename: file.originalname,
        error: err.message
      });
    }
  }

  res.status(207).json({
    success: errors.length === 0,
    message: `${uploadedLogs.length} of ${req.files.length} files uploaded`,
    data: {
      uploaded: uploadedLogs,
      errors: errors.length > 0 ? errors : undefined
    }
  });
}));

/**
 * GET /api/logs
 * List all uploaded logs
 */
router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status = '' } = req.query;
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM logs';
  const params = [];

  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }

  query += ' ORDER BY uploadedAt DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  const logs = await dbService.query(query, params);

  // Get total count
  let countQuery = 'SELECT COUNT(*) as count FROM logs';
  const countParams = [];
  if (status) {
    countQuery += ' WHERE status = ?';
    countParams.push(status);
  }
  const countResult = await dbService.queryOne(countQuery, countParams);

  res.json({
    success: true,
    data: logs,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: countResult.count,
      totalPages: Math.ceil(countResult.count / limit)
    }
  });
}));

/**
 * GET /api/logs/:id
 * Get log details
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const log = await dbService.queryOne(
    `SELECT * FROM logs WHERE id = ?`,
    [id]
  );

  if (!log) {
    throw new AppError('Log not found', 404);
  }

  res.json({
    success: true,
    data: log
  });
}));

/**
 * GET /api/logs/:id/download
 * Download log file
 */
router.get('/:id/download', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const log = await dbService.queryOne(
    `SELECT * FROM logs WHERE id = ?`,
    [id]
  );

  if (!log) {
    throw new AppError('Log not found', 404);
  }

  if (!fs.existsSync(log.filePath)) {
    throw new AppError('File not found on disk', 404);
  }

  res.download(log.filePath, log.filename);
}));

/**
 * DELETE /api/logs/:id
 * Delete log and associated analysis
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const log = await dbService.queryOne(
    `SELECT * FROM logs WHERE id = ?`,
    [id]
  );

  if (!log) {
    throw new AppError('Log not found', 404);
  }

  // Use transaction to ensure data consistency
  await dbService.transaction(async (db) => {
    // Delete associated analysis and threats
    await db.delete(`DELETE FROM threats WHERE analysisId IN (SELECT id FROM analysis WHERE logId = ?)`, [id]);
    await db.delete(`DELETE FROM analysis WHERE logId = ?`, [id]);
    
    // Delete log
    await db.delete(`DELETE FROM logs WHERE id = ?`, [id]);
  });

  // Delete file from disk
  if (fs.existsSync(log.filePath)) {
    fs.unlinkSync(log.filePath);
  }

  res.json({
    success: true,
    message: 'Log deleted successfully'
  });
}));

/**
 * PATCH /api/logs/:id
 * Update log metadata
 */
router.patch('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { lineCount } = req.body;

  const log = await dbService.queryOne(
    `SELECT * FROM logs WHERE id = ?`,
    [id]
  );

  if (!log) {
    throw new AppError('Log not found', 404);
  }

  const updates = [];
  const values = [];

  if (lineCount !== undefined) {
    updates.push('lineCount = ?');
    values.push(lineCount);
  }

  if (updates.length === 0) {
    throw new AppError('No fields to update', 400);
  }

  values.push(id);
  const query = `UPDATE logs SET ${updates.join(', ')}, uploadedAt = CURRENT_TIMESTAMP WHERE id = ?`;

  await dbService.update(query, values);

  const updatedLog = await dbService.queryOne(
    `SELECT * FROM logs WHERE id = ?`,
    [id]
  );

  res.json({
    success: true,
    message: 'Log updated successfully',
    data: updatedLog
  });
}));

module.exports = router;
