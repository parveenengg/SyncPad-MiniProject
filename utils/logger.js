const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logDir = path.join(__dirname, '../logs');
        this.ensureLogDirectory();
    }

    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    formatLog(level, message, metadata = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            metadata: {
                ...metadata,
                environment: process.env.NODE_ENV || 'development',
                platform: process.env.VERCEL ? 'vercel' : 'local'
            }
        };
        return JSON.stringify(logEntry);
    }

    writeToFile(filename, logEntry) {
        const logPath = path.join(this.logDir, filename);
        fs.appendFileSync(logPath, logEntry + '\n');
    }

    info(message, metadata = {}) {
        const logEntry = this.formatLog('INFO', message, metadata);
        console.log(`[INFO] ${message}`, metadata);
        this.writeToFile('app.log', logEntry);
    }

    error(message, metadata = {}) {
        const logEntry = this.formatLog('ERROR', message, metadata);
        console.error(`[ERROR] ${message}`, metadata);
        this.writeToFile('error.log', logEntry);
    }

    warn(message, metadata = {}) {
        const logEntry = this.formatLog('WARN', message, metadata);
        console.warn(`[WARN] ${message}`, metadata);
        this.writeToFile('app.log', logEntry);
    }

    debug(message, metadata = {}) {
        const logEntry = this.formatLog('DEBUG', message, metadata);
        console.log(`[DEBUG] ${message}`, metadata);
        this.writeToFile('debug.log', logEntry);
    }

    // User action logging
    logUserAction(userId, action, details = {}) {
        this.info(`User Action: ${action}`, {
            userId,
            action,
            details,
            type: 'USER_ACTION'
        });
    }

    // Performance logging
    logPerformance(operation, duration, metadata = {}) {
        this.info(`Performance: ${operation}`, {
            operation,
            duration,
            metadata,
            type: 'PERFORMANCE'
        });
    }

    // Security logging
    logSecurity(event, details = {}) {
        this.warn(`Security Event: ${event}`, {
            event,
            details,
            type: 'SECURITY'
        });
    }

    // Database operation logging
    logDatabaseOperation(operation, collection, duration, metadata = {}) {
        this.info(`Database: ${operation}`, {
            operation,
            collection,
            duration,
            metadata,
            type: 'DATABASE'
        });
    }
}

module.exports = new Logger();
