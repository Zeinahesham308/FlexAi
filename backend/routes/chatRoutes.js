const express = require('express');
const router = express.Router();
const multer = require('multer');
const chatController = require('../controllers/chatController');
const { generateSessionId } = require('../utils/sessionidGenerator');


// malha4 lazma
const uploads = multer({ dest: "uploads/" });

// Health check
router.get('/health', chatController.healthCheck);

// Chat endpoint 
router.post('/chat', express.json(), chatController.handleChat);

//get chat history
router.get('/chat/history/:sessionId',chatController.getChatHistory);

//get chat session
router.get('/sessions/:userId', chatController.getUserSessions);

// End chat session
router.post('/session/end/:sessionId', chatController.endSession);


router.get('/session/new', (req, res) => {
  const sessionId = generateSessionId();
  res.json({ sessionId });
});


module.exports = router; 