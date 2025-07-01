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
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`⚡ Server running on http://localhost:${PORT}`);
});
