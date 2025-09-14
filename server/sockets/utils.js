const Room = require("../models/Room");
const Category = require("../models/Category");

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

const extractLetterWords = (doc, letter) => {
  const upperLetter = (letter || "").toUpperCase();
  const words = doc?.words;
  let rawWords = [];

  if (!words) rawWords = [];
  else if (Array.isArray(words)) rawWords = words;
  else if (Array.isArray(words[upperLetter])) rawWords = words[upperLetter];
  else if (Array.isArray(words.mk)) rawWords = words.mk;
  else {
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

const fetchCategoryMeta = async (categoryIds) => {
  if (!categoryIds.length) return [];
  try {
    const categories = await Category.find({ _id: { $in: categoryIds } })
      .select("name validLetters")
      .lean();

    return categories.map((cat) => ({
      id: String(cat._id),
      name: cat.name || String(cat._id),
      validLetters: cat.validLetters || [],
    }));
  } catch {
    return categoryIds.map((id) => ({
      id: String(id),
      name: String(id),
      validLetters: [],
    }));
  }
};


module.exports = {
  computeFinalScores,
  stringifyId,
  normalizeWord,
  extractLetterWords,
  bumpActivity,
  fetchCategoryMeta,
};
