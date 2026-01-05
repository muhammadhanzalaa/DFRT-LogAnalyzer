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

/**
 * GET /api/analysis/:id
 * Get analysis details
 */
router.get('/:id',
    authMiddleware,
    async (req, res, next) => {
        try {
            const analysis = await AnalysisService.getAnalysisById(req.params.id);
            
            // Check ownership
            if (analysis.userId !== req.user.id && req.user.role !== 'admin') {
                throw new NotFoundError('Analysis');
            }
            
            res.json(new ApiResponse(true, analysis, 'Analysis retrieved', 'OK'));
        } catch (error) {
            next(error);
        }
    }
);

/**
 * PUT /api/analysis/:id
 * Update analysis
 */
router.put('/:id',
    authMiddleware,
    validationMiddleware.field({
        name: ['required']
    }),
    async (req, res, next) => {
        try {
            const analysis = await AnalysisService.getAnalysisById(req.params.id);
            
            // Check ownership
            if (analysis.userId !== req.user.id && req.user.role !== 'admin') {
                throw new NotFoundError('Analysis');
            }
            
            const updated = await AnalysisService.updateAnalysis(req.params.id, req.body);
            res.json(new ApiResponse(true, updated, 'Analysis updated', 'OK'));
        } catch (error) {
            next(error);
        }
    }
);

/**
 * DELETE /api/analysis/:id
 * Delete analysis
 */
router.delete('/:id',
    authMiddleware,
    async (req, res, next) => {
        try {
            const analysis = await AnalysisService.getAnalysisById(req.params.id);
            
            // Check ownership
            if (analysis.userId !== req.user.id && req.user.role !== 'admin') {
                throw new NotFoundError('Analysis');
            }
            
            const result = await AnalysisService.deleteAnalysis(req.params.id);
            res.json(new ApiResponse(true, result, 'Analysis deleted', 'OK'));
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/analysis/:id/start
 * Start analysis processing
 */
router.post('/:id/start',
    authMiddleware,
    async (req, res, next) => {
        try {
            const analysis = await AnalysisService.getAnalysisById(req.params.id);
            
            // Check ownership
            if (analysis.userId !== req.user.id && req.user.role !== 'admin') {
                throw new NotFoundError('Analysis');
            }
            
            const { filePaths } = req.body;
            const result = await AnalysisService.startAnalysis(req.params.id, filePaths);
            res.json(new ApiResponse(true, result, 'Analysis started', 'OK'));
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/analysis/:id/logs
 * Get log entries
 */
router.get('/:id/logs',
    authMiddleware,
    async (req, res, next) => {
        try {
            const analysis = await AnalysisService.getAnalysisById(req.params.id);
            
            // Check ownership
            if (analysis.userId !== req.user.id && req.user.role !== 'admin') {
                throw new NotFoundError('Analysis');
            }
            
            const options = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 50,
                severity: req.query.severity,
                search: req.query.search
            };
            const result = await LogService.getLogEntries(req.params.id, options);
            res.json(new ApiResponse(true, result.data, 'Log entries retrieved', 'OK', result.pagination));
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/analysis/:id/threats
 * Get threats
 */
router.get('/:id/threats',
    authMiddleware,
    async (req, res, next) => {
        try {
            const analysis = await AnalysisService.getAnalysisById(req.params.id);
            
            // Check ownership
            if (analysis.userId !== req.user.id && req.user.role !== 'admin') {
                throw new NotFoundError('Analysis');
            }
            
            const options = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 20,
                severity: req.query.severity,
                threatType: req.query.threatType
            };
            const result = await LogService.getThreats(req.params.id, options);
            res.json(new ApiResponse(true, result.data, 'Threats retrieved', 'OK', result.pagination));
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/analysis/:id/stats
 * Get analysis statistics
 */
router.get('/:id/stats',
    authMiddleware,
    async (req, res, next) => {
        try {
            const analysis = await AnalysisService.getAnalysisById(req.params.id);
            
            // Check ownership
            if (analysis.userId !== req.user.id && req.user.role !== 'admin') {
                throw new NotFoundError('Analysis');
            }
            
            const [severityStats, sourceStats, threatSummary] = await Promise.all([
                LogService.getSeverityStats(req.params.id),
                LogService.getSourceStats(req.params.id),
                LogService.getThreatSummary(req.params.id)
            ]);
            
            const stats = {
                severity: severityStats,
                sources: sourceStats,
                threats: threatSummary
            };
            
            res.json(new ApiResponse(true, stats, 'Statistics retrieved', 'OK'));
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;
