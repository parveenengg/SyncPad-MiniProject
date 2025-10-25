const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const {
    getLoginPage,
    getSignupPage,
    login,
    signup,
    logout,
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

module.exports = router;
