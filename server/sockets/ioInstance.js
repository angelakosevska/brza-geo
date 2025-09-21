// This file creates and exports a single Socket.IO instance
// so it can be used across the whole backend without duplicating

let io = null; // will hold  Socket.IO server instance

// Return list of allowed frontend origins (for CORS)
function getAllowedOrigins() {
  const list = [
    "http://localhost:5173",     // local dev frontend
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

    return io;
  },

  // Get the Socket.IO instance anywhere else in the project
  getIO: () => {
    if (!io) throw new Error("Socket.io not initialized!");
    return io;
  },
};
