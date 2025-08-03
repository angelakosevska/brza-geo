// sockets/socketHandlers.js
const Room = require("../models/Room");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);
    socket.data = {};

    socket.on("joinRoom", async ({ code, userId }) => {
      const roomCode = code.toUpperCase();
      socket.join(roomCode);
      socket.data = { roomCode, userId };

      // Atomic add-to-set
      const room = await Room.findOneAndUpdate(
        { code: roomCode },
        { $addToSet: { players: userId } },
        { new: true }
      )
        .populate("players host")
        .exec();

      if (!room) {
        return socket.emit("error", "Room not found");
      }

      io.to(roomCode).emit("roomUpdated", { room });
    });

    async function handleLeave(roomCode, userId) {
      // First: fetch minimal doc to decide what to do
      const lean = await Room.findOne({ code: roomCode })
        .select("players host")
        .lean();
      if (!lean) return;

      const isHost = lean.host.toString() === userId;
      const newPlayers = lean.players.filter(p => p.toString() !== userId);

      // If host & no one left → delete room
      if (isHost && newPlayers.length === 0) {
        await Room.deleteOne({ code: roomCode });
        return io.to(roomCode).emit("roomClosed");
      }

      // Build single update object
      const update = { players: newPlayers };
      if (isHost && newPlayers.length > 0) {
        update.host = newPlayers[0];
      }

      // Atomic update + populate
      const updated = await Room.findOneAndUpdate(
        { code: roomCode },
        update,
        { new: true }
      )
        .populate("players host")
        .exec();

      io.to(roomCode).emit("roomUpdated", { room: updated });
    }

    socket.on("leaveRoom", async ({ code }) => {
      const roomCode = (code || socket.data.roomCode || "").toUpperCase();
      const userId   = socket.data.userId;
      if (!roomCode || !userId) return;

      await handleLeave(roomCode, userId);
      socket.leave(roomCode);
    });

    socket.on("disconnect", async () => {
      const { roomCode, userId } = socket.data;
      if (!roomCode || !userId) return;

      await handleLeave(roomCode, userId);
      // no explicit socket.leave needed here
    });
  });
};
