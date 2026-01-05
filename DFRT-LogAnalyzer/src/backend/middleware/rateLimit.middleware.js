const rateLimit = require('express-rate-limit');

const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || 900000), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || 100),
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health';
  }
});

const apiKeyLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 300,
  message: 'Too many requests with this API key',
  keyGenerator: (req) => req.headers['x-api-key'] || req.ip
});

module.exports = {
  rateLimiter,
  apiKeyLimiter
};
