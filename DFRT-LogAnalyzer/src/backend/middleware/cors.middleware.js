/**
 * CORS Middleware Configuration
 * @file cors.middleware.js
 * Handles cross-origin requests securely
 */

const cors = require('cors');

const corsOptions = {
    origin: function(origin, callback) {
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:5000',
            'http://localhost:8000',
            process.env.FRONTEND_URL || 'http://localhost:3000',
            process.env.BACKEND_URL || 'http://localhost:5000'
        ];

        // Allow requests with no origin (like mobile apps)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin'
    ],
    exposedHeaders: [
        'X-Total-Count',
        'X-Page-Number',
        'X-Page-Size'
    ],
    maxAge: 86400 // 24 hours
};

module.exports = cors(corsOptions);
