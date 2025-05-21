const fetch = require("node-fetch"); // Make sure you have node-fetch installed (npm i node-fetch) or use native fetch if available (Node.js v18+)

const chatController = {
    async handleChat(req, res) {
        // Assuming the frontend sends the user message in req.body.msg
        const userInput = req.body.msg;

        if (!userInput) {
            return res.status(400).json({
                success: false,
                error: "Message (msg) is required in the request body" // Clarified expected input field name
            });
        }

        try {
            // 1. Prepare the request body expected by the Python endpoint
            const requestBody = {
                query: userInput
            };

            // 2. Fetch from your Python backend
            const backendResponse = await fetch(
                "http://172.16.0.148:8080/ai", // Your Python Flask app URL
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        // Removed Authorization header as it doesn't seem required by the provided Python code
                        // Add it back if your Python app actually implements auth check:
                        // Authorization: `Bearer YOUR_TOKEN_IF_NEEDED`
                    },
                    body: JSON.stringify(requestBody), // Send the correct body format
                }
            );

            // 3. Check if the backend request was successful
            if (!backendResponse.ok) {
                // Try to get error details from the backend response if possible
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
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error("Error communicating with backend or processing response:", error);
            // Send an error response back to *your* client
            res.status(500).json({ // Use 500 for internal/backend communication errors
                success: false,
                error: "An error occurred while processing your request",
                // Provide specific details only in development for security
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    healthCheck(req, res) {
        res.json({ status: 'ok', message: 'Server is running' });
    }
};

module.exports = chatController;