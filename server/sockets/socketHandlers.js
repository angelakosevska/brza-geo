const mongoose = require("mongoose");
const Room = require("../models/Room");
const Category = require("../models/Category");
const Game = require("../models/Game");
const User = require("../models/User");
const { addWordPower } = require("../utils/levelSystem");

// ========== CONSTANTS ==========
const BREAK_MS = 120000; // 2 minutes between rounds
const LATE_GRACE_MS = 150; // buffer for client clock skew
const DISCONNECT_GRACE_MS = 60000; // 1 minute grace period for reconnection
const FORCE_SUBMIT_WAIT_MS = 5000; // 5 seconds to collect force submissions

// ========== RUNTIME STATE ==========
// Per-room ephemeral timers/state (not persisted to DB)
const runtime = new Map();

function getRuntime(roomCode) {
  if (!runtime.has(roomCode)) {
    runtime.set(roomCode, {
      roundTO: null,
      breakTO: null,
      ending: false, // prevents endRound re-entry
      breakEndsAt: null, // for client rehydration during break
      gen: 0, // generation counter to invalidate old timers
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

// ========== UTILITY FUNCTIONS ==========
const normalizeSeconds = (v) => {
  const n = Number(v);
  if (!isFinite(n) || n <= 0) return 60;
  if (n > 1000) return Math.round(n / 1000); // convert ms to seconds
  if (n < 3) return 3; // minimum visible time
  return Math.round(n);
};

const pickLetter = (prev) => {
  const alphabet = "АБВГДЃЕЖЗЅИЈКЛЉМНЊОПРСТЌУФХЦЧЏШ";
  const idx = Math.floor(Math.random() * alphabet.length);
  let letter = alphabet[idx];
  // Avoid repeating the same letter
  if (prev && prev === letter) {
    letter = alphabet[(idx + 7) % alphabet.length];
  }
  return letter;
};

const computeFinalScores = (room) => {
  const totals = {};

  for (const round of room.roundsData || []) {
    for (const submission of round.submissions || []) {
      const playerId = String(submission.player);
      totals[playerId] = (totals[playerId] || 0) + (submission.points || 0);
    }
  }

  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const topScore = sorted.length ? sorted[0][1] : 0;
  const winners = sorted
    .filter(([, score]) => score === topScore)
    .map(([playerId]) => playerId);

  return { totals, winners, rounds: room.rounds || 0 };
};

const stringifyId = (v) =>
  typeof v === "string" ? v : v?._id ? String(v._id) : String(v ?? "");

const normalizeWord = (s) => (s || "").trim().toLowerCase();

// Extract words from dictionary for given letter
const extractLetterWords = (doc, letter) => {
  const upperLetter = (letter || "").toUpperCase();
  const words = doc?.words;
  let rawWords = [];

  if (!words) {
    rawWords = [];
  } else if (Array.isArray(words)) {
    rawWords = words;
  } else if (Array.isArray(words[upperLetter])) {
    rawWords = words[upperLetter];
  } else if (Array.isArray(words.mk)) {
    rawWords = words.mk;
  } else {
    // Flatten all arrays in the words object
    const allWords = [];
    for (const val of Object.values(words)) {
      if (Array.isArray(val)) allWords.push(...val);
    }
    rawWords = allWords;
  }

  return rawWords
    .map((word) => String(word || ""))
    .filter((word) => word && word[0].toUpperCase() === upperLetter)
    .map(normalizeWord);
};

// Update room activity timestamp
const bumpActivity = async (roomCode) => {
  try {
    await Room.updateOne(
      { code: roomCode },
      { $set: { lastActiveAt: new Date() } }
    );
  } catch (err) {
    console.warn(`Failed to bump activity for room ${roomCode}:`, err);
  }
};

// ========== CATEGORY HELPERS ==========
const fetchCategoryMeta = async (categoryIds) => {
  if (!categoryIds.length) return [];

  try {
    const categories = await Category.find({ _id: { $in: categoryIds } })
      .select("displayName name")
      .lean();

    const nameById = Object.fromEntries(
      categories.map((cat) => [
        String(cat._id),
        cat.displayName?.mk || cat.name || String(cat._id),
      ])
    );

    return categoryIds.map((id) => ({
      id: String(id),
      name: nameById[String(id)] || String(id),
    }));
  } catch (err) {
    console.warn("Failed to fetch category metadata:", err);
    return categoryIds.map((id) => ({
      id: String(id),
      name: String(id),
    }));
  }
};

// ========== MAIN SOCKET HANDLER ==========
module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);
    socket.data = {}; // { roomCode, userId }

    // ========== ROOM MANAGEMENT ==========
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

      // Notify all clients of player update
      io.to(roomCode).emit("playersUpdated", {
        players: (room.players || []).map(stringifyId),
      });
      io.to(roomCode).emit("roomUpdated", { room });

      // Sync late joiner if round is active
      await syncLateJoiner(socket, room, userId);
    });

    socket.on("getRoundState", async ({ code }, ack) => {
      const roomCode = (code || socket.data.roomCode || "").toUpperCase();
      if (!roomCode) return ack?.(null);

      const state = await buildRoundState(roomCode, socket.data.userId);
      ack?.(state);
    });

    socket.on("leaveRoom", async ({ code }) => {
      const roomCode = (code || socket.data.roomCode || "").toUpperCase();
      const userId = socket.data.userId;
      if (!roomCode || !userId) return;

      await handlePlayerLeave(roomCode, userId);
      await bumpActivity(roomCode);
      socket.leave(roomCode);
    });

    socket.on("disconnect", async () => {
      const { roomCode, userId } = socket.data || {};
      if (!roomCode || !userId) return;

      // Grace period for reconnection
      setTimeout(async () => {
        const stillConnected = Array.from(io.sockets.sockets.values()).some(
          (s) => s.data?.roomCode === roomCode && s.data?.userId === userId
        );
        if (!stillConnected) {
          await handlePlayerLeave(roomCode, userId);
          await bumpActivity(roomCode);
        }
      }, DISCONNECT_GRACE_MS);
    });

    // ========== GAME CONTROL ==========
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
      if (!room.categories?.length && !Array.isArray(payload.categories))
        return socket.emit("error", "Select at least one category");

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
      await startRound(updatedRoom);

      io.to(roomCode).emit("gameStarted", {
        totalRounds: updatedRoom.rounds,
        timer: updatedRoom.timer,
        categories: (updatedRoom.categories || []).map(String),
        endMode: updatedRoom.endMode || "ALL_SUBMIT",
      });
    });

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

      const settings = {
        timer: Math.max(3, Math.min(300, Number(timer || 60))),
        rounds: Math.max(1, Math.min(20, Number(rounds || 5))),
        endMode: endMode === "PLAYER_STOP" ? "PLAYER_STOP" : "ALL_SUBMIT",
      };

      const updated = await Room.findOneAndUpdate(
        { code: roomCode },
        { $set: settings },
        { new: true }
      ).lean();

      await bumpActivity(roomCode);
      io.to(roomCode).emit("settingsUpdated", settings);
    });

    socket.on("backToLobby", async ({ code } = {}) => {
      const roomCode = (code || socket.data.roomCode || "").toUpperCase();
      const { userId } = socket.data || {};
      if (!roomCode || !userId) return;

      const room = await Room.findOne({ code: roomCode }).select("host");
      if (!room) return socket.emit("error", "Room not found");
      if (String(room.host) !== String(userId))
        return socket.emit("error", "Only the host can do this");

      const rt = getRuntime(roomCode);
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

    socket.on("nextRound", async () => {
      const { roomCode, userId } = socket.data || {};
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
        await startRound(fresh);
      } else {
        await endGame(roomCode);
      }
    });

    // ========== ROUND GAMEPLAY ==========
    socket.on("submitAnswers", async ({ answers }) => {
      const { roomCode, userId } = socket.data || {};
      if (!roomCode || !userId) return;

      const hasAnswers = Object.values(answers || {}).some((v) =>
        String(v || "").trim()
      );
      if (!hasAnswers) return;

      const room = await Room.findOne({ code: roomCode }).select(
        "started currentRound roundEndTime players endMode"
      );
      if (!room?.started || !room.currentRound) return;

      // Check if submission is still allowed
      const cutoff = room.roundEndTime
        ? new Date(room.roundEndTime).getTime() + LATE_GRACE_MS
        : 0;
      if (cutoff && Date.now() > cutoff) return;

      await savePlayerSubmission(roomCode, room.currentRound, userId, answers);
      await bumpActivity(roomCode);

      // Check if all players have submitted (ALL_SUBMIT mode)
      if ((room.endMode || "ALL_SUBMIT") === "ALL_SUBMIT") {
        await checkAllSubmitted(roomCode, room.currentRound);
      }
    });

    socket.on("playerStopRound", async () => {
      const { roomCode, userId } = socket.data || {};
      if (!roomCode || !userId) return;

      const room = await Room.findOne({ code: roomCode })
        .select("started currentRound endMode")
        .lean();

      if (!room?.started || !room.currentRound) return;
      if ((room.endMode || "ALL_SUBMIT") !== "PLAYER_STOP") return;

      // 1. Кажи им на сите клиенти да пуштат submitAnswers
      io.to(roomCode).emit("forceSubmit", { code: roomCode });

      // 2. Чекај 5s за submissions
      setTimeout(async () => {
        const rt = getRuntime(roomCode);
        if (rt.ending) return;
        rt.ending = true;
        clearAllTimers(rt);

        await bumpActivity(roomCode);
        try {
          await endRound(roomCode);
        } finally {
          rt.ending = false;
        }
      }, FORCE_SUBMIT_WAIT_MS);
    });

    // ========== HELPER FUNCTIONS ==========
    async function syncLateJoiner(socket, room, userId) {
      if (
        !room.started ||
        !room.currentRound ||
        !room.roundEndTime ||
        !room.letter
      ) {
        return;
      }

      const categoryIds = (room.categories || []).map(String);
      const categoryMeta = await fetchCategoryMeta(categoryIds);

      const hasSubmitted = Boolean(
        (room.roundsData || [])
          .find((r) => r.roundNumber === room.currentRound)
          ?.submissions?.some((s) => String(s.player) === String(userId))
      );

      socket.emit("roundStarted", {
        currentRound: room.currentRound,
        totalRounds: room.rounds,
        letter: room.letter,
        categories: categoryIds,
        categoryMeta,
        roundEndTime: new Date(room.roundEndTime).toISOString(),
        serverNow: Date.now(),
        hasSubmitted,
        endMode: room.endMode || "ALL_SUBMIT",
      });
    }

    async function buildRoundState(roomCode, userId) {
      const room = await Room.findOne({ code: roomCode })
        .select(
          "started currentRound rounds categories letter roundEndTime roundsData endMode"
        )
        .lean();

      if (!room) return null;

      const categoryIds = (room.categories || []).map(String);
      const categoryMeta = await fetchCategoryMeta(categoryIds);
      const now = Date.now();
      let phase = null;
      let breakEndTime = null;

      // Determine current phase
      if (
        room.started &&
        room.roundEndTime &&
        new Date(room.roundEndTime).getTime() > now
      ) {
        phase = "play";
      } else {
        const rt = getRuntime(roomCode);
        if (rt.breakEndsAt && rt.breakEndsAt.getTime() > now) {
          phase = "review";
          breakEndTime = rt.breakEndsAt.toISOString();
        } else if (room.started && !room.roundEndTime) {
          phase = "pending";
        } else if (room.started) {
          phase = "review";
        }
      }

      const hasSubmitted = Boolean(
        (room.roundsData || [])
          .find((r) => r.roundNumber === room.currentRound)
          ?.submissions?.some((s) => String(s.player) === String(userId))
      );

      return {
        currentRound: room.currentRound,
        totalRounds: room.rounds,
        letter: room.letter,
        categories: categoryIds,
        categoryMeta,
        roundEndTime: room.roundEndTime
          ? new Date(room.roundEndTime).toISOString()
          : null,
        breakEndTime,
        serverNow: now,
        phase,
        hasSubmitted,
        endMode: room.endMode || "ALL_SUBMIT",
      };
    }

    async function handlePlayerLeave(roomCode, userId) {
      const room = await Room.findOne({ code: roomCode })
        .select("players host")
        .lean();
      if (!room) return;

      const isHost = String(room.host) === String(userId);
      const newPlayers = (room.players || []).filter(
        (p) => String(p) !== String(userId)
      );

      // Delete room if host leaves and no players remain
      if (isHost && newPlayers.length === 0) {
        await Room.deleteOne({ code: roomCode });
        const rt = runtime.get(roomCode);
        clearAllTimers(rt);
        runtime.delete(roomCode);
        io.to(roomCode).emit("roomClosed");
        return;
      }

      // Update room with new player list and potentially new host
      const update = { players: newPlayers };
      if (isHost && newPlayers.length > 0) {
        update.host = newPlayers[0]; // First remaining player becomes host
      }

      const updated = await Room.findOneAndUpdate({ code: roomCode }, update, {
        new: true,
      }).populate("players host");

      io.to(roomCode).emit("playersUpdated", {
        players: (updated.players || []).map(stringifyId),
      });
      io.to(roomCode).emit("roomUpdated", { room: updated });
    }

    async function savePlayerSubmission(
      roomCode,
      roundNumber,
      userId,
      answers
    ) {
      // Remove existing submission
      await Room.updateOne(
        { code: roomCode, "roundsData.roundNumber": roundNumber },
        { $pull: { "roundsData.$.submissions": { player: userId } } }
      );

      // Add new submission
      await Room.updateOne(
        { code: roomCode, "roundsData.roundNumber": roundNumber },
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

    async function checkAllSubmitted(roomCode, roundNumber) {
      const room = await Room.findOne({ code: roomCode }).select(
        "players roundsData"
      );

      const roundData = room.roundsData.find(
        (r) => r.roundNumber === roundNumber
      );
      const submittedCount = (roundData?.submissions || []).length;
      const playerCount = (room.players || []).length;

      if (playerCount > 0 && submittedCount >= playerCount) {
        const rt = getRuntime(roomCode);
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

    async function startRound(roomDoc) {
      const roomCode = roomDoc.code;
      const rt = getRuntime(roomCode);
      clearAllTimers(rt);
      rt.ending = false;
      rt.breakEndsAt = null;
      rt.gen += 1; // Invalidate old timers
      const myGen = rt.gen;

      if ((roomDoc.currentRound || 0) >= (roomDoc.rounds || 0)) return;

      const duration = normalizeSeconds(roomDoc.timer);
      const letter = pickLetter(roomDoc.letter);
      const endAt = new Date(Date.now() + duration * 1000);
      const nextRound = (roomDoc.currentRound || 0) + 1;

      const updatedRoom = await Room.findOneAndUpdate(
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

      const categoryIds = (updatedRoom.categories || []).map(String);
      const categoryMeta = await fetchCategoryMeta(categoryIds);

      io.to(roomCode).emit("roundStarted", {
        currentRound: updatedRoom.currentRound,
        totalRounds: updatedRoom.rounds,
        letter,
        categories: categoryIds,
        categoryMeta,
        roundEndTime: endAt.toISOString(),
        serverNow: Date.now(),
        hasSubmitted: false,
        endMode: updatedRoom.endMode || "ALL_SUBMIT",
      });

      // Set natural end-of-round timer
      rt.roundTO = setTimeout(async () => {
        if (!rt.ending && myGen === rt.gen) {
          rt.ending = true;
          try {
            await endRound(roomCode);
          } catch (err) {
            console.error("Error ending round:", err);
          } finally {
            rt.ending = false;
          }
        }
      }, duration * 1000 + LATE_GRACE_MS);
    }

    async function endRound(roomCode) {
      const rt = getRuntime(roomCode);
      clearAllTimers(rt);
      rt.breakEndsAt = null;

      const room = await Room.findOne({ code: roomCode });
      if (!room) return;

      const roundNumber = room.currentRound;
      const roundIndex = room.roundsData.findIndex(
        (r) => r.roundNumber === roundNumber
      );
      if (roundIndex === -1) return;

      const round = room.roundsData[roundIndex];
      const categories = (room.categories || []).map(String);
      const letter = (room.letter || "").toUpperCase();

      // Score the round
      const { scores, details, answersByPlayer } = await scoreRound(
        round,
        categories,
        letter
      );

      // Update submissions with scores
      for (const submission of round.submissions || []) {
        const playerId = String(submission.player);
        submission.points = scores[playerId] || 0;
      }

      round.endedAt = new Date();
      await room.save();
      await bumpActivity(roomCode);

      const breakEnd = new Date(Date.now() + BREAK_MS);
      const hasMore = roundNumber < room.rounds;

      io.to(roomCode).emit("roundResults", {
        round: roundNumber,
        scores,
        answers: answersByPlayer,
        details,
        breakEndTime: breakEnd.toISOString(),
        hasMore,
        serverNow: Date.now(),
      });

      if (hasMore) {
        // Schedule next round after break
        rt.breakEndsAt = breakEnd;
        rt.breakTO = setTimeout(async () => {
          try {
            const freshRoom = await Room.findOne({ code: roomCode });
            if (freshRoom) await startRound(freshRoom);
          } catch (err) {
            console.error("Error starting next round:", err);
          } finally {
            rt.breakEndsAt = null;
          }
        }, BREAK_MS);
      } else {
        rt.breakEndsAt = breakEnd;
        rt.breakTO = setTimeout(async () => {
          try {
            await endGame(roomCode);
          } catch (err) {
            console.error("Error ending game:", err);
          } finally {
            rt.breakEndsAt = null;
          }
        }, BREAK_MS);
      }
    }
    const { distance } = require("fastest-levenshtein");

    function isCloseMatch(word, dictSet) {
      for (const dictWord of dictSet) {
        if (distance(word, dictWord) === 1) {
          return true; // дозволуваме само една грешка
        }
      }
      return false;
    }

    async function scoreRound(round, categories, letter) {
      const categoryDocs = await Category.find({ _id: { $in: categories } })
        .select("words")
        .lean();
      const catMap = new Map(categoryDocs.map((c) => [String(c._id), c]));

      const answersByCategory = {};
      const countsByCategory = {};
      const noWordsByCategory = {}; // <---- ново: бележи категории без зборови

      // обработка на сите одговори по категории
      for (const categoryId of categories) {
        const doc = catMap.get(String(categoryId));
        const dictWords = extractLetterWords(doc, letter);
        const dictSet = new Set(dictWords);

        // ако нема зборови за оваа буква во оваа категорија
        if (dictSet.size === 0) {
          noWordsByCategory[String(categoryId)] = true;
          answersByCategory[String(categoryId)] = [];
          countsByCategory[String(categoryId)] = {};
          continue; // скокни на следна категорија
        } else {
          noWordsByCategory[String(categoryId)] = false;
        }

        const answers = (round.submissions || []).map((submission) => {
          const raw = (submission.answers?.[categoryId] || "").trim();
          const normalized = normalizeWord(raw);
          const startsCorrect = !!raw && raw[0]?.toUpperCase() === letter;

          const isExact = startsCorrect && dictSet.has(normalized);
          const isTypo =
            startsCorrect && !isExact && isCloseMatch(normalized, dictSet);

          const inDict = startsCorrect && (isExact || isTypo);

          return {
            player: String(submission.player),
            raw,
            normalized,
            startsCorrect,
            inDict,
            isExact,
            isTypo,
          };
        });

        answersByCategory[String(categoryId)] = answers;

        // броење на зборови
        const counts = {};
        for (const answer of answers) {
          if (answer.inDict) {
            counts[answer.normalized] = (counts[answer.normalized] || 0) + 1;
          }
        }
        countsByCategory[String(categoryId)] = counts;
      }

      const scores = {};
      const details = {};
      const answersByPlayer = {};

      // доделување поени по играч
      for (const submission of round.submissions || []) {
        const playerId = String(submission.player);
        let totalPoints = 0;
        details[playerId] = {};
        answersByPlayer[playerId] = submission.answers || {};

        for (const categoryId of categories) {
          // ако оваа категорија нема зборови на таа буква
          if (noWordsByCategory[String(categoryId)]) {
            details[playerId][String(categoryId)] = {
              value: "",
              valid: true,
              unique: false,
              points: 0,
              reason: "no-words-for-letter",
            };
            continue;
          }

          const answer = (answersByCategory[String(categoryId)] || []).find(
            (a) => a.player === playerId
          ) || {
            raw: "",
            startsCorrect: false,
            inDict: false,
            normalized: "",
            isExact: false,
            isTypo: false,
          };

          const result = {
            value: answer.raw,
            valid: false,
            unique: false,
            points: 0,
            reason: "",
          };

          if (!answer.raw) {
            result.reason = "empty";
          } else if (!answer.startsCorrect) {
            result.reason = "wrong-letter";
          } else if (!answer.inDict) {
            result.reason = "not-in-dictionary";
          } else {
            const count =
              countsByCategory[String(categoryId)][answer.normalized] || 0;

            result.valid = true;
            result.unique = count === 1;

            // бодирање
            if (answer.isExact) {
              if (count === 1) result.points = 10;
              else if (count === 2) result.points = 4;
              else result.points = 2;
            } else if (answer.isTypo) {
              if (count === 1) result.points = 8;
              else if (count === 2) result.points = 3;
              else result.points = 1;
            }

            totalPoints += result.points;
          }

          details[playerId][String(categoryId)] = result;
        }

        scores[playerId] = totalPoints;
      }

      return { scores, details, answersByPlayer, noWordsByCategory };
    }

    async function endGame(roomCode) {
      const room = await Room.findOne({ code: roomCode });
      if (!room) return;

      // Reset room state (but don't delete)
      room.started = false;
      room.letter = null;
      room.roundEndTime = null;
      await room.save();
      await bumpActivity(roomCode);

      // 1. Compute scores
      const finalScores = computeFinalScores(room);

      // 2. Save finished game into Game collection
      await Game.create({
        roomCode,
        players: room.players,
        rounds: room.rounds,
        categories: room.categories,
        roundsData: room.roundsData,
        winners: finalScores.winners,
      });

      // 3. Assign WP to each player
      for (const [playerId, totalPoints] of Object.entries(
        finalScores.totals
      )) {
        const user = await User.findById(playerId);
        if (!user) continue;

        addWordPower(user, totalPoints); // scale rule: 1 point = 1 WP
        await user.save();

        // Broadcast new WP to everyone in the room
        io.to(roomCode).emit("playerWPUpdated", {
          userId: playerId,
          wordPower: user.wordPower,
          level: user.level,
        });
      }

      // 4. Emit final results (with totals + winners)
      io.to(roomCode).emit("gameEnded", {
        ...finalScores,
        serverNow: Date.now(),
      });

      // 5. Update room in client lobby
      const freshRoom = await Room.findOne({ code: roomCode }).populate(
        "players host"
      );
      io.to(roomCode).emit("roomUpdated", { room: freshRoom });
      io.to(roomCode).emit("redirectToLobby", { code: roomCode });
    }
  });
};
