const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();
const userRoutes = require('./routes/userRoutes');


app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Enable CORS for Angular during development
const corsOptions = {
    origin: 'http://localhost:4200', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Routes
app.use('/api/users', userRoutes); // Backend API routes for user operations


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
