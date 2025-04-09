const fetch = require("node-fetch");

const chatController = {
    async handleChat(req, res) {
        const userInput = req.body.msg;

        if (!userInput) {
            return res.status(400).json({
                success: false,
                error: "Message is required"
            });
        }

        try {
            const response = await fetch(
                "https://api.groq.com/openai/v1/chat/completions",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                    },
                    body: JSON.stringify({
                        model: "llama-3.3-70b-versatile",
                        messages: [{ role: "user", content: userInput }],
                    }),
                }
            );

            if (!response.ok) {
                throw new Error(`Groq API error: ${response.status}`);
            }

            const data = await response.json();
            console.log("Groq API Response:", data);

            const generatedText = data?.choices?.[0]?.message?.content || "No response generated.";

            // Structured response for frontend
            res.json({
                success: true,
                data: {
                    message: generatedText,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error("Error in generating content:", error);
            res.status(error.status || 500).json({
                success: false,
                error: "An error occurred while generating content",
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    healthCheck(req, res) {
        res.json({ status: 'ok', message: 'Server is running' });
    }
};

module.exports = chatController; 