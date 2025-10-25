const User = require('../models/User');
const logger = require('../utils/logger');
const { asyncHandler, handleDatabaseError } = require('../middleware/errorHandler');

// Security questions options
const SECURITY_QUESTIONS = [
    "What was the name of your first pet?",
    "What city were you born in?",
    "What was your mother's maiden name?",
    "What was the name of your elementary school?",
    "What was your childhood nickname?",
    "What was the make of your first car?",
    "What was your favorite teacher's name?",
    "What was the name of the street you grew up on?",
    "What was your first job?",
    "What was the name of your first best friend?"
];

// Get profile page
const getProfilePage = asyncHandler(async (req, res) => {
    const user = await User.findById(req.session.userId).select('-password -securityQuestion.answer');
    
    res.render('profile', {
        user: {
            name: user.name,
            email: user.email,
            uniqueId: user.uniqueId,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
            hasSecurityQuestion: !!(user.securityQuestion && user.securityQuestion.question)
        },
        securityQuestions: SECURITY_QUESTIONS,
        currentQuestion: user.securityQuestion ? user.securityQuestion.question : null
    });
});

// Update profile information
const updateProfile = asyncHandler(async (req, res) => {
    const { name, email } = req.body;
    const userId = req.session.userId;

    // Validate input
    if (!name || name.trim().length < 2) {
        return res.status(400).json({
            error: 'Name must be at least 2 characters long'
        });
    }

    if (!email || !email.includes('@')) {
        return res.status(400).json({
            error: 'Please enter a valid email address'
        });
    }

    // Check if email is already taken by another user
    const existingUser = await User.findOne({ 
        email: email.toLowerCase().trim(),
        _id: { $ne: userId }
    });

    if (existingUser) {
        return res.status(409).json({
            error: 'Email is already taken by another user'
        });
    }

    // Update user
    const user = await User.findByIdAndUpdate(
        userId,
        {
            name: name.trim(),
            email: email.toLowerCase().trim()
        },
        { new: true, runValidators: true }
    );

    // Update session
    req.session.userName = user.name;
    req.session.userEmail = user.email;

    logger.logUserAction(userId, 'PROFILE_UPDATE', {
        updatedFields: ['name', 'email'],
        oldName: req.session.userName,
        newName: user.name
    });

    res.json({
        success: true,
        message: 'Profile updated successfully',
        user: {
            name: user.name,
            email: user.email
        }
    });
});

// Change password
const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.session.userId;

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({
            error: 'All password fields are required'
        });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({
            error: 'New password must be at least 6 characters long'
        });
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({
            error: 'New passwords do not match'
        });
    }

    if (currentPassword === newPassword) {
        return res.status(400).json({
            error: 'New password must be different from current password'
        });
    }

    // Get user and verify current password
    const user = await User.findById(userId);
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);

    if (!isCurrentPasswordValid) {
        logger.logSecurity('INVALID_PASSWORD_CHANGE_ATTEMPT', {
            userId,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
        return res.status(401).json({
            error: 'Current password is incorrect'
        });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    logger.logUserAction(userId, 'PASSWORD_CHANGE', {
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });

    res.json({
        success: true,
        message: 'Password changed successfully'
    });
});

// Update security question
const updateSecurityQuestion = asyncHandler(async (req, res) => {
    const { question, answer } = req.body;
    const userId = req.session.userId;

    // Validate input
    if (!question || !answer) {
        return res.status(400).json({
            error: 'Both question and answer are required'
        });
    }

    if (!SECURITY_QUESTIONS.includes(question)) {
        return res.status(400).json({
            error: 'Please select a valid security question'
        });
    }

    if (answer.trim().length < 3) {
        return res.status(400).json({
            error: 'Security answer must be at least 3 characters long'
        });
    }

    // Update security question
    await User.findByIdAndUpdate(
        userId,
        {
            securityQuestion: {
                question: question.trim(),
                answer: answer.trim()
            }
        }
    );

    logger.logUserAction(userId, 'SECURITY_QUESTION_UPDATE', {
        question: question.trim()
    });

    res.json({
        success: true,
        message: 'Security question updated successfully'
    });
});

// Get forgot password page
const getForgotPasswordPage = (req, res) => {
    res.render('forgot-password', { error: null, step: 'email' });
};

// Handle forgot password - step 1: email verification
const handleForgotPasswordEmail = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
        return res.render('forgot-password', {
            error: 'Please enter a valid email address',
            step: 'email'
        });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
        // Don't reveal if user exists or not for security
        return res.render('forgot-password', {
            error: 'If an account with this email exists, you will receive instructions.',
            step: 'email',
            success: true
        });
    }

    if (!user.securityQuestion || !user.securityQuestion.question) {
        return res.render('forgot-password', {
            error: 'This account does not have a security question set up. Please contact support.',
            step: 'email'
        });
    }

    // Store user ID in session for security question step
    req.session.forgotPasswordUserId = user._id;
    req.session.forgotPasswordEmail = user.email;

    logger.logUserAction(user._id, 'FORGOT_PASSWORD_INITIATED', {
        email: user.email,
        ip: req.ip
    });

    res.render('forgot-password', {
        error: null,
        step: 'security',
        question: user.securityQuestion.question,
        email: user.email
    });
});

