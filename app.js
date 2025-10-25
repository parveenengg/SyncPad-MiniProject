require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const noteRoutes = require('./routes/noteRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3330;

// Connect to MongoDB
connectDB();

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(limiter);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'syncpad-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Set EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/', authRoutes);
app.use('/', noteRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).render('error', { 
        error: 'Page not found',
        user: req.session ? {
            name: req.session.userName,
            email: req.session.userEmail
        } : null
    });
});

// Simple error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', { 
        error: 'Something went wrong!',
        user: req.session ? {
            name: req.session.userName,
            email: req.session.userEmail
        } : null
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Export for Vercel
module.exports = app;