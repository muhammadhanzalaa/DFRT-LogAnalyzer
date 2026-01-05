/**
 * Report Routes
 * Generates and manages threat analysis reports
 */

const express = require('express');
const router = express.Router();
const { asyncHandler, AppError } = require('../middleware/error.middleware');
const dbService = require('../services/database.service');
const reportService = require('../services/report.service');

/**
 * GET /api/reports/:analysisId
 * Generate report for analysis
 */
router.get('/:analysisId', asyncHandler(async (req, res) => {
  const { analysisId } = req.params;
  const { format = 'json' } = req.query;

  const analysis = await dbService.queryOne(
    `SELECT * FROM analysis WHERE id = ?`,
    [analysisId]
  );

  if (!analysis) {
    throw new AppError('Analysis not found', 404);
  }

  const threats = await dbService.query(
    `SELECT * FROM threats WHERE analysisId = ? ORDER BY severity DESC, timestamp DESC`,
    [analysisId]
  );

  const log = await dbService.queryOne(
    `SELECT * FROM logs WHERE id = ?`,
    [analysis.logId]
  );

  // Generate report
  const report = {
    metadata: {
      id: `REPORT-${analysis.id}`,
      analysisId: analysis.id,
      logFile: log?.filename,
      generatedAt: new Date().toISOString(),
      analysisType: analysis.analysisType
    },
    summary: {
      totalThreats: threats.length,
      criticalThreats: threats.filter(t => t.severity === 'critical').length,
      highThreats: threats.filter(t => t.severity === 'high').length,
      mediumThreats: threats.filter(t => t.severity === 'medium').length,
      lowThreats: threats.filter(t => t.severity === 'low').length
    },
    threats: threats.map(t => ({
      id: t.id,
      type: t.threatType,
      severity: t.severity,
      description: t.description,
      evidence: t.evidence,
      timestamp: t.timestamp,
      resolved: t.resolved,
      resolutionNotes: t.resolutionNotes
    })),
    recommendations: generateRecommendations(threats)
  };

  // Handle different formats
  if (format === 'csv') {
    const csv = await reportService.generateCSV(report);
    res.set('Content-Type', 'text/csv');
    res.set('Content-Disposition', `attachment; filename="report-${analysis.id}.csv"`);
    res.send(csv);
  } else if (format === 'pdf') {
    const pdf = await reportService.generatePDF(report);
    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', `attachment; filename="report-${analysis.id}.pdf"`);
    res.send(pdf);
  } else {
    res.json({
      success: true,
      data: report
    });
  }
}));

/**
 * POST /api/reports/:analysisId/resolve
 * Mark threat as resolved
 */
router.post('/:analysisId/threats/:threatId/resolve', asyncHandler(async (req, res) => {
  const { threatId } = req.params;
  const { resolutionNotes = '' } = req.body;

  const threat = await dbService.queryOne(
    `SELECT * FROM threats WHERE id = ?`,
    [threatId]
  );

  if (!threat) {
    throw new AppError('Threat not found', 404);
  }

  await dbService.update(
    `UPDATE threats SET resolved = 1, resolutionNotes = ? WHERE id = ?`,
    [resolutionNotes, threatId]
  );

  const updated = await dbService.queryOne(
    `SELECT * FROM threats WHERE id = ?`,
    [threatId]
  );

  res.json({
    success: true,
    message: 'Threat marked as resolved',
    data: updated
  });
}));

/**
 * GET /api/reports/summary
 * Get overall summary statistics
 */
router.get('/summary', asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  let query = 'SELECT COUNT(*) as count FROM analysis WHERE 1=1';
  const params = [];

  if (startDate) {
    query += ' AND createdAt >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND createdAt <= ?';
    params.push(endDate);
  }

  const analysisCount = await dbService.queryOne(query, params);

  query = 'SELECT severity, COUNT(*) as count FROM threats WHERE 1=1';
  const severityParams = [];

  if (startDate) {
    query += ' AND createdAt >= ?';
    severityParams.push(startDate);
  }
  if (endDate) {
    query += ' AND createdAt <= ?';
    severityParams.push(endDate);
  }

  query += ' GROUP BY severity';
  const threatsBySeverity = await dbService.query(query, severityParams);

  res.json({
    success: true,
    data: {
      totalAnalyses: analysisCount.count,
      threatsBySeverity: threatsBySeverity.reduce((acc, row) => {
        acc[row.severity] = row.count;
        return acc;
      }, {})
    }
  });
}));

/**
 * Helper function to generate recommendations based on threats
 */
function generateRecommendations(threats) {
  const recommendations = [];
  const severities = new Set(threats.map(t => t.severity));

  if (severities.has('critical')) {
    recommendations.push('CRITICAL: Immediate action required. Review and remediate critical threats.');
  }
  
  if (severities.has('high')) {
    recommendations.push('HIGH: Investigate and remediate high severity threats within 24 hours.');
  }

  if (severities.has('medium')) {
    recommendations.push('MEDIUM: Schedule review and mitigation within 7 days.');
  }

  if (threats.some(t => t.threatType === 'unauthorized_access')) {
    recommendations.push('Review access logs and update access control policies.');
  }

  if (threats.some(t => t.threatType === 'privilege_escalation')) {
    recommendations.push('Audit privileged accounts and strengthen privilege management controls.');
  }

  if (threats.some(t => t.threatType === 'data_exfiltration')) {
    recommendations.push('Review data loss prevention policies and monitor suspicious data transfers.');
  }

  return recommendations;
}

module.exports = router;
