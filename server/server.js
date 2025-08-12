require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const i18n = require("i18n");

const app = express();
const server = http.createServer(app);

const { initSocket } = require("./sockets/ioInstance");
const io = initSocket(server);
const socketHandlers = require("./sockets/socketHandlers");
socketHandlers(io);

i18n.configure({
  locales: ["en", "mk"],
  directory: __dirname + "/locales",
  defaultLocale: "en",
  autoReload: true,
  objectNotation: true,
  queryParameter: "lang", // e.g. /register?lang=mk
});

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
// Middleware
app.use(express.json());
app.use(i18n.init);
// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/game", require("./routes/game"));
app.use("/api/room", require("./routes/room"));
app.use("/api/categories", require("./routes/category"));

app.get("/", (req, res) => {
  res.send("🚀 Backend is running!");
});

// MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB е поврзана"))
  .catch((err) => console.error("❌ MongoDB проблем со конекцијата:", err));

module.exports.io = io;

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`⚡ Server running on http://localhost:${PORT}`);
});
