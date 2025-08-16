// sockets/socketHandlers.js
const mongoose = require("mongoose");
const Room = require("../models/Room");
const Category = require("../models/Category");

const BREAK_MS = 5000; // pause between rounds
const LATE_GRACE_MS = 150; // tiny buffer to account for client clock skew

// ================== runtime helpers ==================
const runtime = new Map(); // roomCode -> { roundTO:null, breakTO:null, ending:false }
function getRT(roomCode) {
  if (!runtime.has(roomCode))
    runtime.set(roomCode, { roundTO: null, breakTO: null, ending: false });
  return runtime.get(roomCode);
}
function clearAllTimers(rt) {
  if (!rt) return;
  if (rt.roundTO) {
    clearTimeout(rt.roundTO);
    rt.roundTO = null;
  }
  if (rt.breakTO) {
    clearTimeout(rt.breakTO);
    rt.breakTO = null;
  }
}

function normalizeSeconds(v) {
  const n = Number(v);
  if (!isFinite(n) || n <= 0) return 60; // default
  if (n > 1000) return Math.round(n / 1000); // in case ms slipped in
  if (n < 3) return 3; // minimum visible time
  return Math.round(n);
}

function pickLetter(prev) {
  const A = "АБВГДЃЕЖЗЅИЈКЛЉМНЊОПРСТЌУФХЦЧЏШ".toUpperCase();
  const len = A.length;
  const idx = Math.floor(Math.random() * len);
  let L = A[idx];
  if (prev && prev === L) L = A[(idx + 7) % len];
  return L;
}

function computeFinalScores(room) {
  const totals = {};
  for (const r of room.roundsData || []) {
    for (const s of r.submissions || []) {
      const pid = String(s.player);
      totals[pid] = (totals[pid] || 0) + (s.points || 0);
    }
  }
  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const top = sorted.length ? sorted[0][1] : 0;
  const winners = sorted.filter(([, pts]) => pts === top).map(([pid]) => pid);
  return { totals, winners, rounds: room.rounds || 0 };
}

const sId = (v) =>
  typeof v === "string" ? v : v?._id ? String(v._id) : String(v ?? "");

// ================== transliteration & dictionary helpers ==================
// Simple Latin -> Macedonian Cyrillic transliteration.
function toMkCyrillic(input = "") {
  if (!input) return "";
  let s = String(input);

  // digraphs / trigraphs (order matters)
  const pairs = [
    [/dzh/gi, "џ"], // keep before dz
    [/dz/gi,  "ѕ"],
    [/gj/gi,  "ѓ"],
    [/kj/gi,  "ќ"],
    [/zh/gi,  "ж"],
    [/ch/gi,  "ч"],
    [/sh/gi,  "ш"],
    [/lj/gi,  "љ"],
    [/nj/gi,  "њ"],
  ];
  for (const [re, rep] of pairs) {
    s = s.replace(re, (m) => (m[0] === m[0].toUpperCase() ? rep.toUpperCase() : rep));
  }

  // single letters
  const map = {
    a:"а", b:"б", v:"в", g:"г", d:"д", e:"е", z:"з", i:"и", j:"ј", k:"к",
    l:"л", m:"м", n:"н", o:"о", p:"п", r:"р", s:"с", t:"т", u:"у", f:"ф",
    h:"х", c:"ц", y:"и", w:"в", q:"к", x:"кс",
  };
  s = s.replace(/[A-Za-z]/g, (ch) => {
    const lower = ch.toLowerCase();
    const rep = map[lower];
    if (!rep) return ch;
    return ch === ch.toUpperCase() ? rep.toUpperCase() : rep;
  });

  return s;
}
const normalizeWord = (s) => (s || "").trim().toLowerCase();

// Support multiple shapes:
// - words["В"] = [...]
// - words.mk = ["Скопје","Велес", ...]
// - words = ["Скопје","Велес", ...] (array)
// - words = { anyKey: array, ... }
function extractLetterWords(doc, letter) {
  const up = (letter || "").toUpperCase();
  const w = doc?.words;
  let raw = [];

  if (!w) {
    raw = [];
  } else if (Array.isArray(w)) {
    raw = w;
  } else if (Array.isArray(w?.[up])) {
    raw = w[up];
  } else if (Array.isArray(w?.mk)) {
    raw = w.mk;
  } else {
    const all = [];
    for (const val of Object.values(w)) {
      if (Array.isArray(val)) all.push(...val);
    }
    raw = all;
  }

  return raw
    .map((x) => toMkCyrillic(String(x || "")))
    .filter((x) => x && x[0].toUpperCase() === up)
    .map((x) => normalizeWord(x));
}

