const Note = require('../models/Note');
const User = require('../models/User');

/**
 * Sanitize user input to prevent XSS attacks
 * @param {string} input - The input string to sanitize
 * @returns {string} - Sanitized input
 */
const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, ''); // Remove event handlers
};

// Get all notes for authenticated user
const getAllNotes = async (req, res) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.redirect('/login');
        }
        
        const notes = await Note.find({ owner: req.session.userId }).sort({ createdAt: -1 });
        res.render('index', { 
            notes,
            user: {
                name: req.session.userName,
                email: req.session.userEmail
            }
        });
    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).send('Error fetching notes');
    }
};

// Get dashboard with stats
const getDashboard = async (req, res) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.redirect('/login');
        }
        
        const userId = req.session.userId;
        
        // Get user's notes
        const notes = await Note.find({ owner: userId }).sort({ createdAt: -1 });
        
        res.render('home', { 
            notes: notes,
            recentNotes: notes, // Show all notes instead of just recent ones
            user: {
                name: req.session.userName,
                email: req.session.userEmail,
                uniqueId: req.session.userUniqueId
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard:', error);
        res.status(500).send('Error fetching dashboard');
    }
};

// Get create page
const getCreatePage = (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.redirect('/login');
    }
    res.render('create', {
        error: null,
        user: {
            name: req.session.userName,
            email: req.session.userEmail
        }
    });
};

