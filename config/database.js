/**
 * Database Connection Module
 * 
 * Handles MongoDB connection with retry logic, error handling,
 * and enterprise-grade configuration.
 * 
 * @author Enterprise Development Team
 * @version 2.0.0
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Connection configuration
const CONNECTION_CONFIG = {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    minPoolSize: 2,
    maxIdleTimeMS: 30000,
    retryWrites: true,
    retryReads: true,
    bufferCommands: false,
    bufferMaxEntries: 0
};

// Retry configuration
const RETRY_CONFIG = {
    maxRetries: 5,
    retryDelay: 5000,
    backoffMultiplier: 1.5
};

let retryCount = 0;
let isConnecting = false;

/**
 * Establishes connection to MongoDB with retry logic
 * @returns {Promise<void>}
 */
const connectDB = async () => {
    try {
        // Prevent multiple simultaneous connection attempts
        if (isConnecting) {
            logger.info('Database connection already in progress');
            return;
        }

        // Check if already connected
        if (mongoose.connection.readyState === 1) {
            logger.info('MongoDB already connected');
            return;
        }

        isConnecting = true;
        retryCount++;

        logger.info(`Connecting to MongoDB... (Attempt ${retryCount})`);
        
        // Determine connection URI
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sync-pad';
        
        // Connect with configuration
        await mongoose.connect(uri, CONNECTION_CONFIG);
        
        // Set up connection event listeners
        setupConnectionListeners();
        
        logger.info('MongoDB connected successfully');
        retryCount = 0; // Reset retry count on successful connection
        
    } catch (error) {
        logger.error('Database connection error:', error.message);
        
        // Handle retry logic
        if (retryCount < RETRY_CONFIG.maxRetries) {
            const delay = RETRY_CONFIG.retryDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, retryCount - 1);
            logger.info(`Retrying connection in ${delay / 1000} seconds...`);
            
            setTimeout(() => {
                isConnecting = false;
                connectDB();
            }, delay);
        } else {
            logger.error('Maximum retry attempts reached. Database connection failed.');
            isConnecting = false;
            
            // In production, exit the process
            if (process.env.NODE_ENV === 'production') {
                process.exit(1);
            }
        }
    } finally {
        isConnecting = false;
    }
};

/**
 * Sets up MongoDB connection event listeners
 */
const setupConnectionListeners = () => {
    mongoose.connection.on('connected', () => {
        logger.info('MongoDB connection established');
    });

    mongoose.connection.on('error', (error) => {
        logger.error('MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
        
        // Attempt reconnection in non-production
        if (process.env.NODE_ENV !== 'production') {
            setTimeout(connectDB, 5000);
        }
    });

    mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
    });

    // Handle process termination
    process.on('SIGINT', async () => {
        try {
            await mongoose.connection.close();
            logger.info('MongoDB connection closed through app termination');
            process.exit(0);
        } catch (error) {
            logger.error('Error closing MongoDB connection:', error);
            process.exit(1);
        }
    });
};

/**
 * Gracefully closes the database connection
 * @returns {Promise<void>}
 */
const disconnectDB = async () => {
    try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed gracefully');
    } catch (error) {
        logger.error('Error closing MongoDB connection:', error);
        throw error;
    }
};

module.exports = { connectDB, disconnectDB };
