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
        console.log('Login attempt for:', req.body.email);
        
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
        
        // Check database connection
        if (mongoose.connection.readyState !== 1) {
            console.error('Database not connected, attempting to reconnect...');
            try {
                await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sync-pad');
                console.log('Database reconnected successfully');
            } catch (dbError) {
                console.error('Database reconnection failed:', dbError);
                return res.render('login', { error: 'Database connection error. Please try again.' });
            }
        }
        
        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase().trim() });
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
        req.session.userId = user._id.toString();
        req.session.userEmail = user.email;
        req.session.userName = user.name;
        req.session.userUniqueId = user.uniqueId;
        
        console.log('Login successful, session set:', {
            userId: req.session.userId,
            userEmail: req.session.userEmail,
            userName: req.session.userName
        });
        
        // Force session save and redirect
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.render('login', { error: 'Session error. Please try again.' });
            }
            res.redirect('/home');
        });
    } catch (error) {
        console.error('Login error details:', {
            message: error.message,
            stack: error.stack,
            email: req.body?.email,
            hasPassword: !!req.body?.password,
            databaseState: mongoose.connection.readyState
        });
        res.render('login', { error: 'An error occurred during login' });
    }
};

// Handle user signup
const signup = async (req, res) => {
    try {
        console.log('Signup attempt for:', req.body.email);
        
        const { email, password, name, securityQuestion, securityAnswer } = req.body;
        
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
        const userData = {
            email: sanitizeInput(email).toLowerCase(),
            password,
            name: sanitizeInput(name) || email.split('@')[0] // Use email prefix as name if not provided
        };

        // Add security question if provided
        if (securityQuestion && securityAnswer && securityAnswer.trim().length >= 3) {
            userData.securityQuestion = {
                question: securityQuestion.trim(),
                answer: securityAnswer.trim()
            };
        }

        const user = new User(userData);
        
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
        
        console.log('Signup successful, session set:', {
            userId: req.session.userId,
            userEmail: req.session.userEmail,
            userName: req.session.userName
        });
        
        // Save session before redirect
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.render('signup', { error: 'Session error. Please try again.' });
            }
            console.log('Session saved, redirecting to /home');
            res.redirect('/home');
        });
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

// Handle forgot password
const forgotPassword = async (req, res) => {
    try {
        const { email, securityAnswer, newPassword } = req.body;
        
        // Step 1: Email verification
        if (email && !securityAnswer && !newPassword) {
            if (!email.includes('@') || email.length < 5) {
                return res.render('forgot-password', { 
                    error: 'Please enter a valid email address',
                    success: null,
                    showSecurityQuestion: false,
                    user: null
                });
            }
            
            // Check if user exists
            const user = await User.findOne({ email: email.toLowerCase() });
            if (!user) {
                return res.render('forgot-password', { 
                    error: 'No account found with this email address',
                    success: null,
                    showSecurityQuestion: false,
                    user: null
                });
            }
            
            // If no security question is set up, show error
            if (!user.securityQuestion || !user.securityQuestion.question) {
                return res.render('forgot-password', { 
                    error: 'No security question set up for this account. Please contact support.',
                    success: null,
                    showSecurityQuestion: false,
                    user: null
                });
            }
            
            // Show security question
            return res.render('forgot-password', { 
                error: null,
                success: null,
                showSecurityQuestion: true,
                showPasswordForm: false,
                user: {
                    email: user.email,
                    securityQuestion: user.securityQuestion.question
                }
            });
        }
        
        // Step 2: Security answer verification
        if (email && securityAnswer && !newPassword) {
            if (!email || !securityAnswer) {
                return res.render('forgot-password', { 
                    error: 'Email and security answer are required',
                    success: null,
                    showSecurityQuestion: false,
                    user: null
                });
            }
            
            // Check if user exists
            const user = await User.findOne({ email: email.toLowerCase() });
            if (!user) {
                return res.render('forgot-password', { 
                    error: 'No account found with this email address',
                    success: null,
                    showSecurityQuestion: false,
                    user: null
                });
            }
            
            // Verify security answer
            const isCorrect = await user.compareSecurityAnswer(securityAnswer);
            if (!isCorrect) {
                return res.render('forgot-password', { 
                    error: 'Incorrect security answer. Please try again.',
                    success: null,
                    showSecurityQuestion: true,
                    showPasswordForm: false,
                    user: {
                        email: user.email,
                        securityQuestion: user.securityQuestion.question
                    }
                });
            }
            
            // Show password reset form after successful security answer verification
            return res.render('forgot-password', { 
                error: null,
                success: 'Security question verified! Please enter your new password.',
                showSecurityQuestion: true,
                showPasswordForm: true,
                user: {
                    email: user.email,
                    securityQuestion: user.securityQuestion.question
                }
            });
        }
        
        // Step 3: Password reset
        if (email && securityAnswer && newPassword) {
            if (!email || !securityAnswer || !newPassword) {
                return res.render('forgot-password', { 
                    error: 'All fields are required',
                    success: null,
                    showSecurityQuestion: false,
                    user: null
                });
            }
            
            if (newPassword.length < 6) {
                return res.render('forgot-password', { 
                    error: 'New password must be at least 6 characters long.',
                    success: null,
                    showSecurityQuestion: true,
                    showPasswordForm: true,
                    user: {
                        email: email,
                        securityQuestion: 'Your security question'
                    }
                });
            }
            
            // Check if user exists
            const user = await User.findOne({ email: email.toLowerCase() });
            if (!user) {
                return res.render('forgot-password', { 
                    error: 'No account found with this email address',
                    success: null,
                    showSecurityQuestion: false,
                    user: null
                });
            }
            
            // Verify security answer again
            const isCorrect = await user.compareSecurityAnswer(securityAnswer);
            if (!isCorrect) {
                return res.render('forgot-password', { 
                    error: 'Incorrect security answer. Please try again.',
                    success: null,
                    showSecurityQuestion: true,
                    showPasswordForm: true,
                    user: {
                        email: user.email,
                        securityQuestion: user.securityQuestion.question
                    }
                });
            }
            
            // Update password
            user.password = newPassword;
            await user.save();
            
            return res.render('forgot-password', { 
                error: null,
                success: 'Password has been reset successfully! You can now login with your new password.',
                showSecurityQuestion: false,
                user: null
            });
        }
        
        // Default case - show email form
        return res.render('forgot-password', { 
            error: null,
            success: null,
            showSecurityQuestion: false,
            user: null
        });
        
    } catch (error) {
        console.error('Forgot password error:', error);
        return res.render('forgot-password', { 
            error: 'An error occurred. Please try again.',
            success: null,
            showSecurityQuestion: false,
            user: null
        });
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
    forgotPassword,
    requireAuth,
    requireGuest
};
