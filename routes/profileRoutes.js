const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
    getProfilePage,
    updateProfile,
    changePassword,
    updateSecurityQuestion,
    getForgotPasswordPage,
    handleForgotPasswordEmail,
    handleForgotPasswordSecurity,
    handleForgotPasswordReset
} = require('../controllers/profileController');
const { requireAuth } = require('../controllers/authController');

// Rate limiting for profile operations
const profileLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: 'Too many profile operations, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiting for password operations (stricter)
const passwordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many password operations, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Profile routes (require authentication)
router.get('/profile', requireAuth, getProfilePage);
router.post('/profile/update', requireAuth, profileLimiter, updateProfile);
router.post('/profile/change-password', requireAuth, passwordLimiter, changePassword);
router.post('/profile/security-question', requireAuth, profileLimiter, updateSecurityQuestion);

// Forgot password routes (no authentication required)
router.get('/forgot-password', getForgotPasswordPage);
router.post('/forgot-password/email', passwordLimiter, handleForgotPasswordEmail);
router.post('/forgot-password/security', passwordLimiter, handleForgotPasswordSecurity);
router.post('/forgot-password/reset', passwordLimiter, handleForgotPasswordReset);

module.exports = router;
