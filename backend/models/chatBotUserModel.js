const { chatbot_db } = require('../config/db');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    sessions: {
        type: [mongoose.Schema.Types.ObjectId],
        required: true,
        default: []
    },
    userAnswers: {
        type: Object,
        required: true,
        default: {}
    }
});

const ChatbotUser = chatbot_db.model('ChatbotUser', userSchema);

module.exports = ChatbotUser;
