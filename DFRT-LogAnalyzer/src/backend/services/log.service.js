/**
 * Log Service - Business Logic
 * @file log.service.js
 * Handles log entry queries and filtering
 */

const { DatabaseError, NotFoundError } = require('../utils/response.handler');

class LogService {
    static database = null;

    static setDatabase(db) {
        this.database = db;
    }

    /**
     * Get log entries for analysis
     */
    static async getLogEntries(analysisId, options = {}) {
        const { page = 1, limit = 50, severity = null, search = null } = options;
        const offset = (page - 1) * limit;

        try {
            let query = 'SELECT * FROM log_entries WHERE analysisId = ?';
            let params = [analysisId];

            if (severity) {
                query += ' AND severity = ?';
                params.push(severity);
            }

            if (search) {
                query += ' AND (description LIKE ? OR source LIKE ?)';
                params.push(`%${search}%`, `%${search}%`);
            }

            query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const rows = await this.database.all(query, params);

            // Parse metadata
            rows.forEach(row => {
                if (row.metadata) {
                    row.metadata = JSON.parse(row.metadata);
                }
            });

            // Count total
            let countQuery = 'SELECT COUNT(*) as total FROM log_entries WHERE analysisId = ?';
            let countParams = [analysisId];

            if (severity) {
                countQuery += ' AND severity = ?';
                countParams.push(severity);
            }

            if (search) {
                countQuery += ' AND (description LIKE ? OR source LIKE ?)';
                countParams.push(`%${search}%`, `%${search}%`);
            }

            const countResult = await this.database.get(countQuery, countParams);

            return {
                data: rows,
                pagination: {
                    total: countResult.total,
                    page,
                    limit,
                    pages: Math.ceil(countResult.total / limit)
                }
            };
        } catch (error) {
            throw new DatabaseError('Failed to get log entries', error);
        }
    }

    /**
     * Get severity statistics
     */
    static async getSeverityStats(analysisId) {
        try {
            const result = await this.database.all(
                `SELECT severity, COUNT(*) as count 
                 FROM log_entries 
                 WHERE analysisId = ? 
                 GROUP BY severity`,
                [analysisId]
            );

            const stats = {
                critical: 0,
                error: 0,
                warning: 0,
                info: 0,
                debug: 0
            };

            result.forEach(row => {
                if (stats.hasOwnProperty(row.severity)) {
                    stats[row.severity] = row.count;
                }
            });

            return stats;
        } catch (error) {
            throw new DatabaseError('Failed to get severity statistics', error);
        }
    }

    /**
     * Get source statistics
     */
    static async getSourceStats(analysisId) {
        try {
            const result = await this.database.all(
                `SELECT source, COUNT(*) as count 
                 FROM log_entries 
                 WHERE analysisId = ? 
                 GROUP BY source
                 ORDER BY count DESC
                 LIMIT 10`,
                [analysisId]
            );

            return result;
        } catch (error) {
            throw new DatabaseError('Failed to get source statistics', error);
        }
    }

    /**
     * Get threats
     */
    static async getThreats(analysisId, options = {}) {
        const { page = 1, limit = 20, severity = null, threatType = null } = options;
        const offset = (page - 1) * limit;

        try {
            let query = 'SELECT * FROM threats WHERE analysisId = ?';
            let params = [analysisId];

            if (severity) {
                query += ' AND severity = ?';
                params.push(severity);
            }

            if (threatType) {
                query += ' AND threatType = ?';
                params.push(threatType);
            }

            query += ' ORDER BY detectedAt DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const rows = await this.database.all(query, params);

            // Parse details
            rows.forEach(row => {
                if (row.details) {
                    row.details = JSON.parse(row.details);
                }
            });

            // Count total
            let countQuery = 'SELECT COUNT(*) as total FROM threats WHERE analysisId = ?';
            let countParams = [analysisId];

            if (severity) {
                countQuery += ' AND severity = ?';
                countParams.push(severity);
            }

            if (threatType) {
                countQuery += ' AND threatType = ?';
                countParams.push(threatType);
            }

            const countResult = await this.database.get(countQuery, countParams);

            return {
                data: rows,
                pagination: {
                    total: countResult.total,
                    page,
                    limit,
                    pages: Math.ceil(countResult.total / limit)
                }
            };
        } catch (error) {
            throw new DatabaseError('Failed to get threats', error);
        }
    }

    /**
     * Get threat summary
     */
    static async getThreatSummary(analysisId) {
        try {
            const result = await this.database.all(
                `SELECT threatType, severity, COUNT(*) as count 
                 FROM threats 
                 WHERE analysisId = ? 
                 GROUP BY threatType, severity`,
                [analysisId]
            );

            const summary = {
                brute_force: { critical: 0, error: 0, warning: 0 },
                tampering: { critical: 0, error: 0, warning: 0 },
                anomaly: { critical: 0, error: 0, warning: 0 },
                suspicious_activity: { critical: 0, error: 0, warning: 0 }
            };

            result.forEach(row => {
                if (summary[row.threatType]) {
                    summary[row.threatType][row.severity] = row.count;
                }
            });

            return summary;
        } catch (error) {
            throw new DatabaseError('Failed to get threat summary', error);
        }
    }

    /**
     * Get timeline data
     */
    static async getTimeline(analysisId, options = {}) {
        const { startDate = null, endDate = null } = options;

        try {
            let query = `SELECT timestamp, severity, COUNT(*) as count 
                         FROM log_entries 
                         WHERE analysisId = ?`;
            let params = [analysisId];

            if (startDate) {
                query += ' AND timestamp >= ?';
                params.push(startDate);
            }

            if (endDate) {
                query += ' AND timestamp <= ?';
                params.push(endDate);
            }

            query += ' GROUP BY DATE(timestamp), severity ORDER BY timestamp ASC';

            const result = await this.database.all(query, params);
            return result;
        } catch (error) {
            throw new DatabaseError('Failed to get timeline data', error);
        }
    }
}

module.exports = LogService;
