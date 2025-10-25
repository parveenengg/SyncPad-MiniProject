// Test script for messaging functionality
// Run this with: node test-messaging.js

const mongoose = require('mongoose');
const Message = require('./models/Message');
const User = require('./models/User');
require('dotenv').config();

async function testMessaging() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/syncpad');
        console.log('Connected to MongoDB');

        // Create test users if they don't exist
        let user1 = await User.findOne({ email: 'test1@example.com' });
        if (!user1) {
            user1 = new User({
                name: 'Test User 1',
                email: 'test1@example.com',
                password: 'password123'
            });
            await user1.save();
            console.log('Created test user 1');
        }

        let user2 = await User.findOne({ email: 'test2@example.com' });
        if (!user2) {
            user2 = new User({
                name: 'Test User 2',
                email: 'test2@example.com',
                password: 'password123'
            });
            await user2.save();
            console.log('Created test user 2');
        }

        // Create test messages
        const testMessages = [
            {
                sender: user1._id,
                receiver: user2._id,
                title: 'Hello!',
                content: 'This is a test mini note message.',
                messageType: 'note'
            },
            {
                sender: user2._id,
                receiver: user1._id,
                title: 'Response',
                content: 'Got your message! This is a quick response.',
                messageType: 'note'
            },
            {
                sender: user1._id,
                receiver: user2._id,
                title: 'Project Update',
                content: 'Working on the new features. Everything looks good!',
                messageType: 'note'
            }
        ];

        // Clear existing test messages
        await Message.deleteMany({
            sender: { $in: [user1._id, user2._id] },
            receiver: { $in: [user1._id, user2._id] }
        });

        // Create test messages
        for (const messageData of testMessages) {
            const message = new Message(messageData);
            await message.save();
        }

        console.log('Created test messages');

        // Test message queries
        const messages = await Message.find({
            $or: [
                { sender: user1._id, receiver: user2._id },
                { sender: user2._id, receiver: user1._id }
            ]
        }).populate('sender', 'name email').populate('receiver', 'name email');

        console.log('Test messages:');
        messages.forEach(msg => {
            console.log(`- ${msg.sender.name} to ${msg.receiver.name}: ${msg.title} - ${msg.content}`);
        });

        console.log('Messaging system test completed successfully!');
        
    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

testMessaging();
