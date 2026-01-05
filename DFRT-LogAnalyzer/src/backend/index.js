/**
 * DFRT Log Analyzer - Main Application Server
 * @file index.js
 * Phase 4: Backend Optimization & Database Integration
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

// Core imports
const { ErrorHandler, ApiResponse } = require('./utils/response.handler');
const { requestLogger, errorLogger } = require('./utils/logger');
const authMiddleware = require('./middleware/auth.middleware');
const validationMiddleware = require('./middleware/validation.middleware');
const rateLimiter = require('./middleware/rate-limiter.middleware');
const corsMiddleware = require('./middleware/cors.middleware');

// Database and services
const Database = require('./database/db.connection');
const AnalysisService = require('./services/analysis.service');
const UserService = require('./services/user.service');
const LogService = require('./services/log.service');

// Routes
const authRoutes = require('./routes/auth.routes');
const analysisRoutes = require('./routes/analysis.routes');
const userRoutes = require('./routes/user.routes');
const healthRoutes = require('./routes/health.routes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============================================================================
// MIDDLEWARE SETUP
// ============================================================================

// Security middleware
app.use(helmet());
app.use(corsMiddleware);
app.use(rateLimiter.global);

// Body parsing
app.use(express.json({ limit: process.env.JSON_LIMIT || '50mb' }));
app.use(express.urlencoded({ limit: process.env.URL_LIMIT || '50mb', extended: true }));

// Compression
app.use(compression());

// Logging
if (NODE_ENV === 'development') {
    app.use(morgan('dev'));
}
app.use(requestLogger);

// Request validation
app.use(validationMiddleware);

// ============================================================================
// GLOBAL ERROR HANDLING WRAPPER
// ============================================================================

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// ============================================================================
// DATABASE INITIALIZATION
// ============================================================================

let db;

async function initializeDatabase() {
    try {
        db = new Database(process.env.DATABASE_URL || 'sqlite:./dfrt.db');
        await db.connect();
        console.log('✓ Database connected successfully');
        
        // Initialize services with database instance
        AnalysisService.setDatabase(db);
        UserService.setDatabase(db);
        LogService.setDatabase(db);
        
        return db;
    } catch (error) {
        console.error('✗ Database connection failed:', error.message);
        process.exit(1);
    }
}

// ============================================================================
// ROUTES
// ============================================================================

// Health check (no auth required)
app.use('/api/health', healthRoutes);

// Authentication routes (no auth required)
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/analysis', authMiddleware, analysisRoutes);
app.use('/api/users', authMiddleware, userRoutes);

// API documentation
app.get('/api', (req, res) => {
    res.json({
        message: 'DFRT Log Analyzer API',
        version: '4.0.0',
        status: 'operational',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth',
            analysis: '/api/analysis (protected)',
            users: '/api/users (protected)',
            docs: '/api/docs'
        }
    });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req, res) => {
    const error = new ErrorHandler(
        `Cannot ${req.method} ${req.path}`,
        404,
        'ROUTE_NOT_FOUND'
    );
    res.status(404).json(new ApiResponse(false, null, error.message, error.code));
});

// Global error handler (must be last)
app.use((err, req, res, next) => {
    errorLogger.error({
        error: err.message,
        code: err.code || 'INTERNAL_ERROR',
        path: req.path,
        method: req.method,
        stack: err.stack
    });

    const statusCode = err.statusCode || 500;
    const response = new ApiResponse(
        false,
        null,
        err.message || 'Internal server error',
        err.code || 'INTERNAL_ERROR'
    );

    res.status(statusCode).json(response);
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

async function startServer() {
    try {
        // Initialize database
        await initializeDatabase();

        // Start server
        const server = app.listen(PORT, () => {
            console.log(`
╔════════════════════════════════════════════════════════╗
║         DFRT Log Analyzer - Backend Server            ║
╠════════════════════════════════════════════════════════╣
║ Status:      ✓ Running                                ║
║ Port:        ${PORT}                                      ║
║ Environment: ${NODE_ENV}                              ║
║ API:         http://localhost:${PORT}/api              ║
╚════════════════════════════════════════════════════════╝
            `);
        });

        // Graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n✓ Shutting down gracefully...');
            server.close(async () => {
                if (db) await db.disconnect();
                process.exit(0);
            });
        });

    } catch (error) {
        console.error('✗ Failed to start server:', error.message);
        process.exit(1);
    }
}

// Start the server
if (require.main === module) {
    startServer();
}

module.exports = { app, initializeDatabase };
