const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// ========================================
// AUTHENTICATION MIDDLEWARE
// ========================================
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// ========================================
// AUTHENTICATION API
// ========================================

// Login API
router.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Create JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name
            }
        });
    } catch (error) {
        console.error('Login API error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Register API
router.post('/auth/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ error: 'User already exists' });
        }

        const user = new User({
            email: email.toLowerCase(),
            password,
            name: name || email.split('@')[0]
        });

        await user.save();

        // Create JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name
            }
        });
    } catch (error) {
        console.error('Register API error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ========================================
// NOTES API
// ========================================

// Get all notes
router.get('/notes', authenticateToken, async (req, res) => {
    try {
        const notes = await Note.find({ owner: req.user.userId }).sort({ createdAt: -1 });
        res.json({ success: true, data: notes });
    } catch (error) {
        console.error('Get notes error:', error);
        res.status(500).json({ error: 'Failed to fetch notes' });
    }
});

// Get single note
router.get('/notes/:id', authenticateToken, async (req, res) => {
    try {
        const note = await Note.findOne({ 
            _id: req.params.id, 
            owner: req.user.userId 
        });
        
        if (!note) {
            return res.status(404).json({ error: 'Note not found' });
        }
        
        res.json({ success: true, data: note });
    } catch (error) {
        console.error('Get note error:', error);
        res.status(500).json({ error: 'Failed to fetch note' });
    }
});

// Create note
router.post('/notes', authenticateToken, async (req, res) => {
    try {
        const { title, content, encrypted, passcode, shareable } = req.body;
        
        const note = new Note({
            title: title || 'Untitled Note',
            content: content || '',
            encrypted: encrypted === true,
            passcode: encrypted ? passcode : '',
            shareable: shareable === true,
            owner: req.user.userId
        });

        await note.save();
        res.status(201).json({ success: true, data: note });
    } catch (error) {
        console.error('Create note error:', error);
        res.status(500).json({ error: 'Failed to create note' });
    }
});

// Update note
router.put('/notes/:id', authenticateToken, async (req, res) => {
    try {
        const { title, content, encrypted, passcode, shareable } = req.body;
        
        const note = await Note.findOneAndUpdate(
            { _id: req.params.id, owner: req.user.userId },
            {
                title: title || 'Untitled Note',
                content: content || '',
                encrypted: encrypted === true,
                passcode: encrypted ? passcode : '',
                shareable: shareable === true,
                updatedAt: new Date()
            },
            { new: true }
        );

        if (!note) {
            return res.status(404).json({ error: 'Note not found' });
        }

        res.json({ success: true, data: note });
    } catch (error) {
        console.error('Update note error:', error);
        res.status(500).json({ error: 'Failed to update note' });
    }
});

// Delete note
router.delete('/notes/:id', authenticateToken, async (req, res) => {
    try {
        const note = await Note.findOneAndDelete({ 
            _id: req.params.id, 
            owner: req.user.userId 
        });

        if (!note) {
            return res.status(404).json({ error: 'Note not found' });
        }

        res.json({ success: true, message: 'Note deleted successfully' });
    } catch (error) {
        console.error('Delete note error:', error);
        res.status(500).json({ error: 'Failed to delete note' });
    }
});

// ========================================
// HEALTH CHECK
// ========================================
router.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        service: 'SyncPad API',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
