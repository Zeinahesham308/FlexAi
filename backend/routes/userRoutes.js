const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { validateSignup, validateLogin } = require('../middlewares/validateUser');

router.post('/signup',validateSignup, userController.signup);
router.post('/login', validateLogin , userController.login);
router.get('/dashboard/:userId', userController.getDashboard);
router.put('/update-weight/:userId', userController.updateCurrentWeight);

module.exports = router;
