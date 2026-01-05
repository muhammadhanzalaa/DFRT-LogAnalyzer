/**
 * Authentication Middleware
 * @file auth.middleware.js
 * Validates JWT tokens and enforces authorization
 */

const jwt = require('jsonwebtoken');
const { ErrorHandler } = require('../utils/response.handler');

class AuthMiddleware {
    /**
     * Verify JWT token
     */
    static verify(req, res, next) {
        try {
            const token = req.headers.authorization?.split(' ')[1];

            if (!token) {
                throw new ErrorHandler('No token provided', 401, 'MISSING_TOKEN');
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            req.user = decoded;
            next();
        } catch (error) {
            next(new ErrorHandler('Invalid or expired token', 401, 'INVALID_TOKEN'));
        }
    }

    /**
     * Check user role
     */
    static requireRole(...roles) {
        return (req, res, next) => {
            if (!req.user) {
                return next(new ErrorHandler('User not authenticated', 401, 'NOT_AUTHENTICATED'));
            }

            if (!roles.includes(req.user.role)) {
                return next(new ErrorHandler('Insufficient permissions', 403, 'FORBIDDEN'));
            }

            next();
        };
    }

    /**
     * Optional authentication (doesn't fail if no token)
     */
    static optional(req, res, next) {
        try {
            const token = req.headers.authorization?.split(' ')[1];

            if (token) {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
                req.user = decoded;
            }
        } catch (error) {
            // Silently ignore auth errors for optional
        }

        next();
    }
}

module.exports = AuthMiddleware.verify;
module.exports.requireRole = AuthMiddleware.requireRole;
module.exports.optional = AuthMiddleware.optional;
