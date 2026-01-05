/**
 * Input Validation Middleware
 * @file validation.middleware.js
 * Validates and sanitizes request data
 */

const validator = require('validator');
const { ErrorHandler } = require('../utils/response.handler');

class ValidationMiddleware {
    /**
     * Sanitize request data
     */
    static sanitize(req, res, next) {
        // Sanitize all request properties
        const sanitizeValue = (value) => {
            if (typeof value === 'string') {
                return validator.trim(value);
            }
            return value;
        };

        if (req.body && typeof req.body === 'object') {
            Object.keys(req.body).forEach(key => {
                req.body[key] = sanitizeValue(req.body[key]);
            });
        }

        if (req.query && typeof req.query === 'object') {
            Object.keys(req.query).forEach(key => {
                req.query[key] = sanitizeValue(req.query[key]);
            });
        }

        next();
    }

    /**
     * Validate email format
     */
    static validateEmail(email) {
        return validator.isEmail(email);
    }

    /**
     * Validate password strength
     */
    static validatePassword(password) {
        if (!password || password.length < 8) {
            return { valid: false, reason: 'Password must be at least 8 characters' };
        }
        if (!/[A-Z]/.test(password)) {
            return { valid: false, reason: 'Password must contain uppercase letter' };
        }
        if (!/[a-z]/.test(password)) {
            return { valid: false, reason: 'Password must contain lowercase letter' };
        }
        if (!/[0-9]/.test(password)) {
            return { valid: false, reason: 'Password must contain number' };
        }
        if (!/[!@#$%^&*]/.test(password)) {
            return { valid: false, reason: 'Password must contain special character' };
        }
        return { valid: true };
    }

    /**
     * Validate username
     */
    static validateUsername(username) {
        if (!username || username.length < 3 || username.length > 30) {
            return { valid: false, reason: 'Username must be 3-30 characters' };
        }
        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
            return { valid: false, reason: 'Username can only contain letters, numbers, dash, underscore' };
        }
        return { valid: true };
    }

    /**
     * Custom field validator
     */
    static field(rules) {
        return (req, res, next) => {
            const errors = {};

            Object.entries(rules).forEach(([field, fieldRules]) => {
                const value = req.body[field];

                for (const rule of fieldRules) {
                    const [ruleType, ...params] = rule.split(':');

                    switch (ruleType) {
                        case 'required':
                            if (!value || value.toString().trim() === '') {
                                errors[field] = `${field} is required`;
                            }
                            break;

                        case 'email':
                            if (value && !ValidationMiddleware.validateEmail(value)) {
                                errors[field] = 'Invalid email format';
                            }
                            break;

                        case 'password':
                            if (value) {
                                const passCheck = ValidationMiddleware.validatePassword(value);
                                if (!passCheck.valid) {
                                    errors[field] = passCheck.reason;
                                }
                            }
                            break;

                        case 'username':
                            if (value) {
                                const userCheck = ValidationMiddleware.validateUsername(value);
                                if (!userCheck.valid) {
                                    errors[field] = userCheck.reason;
                                }
                            }
                            break;

                        case 'min':
                            if (value && value.toString().length < parseInt(params[0])) {
                                errors[field] = `${field} must be at least ${params[0]} characters`;
                            }
                            break;

                        case 'max':
                            if (value && value.toString().length > parseInt(params[0])) {
                                errors[field] = `${field} must not exceed ${params[0]} characters`;
                            }
                            break;

                        case 'in':
                            if (value && !params.includes(value)) {
                                errors[field] = `${field} must be one of: ${params.join(', ')}`;
                            }
                            break;

                        case 'url':
                            if (value && !validator.isURL(value)) {
                                errors[field] = `${field} must be a valid URL`;
                            }
                            break;

                        case 'integer':
                            if (value && isNaN(parseInt(value))) {
                                errors[field] = `${field} must be an integer`;
                            }
                            break;
                    }
                }
            });

            if (Object.keys(errors).length > 0) {
                return next(new ErrorHandler('Validation failed', 400, 'VALIDATION_ERROR', errors));
            }

            next();
        };
    }
}

// Export as middleware
module.exports = ValidationMiddleware.sanitize;
module.exports.sanitize = ValidationMiddleware.sanitize;
module.exports.field = ValidationMiddleware.field;
module.exports.validateEmail = ValidationMiddleware.validateEmail;
module.exports.validatePassword = ValidationMiddleware.validatePassword;
module.exports.validateUsername = ValidationMiddleware.validateUsername;
