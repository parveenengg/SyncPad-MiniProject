const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    uniqueId: {
        type: String,
        unique: true,
        required: false // Will be set in pre-save hook
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date,
        default: Date.now
    }
});

// Generate unique ID before saving
userSchema.pre('save', async function(next) {
    if (this.isNew && !this.uniqueId) {
        try {
            let uniqueId;
            let isUnique = false;
            let attempts = 0;
            const maxAttempts = 10;
            
            // Keep generating until we get a unique ID
            while (!isUnique && attempts < maxAttempts) {
                // Generate 4-5 digit random number (1000-99999)
                const randomNum = Math.floor(Math.random() * 90000) + 10000;
                uniqueId = `${this.name.replace(/\s+/g, '')}${randomNum}`;
                
                // Check if this uniqueId already exists
                const existingUser = await this.constructor.findOne({ uniqueId });
                if (!existingUser) {
                    isUnique = true;
                }
                attempts++;
            }
            
            if (!isUnique) {
                // Fallback: use timestamp if we can't find a unique ID
                uniqueId = `${this.name.replace(/\s+/g, '')}${Date.now()}`;
            }
            
            this.uniqueId = uniqueId;
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Add indexes for better performance (email and uniqueId already have unique: true)
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);
