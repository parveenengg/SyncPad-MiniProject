const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { requireAuth } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(requireAuth);

// Get all conversations for the current user
router.get('/conversations', messageController.getConversations);

// Get messages between current user and another user
router.get('/messages/:userId', messageController.getMessages);

// Send a new message
router.post('/send', messageController.sendMessage);

// Get unread message count
router.get('/unread-count', messageController.getUnreadCount);

// Mark a message as read
router.put('/mark-read/:messageId', messageController.markAsRead);

// Delete a message
router.delete('/delete/:messageId', messageController.deleteMessage);

// Get all users available for messaging
router.get('/users', messageController.getMessagingUsers);

module.exports = router;
