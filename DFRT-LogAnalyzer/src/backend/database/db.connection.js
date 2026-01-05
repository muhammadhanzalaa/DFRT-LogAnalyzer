/**
 * Database Connection & Pool Management
 * @file db.connection.js
 * Phase 4: Secure and optimized database connectivity
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
    constructor(connectionString) {
        this.connectionString = connectionString || 'sqlite:./dfrt.db';
        this.db = null;
        this.isConnected = false;
        this.connectionPool = {
            active: 0,
            max: 10
        };
    }

    /**
     * Connect to database
     */
    async connect() {
        return new Promise((resolve, reject) => {
            try {
                const dbPath = this.connectionString.replace('sqlite:', '');
                const dir = path.dirname(dbPath);

                // Ensure directory exists
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }

                this.db = new sqlite3.Database(dbPath, (err) => {
                    if (err) {
                        reject(new Error(`Failed to connect to database: ${err.message}`));
                    } else {
                        this.isConnected = true;
                        this.initializeTables();
                        resolve(this);
                    }
                });

                // Enable foreign keys
                this.db.run('PRAGMA foreign_keys = ON');
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Initialize database tables with proper schema
     */
    initializeTables() {
        // Users table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                passwordHash TEXT NOT NULL,
                fullName TEXT,
                role TEXT DEFAULT 'user',
                isActive BOOLEAN DEFAULT 1,
                lastLogin DATETIME,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT valid_role CHECK (role IN ('admin', 'analyst', 'user'))
            )
        `);

        // Create unique index on email and username
        this.db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
        this.db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)`);

        // Analyses table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS analyses (
                id TEXT PRIMARY KEY,
                userId TEXT NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                logType TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                progress REAL DEFAULT 0,
                filesCount INTEGER DEFAULT 0,
                entriesCount INTEGER DEFAULT 0,
                threatsDetected INTEGER DEFAULT 0,
                startTime DATETIME,
                endTime DATETIME,
                duration INTEGER,
                configOptions TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
                CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
                CONSTRAINT valid_logType CHECK (logType IN ('windows_event', 'syslog', 'apache', 'nginx', 'json', 'generic'))
            )
        `);

        // Create indexes on analyses
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_analyses_userId ON analyses(userId)`);
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status)`);
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_analyses_createdAt ON analyses(createdAt DESC)`);

        // Log entries table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS log_entries (
                id TEXT PRIMARY KEY,
                analysisId TEXT NOT NULL,
                logType TEXT NOT NULL,
                timestamp DATETIME,
                source TEXT,
                severity TEXT,
                eventId TEXT,
                description TEXT,
                metadata TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (analysisId) REFERENCES analyses(id) ON DELETE CASCADE,
                CONSTRAINT valid_severity CHECK (severity IN ('critical', 'error', 'warning', 'info', 'debug'))
            )
        `);

        // Create indexes on log_entries
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_log_entries_analysisId ON log_entries(analysisId)`);
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_log_entries_severity ON log_entries(severity)`);
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_log_entries_timestamp ON log_entries(timestamp DESC)`);

        // Threats table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS threats (
                id TEXT PRIMARY KEY,
                analysisId TEXT NOT NULL,
                threatType TEXT NOT NULL,
                severity TEXT NOT NULL,
                detectedAt DATETIME,
                relatedEntries TEXT,
                details TEXT,
                resolved BOOLEAN DEFAULT 0,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (analysisId) REFERENCES analyses(id) ON DELETE CASCADE,
                CONSTRAINT valid_threatType CHECK (threatType IN ('brute_force', 'tampering', 'anomaly', 'suspicious_activity'))
            )
        `);

        // Create indexes on threats
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_threats_analysisId ON threats(analysisId)`);
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_threats_severity ON threats(severity)`);

        // Sessions table for authentication
        this.db.run(`
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                userId TEXT NOT NULL,
                token TEXT UNIQUE NOT NULL,
                expiresAt DATETIME NOT NULL,
                ipAddress TEXT,
                userAgent TEXT,
                isActive BOOLEAN DEFAULT 1,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Create indexes on sessions
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_sessions_userId ON sessions(userId)`);
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)`);
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_sessions_expiresAt ON sessions(expiresAt)`);

        // Audit log table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id TEXT PRIMARY KEY,
                userId TEXT,
                action TEXT NOT NULL,
                resource TEXT NOT NULL,
                details TEXT,
                ipAddress TEXT,
                statusCode INTEGER,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
            )
        `);

        // Create indexes on audit_logs
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_audit_logs_userId ON audit_logs(userId)`);
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)`);
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_audit_logs_createdAt ON audit_logs(createdAt DESC)`);
    }

    /**
     * Run a query with parameters
     */
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not connected'));
                return;
            }

            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        lastID: this.lastID,
                        changes: this.changes
                    });
                }
            });
        });
    }

    /**
     * Get a single row
     */
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not connected'));
                return;
            }

            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    /**
     * Get all rows
     */
    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not connected'));
                return;
            }

            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
    }

    /**
     * Execute transaction
     */
    async transaction(callback) {
        try {
            await this.run('BEGIN TRANSACTION');
            const result = await callback();
            await this.run('COMMIT');
            return result;
        } catch (error) {
            await this.run('ROLLBACK');
            throw error;
        }
    }

    /**
     * Check if database is healthy
     */
    async healthCheck() {
        try {
            const result = await this.get('SELECT 1 as healthy');
            return { healthy: true, message: 'Database is healthy' };
        } catch (error) {
            return { healthy: false, message: error.message };
        }
    }

    /**
     * Disconnect from database
     */
    async disconnect() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        this.isConnected = false;
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    /**
     * Clean up old data
     */
    async cleanup(daysOld = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        try {
            await this.transaction(async () => {
                // Delete old expired sessions
                await this.run(
                    'DELETE FROM sessions WHERE expiresAt < ?',
                    [cutoffDate.toISOString()]
                );

                // Delete old audit logs
                await this.run(
                    'DELETE FROM audit_logs WHERE createdAt < ?',
                    [cutoffDate.toISOString()]
                );
            });

            return { cleaned: true, cutoffDate };
        } catch (error) {
            throw new Error(`Cleanup failed: ${error.message}`);
        }
    }
}

module.exports = Database;
