const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');

router.post('/send-user-answers', agentController.sendUserAnswersHandler);

module.exports = router;
