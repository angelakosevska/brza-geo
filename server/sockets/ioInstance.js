// sockets/ioInstance.js
let io = null;

function getAllowedOrigins() {
  const list = [
    "http://localhost:5173",
    process.env.CLIENT_URL,
    ...(process.env.CLIENT_URLS ? process.env.CLIENT_URLS.split(",") : []),
  ].filter(Boolean);
  return list.map((s) => s.trim());
}

module.exports = {
  initSocket: (server) => {
    if (io) return io;

    const { Server } = require("socket.io");
    const allowed = getAllowedOrigins();

    io = new Server(server, {
      // IMPORTANT: no "*" in prod — allow only your real frontends
      cors: {
        origin: (origin, cb) => {
          // allow server-to-server, health checks, curl (no Origin header)
          if (!origin) return cb(null, true);
          if (allowed.includes(origin)) return cb(null, true);
          return cb(new Error("CORS: origin not allowed"));
        },
        credentials: true,
        methods: ["GET", "POST"],
      },
      path: "/socket.io", 
    });

    return io;
  },

  getIO: () => {
    if (!io) throw new Error("Socket.io not initialized!");
    return io;
  },
};
