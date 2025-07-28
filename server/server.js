require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

const { initSocket } = require("./sockets/ioInstance");

const io = initSocket(server);
const socketHandlers = require("./sockets/socketHandlers");

app.use(
  cors({
    origin: "http://localhost:5173", // or 3000 if you're using CRA
    credentials: true,
  })
);
// Middleware
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/game", require("./routes/game"));
app.use("/api/rooms", require("./routes/room"));

app.get("/", (req, res) => {
  res.send("🚀 Backend is running!");
});

// MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB е поврзана"))
  .catch((err) => console.error("❌ MongoDB проблем со конекцијата:", err));

// Init socket handlers
socketHandlers(io);

// Export io for use in controllers (optional)
module.exports.io = io;

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`⚡ Server running on http://localhost:${PORT}`);
});
