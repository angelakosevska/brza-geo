// sockets/socketHandlers.js
const Room = require("../models/Room");

const runtime = new Map(); // roomCode -> { roundTO: null }
function getRT(roomCode) {
  if (!runtime.has(roomCode)) runtime.set(roomCode, { roundTO: null });
  return runtime.get(roomCode);
}
function pickLetter(prev) {
  const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let L = A[Math.floor(Math.random() * 26)];
  if (prev && prev === L) L = A[(A.indexOf(L) + 7) % 26];
  return L;
}

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);
    socket.data = {};

    // JOIN
    socket.on("joinRoom", async ({ code, userId }) => {
      const roomCode = (code || "").toUpperCase();
      if (!roomCode || !userId) return;
      socket.join(roomCode);
      socket.data = { roomCode, userId };

      const room = await Room.findOneAndUpdate(
        { code: roomCode },
        { $addToSet: { players: userId } },
        { new: true }
      )
        .populate("players host")
        .exec();

      if (!room) return socket.emit("error", "Room not found");
      io.to(roomCode).emit("roomUpdated", { room });
    });

    // LEAVE (button)
    socket.on("leaveRoom", async ({ code }) => {
      const roomCode = (code || socket.data.roomCode || "").toUpperCase();
      const userId = socket.data.userId;
      if (!roomCode || !userId) return;
      await handleLeave(roomCode, userId);
      socket.leave(roomCode);
    });

    // DISCONNECT
    socket.on("disconnect", async () => {
      const { roomCode, userId } = socket.data || {};
      if (!roomCode || !userId) return;
      await handleLeave(roomCode, userId);
    });

    // START GAME (HOST ONLY)
    socket.on("startGame", async () => {
      const { roomCode, userId } = socket.data || {};
      if (!roomCode || !userId) return;

      const room = await Room.findOne({ code: roomCode }).select(
        "host rounds timer categories started"
      );
      if (!room) return socket.emit("error", "Room not found");
      if (String(room.host) !== String(userId))
        return socket.emit("error", "Only the host can start");
      if (!room.categories?.length)
        return socket.emit("error", "Select at least one category");

      // Only flip to started if it's not already
      const updated = await Room.findOneAndUpdate(
        { code: roomCode, started: { $ne: true } },
        {
          $set: {
            started: true,
            currentRound: 0,
            letter: null,
            roundEndTime: null,
            roundsData: [],
          },
        },
        { new: true }
      );
      if (!updated) {
        // Someone already started it — just tell clients to move on
        io.to(roomCode).emit("gameStarted");
        return;
      }

      io.to(roomCode).emit("gameStarted", {
        totalRounds: updated.rounds,
        timer: updated.timer,
        categories: updated.categories || [],
      });

      await startRound(updated);
    });

    // SUBMIT ANSWERS
    socket.on("submitAnswers", async ({ answers }) => {
      const { roomCode, userId } = socket.data || {};
      if (!roomCode || !userId) return;

      const cur = await Room.findOne({ code: roomCode }).select(
        "started currentRound roundEndTime"
      );
      if (!cur || !cur.started || !cur.currentRound) return;

      if (
        cur.roundEndTime &&
        Date.now() > new Date(cur.roundEndTime).getTime()
      ) {
        return; // too late
      }

      const rn = cur.currentRound;
      await Room.updateOne(
        { code: roomCode, "roundsData.roundNumber": rn },
        { $pull: { "roundsData.$.submissions": { player: userId } } }
      );
      await Room.updateOne(
        { code: roomCode, "roundsData.roundNumber": rn },
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
    });

    // --- helpers that close over io/socket scope ---
    async function handleLeave(roomCode, userId) {
      const lean = await Room.findOne({ code: roomCode })
        .select("players host")
        .lean();
      if (!lean) return;

      const isHost = String(lean.host) === String(userId);
      const newPlayers = lean.players.filter(
        (p) => String(p) !== String(userId)
      );

      // if host left and no one remains, delete room + clear timer
      if (isHost && newPlayers.length === 0) {
        await Room.deleteOne({ code: roomCode });
        const rt = runtime.get(roomCode);
        if (rt?.roundTO) clearTimeout(rt.roundTO);
        runtime.delete(roomCode);
        io.to(roomCode).emit("roomClosed");
        return;
      }

      const update = { players: newPlayers };
      if (isHost && newPlayers.length > 0) update.host = newPlayers[0];

      const updated = await Room.findOneAndUpdate({ code: roomCode }, update, {
        new: true,
      })
        .populate("players host")
        .exec();

      io.to(roomCode).emit("roomUpdated", { room: updated });
    }

    async function startRound(roomDoc) {
      const roomCode = roomDoc.code;
      const rt = getRT(roomCode);

      const nextRound = (roomDoc.currentRound || 0) + 1;
      const letter = pickLetter(roomDoc.letter);
      const endAt = new Date(Date.now() + (roomDoc.timer || 60) * 1000);

      const updated = await Room.findOneAndUpdate(
        { _id: roomDoc._id },
        {
          $set: { letter, roundEndTime: endAt },
          $inc: { currentRound: 1 },
          $push: {
            roundsData: {
              roundNumber: nextRound,
              letter,
              startedAt: new Date(),
              endedAt: null,
              submissions: [],
            },
          },
        },
        { new: true }
      );

      io.to(roomCode).emit("roundStarted", {
        currentRound: updated.currentRound,
        totalRounds: updated.rounds,
        letter,
        categories: updated.categories || [],
        roundEndTime: endAt.toISOString(),
      });

      if (rt.roundTO) clearTimeout(rt.roundTO);
      rt.roundTO = setTimeout(async () => {
        try {
          await endRound(updated.code);
        } catch (e) {
          console.error(e);
        }
      }, (updated.timer || 60) * 1000);
    }

    async function endRound(roomCode) {
      const rt = getRT(roomCode);
      if (rt.roundTO) {
        clearTimeout(rt.roundTO);
        rt.roundTO = null;
      }

      const room = await Room.findOne({ code: roomCode });
      if (!room) return;

      // ... scoring ...

      if (room.currentRound < room.rounds) {
        setTimeout(async () => {
          const fresh = await Room.findOne({ code: roomCode });
          if (!fresh) return;
          await startRound(fresh);
        }, 3000);
      } else {
        room.started = false;
        room.letter = null;
        room.roundEndTime = null;
        await room.save();
        io.to(roomCode).emit("gameEnded");
      }
    }
  });
};
