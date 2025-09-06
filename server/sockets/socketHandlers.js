const mongoose = require("mongoose");
const Room = require("../models/Room");
const Category = require("../models/Category");

const BREAK_MS = 120000; // pause between rounds (ms)
const LATE_GRACE_MS = 150; // tiny buffer for client clock skew

// ================== runtime ==================
// Per-room ephemeral timers/state. Not persisted.
const runtime = new Map(); // roomCode -> { roundTO, breakTO, ending, breakEndsAt, gen }
function getRT(roomCode) {
  if (!runtime.has(roomCode)) {
    runtime.set(roomCode, {
      roundTO: null,
      breakTO: null,
      ending: false, // protects endRound from re-entry
      breakEndsAt: null, // used for clients rehydrating during break
      gen: 0, // generation counter (invalidates old timers)
    });
  }
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

// ================== helpers ==================
function normalizeSeconds(v) {
  const n = Number(v);
  if (!isFinite(n) || n <= 0) return 60;
  if (n > 1000) return Math.round(n / 1000); // if ms slipped in
  if (n < 3) return 3; // minimum visible time
  return Math.round(n);
}
function pickLetter(prev) {
  const A = "АБВГДЃЕЖЗЅИЈКЛЉМНЊОПРСТЌУФХЦЧЏШ".toUpperCase();
  const idx = Math.floor(Math.random() * A.length);
  let L = A[idx];
  if (prev && prev === L) L = A[(idx + 7) % A.length]; // avoid repeating letter
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
const normalizeWord = (s) => (s || "").trim().toLowerCase();

// Dictionary shapes supported:
// - words["В"] = [...]
// - words.mk = ["Скопје", ...]
// - words = ["Скопје", ...]
// - words = { anyKey: array, ... }
function extractLetterWords(doc, letter) {
  const up = (letter || "").toUpperCase();
  const w = doc?.words;
  let raw = [];
  if (!w) raw = [];
  else if (Array.isArray(w)) raw = w;
  else if (Array.isArray(w?.[up])) raw = w[up];
  else if (Array.isArray(w?.mk)) raw = w.mk;
  else {
    const all = [];
    for (const val of Object.values(w))
      if (Array.isArray(val)) all.push(...val);
    raw = all;
  }
  // No transliteration; dictionary must be Cyrillic.
  return raw
    .map((x) => String(x || ""))
    .filter((x) => x && x[0].toUpperCase() === up)
    .map((x) => normalizeWord(x));
}

// TTL heartbeat — update lastActiveAt on meaningful activity
async function bumpActivity(roomCode) {
  try {
    await Room.updateOne(
      { code: roomCode },
      { $set: { lastActiveAt: new Date() } }
    );
  } catch {}
}

// ================== socket namespace ==================
module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);
    socket.data = {}; // { roomCode, userId }

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

      await bumpActivity(roomCode);

      io.to(roomCode).emit("playersUpdated", {
        players: (room.players || []).map(sId),
      });
      io.to(roomCode).emit("roomUpdated", { room });

      // Sync late-joiner if a round is active
      if (
        room.started &&
        room.currentRound &&
        room.roundEndTime &&
        room.letter
      ) {
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
        } catch {
          categoryMeta = ids.map((id) => ({ id, name: String(id) }));
        }

        const rn = room.currentRound;
        const hasSubmitted = Boolean(
          (room.roundsData || [])
            .find((r) => r.roundNumber === rn)
            ?.submissions?.some((s) => String(s.player) === String(userId))
        );

        socket.emit("roundStarted", {
          currentRound: room.currentRound,
          totalRounds: room.rounds,
          letter: room.letter,
          categories: ids,
          categoryMeta,
          roundEndTime: new Date(room.roundEndTime).toISOString(),
          serverNow: Date.now(),
          hasSubmitted,
          endMode: room.endMode || "ALL_SUBMIT",
        });
      }
    });

    // === GET ROUND STATE (rehydrate UI) ===
    socket.on("getRoundState", async ({ code }, ack) => {
      const roomCode = (code || socket.data.roomCode || "").toUpperCase();
      if (!roomCode) return ack?.(null);

      const room = await Room.findOne({ code: roomCode })
        .select(
          "started currentRound rounds timer categories letter roundEndTime roundsData endMode"
        )
        .lean();
      if (!room) return ack?.(null);

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
      } catch {
        categoryMeta = ids.map((id) => ({ id, name: String(id) }));
      }

      const rn = room.currentRound;
      const now = Date.now();
      let phase = null;
      let breakEndTime = null;

      if (
        room.started &&
        room.roundEndTime &&
        new Date(room.roundEndTime).getTime() > now
      ) {
        phase = "play";
      } else {
        const rt = getRT(roomCode);
        if (rt.breakEndsAt && rt.breakEndsAt.getTime() > now) {
          phase = "review";
          breakEndTime = rt.breakEndsAt.toISOString();
        } else if (room.started && !room.roundEndTime) {
          phase = "pending";
        } else if (room.started) {
          phase = "review";
        }
      }

      const userId = socket.data.userId;
      const hasSubmitted = Boolean(
        (room.roundsData || [])
          .find((r) => r.roundNumber === rn)
          ?.submissions?.some((s) => String(s.player) === String(userId))
      );

      ack?.({
        currentRound: room.currentRound,
        totalRounds: room.rounds,
        letter: room.letter,
        categories: ids,
        categoryMeta,
        roundEndTime: room.roundEndTime
          ? new Date(room.roundEndTime).toISOString()
          : null,
        breakEndTime,
        serverNow: Date.now(),
        phase,
        hasSubmitted,
        endMode: room.endMode || "ALL_SUBMIT",
      });
    });

    // === LEAVE ROOM (user action) ===
    socket.on("leaveRoom", async ({ code }) => {
      const roomCode = (code || socket.data.roomCode || "").toUpperCase();
      const userId = socket.data.userId;
      if (!roomCode || !userId) return;

      await handleLeave(roomCode, userId);
      await bumpActivity(roomCode);
      socket.leave(roomCode);
    });

    // === DISCONNECT (delayed cleanup, to allow refresh reconnect)
    socket.on("disconnect", async () => {
      const { roomCode, userId } = socket.data || {};
      if (!roomCode || !userId) return;

      // Држи timeout 5 секунди да му дадеш шанса на клиентот да се врати
      setTimeout(async () => {
        const stillConnected = Array.from(io.sockets.sockets.values()).some(
          (s) => s.data?.roomCode === roomCode && s.data?.userId === userId
        );
        if (!stillConnected) {
          await handleLeave(roomCode, userId);
          await bumpActivity(roomCode);
        }
      }, 60000); // 60 секунди grace period
    });

    // === BACK TO LOBBY (host only) ===
    socket.on("backToLobby", async ({ code } = {}) => {
      const roomCode = (code || socket.data.roomCode || "").toUpperCase();
      const { userId } = socket.data || {};
      if (!roomCode || !userId) return;

      const room = await Room.findOne({ code: roomCode }).select(
        "host started currentRound letter roundEndTime"
      );
      if (!room) return socket.emit("error", "Room not found");
      if (String(room.host) !== String(userId))
        return socket.emit("error", "Only the host can do this");

      const rt = getRT(roomCode);
      clearAllTimers(rt);
      rt.ending = false;
      rt.breakEndsAt = null;

      await Room.updateOne(
        { code: roomCode },
        {
          $set: {
            started: false,
            currentRound: 0,
            letter: null,
            roundEndTime: null,
          },
        }
      );

      await bumpActivity(roomCode);

      io.to(roomCode).emit("roomState", {
        started: false,
        currentRound: 0,
        serverNow: Date.now(),
      });

      const fresh = await Room.findOne({ code: roomCode }).populate(
        "players host"
      );
      io.to(roomCode).emit("roomUpdated", { room: fresh });
    });

    // === START GAME (host only) — supports overrides in payload ===
    socket.on("startGame", async (payload = {}) => {
      const roomCode = (
        payload.code ||
        socket.data.roomCode ||
        ""
      ).toUpperCase();
      const { userId } = socket.data || {};
      if (!roomCode || !userId) return;

      const room = await Room.findOne({ code: roomCode }).select(
        "host rounds timer categories started currentRound endMode"
      );
      if (!room) return socket.emit("error", "Room not found");
      if (String(room.host) !== String(userId))
        return socket.emit("error", "Only the host can start");
      if (!room.categories?.length && !Array.isArray(payload.categories))
        return socket.emit("error", "Select at least one category");

      const next = {
        rounds: room.rounds,
        timer: room.timer,
        categories: room.categories,
        endMode: room.endMode || "ALL_SUBMIT",
      };
      if (payload.rounds != null)
        next.rounds = Math.max(1, Math.min(20, Number(payload.rounds) || 5));
      if (payload.timer != null)
        next.timer = Math.max(3, Math.min(300, Number(payload.timer) || 60));
      if (Array.isArray(payload.categories) && payload.categories.length)
        next.categories = payload.categories;
      if (payload.endMode === "PLAYER_STOP" || payload.endMode === "ALL_SUBMIT")
        next.endMode = payload.endMode;

      const updated = await Room.findOneAndUpdate(
        { code: roomCode },
        {
          $set: {
            started: true,
            currentRound: 0,
            letter: null,
            roundEndTime: null,
            roundsData: [],
            rounds: next.rounds,
            timer: next.timer,
            categories: next.categories,
            endMode: next.endMode,
          },
        },
        { new: true }
      );

      await bumpActivity(roomCode);

      await startRound(updated); // start R1 before announcing
      io.to(roomCode).emit("gameStarted", {
        totalRounds: updated.rounds,
        timer: updated.timer,
        categories: (updated.categories || []).map(String),
        endMode: updated.endMode || "ALL_SUBMIT",
      });
    });

    // === UPDATE SETTINGS (host; only while NOT started) ===
    socket.on("updateSettings", async ({ timer, rounds, endMode }) => {
      const { roomCode, userId } = socket.data || {};
      if (!roomCode || !userId) return;

      const room = await Room.findOne({ code: roomCode }).select(
        "host started"
      );
      if (!room) return socket.emit("error", "Room not found");
      if (String(room.host) !== String(userId))
        return socket.emit("error", "Only host can update settings");
      if (room.started)
        return socket.emit(
          "error",
          "Cannot change settings while game running"
        );

      const safeTimer = Math.max(3, Math.min(300, Number(timer || 60)));
      const safeRounds = Math.max(1, Math.min(20, Number(rounds || 5)));
      const safeMode = endMode === "PLAYER_STOP" ? "PLAYER_STOP" : "ALL_SUBMIT";

      const updated = await Room.findOneAndUpdate(
        { code: roomCode },
        { $set: { timer: safeTimer, rounds: safeRounds, endMode: safeMode } },
        { new: true }
      ).lean();

      await bumpActivity(roomCode);

      io.to(roomCode).emit("settingsUpdated", {
        timer: updated.timer,
        rounds: updated.rounds,
        endMode: updated.endMode,
      });
    });

    // === NEXT ROUND (host may skip break) ===
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
      rt.breakEndsAt = null;

      await bumpActivity(roomCode);

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

    // === FORCE END ROUND (host only) ===
    socket.on("endRound", async () => {
      const { roomCode, userId } = socket.data || {};
      if (!roomCode || !userId) return;

      const room = await Room.findOne({ code: roomCode }).select(
        "host started"
      );
      if (!room || !room.started) return;
      if (String(room.host) !== String(userId)) return;

      const rt = getRT(roomCode);
      if (rt.ending) return;
      rt.ending = true;
      clearAllTimers(rt);

      await bumpActivity(roomCode);

      try {
        await endRound(roomCode);
      } finally {
        rt.ending = false;
      }
    });

    // === PLAYER STOP ROUND (Mode: PLAYER_STOP; any player who filled all) ===
    socket.on("playerStopRound", async ({ answers } = {}) => {
      const { roomCode, userId } = socket.data || {};
      if (!roomCode || !userId) return;

      const room = await Room.findOne({ code: roomCode })
        .select(
          "started currentRound roundEndTime categories roundsData endMode"
        )
        .lean();
      if (!room || !room.started || !room.currentRound) return;
      if ((room.endMode || "ALL_SUBMIT") !== "PLAYER_STOP") return;

      const rn = room.currentRound;

      // Optional upsert included answers prior to stopping
      if (
        answers &&
        Object.values(answers).some((v) => String(v || "").trim())
      ) {
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
      }

      const fresh = await Room.findOne({ code: roomCode })
        .select("categories roundsData currentRound")
        .lean();
      const round = (fresh.roundsData || []).find((r) => r.roundNumber === rn);
      if (!round) return;

      const sub = (round.submissions || []).find(
        (s) => String(s.player) === String(userId)
      );
      if (!sub) return;

      const catIds = (fresh.categories || []).map(String);
      const allFilled =
        catIds.length > 0 &&
        catIds.every(
          (cid) => String(sub.answers?.[cid] || "").trim().length > 0
        );
      if (!allFilled) return;

      const rt = getRT(roomCode);
      if (rt.ending) return;
      rt.ending = true;
      clearAllTimers(rt);

      await bumpActivity(roomCode);

      try {
        await endRound(roomCode);
      } finally {
        rt.ending = false;
      }
    });

    // === SUBMIT ANSWERS (atomic replace) ===
    socket.on("submitAnswers", async ({ answers }) => {
      const { roomCode, userId } = socket.data || {};
      if (!roomCode || !userId) return;

      const hasAny = Object.values(answers || {}).some((v) =>
        String(v || "").trim()
      );
      if (!hasAny) return;

      const cur = await Room.findOne({ code: roomCode }).select(
        "started currentRound roundEndTime players categories endMode"
      );
      if (!cur || !cur.started || !cur.currentRound) return;

      const cutoff = cur.roundEndTime
        ? new Date(cur.roundEndTime).getTime() + LATE_GRACE_MS
        : 0;
      if (cutoff && Date.now() > cutoff) return;

      const rn = cur.currentRound;

      // Replace previous submission
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

      await bumpActivity(roomCode);

      // Mode: ALL_SUBMIT — end early once everyone has submitted
      if ((cur.endMode || "ALL_SUBMIT") === "ALL_SUBMIT") {
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
      }
    });

    // ================== internals ==================
    async function handleLeave(roomCode, userId) {
      const lean = await Room.findOne({ code: roomCode })
        .select("players host started")
        .lean();
      if (!lean) return;

      const isHost = String(lean.host) === String(userId);
      const newPlayers = (lean.players || []).filter(
        (p) => String(p) !== String(userId)
      );

      // If host leaves and no one remains → delete room + clear timers
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

    // Start a new round; schedules natural end-of-round timer
    async function startRound(roomDoc) {
      const roomCode = roomDoc.code;
      const rt = getRT(roomCode);
      clearAllTimers(rt);
      rt.ending = false;
      rt.breakEndsAt = null;
      rt.gen += 1; // invalidate older timers
      const myGen = rt.gen;

      if ((roomDoc.currentRound || 0) >= (roomDoc.rounds || 0)) return;

      const secs = normalizeSeconds(roomDoc.timer);
      const letter = pickLetter(roomDoc.letter);
      const endAt = new Date(Date.now() + secs * 1000);

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

      await bumpActivity(roomCode);

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
        hasSubmitted: false,
        endMode: updated.endMode || "ALL_SUBMIT",
      });

      // natural end-of-round
      rt.roundTO = setTimeout(async () => {
        if (!rt.ending && myGen === rt.gen) {
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

    // Score, announce results, schedule break/final
    async function endRound(roomCode) {
      const rt = getRT(roomCode);
      clearAllTimers(rt);
      rt.breakEndsAt = null;

      const room = await Room.findOne({ code: roomCode });
      if (!room) return;

      const rn = room.currentRound;
      const idx = room.roundsData.findIndex((r) => r.roundNumber === rn);
      if (idx === -1) return;

      const round = room.roundsData[idx];
      const categories = (room.categories || []).map(String);
      const letter = (room.letter || "").toUpperCase();

      const cats = await Category.find({ _id: { $in: categories } })
        .select("words")
        .lean();
      const catMap = new Map(cats.map((c) => [String(c._id), c]));

      const byCat = {}; // catId -> [{ player, raw, norm, starts, inDict }]
      const countsByCat = {}; // catId -> { norm: count }

      for (const cid of categories) {
        const doc = catMap.get(String(cid));
        const dictList = extractLetterWords(doc, letter);
        const dictSet = new Set(dictList);

        const ACCEPT_ANY_IF_NO_DICT = true;
        const allowAny = ACCEPT_ANY_IF_NO_DICT && dictSet.size === 0;

        const arr = (round.submissions || []).map((s) => {
          const raw = (s.answers?.[cid] || "").trim(); // typed value (Cyrillic)
          const norm = normalizeWord(raw); // normalized
          const starts = !!raw && raw[0]?.toUpperCase() === letter;
          const inDict = starts && (allowAny || dictSet.has(norm));
          return { player: String(s.player), raw, norm, starts, inDict };
        });

        byCat[String(cid)] = arr;

        const counts = {};
        for (const a of arr)
          if (a.inDict) counts[a.norm] = (counts[a.norm] || 0) + 1;
        countsByCat[String(cid)] = counts;
      }

      const scores = {};
      const details = {}; // details[pid][cid] = { value, valid, unique, points, reason }

      for (const sub of round.submissions || []) {
        const pid = String(sub.player);
        let pts = 0;
        details[pid] = details[pid] || {};

        for (const cid of categories) {
          const a = (byCat[String(cid)] || []).find(
            (x) => x.player === pid
          ) || { raw: "", starts: false, inDict: false, norm: "" };

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

        sub.points = pts;
        scores[pid] = pts;
      }

      round.endedAt = new Date();
      await room.save();
      await bumpActivity(roomCode);

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
        serverNow: Date.now(),
      });

      if (hasMore) {
        rt.breakEndsAt = breakEnd;
        rt.breakTO = setTimeout(async () => {
          try {
            const again = await Room.findOne({ code: roomCode });
            if (!again) return;
            await startRound(again);
          } catch (e) {
            console.error(e);
          } finally {
            rt.breakEndsAt = null;
          }
        }, BREAK_MS);
      } else {
        room.started = false;
        room.letter = null;
        room.roundEndTime = null;
        await room.save();
        await bumpActivity(roomCode);

        const final = computeFinalScores(room);
        io.to(roomCode).emit("gameEnded", final);
      }
    }
  });
};
