/**
 * Logging Configuration
 * @file logger.js
 * Structured logging system
 */

const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../../..', 'logs');

// Ensure logs directory exists
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

/**
 * Log levels
 */
const LogLevel = {
    DEBUG: 'DEBUG',
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR',
    CRITICAL: 'CRITICAL'
};

/**
 * Logger class
 */
class Logger {
    constructor(filename) {
        this.filename = filename;
        this.filepath = path.join(logDir, filename);
    }

    /**
     * Format log message
     */
    format(level, message, data = {}) {
        return JSON.stringify({
            timestamp: new Date().toISOString(),
            level,
            message,
            ...data,
            pid: process.pid
        });
    }

    /**
     * Write log to file
     */
    write(level, message, data = {}) {
        const logMessage = this.format(level, message, data) + '\n';
        
        fs.appendFile(this.filepath, logMessage, (err) => {
            if (err) console.error('Log write error:', err);
        });

        // Also log to console in development
        if (process.env.NODE_ENV !== 'production') {
            console.log(logMessage);
        }
    }

    /**
     * Debug level logging
     */
    debug(message, data = {}) {
        this.write(LogLevel.DEBUG, message, data);
    }

    /**
     * Info level logging
     */
    info(message, data = {}) {
        this.write(LogLevel.INFO, message, data);
    }

    /**
     * Warning level logging
     */
    warn(message, data = {}) {
        this.write(LogLevel.WARN, message, data);
    }

    /**
     * Error level logging
     */
    error(message, data = {}) {
        this.write(LogLevel.ERROR, message, data);
    }

    /**
     * Critical level logging
     */
    critical(message, data = {}) {
        this.write(LogLevel.CRITICAL, message, data);
    }
}

/**
 * Express middleware for request logging
 */
const requestLogger = (req, res, next) => {
    const start = Date.now();
    const logger = new Logger('requests.log');

    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info('HTTP Request', {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            userId: req.user?.id || 'anonymous'
        });
    });

    next();
};

/**
 * Error logger middleware
 */
const errorLogger = new Logger('errors.log');

/**
 * Audit logger for sensitive operations
 */
const auditLogger = new Logger('audit.log');

module.exports = {
    Logger,
    LogLevel,
    requestLogger,
    errorLogger,
    auditLogger
};
