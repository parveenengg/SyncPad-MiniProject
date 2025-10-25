const logger = require('../utils/logger');

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
    // Log the error with context
    logger.error('Unhandled Error', {
        error: {
            message: err.message,
            stack: err.stack,
            name: err.name
        },
        request: {
            method: req.method,
            url: req.url,
            headers: req.headers,
            body: req.body,
            params: req.params,
            query: req.query
        },
        user: req.session ? {
            userId: req.session.userId,
            userEmail: req.session.userEmail
        } : null,
        timestamp: new Date().toISOString()
    });

    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Determine error type and response
    let statusCode = 500;
    let message = 'Something went wrong!';
    let userMessage = 'An unexpected error occurred. Please try again.';

    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation Error';
        userMessage = 'Please check your input and try again.';
    } else if (err.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid ID format';
        userMessage = 'Invalid request format.';
    } else if (err.name === 'MongoError' || err.name === 'MongooseError') {
        statusCode = 503;
        message = 'Database Error';
        userMessage = 'Database temporarily unavailable. Please try again later.';
    } else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Authentication Error';
        userMessage = 'Invalid authentication token.';
    } else if (err.status) {
        statusCode = err.status;
        message = err.message;
        userMessage = err.message;
    }

    // Security logging for suspicious activities
    if (statusCode === 401 || statusCode === 403) {
        logger.logSecurity('Authentication/Authorization Failure', {
            statusCode,
            message,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            url: req.url
        });
    }

    // Send appropriate response
    if (req.accepts('json')) {
        res.status(statusCode).json({
            error: userMessage,
            ...(isDevelopment && { details: err.message, stack: err.stack })
        });
    } else {
        res.status(statusCode).render('error', {
            error: userMessage,
            user: req.session ? {
                name: req.session.userName,
                email: req.session.userEmail
            } : null,
            ...(isDevelopment && { details: err.message })
        });
    }
};

// Async error wrapper
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// Database error handler
const handleDatabaseError = (error, operation, res) => {
    logger.error(`Database Error in ${operation}`, {
        error: {
            message: error.message,
            code: error.code,
            name: error.name
        },
        operation
    });

    if (error.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Invalid data provided',
            details: Object.values(error.errors).map(e => e.message)
        });
    }

    if (error.code === 11000) {
        return res.status(409).json({
            error: 'Duplicate entry',
            message: 'This information already exists'
        });
    }

    return res.status(503).json({
        error: 'Database temporarily unavailable',
        message: 'Please try again later'
    });
};

// Rate limit error handler
const handleRateLimitError = (req, res) => {
    logger.logSecurity('Rate Limit Exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.url,
        method: req.method
    });

    res.status(429).json({
        error: 'Too many requests',
        message: 'Please slow down and try again later'
    });
};

module.exports = {
    errorHandler,
    asyncHandler,
    handleDatabaseError,
    handleRateLimitError
};
