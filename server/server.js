try {
  require("dotenv").config();
} catch (_) {}
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const i18n = require("i18n");

const app = express();
const server = http.createServer(app);

const { initSocket } = require("./sockets/ioInstance");
const io = initSocket(server);
const socketHandlers = require("./sockets/socketHandlers");
socketHandlers(io);

const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL, // e.g. https://your-frontend.vercel.app
  ...(process.env.CLIENT_URLS ? process.env.CLIENT_URLS.split(",") : []), // optional CSV
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());

i18n.configure({
  locales: ["en", "mk"],
  directory: __dirname + "/locales",
  defaultLocale: "en",
  autoReload: true,
  objectNotation: true,
  queryParameter: "lang", // e.g. /register?lang=mk
});

app.use(i18n.init);

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/game", require("./routes/game"));
app.use("/api/room", require("./routes/room"));
app.use("/api/categories", require("./routes/category"));

app.get("/healthz", (_req, res) => res.send("ok"));
app.get("/", (req, res) => {
  res.send("🚀 Backend is running!");
});

// MongoDB
mongoose
  .connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME || "brza_geo" })
  .then(() => console.log("✅ MongoDB е поврзана"))
  .catch((err) => console.error("❌ MongoDB проблем со конекцијата:", err));

module.exports.io = io;

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`⚡ Server running on http://localhost:${PORT}`);
});
