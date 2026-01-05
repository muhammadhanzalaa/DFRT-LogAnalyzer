/**
 * Health Check Routes
 * @file health.routes.js
 * System health and status endpoints
 */

const express = require('express');
const router = express.Router();
const Database = require('../database/db.connection');
const { ApiResponse } = require('../utils/response.handler');

/**
 * GET /api/health
 * Basic health check
 */
router.get('/', (req, res) => {
    res.json(new ApiResponse(true, {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '4.0.0'
    }, 'Server is healthy', 'OK'));
});

/**
 * GET /api/health/detailed
 * Detailed health check with database status
 */
router.get('/detailed', async (req, res, next) => {
    try {
        const dbConnection = req.app.locals.db;
        
        if (!dbConnection) {
            return res.status(503).json(new ApiResponse(false, {
                status: 'unhealthy',
                database: { healthy: false, message: 'No database connection' }
            }, 'Service unavailable', 'UNAVAILABLE'));
        }

        const dbHealth = await dbConnection.healthCheck();
        
        const health = {
            status: dbHealth.healthy ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: '4.0.0',
            database: dbHealth,
            memory: {
                rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB',
                heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
                heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
            }
        };

        res.json(new ApiResponse(dbHealth.healthy, health, 'Health check completed', 'OK'));
    } catch (error) {
        next(error);
    }
});

module.exports = router;
