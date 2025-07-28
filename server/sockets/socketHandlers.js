const Room = require("../models/Room");
const User = require("../models/User");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("✅ A user connected:", socket.id);

    socket.on("joinRoom", async ({ roomCode, username }) => {
      try {
        socket.join(roomCode);
        console.log(`${username} joined room ${roomCode}`);

        const room = await Room.findOne({ code: roomCode }).populate("players");
        if (!room) return;

        const user = await User.findOne({ username });
        if (!user) return;

        const alreadyJoined = room.players.some((p) => p._id.equals(user._id));
        if (!alreadyJoined) {
          room.players.push(user._id);
          await room.save();
        }

        io.to(roomCode).emit("userJoined", { username });

        socket.emit("settingsUpdated", {
          rounds: room.rounds,
          timer: room.timer,
        });

        socket.emit("categoriesSet", {
          categories: room.categories || [],
        });
      } catch (err) {
        console.error("joinRoom error:", err);
      }
    });

    socket.on("updateSettings", async ({ roomCode, rounds, timer }) => {
      try {
        const room = await Room.findOneAndUpdate(
          { code: roomCode },
          { rounds, timer },
          { new: true }
        );
        if (room) io.to(roomCode).emit("settingsUpdated", { rounds, timer });
      } catch (err) {
        console.error("updateSettings error:", err);
      }
    });

    socket.on("setCategories", async ({ roomCode, categories }) => {
      try {
        const room = await Room.findOneAndUpdate(
          { code: roomCode },
          { categories },
          { new: true }
        );
        if (room) io.to(roomCode).emit("categoriesSet", { categories });
      } catch (err) {
        console.error("setCategories error:", err);
      }
    });

    socket.on("startGame", async ({ roomCode, letter, round }) => {
      try {
        const room = await Room.findOneAndUpdate(
          { code: roomCode },
          { started: true, letter, currentRound: round },
          { new: true }
        );
        if (room) io.to(roomCode).emit("gameStarted", { letter, round });
      } catch (err) {
        console.error("startGame error:", err);
      }
    });

    socket.on("playerSubmitted", ({ roomCode, username }) => {
      io.to(roomCode).emit("playerSubmittedUpdate", { username });
    });

    socket.on("sendResults", ({ roomCode, results }) => {
      io.to(roomCode).emit("roundResults", results);
    });

    socket.on("leaveRoom", async ({ roomCode, username }) => {
      try {
        socket.leave(roomCode);
        const user = await User.findOne({ username });
        if (!user) return;

        const room = await Room.findOne({ code: roomCode });
        if (!room) return;

        room.players = room.players.filter((id) => !id.equals(user._id));
        await room.save();

        io.to(roomCode).emit("userLeft", { username });
      } catch (err) {
        console.error("leaveRoom error:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log("❌ User disconnected:", socket.id);
    });
  });
};
