/**
 * Rate Limiter Middleware
 * @file rate-limiter.middleware.js
 * Prevents abuse and DDoS attacks
 */

const rateLimit = require('express-rate-limit');

// Global rate limiter - 100 requests per 15 minutes
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/api/health';
    }
});

// Auth rate limiter - 5 login attempts per 15 minutes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many login attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true
});

// File upload rate limiter - 10 uploads per hour
const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: 'Too many file uploads, please try again later',
    standardHeaders: true,
    legacyHeaders: false
});

// API endpoint rate limiter - 50 requests per minute
const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 50,
    message: 'Too many API requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = {
    global: globalLimiter,
    auth: authLimiter,
    upload: uploadLimiter,
    api: apiLimiter
};
