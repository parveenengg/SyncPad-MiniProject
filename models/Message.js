const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    // Sender and receiver
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Message content (mini note)
    title: {
        type: String,
        required: true,
        maxlength: 100,
        default: 'Quick Note'
    },
    content: {
        type: String,
        required: true,
        maxlength: 1000 // Shorter than regular notes since these are mini notes
    },
    
    // Message metadata
    isRead: {
        type: Boolean,
        default: false
    },
    messageType: {
        type: String,
        enum: ['note', 'request', 'response'],
        default: 'note'
    },
    
    // Optional: Link to a full note if this message references one
    linkedNote: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Note',
        required: false
    },
    
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
messageSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Add indexes for better performance
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, isRead: 1 });
messageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
