const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        console.log('=== MONGODB CONNECTION DEBUG ===');
        console.log('Attempting to connect to MongoDB...');
        console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
        console.log('MONGODB_URI length:', process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 0);
        console.log('MONGODB_URI starts with:', process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 30) + '...' : 'NOT SET');
        
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sync-pad';
        console.log('Using URI:', uri.substring(0, 30) + '...');
        
        // Try connection with more lenient settings
        const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 30000, // 30 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
            connectTimeoutMS: 30000, // 30 seconds
            maxPoolSize: 10, // Maintain up to 10 socket connections
            minPoolSize: 1, // Minimum 1 connection
            retryWrites: true,
            w: 'majority'
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        
        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
        });
        
        mongoose.connection.on('reconnected', () => {
            console.log('MongoDB reconnected');
        });
        
    } catch (error) {
        console.error('Database connection error:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            name: error.name
        });
        console.log('Retrying connection in 5 seconds...');
        setTimeout(connectDB, 5000);
    }
};

module.exports = connectDB;
