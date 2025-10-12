// Load environment variables
try {
  require("dotenv").config();
} catch (_) {}

// Import core dependencies
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const i18n = require("i18n");
const sgMail = require("@sendgrid/mail");

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const { initSocket } = require("./sockets/ioInstance");
const io = initSocket(server);

// Load socket event handlers
require("./sockets/index")(io);

// Configure SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Define allowed client origins (CORS)
const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL_1,
  process.env.CLIENT_URL_2,

  ...(process.env.CLIENT_URLS ? process.env.CLIENT_URLS.split(",") : []),
].filter(Boolean);

// Middleware configuration

// Enable CORS with custom origin check
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// Parse JSON request bodies
app.use(express.json());

// Configure i18n
i18n.configure({
  locales: ["en", "mk"], // supported languages
  directory: __dirname + "/locales", // translation files location
  defaultLocale: "en", // fallback language
  autoReload: true, // reload files on change (dev mode)
  objectNotation: true, // allow nested keys with dot notation
  queryParameter: "lang", // switch language via ?lang=mk
});
app.use(i18n.init);

// API routes
app.use("/api/auth", require("./routes/auth")); // authentication
//app.use("/api/game", require("./routes/game")); // game-related
app.use("/api/room", require("./routes/room")); // room management
app.use("/api/categories", require("./routes/category")); // category management
app.use("/api/user", require("./routes/user")); // user profile
app.use("/api/admin", require("./routes/admin")); // admin review

// Health check route
app.get("/healthz", (_req, res) => res.send("ok"));

// Root route (server status)
app.get("/", (_req, res) => {
  res.send("🚀 Backend is running!");
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    const usedDb =
      mongoose.connection?.db?.databaseName ??
      mongoose.connection?.client?.options?.dbName ??
      "unknown";
    console.log(`✅ MongoDB connected to database: ${usedDb}`);
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });

// Export Socket.IO instance
module.exports.io = io;

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`⚡ Server running on http://localhost:${PORT}`);
});