// Create new note
const createNote = async (req, res) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.redirect('/login');
        }
        
        const { title, content, encrypted, passcode, 'passcode-mobile': passcodeMobile, 'passcode-desktop': passcodeDesktop, shareable, editPermissions, disableEdit } = req.body;
        
        // Handle passcode from either mobile or desktop field
        const finalPasscode = passcode || passcodeMobile || passcodeDesktop || '';
        
        // Auto-save behavior: Check if note is completely empty
        const hasContent = content && content.trim().length > 0;
        const hasTitle = title && title.trim().length > 0;
        
        // If note is completely empty (no title and no content), don't save
        if (!hasContent && !hasTitle) {
            return res.render('create', { 
                error: 'Note cannot be empty. Please add some content or a title.',
                user: {
                    name: req.session.userName,
                    email: req.session.userEmail
                }
            });
        }
        
        // If no title but has content, use "Untitled Note"
        const noteTitle = hasTitle ? sanitizeInput(title) : 'Untitled Note';
        
        if (noteTitle.length > 100) {
            return res.render('create', { 
                error: 'Note title must be less than 100 characters',
                user: {
                    name: req.session.userName,
                    email: req.session.userEmail
                }
            });
        }
        
        if (content && content.length > 10000) {
            return res.render('create', { 
                error: 'Note content must be less than 10,000 characters',
                user: {
                    name: req.session.userName,
                    email: req.session.userEmail
                }
            });
        }
        
        if (encrypted === 'on' && (!finalPasscode || finalPasscode.length < 4)) {
            return res.render('create', { 
                error: 'Passcode is required for encrypted notes and must be at least 4 characters',
                user: {
                    name: req.session.userName,
                    email: req.session.userEmail
                }
            });
        }
        
        // Generate unique public access token if shareable
        let publicAccessToken = '';
        if (shareable === 'on') {
            let isUnique = false;
            while (!isUnique) {
                publicAccessToken = `share-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const existingNote = await Note.findOne({ publicAccessToken });
                if (!existingNote) {
                    isUnique = true;
                }
            }
        }
        
        const newNote = new Note({
            title: noteTitle,
            content: sanitizeInput(content) || '',
            date: new Date().toLocaleDateString('en-GB'),
            renamed: false,
            originalTitle: noteTitle,
            encrypted: encrypted === 'on',
            passcode: finalPasscode,
            shareable: shareable === 'on',
            editPermissions: editPermissions === 'on',
            disableEdit: disableEdit === 'on',
            shareLink: shareable === 'on' ? publicAccessToken : '',
            owner: req.session.userId,
            isPublic: shareable === 'on',
            publicAccessToken: publicAccessToken
        });
        
        await newNote.save();
        res.redirect('/home');
    } catch (error) {
        console.error('Error creating note:', error);
        res.render('create', { 
            error: 'An error occurred while creating the note',
            user: {
                name: req.session.userName,
                email: req.session.userEmail
            }
        });
    }
};

// Get single note
const getNote = async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);
        if (!note) {
            return res.status(404).send('Note not found');
        }
        
        // Check if user has access to this note
        const isOwner = req.session && req.session.userId && note.owner.toString() === req.session.userId;
        const isPublic = note.isPublic;
        
        if (!isOwner && !isPublic) {
            return res.status(403).send('Access denied');
        }
        
        // Check if note is encrypted and requires passcode
        if (note.encrypted && !isOwner) {
            const providedPasscode = req.query.passcode || req.body.passcode;
            if (!providedPasscode || providedPasscode !== note.passcode) {
                return res.render('note', { 
                    note: { ...note.toObject(), content: '[Encrypted - Passcode Required]' },
                    user: req.session ? {
                        name: req.session.userName,
                        email: req.session.userEmail
                    } : null,
                    isOwner,
                    isPublic,
                    requiresPasscode: true,
                    error: 'This note is encrypted. Please provide the correct passcode to view it.'
                });
            }
        }
        
        // Determine edit permission
        const editPermission = isOwner || (note.editPermissions && !note.disableEdit);
        
        res.render('note', { 
            note,
            user: req.session ? {
                name: req.session.userName,
                email: req.session.userEmail
            } : null,
            isOwner,
            isPublic,
            editPermission,
            requiresPasscode: false
        });
    } catch (error) {
        console.error('Error fetching note:', error);
        res.status(500).send('Error fetching note');
    }
};

// Get shared note by public access token
const getSharedNote = async (req, res) => {
    try {
        const { token } = req.params;
        const note = await Note.findOne({ 
            publicAccessToken: token,
            isPublic: true 
        });
        
        if (!note) {
            return res.status(404).render('error', { 
                error: 'Shared note not found or no longer available',
                user: req.session ? {
                    name: req.session.userName,
                    email: req.session.userEmail
                } : null
            });
        }
        
        res.render('shared-note', { 
            note,
            user: req.session ? {
                name: req.session.userName,
                email: req.session.userEmail
            } : null,
            isLoggedIn: !!req.session?.userId
        });
    } catch (error) {
        console.error('Error fetching shared note:', error);
        res.status(500).render('error', { 
            error: 'Error loading shared note',
            user: req.session ? {
                name: req.session.userName,
                email: req.session.userEmail
            } : null
        });
    }
};

// Get edit page
const getEditPage = async (req, res) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.redirect('/login');
        }
        
        const note = await Note.findById(req.params.id);
        if (!note) {
            return res.status(404).send('Note not found');
        }
        
        // Check if user owns this note
        if (note.owner.toString() !== req.session.userId) {
            return res.status(403).send('Access denied');
        }
        
        // Determine if user has edit permission
        const editPermission = note.editPermissions || note.owner.toString() === req.session.userId;
        
        res.render('edit', { 
            note,
            user: {
                name: req.session.userName,
                email: req.session.userEmail
            },
            editPermission,
            isOwner: true,
            isPublic: note.isPublic
        });
    } catch (error) {
        console.error('Error fetching note for edit:', error);
        res.status(500).send('Error fetching note');
    }
};

// Update note
const updateNote = async (req, res) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.redirect('/login');
        }
        
        const { title, content, encrypted, passcode, 'passcode-mobile': passcodeMobile, 'passcode-desktop': passcodeDesktop, shareable, editPermissions, disableEdit } = req.body;
        
        // Handle passcode from either mobile or desktop field
        const finalPasscode = passcode || passcodeMobile || passcodeDesktop || '';
        
        // Input validation
        if (!title || title.trim().length === 0) {
            return res.render('edit', { 
                error: 'Note title is required',
                note: await Note.findById(req.params.id),
                user: {
                    name: req.session.userName,
                    email: req.session.userEmail
                }
            });
        }
        
        if (title.length > 100) {
            return res.render('edit', { 
                error: 'Note title must be less than 100 characters',
                note: await Note.findById(req.params.id),
                user: {
                    name: req.session.userName,
                    email: req.session.userEmail
                }
            });
        }
        
        if (content && content.length > 10000) {
            return res.render('edit', { 
                error: 'Note content must be less than 10,000 characters',
                note: await Note.findById(req.params.id),
                user: {
                    name: req.session.userName,
                    email: req.session.userEmail
                }
            });
        }
        
        const note = await Note.findById(req.params.id);
        
        if (!note) {
            return res.status(404).send('Note not found');
        }
        
        // Check if user owns this note
        if (note.owner.toString() !== req.session.userId) {
            return res.status(403).send('Access denied');
        }
        
        const currentTitle = note.title;
        note.title = sanitizeInput(title);
        note.content = sanitizeInput(content) || '';
        
        // Check if title was changed
        if (title && title !== currentTitle) {
            note.renamed = true;
            // Keep the original title if it hasn't been set yet
            if (!note.originalTitle) {
                note.originalTitle = currentTitle;
            }
        }
        
        // Handle sharing options
        note.encrypted = encrypted === 'on';
        note.passcode = finalPasscode;
        note.shareable = shareable === 'on';
        note.editPermissions = editPermissions === 'on';
        note.disableEdit = disableEdit === 'on';
        
        // Handle public access token
        if (shareable === 'on' && !note.publicAccessToken) {
            // Generate new token if sharing is enabled but no token exists
            let isUnique = false;
            while (!isUnique) {
                const newToken = `share-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const existingNote = await Note.findOne({ publicAccessToken: newToken });
                if (!existingNote) {
                    note.publicAccessToken = newToken;
                    isUnique = true;
                }
            }
            note.isPublic = true;
        } else if (shareable !== 'on') {
            // Remove sharing if disabled
            note.isPublic = false;
            note.publicAccessToken = '';
        }
        
        await note.save();
        res.redirect(`/note/${req.params.id}`);
    } catch (error) {
        console.error('Error updating note:', error);
        res.render('edit', { 
            error: 'An error occurred while updating the note',
            note: await Note.findById(req.params.id),
            user: {
                name: req.session.userName,
                email: req.session.userEmail
            }
        });
    }
};

