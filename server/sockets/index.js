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
const { registerReviewHandlers } = require("./review");
const Game = require("../models/Game");

module.exports = (io) => {
  io.on("connection", (socket) => {
    socket.data.roomCode = null;
    registerReviewHandlers(io, socket);
    // ------------------- JOIN ROOM -------------------
    socket.on("joinRoom", async ({ code }) => {
      const roomCode = (code || "").toUpperCase();
      const userId = socket.data.user?.id;
      if (!roomCode || !userId) return;

      socket.join(roomCode);
      socket.data.roomCode = roomCode;

      const room = await Room.findOneAndUpdate(
        { code: roomCode },
        { $addToSet: { players: userId } },
        { new: true }
      ).populate("players host");

      if (!room) return socket.emit("error", "Room not found");
      await bumpActivity(roomCode);

      io.to(roomCode).emit("playersUpdated", {
        players: (room.players || []).map(stringifyId),
      });
      io.to(roomCode).emit("roomUpdated", { room });

      // Sync state for late joiner if the game already started
      await syncLateJoiner(socket, room, userId);
    });

    // ------------------- LEAVE ROOM -------------------
    socket.on("leaveRoom", async ({ code }) => {
      const roomCode = (code || socket.data.roomCode || "").toUpperCase();
      const userId = socket.data.user?.id;
      if (!roomCode || !userId) return;

      await bumpActivity(roomCode);
      socket.leave(roomCode);
      socket.data.roomCode = null;
    });

    // ------------------- DISCONNECT -------------------
    socket.on("disconnect", async () => {
      const { roomCode } = socket.data || {};
      const userId = socket.data.user?.id;
      if (!roomCode || !userId) return;

      // Grace period before removing
      setTimeout(async () => {
        const stillConnected = Array.from(io.sockets.sockets.values()).some(
          (s) => s.data?.roomCode === roomCode && s.data?.user?.id === userId
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
      const userId = socket.data.user?.id;
      if (!roomCode || !userId) return;

      const room = await Room.findOne({ code: roomCode }).select(
        "host rounds timer categories started endMode"
      );
      if (!room) return socket.emit("error", "Room not found");
      if (String(room.host) !== String(userId)) {
        return socket.emit("error", "Only the host can start");
      }

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

      const newGame = await Game.create({
        roomCode,
        players: room.players || [],
        rounds: settings.rounds,
        categories: settings.categories,
        roundsData: [],
        winners: [],
      });

      const updatedRoom = await Room.findOneAndUpdate(
        { code: roomCode },
        {
          $set: {
            started: true,
            currentRound: 0,
            letter: null,
            roundEndTime: null,
            roundsData: [],
            currentGameId: newGame._id,
            ...settings,
          },
        },
        { new: true }
      );

      await bumpActivity(roomCode);
      await startRound(io, updatedRoom);

      io.to(roomCode).emit("gameStarted", {
        gameId: newGame._id,
        totalRounds: updatedRoom.rounds,
        timer: updatedRoom.timer,
        categories: (updatedRoom.categories || []).map(String),
        endMode: updatedRoom.endMode || "ALL_SUBMIT",
      });
    });

    // ------------------- SUBMIT ANSWERS -------------------
    socket.on("submitAnswers", async ({ answers, forced = false }) => {
      const roomCode = socket.data.roomCode;
      const userId = socket.data.user?.id;
      if (!roomCode || !userId) return;

      const room = await Room.findOne({ code: roomCode }).select(
        "started currentRound roundEndTime players endMode"
      );
      if (!room?.started || !room.currentRound) return;

      // Ignore empty submissions if not forced
      if (
        !forced &&
        (!answers ||
          typeof answers !== "object" ||
          Object.keys(answers).length === 0 ||
          Object.values(answers).every((v) => v === null || v === undefined))
      ) {
        return;
      }

      // Check cutoff
      const cutoff = room.roundEndTime
        ? new Date(room.roundEndTime).getTime() + 150
        : 0;
      if (!forced && cutoff && Date.now() > cutoff) return;

      // Replace existing submission
      await Room.updateOne(
        { code: roomCode, "roundsData.roundNumber": room.currentRound },
        { $pull: { "roundsData.$.submissions": { player: userId } } }
      );
      await Room.updateOne(
        { code: roomCode, "roundsData.roundNumber": room.currentRound },
        {
          $push: {
            "roundsData.$.submissions": {
              player: userId,
              answers: answers || {},
              points: 0,
            },
          },
        }
      );

      if ((room.endMode || "ALL_SUBMIT") === "ALL_SUBMIT") {
        await checkAllSubmitted(io, roomCode, room.currentRound);
      }
    });

    // ------------------- PLAYER STOP ROUND -------------------
    socket.on("playerStopRound", async () => {
      const roomCode = socket.data.roomCode;
      const userId = socket.data.user?.id;
      if (!roomCode || !userId) return;

      const room = await Room.findOne({ code: roomCode })
        .select("started currentRound endMode")
        .lean();
      if (!room?.started || !room.currentRound) return;
      if ((room.endMode || "ALL_SUBMIT") !== "PLAYER_STOP") return;

      io.to(roomCode).emit("forceSubmit", { code: roomCode });

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

    // ------------------- NEXT ROUND -------------------
    socket.on("nextRound", async () => {
      const roomCode = socket.data.roomCode;
      const userId = socket.data.user?.id;
      if (!roomCode || !userId) return;

      const room = await Room.findOne({ code: roomCode }).select(
        "host started currentRound rounds"
      );
      if (!room?.started) return;
      if (String(room.host) !== String(userId)) return;

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
