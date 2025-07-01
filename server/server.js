require('dotenv').config();          // Load .env variables
const express = require('express');  // Import Express
const mongoose = require('mongoose'); // Import Mongoose

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Simple test route
app.get('/', (req, res) => {
  res.send('🚀 Backend is running!');
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('✅ MongoDB е поврзана'))
.catch((err) => console.error('❌ MongoDB проблем со конекцијата:', err));

const authRoute = require('./routes/auth');
app.use('/api/auth', authRoute);

const gameRoute = require('./routes/game');
app.use('/api/game', gameRoute);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`⚡ Server running on http://localhost:${PORT}`);
});


