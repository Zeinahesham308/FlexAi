const fetch = require("node-fetch");
const User = require("../models/userModel");
const mongoose = require("mongoose"); // Optional if not already imported


const agentController = {
  async sendUserAnswersHandler(req, res) {
    console.log("Received request body:", req.body);

    const agentId = req.body.agentId;
    if (!agentId) {
      console.log("No agentId provided");
      return res
        .status(400)
        .json({ success: false, error: "agentId is required" });
    }

    try {
      console.log("Fetching user by agentId from DB...");
      const user = await User.findOne({ agentId }).select("userAnswers");

      if (!user) {
        console.log("User not found for agentId:", agentId);
        return res
          .status(404)
          .json({ success: false, error: "User not found" });
      }

      if (!user.userAnswers || Object.keys(user.userAnswers).length === 0) {
        console.log("No userAnswers found for agentId:", agentId);
        return res
          .status(400)
          .json({ success: false, error: "No user answers found" });
      }

      console.log("Sending user answers to external API...");
      const response = await fetch("http://192.168.137.196:8080/ai/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId, // Optional: include agentId in the request to the Python backend
          userAnswers: user.userAnswers,
        }),
      });

      console.log("External API response status:", response.status);

      if (!response.ok) {
        const errorBody = await response.text();
        console.log("External API error response:", errorBody);
        throw new Error(`External API error: ${response.status}`);
      }

      const apiResponse = await response.json();
      console.log("API response:", apiResponse);

      await User.updateOne({ agentId }, { $set: { workoutPlan: apiResponse } });

      return res.json({ success: true, data: apiResponse });
    } catch (error) {
      console.error("Error caught in handler:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to process user answers",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },



  async modfiyExerciseHandler(req, res) {
    try {
      const { userId, exerciseToReplace, targetMusc } = req.body;

      if (!userId || !exerciseToReplace) {
        return res.status(400).json({
          success: false,
          error: "Both 'userId' and 'exerciseToReplace' are required.",
        });
      }

      // Step 1: Get user and agentId
      const user = await User.findById(userId).select("agentId");
      if (!user || !user.agentId) {
        return res
          .status(404)
          .json({ success: false, error: "User or agentId not found" });
      }

      const agentId = user.agentId;

      // Step 2: Send to AI backend
      const response = await fetch(
        "http://192.168.137.196:8080/ai/agent/change_exercise",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agentId,
            exerciseToReplace,
            targetMusc,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI API error:", errorText);
        return res
          .status(500)
          .json({ success: false, error: "AI backend failed" });
      }

      const updatedPlan = await response.json();

      // Step 3: Update user’s workout plan
      await User.updateOne(
        { _id: userId },
        { $set: { workoutPlan: updatedPlan } }
      );

      res.json({ success: true, data: updatedPlan });
    } catch (error) {
      console.error("Error in modifyExerciseHandler:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },
  async getWorkoutPlanByUserId(req, res) {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, error: 'Invalid userId' });
    }

    const user = await User.findById(userId).select('workoutPlan');

    if (!user || !user.workoutPlan) {
      return res.status(404).json({ success: false, error: 'Workout plan not found' });
    }

    return res.status(200).json({ success: true, data: user.workoutPlan });
  } catch (error) {
    console.error('Error fetching workout plan:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve workout plan',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
};

module.exports = agentController;
