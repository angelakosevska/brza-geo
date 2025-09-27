// This file creates and exports a single Socket.IO instance
// so it can be used across the whole backend without duplicating
const jwt = require("jsonwebtoken");
const User = require("../models/User");

let io = null; // will hold  Socket.IO server instance

// Return list of allowed frontend origins (for CORS)
function getAllowedOrigins() {
  const list = [
    "http://localhost:5173", // local dev frontend
    "https://brza-geo.vercel.app", // deployed frontend
  ].filter(Boolean); // just in case some value is undefined
  return list.map((s) => s.trim()); // clean spaces
}

module.exports = {
  // Initialize Socket.IO server, only once
  initSocket: (server) => {
    if (io) return io; // if already initialized, reuse it

    const { Server } = require("socket.io");
    const allowed = getAllowedOrigins();

    io = new Server(server, {
      cors: {
        origin: (origin, cb) => {
          // Allow requests with no origin (like Postman, curl)
          if (!origin) return cb(null, true);

          // If origin is in our whitelist -> allow
          if (allowed.includes(origin)) return cb(null, true);

          // Otherwise block it
          return cb(new Error("CORS: origin not allowed"));
        },
        credentials: true, // allow cookies/credentials
        methods: ["GET", "POST"], // allowed HTTP methods
      },
      path: "/socket.io", // where socket.io listens (default)
    });

    // Authenticate every socket before it connects
    io.use(async (socket, next) => {
      try {
        // Accept token either via socket.auth.token or Authorization header
        const token =
          socket.handshake.auth?.token ||
          socket.handshake.headers?.authorization?.split(" ")[1];

        if (!token) return next(new Error("No token"));

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check that this token's session is the *current* active session
        const user = await User.findById(decoded.userId).select(
          "currentSessionId"
        );
        if (!user || user.currentSessionId !== decoded.sid) {
          return next(new Error("Invalid session"));
        }

        // Stash useful info
        socket.data.user = {
          id: decoded.userId,
          username: decoded.username,
          role: decoded.role,
          sid: decoded.sid,
        };

        io.on("connection", (socket) => {
          const { id, username } = socket.data.user;

          // private room per user (used to kick/notify)
          socket.join(id.toString());

          // Optional logs
          console.log("✅ socket connected:", username, socket.id);

          socket.on("disconnect", (reason) => {
            console.log("❌ socket disconnected:", username, reason);
          });
        });

        next();
      } catch (err) {
        next(new Error("Unauthorized"));
      }
    });

    return io;
  },

  // Get the Socket.IO instance anywhere else in the project
  getIO: () => {
    if (!io) throw new Error("Socket.io not initialized!");
    return io;
  },
};
