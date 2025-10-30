const express = require('express');
const router = express.Router();
const {
    getAllNotes,
    getDashboard,
    getCreatePage,
    createNote,
    getNote,
    getSharedNote,
    getEditPage,
    updateNote,
    deleteNote,
    toggleSharing
} = require('../controllers/noteController');
const { requireAuth } = require('../controllers/authController');
// ========================================
// EJS ROUTES
// ========================================

// EJS Home route (fallback)
router.get('/home', requireAuth, getDashboard);

// EJS Create page (fallback)
router.get('/create', requireAuth, getCreatePage);

// EJS Note view (fallback)
router.get('/note/:id', getNote);

// EJS Edit page (fallback)
router.get('/edit/:id', requireAuth, getEditPage);

// ========================================
// LEGACY ROUTES (for backward compatibility)
// ========================================

// Dashboard route (redirects to home)
router.get('/collaborators', requireAuth, (req, res) => {
    res.redirect('/home');
});

// Notes listing route
router.get('/notes', requireAuth, getAllNotes);

// Create new note
router.post('/createnote', requireAuth, createNote);

// Get shared note by token
router.get('/shared/:token', getSharedNote);

// Update note
router.post('/update/:id', requireAuth, updateNote);

// Delete note
router.get('/delete/:id', requireAuth, deleteNote);

// Toggle sharing
router.post('/toggle-sharing/:id', requireAuth, toggleSharing);

module.exports = router;
