// Load environment variables from .env file (safe try/catch in case dotenv is missing)
try {
  require("dotenv").config();
} catch (_) {}

// Import core dependencies
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const i18n = require("i18n");

// Initialize Express app and create an HTTP server
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO instance and bind it to the HTTP server
const { initSocket } = require("./sockets/ioInstance");
const io = initSocket(server);

// Load socket event handlers (main socket logic is inside /sockets/index.js)
require("./sockets/index")(io);

// Define allowed client origins for CORS (from .env or default localhost)
const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL, // e.g. frontend hosted on Vercel
  ...(process.env.CLIENT_URLS ? process.env.CLIENT_URLS.split(",") : []),
].filter(Boolean);

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

// Configure i18n (internationalization) for English and Macedonian
i18n.configure({
  locales: ["en", "mk"],             // supported languages
  directory: __dirname + "/locales", // translation files location
  defaultLocale: "en",               // fallback language
  autoReload: true,                  // reload files on change (dev mode)
  objectNotation: true,              // allow nested keys with dot notation
  queryParameter: "lang",            // switch language via ?lang=mk
});
app.use(i18n.init); // attach i18n middleware

// API routes
app.use("/api/auth", require("./routes/auth"));         // authentication (register/login/etc.)
app.use("/api/game", require("./routes/game"));         // game-related endpoints
app.use("/api/room", require("./routes/room"));         // room management endpoints
app.use("/api/categories", require("./routes/category"));// category management endpoints
app.use("/api/user", require("./routes/user"));         // user profile endpoints

// Health check route
app.get("/healthz", (_req, res) => res.send("ok"));

// Root route (basic server status)
app.get("/", (req, res) => {
  res.send("🚀 Backend is running!");
});

// Connect to MongoDB using URI from environment variables
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    // Log which database is being used
    const usedDb =
      mongoose.connection?.db?.databaseName ??
      mongoose.connection?.client?.options?.dbName ??
      "unknown";
    console.log(`✅ MongoDB connected to database: ${usedDb}`);
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });


// Export Socket.IO instance for use in other modules
module.exports.io = io;

// Start the server on defined port (default: 5000)
const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`⚡ Server running on http://localhost:${PORT}`);
});

app.get("/test-email", async (req, res) => {
  try {
    await transporter.sendMail({
      from: '"Type Rush" <brza.geografija17@gmail.com>', // истиот email што ти е verified во SendGrid
      to: "kosevska90@gmail.com",
      subject: "Test Email from Type Rush",
      text: "Ова е тест порака од Nodemailer + SendGrid 🎉",
    });
    res.send("✅ Email sent!");
  } catch (err) {
    console.error("❌ Email error:", err);
    res.status(500).send("Failed to send email");
  }
});