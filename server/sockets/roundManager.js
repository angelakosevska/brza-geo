const Room = require("../models/Room");
const { scoreRound } = require("./scoring");
const { bumpActivity, fetchCategoryMeta } = require("./utils");
const {
  getRuntime,
  clearAllTimers,
  BREAK_MS,
  LATE_GRACE_MS,
} = require("./runtime");

async function startRound(io, roomDoc) {
  const roomCode = roomDoc.code;
  const rt = getRuntime(roomCode);
  clearAllTimers(rt);
  rt.ending = false;
  rt.breakEndsAt = null;
  rt.gen += 1;
  const myGen = rt.gen;

  if ((roomDoc.currentRound || 0) >= (roomDoc.rounds || 0)) return;

  const timerVal = Number(roomDoc.timer);
  const duration = Math.max(3, isNaN(timerVal) ? 60 : timerVal);
  const endAt = new Date(Date.now() + duration * 1000);

  const alphabet = "АБВГДЃЕЖЗЅИЈКЛЉМНЊОПРСТЌУФХЦЧЏШ".split("");

  const categoryIds = (roomDoc.categories || []).map(String);
  const categoryMeta = await fetchCategoryMeta(categoryIds);

  // letters from validLetters in category
  const validLetters = new Set();
  for (const cat of categoryMeta) {
    for (const l of cat.validLetters || []) {
      const letter = String(l).trim().toUpperCase();
      validLetters.add(letter);
    }
  }
  console.log("📂 categoryMeta:", categoryMeta);
  console.log("📚 collected validLetters:", Array.from(validLetters));


  // ако нема валидни букви → скипни рундата
  if (validLetters.size === 0) {
    console.warn("⚠️ No valid letters found. Skipping round.");

    io.to(roomCode).emit("roundSkipped", {
      currentRound: (roomDoc.currentRound || 0) + 1,
      totalRounds: roomDoc.rounds,
      reason: "no-valid-words",
      serverNow: Date.now(),
    });

    // пауза пред следна рунда (2 секунди)
    setTimeout(async () => {
      const freshRoom = await Room.findOneAndUpdate(
        { _id: roomDoc._id },
        { $inc: { currentRound: 1 } }, // само зголеми рунда
        { new: true }
      );
      if (freshRoom && freshRoom.currentRound <= freshRoom.rounds) {
        await startRound(io, freshRoom);
      }
    }, 2000);

    return;
  }

  // нормално избери буква од валидни
  const pool = Array.from(validLetters);
  const idx = Math.floor(Math.random() * pool.length);
  const letter = pool[idx];
  console.log("🎲 Picked letter:", letter);

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

  // auto-end round
  rt.roundTO = setTimeout(async () => {
    if (!rt.ending && myGen === rt.gen) {
      rt.ending = true;
      try {
        await endRound(io, roomCode);
      } finally {
        rt.ending = false;
      }
    }
  }, duration * 1000 + LATE_GRACE_MS);
}

async function endRound(io, roomCode) {
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

  const { scores, details, answersByPlayer } = await scoreRound(
    round,
    categories,
    letter
  );

  for (const submission of round.submissions || []) {
    submission.points = scores[String(submission.player)] || 0;
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
    if (!rt.skipBreak) {
      rt.breakEndsAt = breakEnd;
      rt.breakTO = setTimeout(async () => {
        try {
          const freshRoom = await Room.findOne({ code: roomCode });
          if (freshRoom) await startRound(io, freshRoom);
        } finally {
          rt.breakEndsAt = null;
        }
      }, BREAK_MS);
    }
    rt.skipBreak = false; // reset flag
  } else {
    const { endGame } = require("./gameManager");
    if (!rt.skipBreak) {
      rt.breakEndsAt = breakEnd;
      rt.breakTO = setTimeout(async () => {
        try {
          await endGame(io, roomCode);
        } finally {
          rt.breakEndsAt = null;
        }
      }, BREAK_MS);
    }
    rt.skipBreak = false;
  }
}

async function checkAllSubmitted(io, roomCode, roundNumber) {
  const room = await Room.findOne({ code: roomCode }).select(
    "players roundsData"
  );
  if (!room) return;

  const roundData = room.roundsData.find((r) => r.roundNumber === roundNumber);
  const submittedCount = (roundData?.submissions || []).length;
  const playerCount = (room.players || []).length;

  if (playerCount > 0 && submittedCount >= playerCount) {
    const rt = getRuntime(roomCode);
    if (!rt.ending) {
      rt.ending = true;
      clearAllTimers(rt);
      try {
        await endRound(io, roomCode);
      } finally {
        rt.ending = false;
      }
    }
  }
}

async function syncLateJoiner(socket, room, userId) {
  if (!room.started || !room.currentRound || !room.letter) return;

  const roundEndTime = room.roundEndTime ? new Date(room.roundEndTime) : null;
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
    roundEndTime: roundEndTime ? roundEndTime.toISOString() : null,
    serverNow: Date.now(),
    hasSubmitted,
    endMode: room.endMode || "ALL_SUBMIT",
  });
}

module.exports = {
  startRound,
  endRound,
  checkAllSubmitted,
  syncLateJoiner,
};
