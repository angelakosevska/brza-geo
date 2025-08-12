// sockets/socketHandlers.js
const mongoose = require("mongoose");
const Room = require("../models/Room");
const Category = require("../models/Category");

const BREAK_MS = 5000; // pause between rounds
const runtime = new Map(); // roomCode -> { roundTO:null, breakTO:null }
function getRT(roomCode) {
  if (!runtime.has(roomCode)) runtime.set(roomCode, { roundTO: null, breakTO: null });
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

    // === JOIN ROOM ===
    socket.on("joinRoom", async ({ code, userId }) => {
      const roomCode = (code || "").toUpperCase();
      if (!roomCode || !userId) return;

      socket.join(roomCode);
      socket.data = { roomCode, userId };

      const room = await Room.findOneAndUpdate(
        { code: roomCode },
        { $addToSet: { players: userId } },
        { new: true }
      ).populate("players host");

      if (!room) return socket.emit("error", "Room not found");
      io.to(roomCode).emit("roomUpdated", { room });
    });

    // === LEAVE ROOM (button) ===
    socket.on("leaveRoom", async ({ code }) => {
      const roomCode = (code || socket.data.roomCode || "").toUpperCase();
      const userId = socket.data.userId;
      if (!roomCode || !userId) return;

      await handleLeave(roomCode, userId);
      socket.leave(roomCode);
    });

    // === DISCONNECT ===
    socket.on("disconnect", async () => {
      const { roomCode, userId } = socket.data || {};
      if (!roomCode || !userId) return;
      await handleLeave(roomCode, userId);
    });

    // === START GAME (host only) ===
    socket.on("startGame", async () => {
      const { roomCode, userId } = socket.data || {};
      if (!roomCode || !userId) return;

      const room = await Room.findOne({ code: roomCode }).select("host rounds timer categories started");
      if (!room) return socket.emit("error", "Room not found");
      if (String(room.host) !== String(userId)) return socket.emit("error", "Only the host can start");
      if (!room.categories?.length) return socket.emit("error", "Select at least one category");

      // Reset live state atomically (avoid VersionError)
      const updated = await Room.findOneAndUpdate(
        { code: roomCode, started: { $ne: true } },
        { $set: { started: true, currentRound: 0, letter: null, roundEndTime: null, roundsData: [] } },
        { new: true }
      );

      if (!updated) {
        // already started by someone else
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

    // === HOST CAN SKIP BREAK ===
    socket.on("nextRound", async () => {
      const { roomCode, userId } = socket.data || {};
      if (!roomCode || !userId) return;
      const room = await Room.findOne({ code: roomCode }).select("host started currentRound rounds");
      if (!room || !room.started) return;
      if (String(room.host) !== String(userId)) return;

      const rt = getRT(roomCode);
      if (rt.breakTO) { clearTimeout(rt.breakTO); rt.breakTO = null; }

      const fresh = await Room.findOne({ code: roomCode });
      if (fresh && fresh.currentRound < fresh.rounds) {
        await startRound(fresh);
      }
    });

    // === SUBMIT ANSWERS (atomic replace) ===
    socket.on("submitAnswers", async ({ answers }) => {
      const { roomCode, userId } = socket.data || {};
      if (!roomCode || !userId) return;

      const cur = await Room.findOne({ code: roomCode }).select("started currentRound roundEndTime");
      if (!cur || !cur.started || !cur.currentRound) return;

      // Cutoff after time
      if (cur.roundEndTime && Date.now() > new Date(cur.roundEndTime).getTime()) return;

      const rn = cur.currentRound;
      // Remove previous submission
      await Room.updateOne(
        { code: roomCode, "roundsData.roundNumber": rn },
        { $pull: { "roundsData.$.submissions": { player: userId } } }
      );
      // Push new
      await Room.updateOne(
        { code: roomCode, "roundsData.roundNumber": rn },
        { $push: { "roundsData.$.submissions": { player: userId, answers: answers || {}, points: 0 } } }
      );
    });

    // ================== helpers ==================
    async function handleLeave(roomCode, userId) {
      const lean = await Room.findOne({ code: roomCode }).select("players host").lean();
      if (!lean) return;

      const isHost = String(lean.host) === String(userId);
      const newPlayers = (lean.players || []).filter(p => String(p) !== String(userId));

      // If host left and no one remains → delete room + clear timers
      if (isHost && newPlayers.length === 0) {
        await Room.deleteOne({ code: roomCode });
        const rt = runtime.get(roomCode);
        if (rt?.roundTO) clearTimeout(rt.roundTO);
        if (rt?.breakTO) clearTimeout(rt.breakTO);
        runtime.delete(roomCode);
        io.to(roomCode).emit("roomClosed");
        return;
      }

      const update = { players: newPlayers };
      if (isHost && newPlayers.length > 0) update.host = newPlayers[0];

      const updated = await Room.findOneAndUpdate({ code: roomCode }, update, { new: true })
        .populate("players host");
      io.to(roomCode).emit("roomUpdated", { room: updated });
    }

    async function startRound(roomDoc) {
      const roomCode = roomDoc.code;
      const rt = getRT(roomCode);

      const nextRound = (roomDoc.currentRound || 0) + 1;
      const letter = pickLetter(roomDoc.letter);
      const endAt = new Date(Date.now() + (roomDoc.timer || 60) * 1000);

      // Push new round + set letter/end time
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

      // Prepare category labels (MK)
      const ids = (updated.categories || []).map(id => id); // can be strings
      let categoryMeta = [];
      if (ids.length) {
        const cats = await Category.find({ _id: { $in: ids } })
          .select("displayName name")
          .lean();
        const nameById = Object.fromEntries(
          cats.map(c => [String(c._id), (c.displayName?.mk || c.name || String(c._id))])
        );
        categoryMeta = ids.map(id => ({ id: String(id), name: nameById[String(id)] || String(id) }));
      }

      io.to(roomCode).emit("roundStarted", {
        currentRound: updated.currentRound,
        totalRounds: updated.rounds,
        letter,
        categories: updated.categories || [],   // IDs
        categoryMeta,                           // [{id,name}] in MK
        roundEndTime: endAt.toISOString(),
      });

      if (rt.roundTO) clearTimeout(rt.roundTO);
      rt.roundTO = setTimeout(async () => {
        try { await endRound(updated.code); } catch (e) { console.error(e); }
      }, (updated.timer || 60) * 1000);
    }

    async function endRound(roomCode) {
      const rt = getRT(roomCode);
      if (rt.roundTO) { clearTimeout(rt.roundTO); rt.roundTO = null; }

      const room = await Room.findOne({ code: roomCode });
      if (!room) return;

      const rn = room.currentRound;
      const idx = room.roundsData.findIndex(r => r.roundNumber === rn);
      if (idx === -1) return;

      const round = room.roundsData[idx];
      const categories = room.categories || [];
      const letter = room.letter;
      const L = (letter || "").toUpperCase();

      // Load categories to validate against words
      const cats = await Category.find({ _id: { $in: categories } })
        .select("words")
        .lean();
      const wordsByCatAndLetter = new Map(); // key: catId -> Set(lowercase words for L)
      const catMap = new Map(cats.map(c => [String(c._id), c]));
      for (const cid of categories) {
        const doc = catMap.get(String(cid));
        const list = Array.isArray(doc?.words?.[L]) ? doc.words[L] : [];
        const set = new Set(list.map(w => (w || "").trim().toLowerCase()));
        wordsByCatAndLetter.set(String(cid), set);
      }

      // Collect submitted answers per category
      const submissions = round.submissions || [];
      const byCat = {}; // catId -> [{player, raw, norm, starts, inDict}]
      const normalize = (s) => (s || "").trim().toLowerCase();

      for (const cid of categories) {
        const set = wordsByCatAndLetter.get(String(cid)) || new Set();
        const arr = submissions.map(s => {
          const raw = (s.answers?.[cid] || "").trim();
          const norm = normalize(raw);
          const starts = !!raw && raw[0]?.toUpperCase() === L;
          const inDict = starts && set.has(norm);
          return { player: String(s.player), raw, norm, starts, inDict };
        });
        byCat[String(cid)] = arr;
      }

      // Count duplicates among valid answers
      const countsByCat = {}; // catId -> { norm: count }
      for (const cid of categories) {
        const counts = {};
        for (const a of byCat[String(cid)]) {
          if (a.inDict) counts[a.norm] = (counts[a.norm] || 0) + 1;
        }
        countsByCat[String(cid)] = counts;
      }

      // Score each submission
      const scores = {};
      const details = {}; // details[userId][catId] = { value, valid, unique, points, reason }
      for (const sub of submissions) {
        const pid = String(sub.player);
        let pts = 0;
        details[pid] = details[pid] || {};

        for (const cid of categories) {
          const a = (byCat[String(cid)] || []).find(x => x.player === pid) || { raw: "" };
          let entry = { value: a.raw, valid: false, unique: false, points: 0, reason: "" };

          if (!a.raw) entry.reason = "empty";
          else if (!a.starts) entry.reason = "wrong-letter";
          else if (!a.inDict) entry.reason = "not-in-dictionary";
          else {
            const count = countsByCat[String(cid)][a.norm] || 0;
            entry.valid = true;
            entry.unique = count === 1;
            entry.points = entry.unique ? 10 : 5;
            pts += entry.points;
          }

          details[pid][String(cid)] = entry;
        }

        sub.points = pts;
        scores[pid] = pts;
      }

      round.endedAt = new Date();
      await room.save();

      const answersByPlayer = {};
      for (const sub of submissions) {
        answersByPlayer[String(sub.player)] = sub.answers || {};
      }

      const breakEnd = new Date(Date.now() + BREAK_MS);
      const hasMore = rn < room.rounds;

      io.to(roomCode).emit("roundResults", {
        round: rn,
        scores,
        answers: answersByPlayer,
        details,                        // per-answer info for UI (optional)
        breakEndTime: breakEnd.toISOString(),
        hasMore,
      });

      if (hasMore) {
        rt.breakTO = setTimeout(async () => {
          try {
            const fresh = await Room.findOne({ code: roomCode });
            if (!fresh) return;
            await startRound(fresh);
          } catch (e) { console.error(e); }
        }, BREAK_MS);
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
