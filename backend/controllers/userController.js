const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const UserChatBot = require("../models/chatBotUserModel");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key"; // Use env in production
const getNextSequence = require("../utils/counter");
const  agentController = require("./agentController");

exports.signup = async (req, res, next) => {
  try {
    const { name, email, password, userAnswers } = req.body;

    console.log("Received signup request:", {
      name,
      email,
      password,
      userAnswers,
    });

    const existingUser = await User.findOne({ name: name });
    if (existingUser) {
      return res.status(400).json({
        message: "Username already exists",
      });
    }

    const newChatbotUser = new UserChatBot({
      username: name,
      userAnswers: userAnswers,
    });
    await newChatbotUser.save();
    console.log("New chatbot user created:", newChatbotUser);

    const hashedPassword = await bcrypt.hash(password, 10);

    const agentId = await getNextSequence("agentId");
    console.log("Generated agentId:", agentId);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      userAnswers,
      chatbotId: newChatbotUser._id,
      agentId
    });

    await newUser.save();

    agentController.sendUserAnswersHandler(
  { body: { agentId } },
  {
    json: () => console.log("Agent creation started"),
    status: () => ({ json: () => {} }) // prevent crash on error
  }
);
    console.log("New user created:", newUser);
    return res.status(201).json({
      message: "User created successful",
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { name, password } = req.body;

    const user = await User.findOne({ name: name }); // we must use the email!!
    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

    return res.status(200).json({
      message: "Login successful",
      token,
      data: {
        name: user.name,
        chatbotId: user.chatbotId,
        userId: user._id,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("name userAnswers");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const {
      gender = "",
      currentWeight = 0,
      targetWeight = 0,
      height = 0,
      goal = "",
    } = user.userAnswers || {};

    res.status(200).json({
      success: true,
      data: {
        name: user.name,
        gender,
        currentWeight,
        targetWeight,
        height,
        goal,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: err.message,
    });
  }
};

exports.updateCurrentWeight = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newWeight } = req.body;

    if (!newWeight) {
      return res
        .status(400)
        .json({ success: false, message: "newWeight is required" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Update only the currentWeight inside userAnswers
    user.userAnswers.currentWeight = newWeight;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Current weight updated successfully",
      data: {
        currentWeight: user.userAnswers.currentWeight,
      },
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};
