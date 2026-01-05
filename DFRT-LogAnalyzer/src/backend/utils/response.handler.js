/**
 * Response Handler & Error Classes
 * @file response.handler.js
 * Centralized error and response handling
 */

/**
 * Standardized error handler
 */
class ErrorHandler extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
        super(message);
        this.name = 'ErrorHandler';
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.timestamp = new Date().toISOString();
        
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Standardized API response
 */
class ApiResponse {
    constructor(
        success = true,
        data = null,
        message = 'Success',
        code = 'OK',
        pagination = null
    ) {
        this.success = success;
        this.data = data;
        this.message = message;
        this.code = code;
        this.pagination = pagination;
        this.timestamp = new Date().toISOString();
    }

    /**
     * Create success response
     */
    static success(data, message = 'Success', code = 'OK', pagination = null) {
        return new ApiResponse(true, data, message, code, pagination);
    }

    /**
     * Create error response
     */
    static error(message, code = 'ERROR', statusCode = 500, details = null) {
        return new ApiResponse(false, null, message, code);
    }

    /**
     * Create paginated response
     */
    static paginated(data, total, page, pageSize, message = 'Success') {
        return new ApiResponse(
            true,
            data,
            message,
            'OK',
            {
                total,
                page,
                pageSize,
                pages: Math.ceil(total / pageSize)
            }
        );
    }
}

/**
 * Common error types
 */
class ValidationError extends ErrorHandler {
    constructor(message, details = null) {
        super(message, 400, 'VALIDATION_ERROR', details);
    }
}

class NotFoundError extends ErrorHandler {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404, 'NOT_FOUND');
    }
}

class UnauthorizedError extends ErrorHandler {
    constructor(message = 'Unauthorized') {
        super(message, 401, 'UNAUTHORIZED');
    }
}

class ForbiddenError extends ErrorHandler {
    constructor(message = 'Access forbidden') {
        super(message, 403, 'FORBIDDEN');
    }
}

class ConflictError extends ErrorHandler {
    constructor(message = 'Resource conflict') {
        super(message, 409, 'CONFLICT');
    }
}

class DatabaseError extends ErrorHandler {
    constructor(message, originalError = null) {
        super(
            message || 'Database operation failed',
            500,
            'DATABASE_ERROR',
            process.env.NODE_ENV === 'development' ? originalError?.message : undefined
        );
    }
}

class ServiceError extends ErrorHandler {
    constructor(message, code = 'SERVICE_ERROR') {
        super(message, 500, code);
    }
}

module.exports = {
    ErrorHandler,
    ApiResponse,
    ValidationError,
    NotFoundError,
    UnauthorizedError,
    ForbiddenError,
    ConflictError,
    DatabaseError,
    ServiceError
};
