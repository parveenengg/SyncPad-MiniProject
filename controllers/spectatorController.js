const User = require('../models/User');
const Note = require('../models/Note');
const logger = require('../utils/logger');
const { asyncHandler, handleDatabaseError } = require('../middleware/errorHandler');

// Get user's public notes for spectator view
const getUserPublicNotes = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    
    // Get user information
    const user = await User.findById(userId).select('name email uniqueId createdAt');
    if (!user) {
        return res.status(404).render('error', {
            error: 'User not found',
            user: null
        });
    }

    // Get user's public notes only
    const notes = await Note.find({
        owner: userId,
        isPublic: true
    })
    .select('title content date createdAt')
    .sort({ createdAt: -1 })
    .limit(50); // Limit to prevent performance issues

    logger.logUserAction(req.session.userId, 'SPECTATOR_VIEW', {
        viewedUserId: userId,
        viewedUserName: user.name,
        notesCount: notes.length
    });

    res.render('spectator-notes', {
        user: {
            name: user.name,
            email: user.email,
            uniqueId: user.uniqueId,
            createdAt: user.createdAt
        },
        notes: notes.map(note => ({
            id: note._id,
            title: note.title,
            content: note.content,
            date: note.date,
            createdAt: note.createdAt
        })),
        viewer: req.session ? {
            name: req.session.userName,
            email: req.session.userEmail
        } : null
    });
});

// Get all users for collaborators page (public info only)
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find({})
        .select('name email uniqueId createdAt lastLogin')
        .sort({ createdAt: -1 })
        .limit(100); // Limit for performance

    // Get public note counts for each user
    const usersWithNoteCounts = await Promise.all(
        users.map(async (user) => {
            const publicNoteCount = await Note.countDocuments({
                owner: user._id,
                isPublic: true
            });
            
            return {
                id: user._id,
                name: user.name,
                email: user.email,
                uniqueId: user.uniqueId,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin,
                publicNoteCount
            };
        })
    );

    logger.logUserAction(req.session.userId, 'COLLABORATORS_VIEW', {
        usersCount: usersWithNoteCounts.length
    });

    res.render('collaborators', {
        users: usersWithNoteCounts,
        currentUser: req.session ? {
            name: req.session.userName,
            email: req.session.userEmail,
            uniqueId: req.session.userUniqueId
        } : null
    });
});

// Search users by name or email
const searchUsers = asyncHandler(async (req, res) => {
    const { query } = req.query;
    
    if (!query || query.trim().length < 2) {
        return res.json({ users: [] });
    }

    const searchRegex = new RegExp(query.trim(), 'i');
    const users = await User.find({
        $or: [
            { name: searchRegex },
            { email: searchRegex },
            { uniqueId: searchRegex }
        ]
    })
    .select('name email uniqueId createdAt')
    .sort({ name: 1 })
    .limit(20);

    const usersWithNoteCounts = await Promise.all(
        users.map(async (user) => {
            const publicNoteCount = await Note.countDocuments({
                owner: user._id,
                isPublic: true
            });
            
            return {
                id: user._id,
                name: user.name,
                email: user.email,
                uniqueId: user.uniqueId,
                createdAt: user.createdAt,
                publicNoteCount
            };
        })
    );

    logger.logUserAction(req.session.userId, 'USER_SEARCH', {
        query: query.trim(),
        resultsCount: usersWithNoteCounts.length
    });

    res.json({ users: usersWithNoteCounts });
});

module.exports = {
    getUserPublicNotes,
    getAllUsers,
    searchUsers
};
