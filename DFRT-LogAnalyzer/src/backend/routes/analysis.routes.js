/**
 * Analysis Routes
 * @file analysis.routes.js
 * Handles threat analysis endpoints
 * @version 3.0.0 (Phase 4 - Backend Optimization)
 */

const express = require('express');
const router = express.Router();
const { asyncHandler, AppError } = require('../middleware/error.middleware');
const dbService = require('../services/database.service');
const analyzerService = require('../services/analyzer.service');
const { validators } = require('../utils/validation');

/**
 * POST /api/analysis
 * Create new analysis for a log
 */
router.post('/', asyncHandler(async (req, res) => {
  const { logId, analysisType = 'comprehensive' } = req.body;

  // Validate input
  if (!logId) {
    throw new AppError('logId is required', 400);
  }

  // Check if log exists
  const log = await dbService.queryOne(
    `SELECT * FROM logs WHERE id = ?`,
    [logId]
  );

  if (!log) {
    throw new AppError('Log not found', 404);
  }

  try {
    // Create analysis record
    const analysisId = await dbService.insert(
      `INSERT INTO analysis (logId, analysisType, status) VALUES (?, ?, ?)`,
      [logId, analysisType, 'processing']
    );

    // Start analysis (async in production)
    const threats = await analyzerService.analyzeLog(log.filePath, analysisType);

    // Update analysis record
    await dbService.update(
      `UPDATE analysis SET analysisData = ?, status = ? WHERE id = ?`,
      [JSON.stringify({ threatCount: threats.length }), 'completed', analysisId]
    );

    // Insert threat records
    for (const threat of threats) {
      await dbService.insert(
        `INSERT INTO threats (analysisId, threatType, severity, description, evidence) VALUES (?, ?, ?, ?, ?)`,
        [analysisId, threat.type, threat.severity, threat.description, threat.evidence]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Analysis completed',
      data: {
        id: analysisId,
        logId,
        analysisType,
        threatCount: threats.length,
        threats
      }
    });
  } catch (err) {
    throw new AppError(`Analysis failed: ${err.message}`, 500);
  }
}));

/**
 * GET /api/analysis
 * Get all analyses
 */
router.get('/', asyncHandler(async (req, res) => {
  const { logId, status = '', page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM analysis WHERE 1=1';
  const params = [];

  if (logId) {
    query += ' AND logId = ?';
    params.push(logId);
  }

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  const analyses = await dbService.query(query, params);

  // Get total count
  let countQuery = 'SELECT COUNT(*) as count FROM analysis WHERE 1=1';
  const countParams = [];
  if (logId) {
    countQuery += ' AND logId = ?';
    countParams.push(logId);
  }
  if (status) {
    countQuery += ' AND status = ?';
    countParams.push(status);
  }
  const countResult = await dbService.queryOne(countQuery, countParams);

  res.json({
    success: true,
    data: analyses,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: countResult.count,
      totalPages: Math.ceil(countResult.count / limit)
    }
  });
}));

/**
 * GET /api/analysis/:id
 * Get analysis details with threats
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const analysis = await dbService.queryOne(
    `SELECT * FROM analysis WHERE id = ?`,
    [id]
  );

  if (!analysis) {
    throw new AppError('Analysis not found', 404);
  }

  const threats = await dbService.query(
    `SELECT * FROM threats WHERE analysisId = ? ORDER BY severity DESC`,
    [id]
  );

  res.json({
    success: true,
    data: {
      ...analysis,
      threats
    }
  });
}));

/**
 * PATCH /api/analysis/:id
 * Update analysis
 */
router.patch('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, analysisData } = req.body;

  const analysis = await dbService.queryOne(
    `SELECT * FROM analysis WHERE id = ?`,
    [id]
  );

  if (!analysis) {
    throw new AppError('Analysis not found', 404);
  }

  const updates = [];
  const values = [];

  if (status) {
    updates.push('status = ?');
    values.push(status);
  }

  if (analysisData) {
    updates.push('analysisData = ?');
    values.push(JSON.stringify(analysisData));
  }

  if (updates.length === 0) {
    throw new AppError('No fields to update', 400);
  }

  updates.push('updatedAt = CURRENT_TIMESTAMP');
  values.push(id);

  await dbService.update(
    `UPDATE analysis SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  const updated = await dbService.queryOne(
    `SELECT * FROM analysis WHERE id = ?`,
    [id]
  );

  res.json({
    success: true,
    message: 'Analysis updated',
    data: updated
  });
}));

/**
 * DELETE /api/analysis/:id
 * Delete analysis and associated threats
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const analysis = await dbService.queryOne(
    `SELECT * FROM analysis WHERE id = ?`,
    [id]
  );

  if (!analysis) {
    throw new AppError('Analysis not found', 404);
  }

  // Use transaction
  await dbService.transaction(async (db) => {
    await db.delete(`DELETE FROM threats WHERE analysisId = ?`, [id]);
    await db.delete(`DELETE FROM analysis WHERE id = ?`, [id]);
  });

  res.json({
    success: true,
    message: 'Analysis deleted'
  });
}));

module.exports = router;
