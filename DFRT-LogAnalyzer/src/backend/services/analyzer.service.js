/**
 * Analyzer Service
 * Wrapper around the DFRT fallback analyzer
 * Provides high-level analysis interface for the API
 */

const fs = require('fs');
const path = require('path');
const FallbackAnalyzer = require('./analyzer.fallback');
const { AppError } = require('../middleware/error.middleware');

class AnalyzerService {
  constructor() {
    this.analyzer = new FallbackAnalyzer();
    this.analyzer.initialize({});
  }

  /**
   * Analyze log file and extract threats
   * @param {string} filePath - Path to log file
   * @param {string} analysisType - Type of analysis (quick, comprehensive, etc.)
   * @returns {Promise<Array>} Array of detected threats
   */
  async analyzeLog(filePath, analysisType = 'comprehensive') {
    try {
      // Validate file exists
      if (!fs.existsSync(filePath)) {
        throw new AppError('Log file not found', 404);
      }

      // Run analysis
      const result = await this.analyzer.analyzeFile(filePath);

      // Extract threats from result
      const threats = this.extractThreats(result, analysisType);

      return threats;
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError(`Analysis failed: ${err.message}`, 500);
    }
  }

  /**
   * Extract threats from analysis result
   * @private
   */
  extractThreats(analysisResult, analysisType) {
    const threats = [];

    if (!analysisResult) {
      return threats;
    }

    // Extract failed logins
    if (analysisResult.failedLogins) {
      Object.entries(analysisResult.failedLogins).forEach(([user, count]) => {
        if (count >= 3) {
          threats.push({
            type: 'failed_login',
            severity: count >= 10 ? 'high' : 'medium',
            description: `${count} failed login attempts for user '${user}'`,
            evidence: `User '${user}' had ${count} failed authentication attempts`,
            timestamp: new Date().toISOString()
          });
        }
      });
    }

    // Extract brute force attempts
    if (analysisResult.bruteForceAttempts) {
      analysisResult.bruteForceAttempts.forEach(attempt => {
        threats.push({
          type: 'brute_force',
          severity: 'high',
          description: `Potential brute force attack detected`,
          evidence: JSON.stringify(attempt),
          timestamp: new Date().toISOString()
        });
      });
    }

    // Extract suspicious activities
    if (analysisResult.suspiciousActivities) {
      analysisResult.suspiciousActivities.forEach(activity => {
        threats.push({
          type: 'suspicious_activity',
          severity: 'medium',
          description: `Suspicious activity: ${activity.description}`,
          evidence: JSON.stringify(activity),
          timestamp: new Date().toISOString()
        });
      });
    }

    // Extract privilege escalations
    if (analysisResult.privilegeEscalations) {
      analysisResult.privilegeEscalations.forEach(escalation => {
        threats.push({
          type: 'privilege_escalation',
          severity: 'high',
          description: `Privilege escalation detected: ${escalation.user}`,
          evidence: JSON.stringify(escalation),
          timestamp: new Date().toISOString()
        });
      });
    }

    // Extract unauthorized access
    if (analysisResult.unauthorizedAccess) {
      analysisResult.unauthorizedAccess.forEach(access => {
        threats.push({
          type: 'unauthorized_access',
          severity: 'critical',
          description: `Unauthorized access attempt detected`,
          evidence: JSON.stringify(access),
          timestamp: new Date().toISOString()
        });
      });
    }

    // Sort by severity
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    threats.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return threats;
  }

  /**
   * Get analysis status/progress
   * @private
   */
  getStatus() {
    return {
      status: 'ready',
      analyzerVersion: '3.0.0'
    };
  }
}

// Singleton instance
const analyzerService = new AnalyzerService();

module.exports = analyzerService;
