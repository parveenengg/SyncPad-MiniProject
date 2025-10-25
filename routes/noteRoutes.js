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

// Home route
router.get('/home', requireAuth, getDashboard); // Keep for backward compatibility

// Collaborators route (New Dashboard)
router.get('/collaborators', requireAuth, (req, res) => {
    res.render('collaborators', {
        user: {
            name: req.session.userName,
            email: req.session.userEmail,
            uniqueId: req.session.userUniqueId
        }
    });
});

// Notes listing route
router.get('/notes', requireAuth, getAllNotes);

// Create page
router.get('/create', requireAuth, getCreatePage);

// Create new note
router.post('/createnote', requireAuth, createNote);

// Get single note
router.get('/note/:id', getNote);

// Get shared note by token
router.get('/shared/:token', getSharedNote);

// Get edit page
router.get('/edit/:id', requireAuth, getEditPage);

// Update note
router.post('/update/:id', requireAuth, updateNote);

// Delete note
router.get('/delete/:id', requireAuth, deleteNote);

// Toggle sharing
router.post('/toggle-sharing/:id', requireAuth, toggleSharing);

module.exports = router;
