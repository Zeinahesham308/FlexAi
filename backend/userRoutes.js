const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/', userController.renderLogin);
router.get('/signup', userController.renderSignup);
router.post('/signup', userController.signup);
router.post('/login', userController.login);

module.exports = router;