// ================== socket namespace ==================
module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);
    socket.data = {};

    // === JOIN ROOM ===
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

      io.to(roomCode).emit("playersUpdated", {
        players: (room.players || []).map(sId),
      });
      io.to(roomCode).emit("roomUpdated", { room });

      // If a round is in progress, sync newcomer so they can play immediately
      if (room.started && room.currentRound && room.roundEndTime && room.letter) {
        const ids = (room.categories || []).map(String);

        let categoryMeta = [];
        try {
          if (ids.length) {
            const cats = await Category.find({ _id: { $in: ids } })
              .select("displayName name")
              .lean();
            const nameById = Object.fromEntries(
              cats.map((c) => [
                String(c._id),
                c.displayName?.mk || c.name || String(c._id),
              ])
            );
            categoryMeta = ids.map((id) => ({ id, name: nameById[id] || id }));
          }
        } catch (e) {
          console.error("categoryMeta build failed", e);
          categoryMeta = ids.map((id) => ({ id, name: String(id) }));
        }

        socket.emit("roundStarted", {
          currentRound: room.currentRound,
          totalRounds: room.rounds,
          letter: room.letter,
          categories: ids,
          categoryMeta,
          roundEndTime: new Date(room.roundEndTime).toISOString(),
          serverNow: Date.now(),
        });
      }
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

      const room = await Room.findOne({ code: roomCode }).select(
        "host rounds timer categories started currentRound"
      );
      if (!room) return socket.emit("error", "Room not found");
      if (String(room.host) !== String(userId))
        return socket.emit("error", "Only the host can start");
      if (!room.categories?.length)
        return socket.emit("error", "Select at least one category");

      // Try to flip from not-started -> started atomically
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
        io.to(roomCode).emit("gameStarted");
        return;
      }

      io.to(roomCode).emit("gameStarted", {
        totalRounds: updated.rounds,
        timer: updated.timer,
        categories: (updated.categories || []).map(String),
      });

      await startRound(updated);
    });

    // === HOST CAN SKIP BREAK ===
    socket.on("nextRound", async () => {
      const { roomCode, userId } = socket.data || {};
      if (!roomCode || !userId) return;
      const room = await Room.findOne({ code: roomCode }).select(
        "host started currentRound rounds"
      );
      if (!room || !room.started) return;
      if (String(room.host) !== String(userId)) return;

      const rt = getRT(roomCode);
      clearAllTimers(rt);
      rt.ending = false;

      const fresh = await Room.findOne({ code: roomCode });
      if (fresh && fresh.currentRound < fresh.rounds) {
        await startRound(fresh);
      } else {
        const finalRoom = await Room.findOne({ code: roomCode });
        if (finalRoom) {
          await Room.updateOne(
            { code: roomCode },
            { $set: { started: false, letter: null, roundEndTime: null } }
          );
          const final = computeFinalScores(finalRoom);
          io.to(roomCode).emit("gameEnded", final);
        } else {
          io.to(roomCode).emit("gameEnded", {
            totals: {},
            winners: [],
            rounds: 0,
          });
        }
      }
    });

    // === SUBMIT ANSWERS (atomic replace) ===
    socket.on("submitAnswers", async ({ answers }) => {
      const { roomCode, userId } = socket.data || {};
      if (!roomCode || !userId) return;

      const cur = await Room.findOne({ code: roomCode }).select(
        "started currentRound roundEndTime players categories"
      );
      if (!cur || !cur.started || !cur.currentRound) return;

      // Cutoff after time (+ tiny grace)
      const cutoff = cur.roundEndTime
        ? new Date(cur.roundEndTime).getTime() + LATE_GRACE_MS
        : 0;
      if (cutoff && Date.now() > cutoff) return;

      const rn = cur.currentRound;

      // Remove previous submission (idempotent) then push the new one
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

      // If everyone submitted -> end early
      const fresh = await Room.findOne({ code: roomCode }).select(
        "players roundsData currentRound"
      );
      const idx = fresh.roundsData.findIndex((r) => r.roundNumber === rn);
      const submittedCount =
        idx >= 0 ? (fresh.roundsData[idx].submissions || []).length : 0;
      const playerCount = (fresh.players || []).length;

      if (playerCount > 0 && submittedCount >= playerCount) {
        const rt = getRT(roomCode);
        if (!rt.ending) {
          rt.ending = true;
          clearAllTimers(rt);
          try {
            await endRound(roomCode);
          } finally {
            rt.ending = false;
          }
        }
      }
    });

    // ================== helpers ==================
    async function handleLeave(roomCode, userId) {
      const lean = await Room.findOne({ code: roomCode })
        .select("players host started")
        .lean();
      if (!lean) return;

      const isHost = String(lean.host) === String(userId);
      const newPlayers = (lean.players || []).filter(
        (p) => String(p) !== String(userId)
      );

      // If host left and no one remains → delete room + clear timers
      if (isHost && newPlayers.length === 0) {
        await Room.deleteOne({ code: roomCode });
        const rt = runtime.get(roomCode);
        clearAllTimers(rt);
        runtime.delete(roomCode);
        io.to(roomCode).emit("roomClosed");
        return;
      }

      const update = { players: newPlayers };
      if (isHost && newPlayers.length > 0) update.host = newPlayers[0];

      const updated = await Room.findOneAndUpdate({ code: roomCode }, update, {
        new: true,
      }).populate("players host");

      io.to(roomCode).emit("playersUpdated", {
        players: (updated.players || []).map(sId),
      });
      io.to(roomCode).emit("roomUpdated", { room: updated });
    }

    async function startRound(roomDoc) {
      const roomCode = roomDoc.code;
      const rt = getRT(roomCode);
      clearAllTimers(rt);
      rt.ending = false;

      const secs = normalizeSeconds(roomDoc.timer);
      const letter = pickLetter(roomDoc.letter);
      let endAt = new Date(Date.now() + secs * 1000);
      if (endAt.getTime() <= Date.now()) {
        endAt = new Date(Date.now() + secs * 1000);
      }

      const nextRound = (roomDoc.currentRound || 0) + 1;

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

      const ids = (updated.categories || []).map(String);
      let categoryMeta = [];
      if (ids.length) {
        const cats = await Category.find({ _id: { $in: ids } })
          .select("displayName name")
          .lean();
        const nameById = Object.fromEntries(
          cats.map((c) => [
            String(c._id),
            c.displayName?.mk || c.name || String(c._id),
          ])
        );
        categoryMeta = ids.map((id) => ({ id, name: nameById[id] || id }));
      }

      io.to(roomCode).emit("roundStarted", {
        currentRound: updated.currentRound,
        totalRounds: updated.rounds,
        letter,
        categories: ids,
        categoryMeta,
        roundEndTime: endAt.toISOString(),
        serverNow: Date.now(),
      });

      rt.roundTO = setTimeout(async () => {
        if (!rt.ending) {
          rt.ending = true;
          try {
            await endRound(updated.code);
          } catch (e) {
            console.error(e);
          } finally {
            rt.ending = false;
          }
        }
      }, secs * 1000 + LATE_GRACE_MS);
    }

    async function endRound(roomCode) {
      const rt = getRT(roomCode);
      clearAllTimers(rt);

      const room = await Room.findOne({ code: roomCode });
      if (!room) return;

      const rn = room.currentRound;
      const idx = room.roundsData.findIndex((r) => r.roundNumber === rn);
      if (idx === -1) return;

      const round = room.roundsData[idx];
      const categories = (room.categories || []).map(String);
      const letter = (room.letter || "").toUpperCase();

      // Load categories
      const cats = await Category.find({ _id: { $in: categories } })
        .select("words")
        .lean();
      const catMap = new Map(cats.map((c) => [String(c._id), c]));

      // Build per-category arrays with flags (Latin input accepted)
      const byCat = {};       // catId -> [{ player, raw, norm, starts, inDict }]
      const countsByCat = {}; // catId -> { norm: count }

      for (const cid of categories) {
        const doc = catMap.get(String(cid));
        const dictList = extractLetterWords(doc, letter); // normalized (lowercase Cyr)
        const dictSet = new Set(dictList);

        const ACCEPT_ANY_IF_NO_DICT = true;
        const allowAny = ACCEPT_ANY_IF_NO_DICT && dictSet.size === 0;

        const arr = (round.submissions || []).map((s) => {
          const raw = (s.answers?.[cid] || "").trim();        // what player typed
          const rawCyr = toMkCyrillic(raw);
          const norm = normalizeWord(rawCyr);
          const starts = !!rawCyr && rawCyr[0]?.toUpperCase() === letter;
          const inDict = starts && (allowAny || dictSet.has(norm));
          return { player: String(s.player), raw, norm, starts, inDict };
        });

        byCat[String(cid)] = arr;

        // duplicate counts among valid answers
        const counts = {};
        for (const a of arr) {
          if (a.inDict) counts[a.norm] = (counts[a.norm] || 0) + 1;
        }
        countsByCat[String(cid)] = counts;
      }

      // Score each submission
      const scores = {};
      const details = {}; // details[userId][catId] = { value, valid, unique, points, reason }
      for (const sub of round.submissions || []) {
        const pid = String(sub.player);
        let pts = 0;
        details[pid] = details[pid] || {};

        for (const cid of categories) {
          const a =
            (byCat[String(cid)] || []).find((x) => x.player === pid) ||
            { raw: "", starts: false, inDict: false, norm: "" };
          const entry = {
            value: a.raw,
            valid: false,
            unique: false,
            points: 0,
            reason: "",
          };

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

        sub.points = pts; // persisted per-round points
        scores[pid] = pts;
      }

      round.endedAt = new Date();
      await room.save();

      const answersByPlayer = {};
      for (const sub of round.submissions || []) {
        answersByPlayer[String(sub.player)] = sub.answers || {};
      }

      const breakEnd = new Date(Date.now() + BREAK_MS);
      const hasMore = rn < room.rounds;

      io.to(roomCode).emit("roundResults", {
        round: rn,
        scores,
        answers: answersByPlayer,
        details,
        breakEndTime: breakEnd.toISOString(),
        hasMore,
      });

      if (hasMore) {
        rt.breakTO = setTimeout(async () => {
          try {
            const fresh = await Room.findOne({ code: roomCode });
            if (!fresh) return;
            await startRound(fresh);
          } catch (e) {
            console.error(e);
          }
        }, BREAK_MS);
      } else {
        room.started = false;
        room.letter = null;
        room.roundEndTime = null;
        await room.save();

        const final = computeFinalScores(room);
        io.to(roomCode).emit("gameEnded", final);
      }
    }
  });
};
