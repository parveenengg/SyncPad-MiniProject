const User = require('../models/User');
const Note = require('../models/Note');
const logger = require('../utils/logger');
const { asyncHandler, handleDatabaseError } = require('../middleware/errorHandler');

// Admin login page
const getAdminLoginPage = (req, res) => {
    res.render('admin-login', { error: null });
};

// Admin login authentication
const adminLogin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
        return res.render('admin-login', { error: 'Email and password are required' });
    }

    // Find admin user
    const admin = await User.findOne({ 
        email: email.toLowerCase().trim(),
        role: { $in: ['admin', 'super_admin'] }
    });

    if (!admin) {
        logger.logSecurity('ADMIN_LOGIN_FAILED', {
            email,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
        return res.render('admin-login', { error: 'Invalid admin credentials' });
    }

    // Check if account is locked
    if (admin.isLocked) {
        return res.render('admin-login', { 
            error: 'Account is temporarily locked due to too many failed attempts' 
        });
    }

    // Check password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
        await admin.incLoginAttempts();
        logger.logSecurity('ADMIN_LOGIN_FAILED', {
            email,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
        return res.render('admin-login', { error: 'Invalid admin credentials' });
    }

    // Reset login attempts on successful login
    await admin.resetLoginAttempts();

    // Update online status
    await admin.updateOnlineStatus(true);

    // Set admin session
    req.session.adminId = admin._id;
    req.session.adminEmail = admin.email;
    req.session.adminName = admin.name;
    req.session.adminRole = admin.role;

    logger.logUserAction(admin._id, 'ADMIN_LOGIN', {
        email: admin.email,
        role: admin.role,
        ip: req.ip
    });

    res.redirect('/admin/home');
});

// Admin dashboard
const getAdminDashboard = asyncHandler(async (req, res) => {
    // Get user statistics
    const totalUsers = await User.countDocuments({ role: 'user' });
    const activeUsers = await User.countDocuments({ isOnline: true });
    const totalAdmins = await User.countDocuments({ role: { $in: ['admin', 'super_admin'] } });
    
    // Get storage statistics
    const users = await User.find({ role: 'user' }).select('storageUsage name email');
    
    // Calculate total storage usage
    let totalStorageBytes = 0;
    let topStorageUsers = [];
    
    for (let user of users) {
        // Calculate storage if not recently calculated
        if (!user.storageUsage.lastCalculated || 
            Date.now() - user.storageUsage.lastCalculated > 24 * 60 * 60 * 1000) {
            await user.calculateStorageUsage();
        }
        
        totalStorageBytes += user.storageUsage.totalBytes;
        
        topStorageUsers.push({
            name: user.name,
            email: user.email,
            storageBytes: user.storageUsage.totalBytes,
            formattedStorage: user.getFormattedStorageUsage(),
            notesCount: user.storageUsage.notesCount
        });
    }
    
    // Sort by storage usage
    topStorageUsers.sort((a, b) => b.storageBytes - a.storageBytes);
    topStorageUsers = topStorageUsers.slice(0, 10); // Top 10 users
    
    // Get recent activity
    const recentUsers = await User.find({ role: 'user' })
        .sort({ lastLogin: -1 })
        .limit(10)
        .select('name email lastLogin isOnline');
    
    // Get note statistics
    const totalNotes = await Note.countDocuments();
    const publicNotes = await Note.countDocuments({ isPublic: true });
    const encryptedNotes = await Note.countDocuments({ encrypted: true });
    
    // Format total storage
    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    logger.logUserAction(req.session.adminId, 'ADMIN_DASHBOARD_ACCESS', {
        adminEmail: req.session.adminEmail
    });

    res.render('admin-dashboard', {
        admin: {
            name: req.session.adminName,
            email: req.session.adminEmail,
            role: req.session.adminRole
        },
        stats: {
            totalUsers,
            activeUsers,
            totalAdmins,
            totalNotes,
            publicNotes,
            encryptedNotes,
            totalStorage: formatBytes(totalStorageBytes)
        },
        topStorageUsers,
        recentUsers
    });
});

// Get all users for admin management
const getAllUsers = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const role = req.query.role || '';
    
    const skip = (page - 1) * limit;
    
    // Build query
    let query = {};
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ];
    }
    if (role) {
        query.role = role;
    }
    
    const users = await User.find(query)
        .select('-password -securityQuestion.answer')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    
    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);
    
    logger.logUserAction(req.session.adminId, 'ADMIN_USERS_VIEW', {
        page,
        search,
        role
    });
    
    res.render('admin-users', {
        admin: {
            name: req.session.adminName,
            email: req.session.adminEmail,
            role: req.session.adminRole
        },
        users: users.map(user => ({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isOnline: user.isOnline,
            lastSeen: user.lastSeen,
            lastLogin: user.lastLogin,
            isActive: user.isActive,
            storageUsage: user.getFormattedStorageUsage(),
            notesCount: user.storageUsage.notesCount,
            createdAt: user.createdAt
        })),
        pagination: {
            currentPage: page,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
            nextPage: page + 1,
            prevPage: page - 1
        },
        filters: {
            search,
            role
        }
    });
});

// Update user status
const updateUserStatus = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { action } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    switch (action) {
        case 'activate':
            user.isActive = true;
            break;
        case 'deactivate':
            user.isActive = false;
            break;
        case 'make_admin':
            user.role = 'admin';
            break;
        case 'remove_admin':
            user.role = 'user';
            break;
        default:
            return res.status(400).json({ error: 'Invalid action' });
    }
    
    await user.save();
    
    logger.logUserAction(req.session.adminId, 'ADMIN_USER_UPDATE', {
        targetUserId: userId,
        action,
        targetUserEmail: user.email
    });
    
    res.json({ success: true, message: `User ${action} successful` });
});

// Admin logout
const adminLogout = (req, res) => {
    logger.logUserAction(req.session.adminId, 'ADMIN_LOGOUT', {
        adminEmail: req.session.adminEmail
    });
    
    req.session.destroy((err) => {
        if (err) {
            console.error('Admin logout error:', err);
            return res.redirect('/admin');
        }
        res.redirect('/admin');
    });
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
    if (req.session && req.session.adminId) {
        return next();
    } else {
        res.redirect('/admin');
    }
};

module.exports = {
    getAdminLoginPage,
    adminLogin,
    getAdminDashboard,
    getAllUsers,
    updateUserStatus,
    adminLogout,
    requireAdmin
};
