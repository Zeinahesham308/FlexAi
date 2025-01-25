const { db } = require('../config/db');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    chatbotId: { 
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    userAnswers: {
        type: Object,
        required: true,
        default: {}
    }
});

const User = db.model('User', userSchema);

module.exports = User;
