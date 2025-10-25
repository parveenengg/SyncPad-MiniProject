const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        default: 'Untitled Note'
    },
    content: {
        type: String,
        required: true,
        default: ''
    },
    date: {
        type: String,
        required: true
    },
    renamed: {
        type: Boolean,
        default: false
    },
    originalTitle: {
        type: String,
        default: ''
    },
    encrypted: {
        type: Boolean,
        default: false
    },
    passcode: {
        type: String,
        default: ''
    },
    shareable: {
        type: Boolean,
        default: false
    },
    editPermissions: {
        type: Boolean,
        default: false
    },
    disableEdit: {
        type: Boolean,
        default: false
    },
    shareLink: {
        type: String,
        default: ''
    },
    // User ownership
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Collaboration features
    collaborators: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        permissions: {
            type: String,
            enum: ['read', 'write'],
            default: 'read'
        }
    }],
    // Public access for shared notes
    isPublic: {
        type: Boolean,
        default: false
    },
    publicAccessToken: {
        type: String,
        unique: true,
        sparse: true
    },
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
noteSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Add indexes for better performance (publicAccessToken already has unique: true)
noteSchema.index({ owner: 1 });
noteSchema.index({ owner: 1, createdAt: -1 });
noteSchema.index({ isPublic: 1 });
noteSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Note', noteSchema);
