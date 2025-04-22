const ChatHistory = require('../models/chatHistoryModel');

// Save a new message to chat history
const saveMessage = async (req, res) => {
    try {
        const { userId, sessionId, message, role } = req.body;

        // Find existing chat history or create new one
        let chatHistory = await ChatHistory.findOne({ userId, sessionId });

        if (!chatHistory) {
            chatHistory = new ChatHistory({
                userId,
                sessionId,
                messages: []
            });
        }

        // Add new message
        chatHistory.messages.push({
            role,
            content: message
        });

        await chatHistory.save();

        res.status(200).json({
            success: true,
            message: 'Message saved successfully',
            data: chatHistory
        });
    } catch (error) {
        console.error('Error saving message:', error);
        res.status(500).json({
            success: false,
            message: 'Error saving message',
            error: error.message
        });
    }
};

// Get chat history for a user
const getChatHistory = async (req, res) => {
    try {
        const { userId, sessionId } = req.params;

        const chatHistory = await ChatHistory.findOne({ userId, sessionId });

        if (!chatHistory) {
            return res.status(404).json({
                success: false,
                message: 'Chat history not found'
            });
        }

        res.status(200).json({
            success: true,
            data: chatHistory
        });
    } catch (error) {
        console.error('Error getting chat history:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting chat history',
            error: error.message
        });
    }
};

// Get all chat sessions for a user
const getUserChatSessions = async (req, res) => {
    try {
        const { userId } = req.params;

        const chatSessions = await ChatHistory.find({ userId })
            .select('sessionId createdAt updatedAt')
            .sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            data: chatSessions
        });
    } catch (error) {
        console.error('Error getting user chat sessions:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting user chat sessions',
            error: error.message
        });
    }
};

// Delete a chat session
const deleteChatSession = async (req, res) => {
    try {
        const { userId, sessionId } = req.params;

        const result = await ChatHistory.findOneAndDelete({ userId, sessionId });

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Chat session not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Chat session deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting chat session:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting chat session',
            error: error.message
        });
    }
};

module.exports = {
    saveMessage,
    getChatHistory,
    getUserChatSessions,
    deleteChatSession
}; 