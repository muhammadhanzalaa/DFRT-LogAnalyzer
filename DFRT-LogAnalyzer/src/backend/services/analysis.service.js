/**
 * Analysis Service - Business Logic
 * @file analysis.service.js
 * Handles log analysis operations
 */

const { v4: uuidv4 } = require('uuid');
const FallbackAnalyzer = require('../services/analyzer.fallback');
const { DatabaseError, NotFoundError, ValidationError } = require('../utils/response.handler');

class AnalysisService {
    static database = null;

    static setDatabase(db) {
        this.database = db;
    }

    /**
     * Create new analysis
     */
    static async createAnalysis(userId, analysisData) {
        const { name, description, logType, configOptions } = analysisData;

        if (!name || !logType) {
            throw new ValidationError('Name and log type are required');
        }

        try {
            const analysisId = uuidv4();
            const now = new Date().toISOString();

            await this.database.run(
                `INSERT INTO analyses (id, userId, name, description, logType, status, configOptions, createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [analysisId, userId, name, description || '', logType, 'pending', JSON.stringify(configOptions || {}), now, now]
            );

            return this.getAnalysisById(analysisId);
        } catch (error) {
            throw new DatabaseError('Failed to create analysis', error);
        }
    }

    /**
     * Get analysis by ID
     */
    static async getAnalysisById(analysisId) {
        try {
            const analysis = await this.database.get(
                'SELECT * FROM analyses WHERE id = ?',
                [analysisId]
            );

            if (!analysis) {
                throw new NotFoundError('Analysis');
            }

            // Parse config options
            if (analysis.configOptions) {
                analysis.configOptions = JSON.parse(analysis.configOptions);
            }

            return analysis;
        } catch (error) {
            throw new DatabaseError('Failed to get analysis', error);
        }
    }

    /**
     * List user's analyses
     */
    static async listAnalyses(userId, options = {}) {
        const { page = 1, limit = 10, status = null, logType = null } = options;
        const offset = (page - 1) * limit;

        try {
            let query = 'SELECT * FROM analyses WHERE userId = ?';
            let params = [userId];

            if (status) {
                query += ' AND status = ?';
                params.push(status);
            }

            if (logType) {
                query += ' AND logType = ?';
                params.push(logType);
            }

            query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const rows = await this.database.all(query, params);

            // Parse config options
            rows.forEach(row => {
                if (row.configOptions) {
                    row.configOptions = JSON.parse(row.configOptions);
                }
            });

            // Count total
            let countQuery = 'SELECT COUNT(*) as total FROM analyses WHERE userId = ?';
            let countParams = [userId];

            if (status) {
                countQuery += ' AND status = ?';
                countParams.push(status);
            }

            if (logType) {
                countQuery += ' AND logType = ?';
                countParams.push(logType);
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
            throw new DatabaseError('Failed to list analyses', error);
        }
    }

    /**
     * Update analysis
     */
    static async updateAnalysis(analysisId, updates) {
        try {
            const analysis = await this.getAnalysisById(analysisId);

            const { name, description, status, progress } = updates;
            const fields = [];
            const values = [];

            if (name !== undefined) {
                fields.push('name = ?');
                values.push(name);
            }

            if (description !== undefined) {
                fields.push('description = ?');
                values.push(description);
            }

            if (status !== undefined) {
                fields.push('status = ?');
                values.push(status);
            }

            if (progress !== undefined) {
                fields.push('progress = ?');
                values.push(progress);
            }

            fields.push('updatedAt = ?');
            values.push(new Date().toISOString());
            values.push(analysisId);

            await this.database.run(
                `UPDATE analyses SET ${fields.join(', ')} WHERE id = ?`,
                values
            );

            return this.getAnalysisById(analysisId);
        } catch (error) {
            throw new DatabaseError('Failed to update analysis', error);
        }
    }

    /**
     * Delete analysis
     */
    static async deleteAnalysis(analysisId) {
        try {
            await this.database.run(
                'DELETE FROM analyses WHERE id = ?',
                [analysisId]
            );

            return { message: 'Analysis deleted successfully' };
        } catch (error) {
            throw new DatabaseError('Failed to delete analysis', error);
        }
    }

    /**
     * Start analysis
     */
    static async startAnalysis(analysisId, filePaths) {
        try {
            const analysis = await this.getAnalysisById(analysisId);

            // Update status to processing
            await this.updateAnalysis(analysisId, { status: 'processing', progress: 0 });

            // Run analyzer
            const analyzer = new FallbackAnalyzer();
            analyzer.initialize(analysis.configOptions);

            const result = await analyzer.analyzeFiles(filePaths);

            // Save results
            await this.saveAnalysisResults(analysisId, result);

            // Update analysis with results
            const duration = (new Date() - new Date(analysis.createdAt)) / 1000;
            await this.updateAnalysis(analysisId, {
                status: 'completed',
                progress: 100,
                entriesCount: result.entries.length,
                threatsDetected: result.threats.length,
                duration: Math.round(duration)
            });

            return this.getAnalysisById(analysisId);
        } catch (error) {
            // Update status to failed
            await this.updateAnalysis(analysisId, { status: 'failed' });
            throw new DatabaseError('Analysis failed', error);
        }
    }

    /**
     * Save analysis results
     */
    static async saveAnalysisResults(analysisId, result) {
        try {
            await this.database.transaction(async () => {
                // Save log entries
                for (const entry of result.entries) {
                    await this.database.run(
                        `INSERT INTO log_entries (id, analysisId, logType, timestamp, source, severity, eventId, description, metadata)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            uuidv4(),
                            analysisId,
                            result.logType || 'generic',
                            entry.timestamp,
                            entry.source || 'unknown',
                            entry.severity || 'info',
                            entry.eventId || '',
                            entry.description || '',
                            JSON.stringify(entry.metadata || {})
                        ]
                    );
                }

                // Save threats
                for (const threat of result.threats) {
                    await this.database.run(
                        `INSERT INTO threats (id, analysisId, threatType, severity, detectedAt, details)
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [
                            uuidv4(),
                            analysisId,
                            threat.type,
                            threat.severity,
                            new Date().toISOString(),
                            JSON.stringify(threat)
                        ]
                    );
                }
            });
        } catch (error) {
            throw new DatabaseError('Failed to save analysis results', error);
        }
    }
}

module.exports = AnalysisService;
