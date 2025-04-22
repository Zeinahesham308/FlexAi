const express = require('express');
const router = express.Router();
const {
    saveMessage,
    getChatHistory,
    getUserChatSessions,
    deleteChatSession
} = require('../controllers/chatHistoryController');

// Save a new message
router.post('/save', saveMessage);

// Get chat history for a specific session
router.get('/history/:userId/:sessionId', getChatHistory);

// Get all chat sessions for a user
router.get('/sessions/:userId', getUserChatSessions);

// Delete a chat session
router.delete('/session/:userId/:sessionId', deleteChatSession);

module.exports = router; 