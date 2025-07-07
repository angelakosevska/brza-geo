require('dotenv').config();          // Load .env variables
const express = require('express');  // Import Express
const mongoose = require('mongoose'); // Import Mongoose
const http = require('http');
const {Server} = require('socket.io')

const app = express();
const server = http.createServer(app);
// Middleware to parse JSON bodies
app.use(express.json());

const authRoute = require('./routes/auth');
const gameRoute = require('./routes/game');
const roomRoutes = require('./routes/room');

app.use('/api/auth', authRoute);
app.use('/api/game', gameRoute);
app.use('/api/rooms', roomRoutes);

// Simple test route
app.get('/', (req, res) => {
  res.send('🚀 Backend is running!');
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('✅ MongoDB е поврзана'))
.catch((err) => console.error('❌ MongoDB проблем со конекцијата:', err));

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",  // Change this in production!
    methods: ["GET", "POST"]
  }
});

// Example: Socket.IO handlers here
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // your socket event handlers here

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start listening on the server (not app)
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`⚡ Server running on http://localhost:${PORT}`);
});


