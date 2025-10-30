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

// ========================================
// ADMIN LOGIN ROUTES (no authentication required)
// ========================================
router.get('/', getAdminLoginPage);
router.post('/login', adminLimiter, adminLogin);

// ========================================
// EJS ADMIN ROUTES
// ========================================

// EJS Monitor route (fallback)
router.get('/monitor', requireAdmin, getAdminDashboard);

// Legacy admin home route (redirects to monitor)
router.get('/home', requireAdmin, (req, res) => {
    res.redirect('/monitor');
});

// Admin users management
router.get('/users', requireAdmin, getAllUsers);
router.post('/users/:userId/status', requireAdmin, updateUserStatus);
router.get('/logout', adminLogout);

module.exports = router;