// Handle forgot password - step 2: security question
const handleForgotPasswordSecurity = asyncHandler(async (req, res) => {
    const { answer } = req.body;
    const userId = req.session.forgotPasswordUserId;

    if (!userId) {
        return res.redirect('/forgot-password');
    }

    if (!answer || answer.trim().length < 3) {
        const user = await User.findById(userId);
        return res.render('forgot-password', {
            error: 'Please provide a valid answer',
            step: 'security',
            question: user.securityQuestion.question,
            email: req.session.forgotPasswordEmail
        });
    }

    const user = await User.findById(userId);
    const isAnswerCorrect = await user.compareSecurityAnswer(answer);

    if (!isAnswerCorrect) {
        logger.logSecurity('INVALID_SECURITY_ANSWER', {
            userId,
            email: user.email,
            ip: req.ip
        });
        return res.render('forgot-password', {
            error: 'Incorrect answer. Please try again.',
            step: 'security',
            question: user.securityQuestion.question,
            email: req.session.forgotPasswordEmail
        });
    }

    // Store verification in session for password reset step
    req.session.forgotPasswordVerified = true;

    logger.logUserAction(userId, 'SECURITY_QUESTION_VERIFIED', {
        email: user.email,
        ip: req.ip
    });

    res.render('forgot-password', {
        error: null,
        step: 'reset',
        email: req.session.forgotPasswordEmail
    });
});

// Handle forgot password - step 3: password reset
const handleForgotPasswordReset = asyncHandler(async (req, res) => {
    const { newPassword, confirmPassword } = req.body;
    const userId = req.session.forgotPasswordUserId;
    const isVerified = req.session.forgotPasswordVerified;

    if (!userId || !isVerified) {
        return res.redirect('/forgot-password');
    }

    if (!newPassword || !confirmPassword) {
        return res.render('forgot-password', {
            error: 'Both password fields are required',
            step: 'reset',
            email: req.session.forgotPasswordEmail
        });
    }

    if (newPassword.length < 6) {
        return res.render('forgot-password', {
            error: 'Password must be at least 6 characters long',
            step: 'reset',
            email: req.session.forgotPasswordEmail
        });
    }

    if (newPassword !== confirmPassword) {
        return res.render('forgot-password', {
            error: 'Passwords do not match',
            step: 'reset',
            email: req.session.forgotPasswordEmail
        });
    }

    // Update password
    const user = await User.findById(userId);
    user.password = newPassword;
    await user.save();

    // Clear forgot password session data
    delete req.session.forgotPasswordUserId;
    delete req.session.forgotPasswordEmail;
    delete req.session.forgotPasswordVerified;

    logger.logUserAction(userId, 'PASSWORD_RESET_SUCCESS', {
        email: user.email,
        ip: req.ip
    });

    res.render('forgot-password', {
        error: null,
        step: 'success',
        message: 'Password reset successfully! You can now log in with your new password.'
    });
});

module.exports = {
    getProfilePage,
    updateProfile,
    changePassword,
    updateSecurityQuestion,
    getForgotPasswordPage,
    handleForgotPasswordEmail,
    handleForgotPasswordSecurity,
    handleForgotPasswordReset,
    SECURITY_QUESTIONS
};
