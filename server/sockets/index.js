const Room = require("../models/Room");
const { bumpActivity, stringifyId } = require("./utils");
const {
  getRuntime,
  clearAllTimers,
  DISCONNECT_GRACE_MS,
  FORCE_SUBMIT_WAIT_MS,
} = require("./runtime");
const {
  startRound,
  endRound,
  checkAllSubmitted,
  syncLateJoiner,
} = require("./roundManager");
const { endGame } = require("./gameManager");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("🔌 Socket connected:", socket.id);
    socket.data = {}; // will hold { roomCode, userId }

    // ------------------- JOIN ROOM -------------------
    socket.on("joinRoom", async ({ code, userId }) => {
      const roomCode = (code || "").toUpperCase();
      if (!roomCode || !userId) return;

      socket.join(roomCode);
      socket.data = { roomCode, userId: String(userId) };

      const room = await Room.findOneAndUpdate(
        { code: roomCode },
        { $addToSet: { players: userId } },
        { new: true }
      ).populate("players host");

      if (!room) return socket.emit("error", "Room not found");
      await bumpActivity(roomCode);

      // Notify all players
      io.to(roomCode).emit("playersUpdated", {
        players: (room.players || []).map(stringifyId),
      });
      io.to(roomCode).emit("roomUpdated", { room });

      // Sync state for the new joiner if game already running
      await syncLateJoiner(socket, room, userId);
    });

    // ------------------- LEAVE ROOM -------------------
    socket.on("leaveRoom", async ({ code }) => {
      const roomCode = (code || socket.data.roomCode || "").toUpperCase();
      const userId = socket.data.userId;
      if (!roomCode || !userId) return;

      await bumpActivity(roomCode);
      socket.leave(roomCode);
    });

    // ------------------- DISCONNECT -------------------
    socket.on("disconnect", async () => {
      const { roomCode, userId } = socket.data || {};
      if (!roomCode || !userId) return;

      // Grace period to allow reconnection
      setTimeout(async () => {
        const stillConnected = Array.from(io.sockets.sockets.values()).some(
          (s) => s.data?.roomCode === roomCode && s.data?.userId === userId
        );
        if (!stillConnected) {
          await bumpActivity(roomCode);
        }
      }, DISCONNECT_GRACE_MS);
    });

    // ------------------- START GAME -------------------
    socket.on("startGame", async (payload = {}) => {
      const roomCode = (
        payload.code ||
        socket.data.roomCode ||
        ""
      ).toUpperCase();
      const { userId } = socket.data || {};
      if (!roomCode || !userId) return;

      const room = await Room.findOne({ code: roomCode }).select(
        "host rounds timer categories started endMode"
      );
      if (!room) return socket.emit("error", "Room not found");
      if (String(room.host) !== String(userId))
        return socket.emit("error", "Only the host can start");

      const settings = {
        rounds: Math.max(
          1,
          Math.min(20, Number(payload.rounds) || room.rounds)
        ),
        timer: Math.max(3, Math.min(300, Number(payload.timer) || room.timer)),
        categories: Array.isArray(payload.categories)
          ? payload.categories
          : room.categories,
        endMode: ["PLAYER_STOP", "ALL_SUBMIT"].includes(payload.endMode)
          ? payload.endMode
          : room.endMode || "ALL_SUBMIT",
      };

      const updatedRoom = await Room.findOneAndUpdate(
        { code: roomCode },
        {
          $set: {
            started: true,
            currentRound: 0,
            letter: null,
            roundEndTime: null,
            roundsData: [],
            ...settings,
          },
        },
        { new: true }
      );

      await bumpActivity(roomCode);
      await startRound(io, updatedRoom);

      io.to(roomCode).emit("gameStarted", {
        totalRounds: updatedRoom.rounds,
        timer: updatedRoom.timer,
        categories: (updatedRoom.categories || []).map(String),
        endMode: updatedRoom.endMode || "ALL_SUBMIT",
      });
    });

    // ------------------- SUBMIT ANSWERS -------------------
    socket.on("submitAnswers", async ({ answers }) => {
      const { roomCode, userId } = socket.data || {};
      if (!roomCode || !userId) return;

      // No answers at all? Skip.
      if (
        !answers ||
        Object.values(answers).every((v) => !String(v || "").trim())
      ) {
        return;
      }

      const room = await Room.findOne({ code: roomCode }).select(
        "started currentRound roundEndTime players endMode"
      );
      if (!room?.started || !room.currentRound) return;

      // Check cutoff
      const cutoff = room.roundEndTime
        ? new Date(room.roundEndTime).getTime() + 150
        : 0;
      if (cutoff && Date.now() > cutoff) return;

      // Replace submission
      await Room.updateOne(
        { code: roomCode, "roundsData.roundNumber": room.currentRound },
        { $pull: { "roundsData.$.submissions": { player: userId } } }
      );
      await Room.updateOne(
        { code: roomCode, "roundsData.roundNumber": room.currentRound },
        {
          $push: {
            "roundsData.$.submissions": { player: userId, answers, points: 0 },
          },
        }
      );

      await bumpActivity(roomCode);

      // End round if mode = ALL_SUBMIT
      if ((room.endMode || "ALL_SUBMIT") === "ALL_SUBMIT") {
        await checkAllSubmitted(io, roomCode, room.currentRound);
      }
    });

    // ------------------- PLAYER STOP ROUND -------------------
    socket.on("playerStopRound", async () => {
      const { roomCode, userId } = socket.data || {};
      if (!roomCode || !userId) return;

      const room = await Room.findOne({ code: roomCode })
        .select("started currentRound endMode")
        .lean();
      if (!room?.started || !room.currentRound) return;
      if ((room.endMode || "ALL_SUBMIT") !== "PLAYER_STOP") return;

      // Force all clients to submit
      io.to(roomCode).emit("forceSubmit", { code: roomCode });

      // After a short wait, end the round
      setTimeout(async () => {
        const rt = getRuntime(roomCode);
        if (rt.ending) return;
        rt.ending = true;
        clearAllTimers(rt);
        await bumpActivity(roomCode);
        try {
          await endRound(io, roomCode);
        } finally {
          rt.ending = false;
        }
      }, FORCE_SUBMIT_WAIT_MS);
    });

    // ------------------- NEXT ROUND (skip break) -------------------
    socket.on("nextRound", async () => {
      const { roomCode, userId } = socket.data || {};
      if (!roomCode || !userId) return;

      const room = await Room.findOne({ code: roomCode }).select(
        "host started currentRound rounds"
      );
      if (!room?.started) return;
      if (String(room.host) !== String(userId)) return; // only host

      const rt = getRuntime(roomCode);
      clearAllTimers(rt);
      rt.ending = false;
      rt.breakEndsAt = null;

      await bumpActivity(roomCode);

      const fresh = await Room.findOne({ code: roomCode });
      if (fresh && fresh.currentRound < fresh.rounds) {
        await startRound(io, fresh); 
      } else {
        await endGame(io, roomCode); 
      }
    });
  });
};
