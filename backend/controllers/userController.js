const bcrypt = require('bcrypt');
const User = require('../models/userModel');

exports.renderLogin = (req, res) => {
    res.render('login');
};

exports.renderSignup = (req, res) => {
    res.render('signup');
};

exports.signup = async (req, res) => {
    const { username, password } = req.body;

    try {
        const existingUser = await User.findOne({ name: username });
        if (existingUser) {
            return res.send('User already exists. Please choose a different username.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name: username, password: hashedPassword });

        await newUser.save();
        res.send('Signup successful');
    } catch (error) {
        res.status(500).send('Error during signup');
    }
};

exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ name: username });
        if (!user) {
            return res.send('User not found');
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (isPasswordMatch) {
            res.render('home');
        } else {
            res.send('Incorrect password');
        }
    } catch (error) {
        res.status(500).send('Error during login');
    }
};
