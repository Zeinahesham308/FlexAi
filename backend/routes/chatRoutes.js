const express = require('express');
const router = express.Router();
const multer = require('multer');
const chatController = require('../controllers/chatController');
const { generateSessionId } = require('../utils/sessionidGenerator');


// Configure multer for file uploads
const uploads = multer({ dest: "uploads/" });

// Health check endpoint
router.get('/health', chatController.healthCheck);

// Chat endpoint with file upload support
router.post('/chat', express.json(), chatController.handleChat);

router.get('/chat/history/:sessionId',chatController.getChatHistory);

router.get('/session/new', (req, res) => {
  const sessionId = generateSessionId();
  res.json({ sessionId });
});


module.exports = router; 