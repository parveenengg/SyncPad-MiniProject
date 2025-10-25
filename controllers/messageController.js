const Message = require('../models/Message');
const User = require('../models/User');

// Add error handling wrapper for all controller functions
const handleAsync = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Sanitize user input to prevent XSS attacks
 * @param {string} input - The input string to sanitize
 * @returns {string} - Sanitized input
 */
const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, ''); // Remove event handlers
};

// Get all conversations for a user
const getConversations = async (req, res) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userId = req.session.userId;
        
        // Get all unique users that the current user has conversations with
        const conversations = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { sender: userId },
                        { receiver: userId }
                    ]
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'sender',
                    foreignField: '_id',
                    as: 'senderInfo'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'receiver',
                    foreignField: '_id',
                    as: 'receiverInfo'
                }
            },
            {
                $addFields: {
                    otherUser: {
                        $cond: {
                            if: { $eq: ['$sender', userId] },
                            then: { $arrayElemAt: ['$receiverInfo', 0] },
                            else: { $arrayElemAt: ['$senderInfo', 0] }
                        }
                    }
                }
            },
            {
                $group: {
                    _id: '$otherUser._id',
                    otherUser: { $first: '$otherUser' },
                    lastMessage: { $first: '$$ROOT' },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                { $and: [
                                    { $eq: ['$receiver', userId] },
                                    { $eq: ['$isRead', false] }
                                ]},
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $sort: { 'lastMessage.createdAt': -1 }
            }
        ]);

        res.json({ conversations });
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: 'Error fetching conversations' });
    }
};

// Get messages between two users
const getMessages = async (req, res) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { userId } = req.params;
        const currentUserId = req.session.userId;

        // Verify the conversation exists between these users
        const messages = await Message.find({
            $or: [
                { sender: currentUserId, receiver: userId },
                { sender: userId, receiver: currentUserId }
            ]
        })
        .populate('sender', 'name email')
        .populate('receiver', 'name email')
        .sort({ createdAt: 1 });

        // Mark messages as read
        await Message.updateMany(
            { receiver: currentUserId, sender: userId, isRead: false },
            { isRead: true }
        );

        res.json({ messages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Error fetching messages' });
    }
};

// Send a new message (mini note)
const sendMessage = async (req, res) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { receiverId, title, content, messageType = 'note' } = req.body;
        const senderId = req.session.userId;

        // Input validation
        if (!receiverId || !content) {
            return res.status(400).json({ error: 'Receiver ID and content are required' });
        }

        if (title && title.length > 100) {
            return res.status(400).json({ error: 'Title must be less than 100 characters' });
        }

        if (content.length > 1000) {
            return res.status(400).json({ error: 'Content must be less than 1000 characters' });
        }

        // Check if receiver exists
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({ error: 'Receiver not found' });
        }

        // Create new message
        const newMessage = new Message({
            sender: senderId,
            receiver: receiverId,
            title: sanitizeInput(title) || 'Quick Note',
            content: sanitizeInput(content),
            messageType: messageType
        });

        await newMessage.save();

        // Populate sender info for response
        await newMessage.populate('sender', 'name email');

        res.json({ 
            message: newMessage,
            success: true 
        });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Error sending message' });
    }
};

// Get unread message count
const getUnreadCount = async (req, res) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userId = req.session.userId;
        const unreadCount = await Message.countDocuments({
            receiver: userId,
            isRead: false
        });

        res.json({ unreadCount });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ error: 'Error fetching unread count' });
    }
};

// Mark message as read
const markAsRead = async (req, res) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { messageId } = req.params;
        const userId = req.session.userId;

        const message = await Message.findOneAndUpdate(
            { _id: messageId, receiver: userId },
            { isRead: true },
            { new: true }
        );

        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error marking message as read:', error);
        res.status(500).json({ error: 'Error marking message as read' });
    }
};

// Delete a message
const deleteMessage = async (req, res) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { messageId } = req.params;
        const userId = req.session.userId;

        const message = await Message.findOne({
            _id: messageId,
            $or: [
                { sender: userId },
                { receiver: userId }
            ]
        });

        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        await Message.findByIdAndDelete(messageId);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ error: 'Error deleting message' });
    }
};

// Get all users for messaging (collaborators and team members)
const getMessagingUsers = async (req, res) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const currentUserId = req.session.userId;
        
        // Get all users except current user
        const users = await User.find({ _id: { $ne: currentUserId } })
            .select('name email uniqueId')
            .sort({ name: 1 });

        res.json({ users });
    } catch (error) {
        console.error('Error fetching messaging users:', error);
        res.status(500).json({ error: 'Error fetching messaging users' });
    }
};

module.exports = {
    getConversations: handleAsync(getConversations),
    getMessages: handleAsync(getMessages),
    sendMessage: handleAsync(sendMessage),
    getUnreadCount: handleAsync(getUnreadCount),
    markAsRead: handleAsync(markAsRead),
    deleteMessage: handleAsync(deleteMessage),
    getMessagingUsers: handleAsync(getMessagingUsers)
};
