// const express = require('express');
// const router = express.Router();
// const multer = require('multer');
// const chatController = require('../controllers/chatController');
// const { generateSessionId } = require('../utils/sessionidGenerator');


// // malha4 lazma
// const uploads = multer({ dest: "uploads/" });

// // Health check
// router.get('/health', chatController.healthCheck);

// // Chat endpoint 
// router.post('/chat', express.json(), chatController.handleChat);

// //get chat history
// router.get('/chat/history/:sessionId',chatController.getChatHistory);

// //get chat session
// router.get('/sessions/:userId', chatController.getUserSessions);

// // End chat session
// router.post('/session/end/:sessionId', chatController.endSession);

// // Start new chat session
// router.post('/session/new/:userId', chatController.startNewSession);

// router.get('/session/new', (req, res) => {
//   const sessionId = generateSessionId();
//   res.json({ sessionId });
// });


// module.exports = router; 


const express = require('express');
const router = express.Router();
const multer = require('multer');
const chatController = require('../controllers/chatController');

// Health check
router.get('/health', chatController.healthCheck);

// Unified chat message handling
router.post('/sessions/:sessionId/messages', express.json(), chatController.handleChat);

// Get full chat history for a session
router.get('/sessions/:sessionId/messages', chatController.getChatHistory);

// Get all sessions for a user
router.get('/sessions/:userId', chatController.getUserSessions);

// End an active session
router.post('/sessions/:sessionId/end', chatController.endSession);

// Start a new chat session
router.post('/sessions', chatController.startNewSession); // expects userId in req.body

module.exports = router;
