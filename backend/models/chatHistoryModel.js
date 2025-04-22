const mongoose = require('mongoose');
const { chatbot_db } = require('../config/db');

const chatHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    messages: [{
        role: {
            type: String,
            enum: ['user', 'assistant'],
            required: true
        },
        content: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    sessionId: {
        type: String,
        required: true
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

// Update the updatedAt timestamp before saving
chatHistorySchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const ChatHistory = chatbot_db.model('ChatHistory', chatHistorySchema);

module.exports = ChatHistory; 