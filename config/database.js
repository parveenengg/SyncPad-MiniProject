const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Check if already connected
        if (mongoose.connection.readyState === 1) {
            console.log('MongoDB already connected');
            return;
        }

        console.log('Connecting to MongoDB...');
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sync-pad';
        
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000,
            maxPoolSize: 10,
            retryWrites: true
        });
        
        console.log('MongoDB Connected successfully');
        
    } catch (error) {
        console.error('Database connection error:', error.message);
        
        // Retry connection in non-production environments
        if (process.env.NODE_ENV !== 'production') {
            console.log('Retrying connection in 5 seconds...');
            setTimeout(connectDB, 5000);
        }
    }
};

module.exports = connectDB;
