require("dotenv").config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Enable CORS for Angular during development
const corsOptions = {
    origin: process.env.FRONTEND_URL || '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};
app.use(cors(corsOptions));

// Routes
app.use('/api/users', userRoutes); // Backend API routes for user operations
app.use('/api', chatRoutes); // Chat routes

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

app.use((err, req, res, next) => {
    console.error(`[Error] ${err.message}`);
    
    const statusCode = err.statusCode || 500; // Default to 500 if statusCode is not set
    const response = {
      message: err.message || "Internal Server Error",
    };
  
    if (process.env.NODE_ENV === "development") {
      // Include stack trace only in development mode
      response.stack = err.stack;
    }
  
    res.status(statusCode).json(response);
  });

if (process.env.NODE_ENV === 'production') {
    
    app.use(express.static(path.join(__dirname, 'frontend/dist/frontend')));

    
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'frontend', 'dist', 'frontend', 'index.html'));
    });
}

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});