const bcrypt = require('bcrypt');
const User = require('../models/userModel');
const UserChatBot = require('../models/chatBotUserModel');


exports.signup = async (req, res, next) => {
    try{
        const { name, email,password, userAnswers } = req.body;

        const existingUser = await User.findOne({ name: name });
        if (existingUser) {
            return res.status(400).json({
                message: "Username already exists",
            });
        }

        const newChatbotUser = new UserChatBot({ username: name , userAnswers: userAnswers });
        await newChatbotUser.save();
    

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword, userAnswers, chatbotId: newChatbotUser._id });

        await newUser.save();
        return res.status(201).json({
            message: "User created successful",
        });
    }
    catch(err){
        next(err)
    }
};



exports.login = async (req, res) => {
    try{
        const { name, password } = req.body;

        const user = await User.findOne({ name: name });
        if (!user) {
            return res.status(401).json({
                message: "User not found",
            });
            
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (isPasswordMatch) {
            return res.status(200).json({
                message: "Login successful",
                data: {
                    name: name,
                    chatbotId: user.chatbotId,
                    userId: user._id,
                }
            });
        } else {
            return res.status(401).json({
                message: "Invalid credentials", 
            });
        }
    }
    catch(err){
        next(err)
    }
};
