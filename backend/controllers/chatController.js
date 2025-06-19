const fetch = require("node-fetch");
const { chatbot_db } = require('../config/db');
const { generateSessionId } = require('../utils/sessionidGenerator');
const User = require('../models/userModel'); 

const chatController = {
  // async handleChat(req, res) {
  //   const userInput = req.body.msg;
  //   const userId = req.body.userId;

  //   if (!userInput || !userId) {
  //     return res.status(400).json({
  //       success: false,
  //       error: "Both 'msg' and 'userId' are required in the request body"
  //     });
  //   }

  //   try {
  //     const sessionsCollection = chatbot_db.collection('sessions');
  //     const historyCollection = chatbot_db.collection('history');

  //     // Step 1: Find or create session
  //     let activeSession = await sessionsCollection.findOne({ userId, isActive: true });
  //     let sessionId;

  //     if (activeSession) {
  //       sessionId = activeSession.sessionId;
  //       await sessionsCollection.updateOne(
  //         { sessionId },
  //         { $set: { lastUpdated: new Date() } }
  //       );
  //       console.log("Reusing session:", sessionId);
  //     } else {
  //       sessionId = generateSessionId();
  //       console.log("Creating new session:", sessionId);

  //       // Create session in DB
  //       await sessionsCollection.insertOne({
  //         userId,
  //         sessionId,
  //         isActive: true,
  //         startedAt: new Date(),
  //         lastUpdated: new Date()
  //       });

  //       // Add session to user's sessions array
  //       await User.updateOne(
  //         { _id: userId },
  //         { $addToSet: { sessions: sessionId } } // Prevent duplicates
  //       );
  //     }

  //     // Step 2: Send user message to AI
  //     const requestBody = {
  //       query: userInput,
  //       sessionId
  //     };

  //     const backendResponse = await fetch("http://172.20.10.2:8080/ai", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(requestBody)
  //     });

  //     if (!backendResponse.ok) {
  //       let errorDetails = `Backend error: ${backendResponse.status}`;
  //       try {
  //         const errorBody = await backendResponse.json();
  //         errorDetails = errorBody.error || errorBody.detail || JSON.stringify(errorBody);
  //       } catch (e) {}
  //       throw new Error(errorDetails);
  //     }

  //     const backendData = await backendResponse.json();
  //     const generatedText = backendData?.response || "No response received from backend.";

  //     // Step 3: Save both user and bot messages to history
  //     const now = new Date();

  //     await historyCollection.insertMany([
  //       {
  //         SessionId: sessionId,
  //         createdAt: now,
  //         History: JSON.stringify({
  //           type: "human",
  //           data: { content: userInput }
  //         })
  //       },
  //       {
  //         SessionId: sessionId,
  //         createdAt: now,
  //         History: JSON.stringify({
  //           type: "ai",
  //           data: { content: generatedText }
  //         })
  //       }
  //     ]);

  //     // Step 4: Respond to frontend
  //     res.json({
  //       success: true,
  //       data: {
  //         message: generatedText,
  //         timestamp: now.toISOString(),
  //         sessionId
  //       }
  //     });

  //   } catch (error) {
  //     console.error("Error in handleChat:", error);
  //     res.status(500).json({
  //       success: false,
  //       error: "An error occurred while processing your request",
  //       details: process.env.NODE_ENV === 'development' ? error.message : undefined
  //     });
  //   }
  // }
  async handleChat(req, res) {
  const userInput = req.body.msg;
  const userId = req.body.userId;
  const sessionId = req.params.sessionId; // <-- from URL

  if (!userInput || !userId) {
    return res.status(400).json({
      success: false,
      error: "Both 'msg' and 'userId' are required in the request body"
    });
  }

  try {
    const sessionsCollection = chatbot_db.collection('sessions');
    const historyCollection = chatbot_db.collection('history');

    // Validate if sessionId exists and is active for this user
    let session = await sessionsCollection.findOne({ sessionId, userId });
    if (!session) {
      return res.status(404).json({
        success: false,
        error: "Session not found for this user"
      });
    }

    // Update last used time
    await sessionsCollection.updateOne(
      { sessionId },
      { $set: { lastUpdated: new Date() } }
    );

    // Send user message to AI
    const requestBody = {
      query: userInput,
      sessionId
    };

    const backendResponse = await fetch("http://192.168.137.196:8080/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    if (!backendResponse.ok) {
      const errorBody = await backendResponse.text();
      throw new Error(`AI backend error: ${backendResponse.status} - ${errorBody}`);
    }

    const backendData = await backendResponse.json();
    const generatedText = backendData?.response || "No response received from backend.";
    const now = new Date();

    // Save human + ai message
    await historyCollection.insertMany([
      {
        SessionId: sessionId,
        createdAt: now,
        History: JSON.stringify({
          type: "human",
          data: { content: userInput }
        })
      },
      {
        SessionId: sessionId,
        createdAt: now,
        History: JSON.stringify({
          type: "ai",
          data: { content: generatedText }
        })
      }
    ]);

    res.json({
      success: true,
      data: {
        message: generatedText,
        timestamp: now.toISOString(),
        sessionId
      }
    });
  } catch (error) {
    console.error("Error in handleChat:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
},

  healthCheck(req, res) {
    res.json({ status: 'ok', message: 'Server is running' });
  },

  getChatHistory: async (req, res) => {
    try {
      const sessionId = req.params.sessionId;
      const collection = chatbot_db.collection('history');
      const docs = await collection.find({ SessionId: sessionId }).sort({ createdAt: 1 }).toArray();
      const messages = docs.map(doc => JSON.parse(doc.History));
      res.json({ sessionId, messages });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to load chat history' });
    }
  },
  getUserSessions: async (req, res) => {
  try {
    const { userId } = req.params;
    const sessionsCollection = chatbot_db.collection('sessions');
    const sessions = await sessionsCollection.find({ userId }).sort({ startedAt: -1 }).toArray();
    res.json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch sessions' });
  }
},
endSession: async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const sessionsCollection = chatbot_db.collection('sessions');
    await sessionsCollection.updateOne(
      { sessionId },
      { $set: { isActive: false, endedAt: new Date() } }
    );
    res.json({ success: true, message: "Session ended." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Could not end session." });
  }
},
// startNewSession: async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const sessionsCollection = chatbot_db.collection('sessions');
//     const sessionId = generateSessionId();

//     // Step 1: End any active session
//     await sessionsCollection.updateMany(
//       { userId, isActive: true },
//       { $set: { isActive: false, endedAt: new Date() } }
//     );

//     // Step 2: Create new session
//     await sessionsCollection.insertOne({
//       userId,
//       sessionId,
//       isActive: true,
//       startedAt: new Date(),
//       lastUpdated: new Date()
//     });

//     // Step 3: Add sessionId to user's session array
//     await User.updateOne(
//       { _id: userId },
//       { $addToSet: { sessions: sessionId } }
//     );

//     res.json({
//       success: true,
//       message: "New session started.",
//       sessionId
//     });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to start new session."
//     });
//   }
// }
startNewSession: async (req, res) => {
  try {
    const { userId } = req.body; // ⬅️ get from body now
    if (!userId) {
      return res.status(400).json({ success: false, message: "userId is required" });
    }

    const sessionsCollection = chatbot_db.collection('sessions');
    const sessionId = generateSessionId();

    await sessionsCollection.updateMany(
      { userId, isActive: true },
      { $set: { isActive: false, endedAt: new Date() } }
    );

    await sessionsCollection.insertOne({
      userId,
      sessionId,
      isActive: true,
      startedAt: new Date(),
      lastUpdated: new Date()
    });

    await User.updateOne(
      { _id: userId },
      { $addToSet: { sessions: sessionId } }
    );

    res.json({
      success: true,
      message: "New session started.",
      sessionId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to start new session"
    });
  }
}



};

module.exports = chatController;






