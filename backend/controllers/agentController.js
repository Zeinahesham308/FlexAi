const fetch = require("node-fetch");
const User = require('../models/userModel');

const agentController = {
  async sendUserAnswersHandler(req, res) {
    console.log('Received request body:', req.body);

    const userId = req.body.userId;
    if (!userId) {
      console.log('No userId provided');
      return res.status(400).json({ success: false, error: 'userId is required' });
    }

    try {
      console.log('Fetching user from DB...');
      const user = await User.findById(userId).select('userAnswers');

      if (!user) {
        console.log('User not found for ID:', userId);
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      if (!user.userAnswers || Object.keys(user.userAnswers).length === 0) {
        console.log('No userAnswers found for user:', userId);
        return res.status(400).json({ success: false, error: 'No user answers found' });
      }

      console.log('Sending user answers to external API...');
      const response = await fetch('http://192.168.1.4:8080/ai/agent', { // replace with real API
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAnswers: user.userAnswers }),
      });

      console.log('External API response status:', response.status);

      if (!response.ok) {
        const errorBody = await response.text();
        console.log('External API error response:', errorBody);
        throw new Error(`External API error: ${response.status}`);
      }

      const apiResponse = await response.json();
      console.log('API response:', apiResponse);

      return res.json({ success: true, data: apiResponse });
    } catch (error) {
      console.error('Error caught in handler:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to process user answers',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
};

module.exports = agentController;
