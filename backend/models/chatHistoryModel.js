const { db } = require("../config/db");
const mongoose = require("mongoose");

const ChatMessageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sender: { type: String, enum: ["user", "bot"], required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const ChatMessage = db.model("ChatMessage", ChatMessageSchema);

module.exports = ChatMessage;
