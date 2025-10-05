// Singleton wrapper for a single Socket.IO instance
// Ensures the same server is reused across the backend

const jwt = require("jsonwebtoken");
const User = require("../models/User");

let io = null;

function getAllowedOrigins() {
  const list = ["http://localhost:5173", "https://brza-geo.vercel.app"].filter(
    Boolean
  );
  return list.map((s) => s.trim());
}

module.exports = {
  initSocket: (server) => {
    if (io) return io;

    const { Server } = require("socket.io");
    const allowed = getAllowedOrigins();

    io = new Server(server, {
      cors: {
        origin: (origin, cb) => {
          if (!origin) return cb(null, true);
          if (allowed.includes(origin)) return cb(null, true);
          return cb(new Error("CORS: origin not allowed"));
        },
        credentials: true,
        methods: ["GET", "POST"],
      },
      path: "/socket.io",
    });

    // Middleware: authenticate every socket before connection
    io.use(async (socket, next) => {
      try {
        const token =
          socket.handshake.auth?.token ||
          socket.handshake.headers?.authorization?.split(" ")[1];

        if (!token) return next(new Error("No token provided"));

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId).select(
          "currentSessionId"
        );
        if (!user || user.currentSessionId !== decoded.sid) {
          return next(new Error("Invalid session"));
        }

        socket.data.user = {
          id: decoded.userId,
          username: decoded.username,
          role: decoded.role,
          sid: decoded.sid,
        };

        io.on("connection", (socket) => {
          const { id, username } = socket.data.user;

          socket.join(id.toString());

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

  getIO: () => {
    if (!io) throw new Error("Socket.IO not initialized!");
    return io;
  },
};
