const fetch = require("node-fetch"); // Make sure you have node-fetch installed (npm i node-fetch) or use native fetch if available (Node.js v18+)
const ChatMessage = require("../models/chatHistoryModel"); 



const chatController = {
    async handleChat(req, res) {
        const userInput = req.body.msg;
        const userId = req.body.userId; // TODO: replace this with JWT-based req.user._id in production
    
        if (!userInput || !userId) {
            return res.status(400).json({
                success: false,
                error: "Message (msg) and userId are required in the request body"
            });
        }
    
        try {
            // Save user's message to DB
            await ChatMessage.create({
                userId,
                sender: 'user',
                message: userInput
            });
    
            // Send message to Python backend
            const requestBody = { query: userInput };
            const backendResponse = await fetch("http://192.168.1.37:8080/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            });
    
            if (!backendResponse.ok) {
                let errorDetails = `Backend error: ${backendResponse.status}`;
                try {
                    const errorBody = await backendResponse.json();
                    errorDetails = errorBody.error || errorBody.detail || JSON.stringify(errorBody);
                } catch (e) {}
                throw new Error(errorDetails);
            }
    
            const backendData = await backendResponse.json();
            const generatedText = backendData?.response || "No response received from backend.";
    
            // Save bot's reply to DB
            await ChatMessage.create({
                userId,
                sender: 'bot',
                message: generatedText
            });
    
            res.json({
                success: true,
                data: {
                    message: generatedText,
                    timestamp: new Date().toISOString()
                }
            });
    
        } catch (error) {
            console.error("Error processing chatbot:", error);
            res.status(500).json({
                success: false,
                error: "An error occurred while processing your request",
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },
    async getHistory(req, res) {
        try {
            const userId = req.params.userId;
            const history = await ChatMessage.find({ userId }).sort({ timestamp: 1 });
            res.status(200).json(history);
        } catch (err) {
            res.status(500).json({ error: 'Failed to retrieve chat history.' });
        }
    },
    healthCheck(req, res) {
        res.json({ status: 'ok', message: 'Server is running' });
    }
};

module.exports = chatController;