// Delete note
const deleteNote = async (req, res) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.redirect('/login');
        }
        
        const note = await Note.findById(req.params.id);
        if (!note) {
            return res.status(404).send('Note not found');
        }
        
        // Check if user owns this note
        if (note.owner.toString() !== req.session.userId) {
            return res.status(403).send('Access denied');
        }
        
        await Note.findByIdAndDelete(req.params.id);
        res.redirect('/home');
    } catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).send('Error deleting note');
    }
};

// Toggle note sharing
const toggleSharing = async (req, res) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.redirect('/login');
        }
        
        const note = await Note.findById(req.params.id);
        if (!note) {
            return res.status(404).send('Note not found');
        }
        
        // Check if user owns this note
        if (note.owner.toString() !== req.session.userId) {
            return res.status(403).send('Access denied');
        }
        
        // Toggle sharing
        note.isPublic = !note.isPublic;
        if (note.isPublic && !note.publicAccessToken) {
            let isUnique = false;
            let publicAccessToken = '';
            while (!isUnique) {
                publicAccessToken = `share-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const existingNote = await Note.findOne({ publicAccessToken });
                if (!existingNote) {
                    isUnique = true;
                }
            }
            note.publicAccessToken = publicAccessToken;
        }
        
        await note.save();
        res.json({ 
            isPublic: note.isPublic, 
            shareLink: note.isPublic ? `/shared/${note.publicAccessToken}` : null 
        });
    } catch (error) {
        console.error('Error toggling sharing:', error);
        res.status(500).send('Error toggling sharing');
    }
};

module.exports = {
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
};
