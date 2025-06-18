const fetch = require("node-fetch"); 
const { chatbot_db } = require('../config/db');
const session = require("express-session");
const { generateSessionId } = require('../utils/sessionidGenerator');

const chatController = {
    async handleChat(req, res) {
        const userInput = req.body.msg;

        if (!userInput) {
            return res.status(400).json({
                success: false,
                error: "Message (msg) is required in the request body" 
            });
        }

        try {
            // const sessionId = generateSessionId();
            // console.log("Generated sessionId:", sessionId);
            // const requestBody = {
            //     query: userInput,
            //     sessionId: sessionId, 
            // };
            const userId = req.body.userId; 
            const sessionsCollection= chatbot_db.collection('sessions'); // Use the correct collection name for sessions

            let activeSession = await sessionsCollection.findOne({ userId: userId, isActive: true });
            let sessionId;
            if (activeSession) {
                sessionId = activeSession.sessionId; // Use existing session ID
            } else {
                sessionId = generateSessionId(); // Generate a new session ID
                await sessionsCollection.insertOne({
                    userId,
                    sessionId,
                    isActive: true,
                    startedAt: new Date(),
                    lastUpdated: new Date()
                });
            }

            const requestBody = {
                query: userInput,
                sessionId: sessionId, 
            };

            console.log("Request Body to Python Backend:", requestBody); // Log the request body for debugging
            const backendResponse = await fetch(
                "http://10.10.10.60:8080/ai", 
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(requestBody), 
                    
                }
            );

        
            if (!backendResponse.ok) {
            
                let errorDetails = `Backend error: ${backendResponse.status}`;
                try {
                    const errorBody = await backendResponse.json(); // Or .text()
                    errorDetails = errorBody.error || errorBody.detail || JSON.stringify(errorBody);
                } catch (e) {
                    // Failed to parse error body, stick with status code
                }
                 // Throw an error that includes details from the backend if available
                throw new Error(errorDetails);
            }

            // 4. Parse the JSON response from the Python backend
            const backendData = await backendResponse.json();
            console.log("Python Backend Response:", backendData); // Log the actual response structure

            // 5. Extract the generated text using the key defined in Python ("response")
            const generatedText = backendData?.response || "No response received from backend."; // Use the correct key

            // 6. Send the structured response back to *your* client (e.g., the frontend)
            res.json({
                success: true,
                data: {
                    message: generatedText,
                    timestamp: new Date().toISOString(),
                    sessionId: sessionId
                }
            });

        } catch (error) {
            console.error("Error communicating with backend or processing response:", error);
            
            res.status(500).json({
                success: false,
                error: "An error occurred while processing your request",
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },
//     async handleChat(req, res) {
//     const userInput = req.body.msg;
//     const userId = req.body.userId;

//     if (!userInput || !userId) {
//       return res.status(400).json({
//         success: false,
//         error: "Both 'msg' and 'userId' are required in the request body"
//       });
//     }

//     try {
//       const sessionsCollection = chatbot_db.collection('sessions');
//       const historyCollection = chatbot_db.collection('history');

//       // 1. Check if user has an active session
//       let activeSession = await sessionsCollection.findOne({ userId, isActive: true });
//       let sessionId;

//       if (activeSession) {
//         sessionId = activeSession.sessionId;
//         console.log("Using existing session:", sessionId);
//         await sessionsCollection.updateOne(
//           { sessionId },
//           { $set: { lastUpdated: new Date() } }
//         );
//       } else {
//         sessionId = generateSessionId();
//         console.log("Creating new session:", sessionId);
//         await sessionsCollection.insertOne({
//           userId,
//           sessionId,
//           isActive: true,
//           startedAt: new Date(),
//           lastUpdated: new Date()
//         });
//       }

//       // 2. Prepare message to send to Python AI backend
//       const requestBody = {
//         query: userInput,
//         sessionId: sessionId
//       };

//       const backendResponse = await fetch(
//         "http://10.10.10.60:8080/ai",
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(requestBody)
//         }
//       );

//       if (!backendResponse.ok) {
//         let errorDetails = `Backend error: ${backendResponse.status}`;
//         try {
//           const errorBody = await backendResponse.json();
//           errorDetails = errorBody.error || errorBody.detail || JSON.stringify(errorBody);
//         } catch (e) {}
//         throw new Error(errorDetails);
//       }

//       const backendData = await backendResponse.json();
//       const generatedText = backendData?.response || "No response received from backend.";

//       // 3. Save user message to history
//       await historyCollection.insertOne({
//         SessionId: sessionId,
//         createdAt: new Date(),
//         History: JSON.stringify({
//           type: "human",
//           data: { content: userInput }
//         })
//       });

//       // 4. Save bot response to history
//       await historyCollection.insertOne({
//         SessionId: sessionId,
//         createdAt: new Date(),
//         History: JSON.stringify({
//           type: "ai",
//           data: { content: generatedText }
//         })
//       });

//       // 5. Respond back to frontend
//       res.json({
//         success: true,
//         data: {
//           message: generatedText,
//           timestamp: new Date().toISOString(),
//           sessionId: sessionId
//         }
//       });

//     } catch (error) {
//       console.error("Error during chat handling:", error);
//       res.status(500).json({
//         success: false,
//         error: "An error occurred while processing your request",
//         details: process.env.NODE_ENV === 'development' ? error.message : undefined
//       });
//     }
//   },

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
    }
};

module.exports = chatController;