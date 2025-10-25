const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
    getUserPublicNotes,
    getAllUsers,
    searchUsers
} = require('../controllers/spectatorController');
const { requireAuth } = require('../controllers/authController');

// Rate limiting for spectator operations
const spectatorLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 requests per windowMs
    message: 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Spectator routes (require authentication)
router.get('/collaborators', requireAuth, spectatorLimiter, getAllUsers);
router.get('/user/:userId/notes', requireAuth, spectatorLimiter, getUserPublicNotes);
router.get('/search-users', requireAuth, spectatorLimiter, searchUsers);

module.exports = router;
