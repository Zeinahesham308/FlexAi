const mongoose = require('../config/db');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
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

const User = mongoose.model('User', userSchema);

module.exports = User;
