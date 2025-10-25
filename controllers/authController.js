const mongoose = require('mongoose');
const User = require('../models/User');
const Note = require('../models/Note');

// Input sanitization function
const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, ''); // Remove event handlers
};

// Render login page
const getLoginPage = (req, res) => {
    res.render('login', { error: null });
};

// Render signup page
const getSignupPage = (req, res) => {
    res.render('signup', { error: null });
};

// Handle user login
const login = async (req, res) => {
    try {
        console.log('Login attempt:', { email: req.body.email, hasPassword: !!req.body.password });
        console.log('MongoDB connection state:', mongoose.connection.readyState);
        
        // Check if database is connected
        if (mongoose.connection.readyState !== 1) {
            console.error('Database not connected. State:', mongoose.connection.readyState);
            return res.render('login', { error: 'Database connection error. Please try again.' });
        }
        
        const { email, password } = req.body;
        
        // Input validation
        if (!email || !password) {
            return res.render('login', { error: 'Email and password are required' });
        }
        
        if (!email.includes('@') || email.length < 5) {
            return res.render('login', { error: 'Please enter a valid email address' });
        }
        
        if (password.length < 6) {
            return res.render('login', { error: 'Password must be at least 6 characters long' });
        }
        
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.render('login', { error: 'Error: You are not a user' });
        }
        
        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.render('login', { error: 'Error: Wrong password' });
        }
        
        // Update last login
        user.lastLogin = new Date();
        await user.save();
        
        // Set session
        req.session.userId = user._id;
        req.session.userEmail = user.email;
        req.session.userName = user.name;
        req.session.userUniqueId = user.uniqueId;
        
        console.log('Login successful, redirecting to /home');
        res.redirect('/home');
    } catch (error) {
        console.error('Login error details:', {
            message: error.message,
            stack: error.stack,
            email: req.body?.email,
            hasPassword: !!req.body?.password
        });
        res.render('login', { error: 'An error occurred during login' });
    }
};

// Handle user signup
const signup = async (req, res) => {
    try {
        console.log('Signup attempt:', { email: req.body.email, hasPassword: !!req.body.password, name: req.body.name });
        console.log('MongoDB connection state:', mongoose.connection.readyState);
        
        // Check if database is connected
        if (mongoose.connection.readyState !== 1) {
            console.error('Database not connected. State:', mongoose.connection.readyState);
            return res.render('signup', { error: 'Database connection error. Please try again.' });
        }
        
        const { email, password, name } = req.body;
        
        // Input validation
        if (!email || !password) {
            return res.render('signup', { error: 'Email and password are required' });
        }
        
        if (!email.includes('@') || email.length < 5) {
            return res.render('signup', { error: 'Please enter a valid email address' });
        }
        
        if (password.length < 6) {
            return res.render('signup', { error: 'Password must be at least 6 characters long' });
        }
        
        if (name && name.trim().length < 2) {
            return res.render('signup', { error: 'Name must be at least 2 characters long' });
        }
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render('signup', { error: 'User with this email already exists' });
        }
        
        // Create new user
        const user = new User({
            email: sanitizeInput(email).toLowerCase(),
            password,
            name: sanitizeInput(name) || email.split('@')[0] // Use email prefix as name if not provided
        });
        
        await user.save();
        
        // Create a default welcome note for new users
        const welcomeNote = new Note({
            title: 'Welcome to SyncPad!',
            content: `Welcome to SyncPad, ${user.name}! This is your first note. You can edit it, delete it, or create new notes.\n\nFeatures you can explore:\n- Create and edit notes\n- Share notes with others\n- Collaborate on shared notes\n- Encrypt sensitive notes\n\nHappy note-taking!`,
            date: new Date().toLocaleDateString('en-GB'),
            owner: user._id,
            isPublic: false
        });
        
        await welcomeNote.save();
        
        // Set session
        req.session.userId = user._id;
        req.session.userEmail = user.email;
        req.session.userName = user.name;
        req.session.userUniqueId = user.uniqueId;
        
        console.log('Signup successful, redirecting to /home');
        res.redirect('/home');
    } catch (error) {
        console.error('Signup error details:', {
            message: error.message,
            stack: error.stack,
            email: req.body?.email,
            hasPassword: !!req.body?.password,
            name: req.body?.name
        });
        res.render('signup', { error: 'An error occurred during signup' });
    }
};

// Handle user logout
const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.redirect('/');
        }
        res.redirect('/');
    });
};

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    } else {
        res.redirect('/login');
    }
};

// Middleware to check if user is not authenticated (for login/signup pages)
const requireGuest = (req, res, next) => {
    if (req.session && req.session.userId) {
        return res.redirect('/home');
    } else {
        return next();
    }
};

module.exports = {
    getLoginPage,
    getSignupPage,
    login,
    signup,
    logout,
    requireAuth,
    requireGuest
};
