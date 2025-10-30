/**
 * SyncPad Enterprise Application Server
 * 
 * A production-ready note-taking application with hybrid React/EJS rendering,
 * comprehensive error handling, and enterprise-grade security.
 * 
 * @author Enterprise Development Team
 * @version 2.0.0
 * @since 2024-10-29
 */

// Environment configuration - only load dotenv in development
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

// Core dependencies
const express = require('express');
const path = require('path');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

// Database and utilities
const { connectDB } = require('./config/database');
const { initFirebase } = require('./config/firebase');
const logger = require('./utils/logger');

// Route handlers
const noteRoutes = require('./routes/noteRoutes');
const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes');
const adminRoutes = require('./routes/adminRoutes');
const apiRoutes = require('./routes/apiRoutes');

// Middleware
const { errorHandler } = require('./middleware/errorHandler');

// Initialize Express application
const app = express();
const PORT = process.env.PORT || 3330;

// Database connection with retry logic (switchable)
const DATA_STORE = (process.env.DATA_STORE || 'mongodb').toLowerCase();
if (DATA_STORE === 'firestore') {
    initFirebase();
    logger.info('Using Firestore data store');
} else {
    connectDB();
}

// ========================================
// SECURITY CONFIGURATION
// ========================================

// Rate limiting configuration
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for health checks
    skip: (req) => req.path === '/health' || req.path === '/api/health'
});

// Security headers configuration
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: [
                "'self'", 
                "'unsafe-inline'", 
                "https://cdn.jsdelivr.net", 
                "https://fonts.googleapis.com",
                "https://cdn.tailwindcss.com"
            ],
            scriptSrc: [
                "'self'", 
                "'unsafe-inline'", 
                "'unsafe-eval'", 
                "https://cdn.jsdelivr.net", 
                "https://unpkg.com",
                "https://cdn.tailwindcss.com"
            ],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: ["'self'", "ws:", "wss:"],
            fontSrc: [
                "'self'", 
                "https://fonts.gstatic.com", 
                "https://cdn.jsdelivr.net"
            ],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
            workerSrc: ["'self'", "blob:"],
            childSrc: ["'self'", "blob:"]
        },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// ========================================
// MIDDLEWARE CONFIGURATION
// ========================================

// Compression middleware for performance
app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    }
}));

// Logging middleware with environment-specific configuration
if (process.env.NODE_ENV === 'production') {
    app.use(morgan('combined', {
        stream: {
            write: (message) => logger.info(message.trim())
        }
    }));
} else {
    app.use(morgan('dev', {
        stream: {
            write: (message) => logger.info(message.trim())
        }
    }));
}

// Rate limiting middleware
app.use(limiter);

// Body parsing middleware with security limits
app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb',
    parameterLimit: 1000
}));
app.use(express.json({ 
    limit: '10mb',
    strict: true
}));

// ========================================
// STATIC FILE SERVING
// ========================================

// Static files with security headers
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
        // Security headers for static files
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
    }
}));

// Specific static file routes for better organization
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// ========================================
// SESSION CONFIGURATION
// ========================================

// Session middleware with enhanced security
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    name: 'syncpad.sid', // Custom session name
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        domain: process.env.NODE_ENV === 'production' ? process.env.DOMAIN : undefined
    },
    rolling: true, // Reset expiration on activity
    store: undefined // Use memory store for simplicity (consider Redis for production)
}));

// Set EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API status endpoint
app.get('/api/status', (req, res) => {
    res.json({
        service: 'SyncPad API',
        version: '1.0.0',
        status: 'operational',
        timestamp: new Date().toISOString()
    });
});

// Routes
app.use('/', authRoutes);
app.use('/', noteRoutes);
app.use('/api/messages', messageRoutes);
app.use('/admin', adminRoutes);
app.use('/api', apiRoutes);         // REST API for mobile/web clients

// 404 handler
app.use((req, res) => {
    res.status(404).render('error', { 
        error: 'Page not found',
        user: req.session ? {
            name: req.session.userName,
            email: req.session.userEmail
        } : null
    });
});

// Global error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Export for Vercel
module.exports = app;