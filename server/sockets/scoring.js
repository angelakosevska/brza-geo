const { extractLetterWords, normalizeWord } = require("./utils");
const Category = require("../models/Category");
const ReviewWord = require("../models/ReviewWord"); // ✅ ново

/**
 * Score all submissions for one round.
 * @param {Object} round - The round object from the DB (includes submissions).
 * @param {Array} categories - Array of category IDs used this round.
 * @param {String} letter - The current round letter (uppercase).
 * @param {String} gameId - ID на тековната игра (за ReviewWord lookup).
 * @returns {Object} scores, details, answersByPlayer, noWordsByCategory
 */
async function scoreRound(round, categories, letter, gameId) {
  const categoryDocs = await Category.find({ _id: { $in: categories } })
    .select("words")
    .lean();
  const catMap = new Map(categoryDocs.map((c) => [String(c._id), c]));

  let reviewMap = new Map();
  if (gameId) {
    const reviewWords = await ReviewWord.find({
      gameId,
      roundNumber: round.roundNumber,
      status: "accepted",
    }).lean();

    for (const rw of reviewWords) {
      reviewMap.set(
        `${String(rw.submittedBy)}_${String(rw.category)}`,
        rw.word
      );
    }
  }

  const answersByCategory = {};
  const countsByCategory = {};
  const noWordsByCategory = {};

  for (const categoryId of categories) {
    const doc = catMap.get(String(categoryId));

    const dictWords = extractLetterWords(doc, letter);
    const dictSet = new Set(dictWords);

    if (dictSet.size === 0) {
      noWordsByCategory[categoryId] = true;
      answersByCategory[categoryId] = [];
      countsByCategory[categoryId] = {};
      continue;
    }

    noWordsByCategory[categoryId] = false;

    const answers = (round.submissions || []).map((submission) => {
      const raw = (submission.answers?.[categoryId] || "").trim();
      const normalized = normalizeWord(raw);
      const startsCorrect = !!raw && raw[0]?.toUpperCase() === letter;

      const isExact = startsCorrect && dictSet.has(normalized);

      return {
        player: String(submission.player),
        raw, // raw user input
        normalized, // lowercased/trimmed
        startsCorrect, // starts with the round letter?
        inDict: isExact, // valid word only if exact match
        isExact, // exact dictionary match
      };
    });

    answersByCategory[categoryId] = answers;

    const counts = {};
    for (const a of answers) {
      if (a.inDict) {
        counts[a.normalized] = (counts[a.normalized] || 0) + 1;
      }
    }
    countsByCategory[categoryId] = counts;
  }

  const scores = {};
  const details = {};
  const answersByPlayer = {};

  for (const submission of round.submissions || []) {
    const playerId = String(submission.player);
    let totalPoints = 0;
    details[playerId] = {};
    answersByPlayer[playerId] = submission.answers || {};

    for (const categoryId of categories) {
      if (noWordsByCategory[categoryId]) {
        details[playerId][categoryId] = {
          value: "",
          valid: true,
          unique: false,
          points: 0,
          reason: "no-words-for-letter",
        };
        continue;
      }

      const answer =
        (answersByCategory[categoryId] || []).find(
          (a) => a.player === playerId
        ) || {};
      const count = countsByCategory[categoryId][answer.normalized] || 0;

      const result = {
        value: answer.raw || "",
        valid: answer.inDict || false,
        unique: count === 1,
        points: 0,
        reason: "",
      };

      if (!answer.raw) {
        result.reason = "empty";
        result.valid = false;
        result.unique = false;
        result.points = 0;
      } else if (!answer.startsCorrect) {
        result.reason = "wrong-letter";
      } else if (!answer.inDict) {
        if (reviewMap.has(`${playerId}_${categoryId}`)) {
          result.reason = "review-accepted";
          result.valid = true;
          result.unique = false;
          result.points = 5;
          totalPoints += 5;
        } else {
          result.reason = "not-in-dictionary";
        }
      } else {
        // Valid dictionary word — assign points
        if (count === 1) {
          result.points = 10;
          result.unique = true;
        } else if (count === 2) {
          result.points = 4;
          result.unique = false;
        } else {
          result.points = 2;
          result.unique = false;
        }
        totalPoints += result.points;
      }

      details[playerId][categoryId] = result;
    }

    scores[playerId] = totalPoints;
  }

  return { scores, details, answersByPlayer, noWordsByCategory };
}

module.exports = { scoreRound };
