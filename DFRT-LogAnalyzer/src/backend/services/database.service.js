/**
 * Database Service
 * Handles all database operations for the DFRT Log Analyzer
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { AppError } = require('../middleware/error.middleware');

class DatabaseService {
  constructor() {
    this.db = null;
    this.initialized = false;
  }

  /**
   * Initialize database connection
   */
  initialize() {
    return new Promise((resolve, reject) => {
      const dbPath = process.env.DATABASE_URL || 'sqlite:./dfrt.db';
      const dbFile = dbPath.replace('sqlite:', '');
      
      // Create database directory if it doesn't exist
      const dir = path.dirname(dbFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      this.db = new sqlite3.Database(dbFile, (err) => {
        if (err) {
          console.error('Database connection error:', err);
          reject(err);
        } else {
          this.setupDatabase().then(resolve).catch(reject);
        }
      });
    });
  }

  /**
   * Setup database schema
   */
  setupDatabase() {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        try {
          // Logs table
          this.db.run(`
            CREATE TABLE IF NOT EXISTS logs (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              filename TEXT NOT NULL,
              filePath TEXT NOT NULL,
              uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
              fileSize INTEGER,
              lineCount INTEGER,
              status TEXT DEFAULT 'uploaded',
              error TEXT,
              createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
              UNIQUE(filePath)
            )
          `);

          // Analysis table
          this.db.run(`
            CREATE TABLE IF NOT EXISTS analysis (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              logId INTEGER NOT NULL,
              analysisType TEXT NOT NULL,
              startDate DATETIME,
              endDate DATETIME,
              threatLevel TEXT,
              suspiciousActivities INTEGER DEFAULT 0,
              analysisData TEXT,
              createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
              updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (logId) REFERENCES logs(id) ON DELETE CASCADE
            )
          `);

          // Threats table
          this.db.run(`
            CREATE TABLE IF NOT EXISTS threats (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              analysisId INTEGER NOT NULL,
              threatType TEXT NOT NULL,
              severity TEXT NOT NULL,
              description TEXT,
              evidence TEXT,
              timestamp DATETIME,
              resolved BOOLEAN DEFAULT FALSE,
              resolutionNotes TEXT,
              createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (analysisId) REFERENCES analysis(id) ON DELETE CASCADE
            )
          `);

          // Audit log table
          this.db.run(`
            CREATE TABLE IF NOT EXISTS audit_logs (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              action TEXT NOT NULL,
              userId TEXT,
              resourceId INTEGER,
              resourceType TEXT,
              changes TEXT,
              ipAddress TEXT,
              userAgent TEXT,
              createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `);

          // Settings table
          this.db.run(`
            CREATE TABLE IF NOT EXISTS settings (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              key TEXT UNIQUE NOT NULL,
              value TEXT,
              type TEXT,
              updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `);

          // Create indexes
          this.db.run('CREATE INDEX IF NOT EXISTS idx_logs_uploadedAt ON logs(uploadedAt)');
          this.db.run('CREATE INDEX IF NOT EXISTS idx_analysis_logId ON analysis(logId)');
          this.db.run('CREATE INDEX IF NOT EXISTS idx_threats_analysisId ON threats(analysisId)');
          this.db.run('CREATE INDEX IF NOT EXISTS idx_threats_severity ON threats(severity)');
          this.db.run('CREATE INDEX IF NOT EXISTS idx_audit_logs_createdAt ON audit_logs(createdAt)', (err) => {
            if (err) {
              reject(err);
            } else {
              this.initialized = true;
              resolve();
            }
          });
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  /**
   * Execute a query and return results
   */
  query(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(new AppError(`Database query error: ${err.message}`, 500));
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  /**
   * Execute a query and return single row
   */
  queryOne(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(new AppError(`Database query error: ${err.message}`, 500));
        } else {
          resolve(row || null);
        }
      });
    });
  }

  /**
   * Execute an insert and return the inserted ID
   */
  insert(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            reject(new AppError('Duplicate entry', 409));
          } else {
            reject(new AppError(`Database insert error: ${err.message}`, 500));
          }
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  /**
   * Execute an update
   */
  update(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(new AppError(`Database update error: ${err.message}`, 500));
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  /**
   * Execute a delete
   */
  delete(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(new AppError(`Database delete error: ${err.message}`, 500));
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  /**
   * Execute transaction
   */
  transaction(callback) {
    return new Promise(async (resolve, reject) => {
      try {
        this.db.run('BEGIN TRANSACTION', (err) => {
          if (err) reject(err);
        });

        const result = await callback(this);
        
        this.db.run('COMMIT', (err) => {
          if (err) {
            this.db.run('ROLLBACK');
            reject(err);
          } else {
            resolve(result);
          }
        });
      } catch (err) {
        this.db.run('ROLLBACK');
        reject(err);
      }
    });
  }

  /**
   * Close database connection
   */
  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

// Singleton instance
const dbService = new DatabaseService();

module.exports = dbService;
