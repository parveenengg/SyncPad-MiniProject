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

// Auth rate limiting (stricter for login/signup)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
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

// Forgot password route
router.get('/forgot-password', (req, res) => {
    res.render('forgot-password', { error: null, success: null });
});
router.post('/forgot-password', authLimiter, forgotPassword);

// Admin login redirect (for backward compatibility)
router.get('/login-admin', (req, res) => {
    res.redirect('/admin');
});

module.exports = router;
