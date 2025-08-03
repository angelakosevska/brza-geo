// sockets/socketHandlers.js (or similar)
const Room = require("../models/Room");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // Use consistent parameter name: code
    socket.on("joinRoom", async ({ code }) => {
      const roomCode = code.toUpperCase();
      socket.join(roomCode);

      const room = await Room.findOne({ code: roomCode })
        .populate("players")
        .populate("host");
      io.to(roomCode).emit("roomUpdated", { room });
      socket.to(roomCode).emit("userJoined");
    });

    socket.on("leaveRoom", async ({ code }) => {
      const roomCode = code.toUpperCase();

      socket.leave(roomCode);
      // Broadcast updated room state to all
      const room = await Room.findOne({ code: roomCode })
        .populate("players")
        .populate("host");
      io.to(roomCode).emit("roomUpdated", { room });
    });

    // ...add other real-time handlers here
  });
};
