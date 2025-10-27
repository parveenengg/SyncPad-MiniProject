const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const {
    getLoginPage,
    getSignupPage,
    login,
    signup,
    logout,
    forgotPassword,
    requireAuth,
    requireGuest
} = require('../controllers/authController');

// Auth rate limiting (more lenient for development)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 requests per windowMs (increased from 5)
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting in development
        return process.env.NODE_ENV === 'development';
    }
});

// Landing page
router.get('/', (req, res) => {
    res.render('landing', { 
        user: req.session ? {
            name: req.session.userName,
            email: req.session.userEmail
        } : null 
    });
});

// Auth routes
router.get('/login', requireGuest, getLoginPage);
router.post('/login', authLimiter, login);
router.get('/signup', requireGuest, getSignupPage);
router.post('/signup', authLimiter, signup);
router.get('/logout', logout);

// Alternative login route without rate limiting (for testing)
router.post('/login-test', login);

// Forgot password route
router.get('/forgot-password', (req, res) => {
    res.render('forgot-password', { 
        error: null, 
        success: null,
        showSecurityQuestion: false,
        showPasswordForm: false,
        user: null
    });
});
router.post('/forgot-password', authLimiter, forgotPassword);

// Test route to check session
router.get('/test-session', (req, res) => {
    res.json({
        hasSession: !!req.session,
        userId: req.session?.userId,
        userEmail: req.session?.userEmail,
        userName: req.session?.userName,
        sessionId: req.sessionID
    });
});

// Clear rate limit for testing (development only)
router.get('/clear-rate-limit', (req, res) => {
    if (process.env.NODE_ENV === 'development') {
        // Clear rate limit by resetting the limiter
        authLimiter.resetKey(req.ip);
        res.json({ message: 'Rate limit cleared for this IP' });
    } else {
        res.status(403).json({ message: 'Not available in production' });
    }
});

// Admin login redirect (for backward compatibility)
router.get('/login-admin', (req, res) => {
    res.redirect('/admin');
});

module.exports = router;
