const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
    getAdminLoginPage,
    adminLogin,
    getAdminDashboard,
    getAllUsers,
    updateUserStatus,
    adminLogout,
    requireAdmin
} = require('../controllers/adminController');

// Rate limiting for admin operations
const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: 'Too many admin requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Admin login routes (no authentication required)
router.get('/', getAdminLoginPage);
router.post('/login', adminLimiter, adminLogin);

// Admin dashboard routes (require admin authentication)
router.get('/home', requireAdmin, getAdminDashboard);
router.get('/users', requireAdmin, getAllUsers);
router.post('/users/:userId/status', requireAdmin, updateUserStatus);
router.get('/logout', adminLogout);

module.exports = router;
