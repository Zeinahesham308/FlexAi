const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');

router.post('/send-user-answers', agentController.sendUserAnswersHandler);


router.post('/plan/update-exercise', agentController.modfiyExerciseHandler);

router.get('/workout-plan/user/:userId', agentController.getWorkoutPlanByUserId);


module.exports = router;
