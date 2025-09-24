const { extractLetterWords, normalizeWord } = require("./utils");
const Category = require("../models/Category");

/**
 * Score all submissions for one round.
 * @param {Object} round - The round object from the DB (includes submissions).
 * @param {Array} categories - Array of category IDs used this round.
 * @param {String} letter - The current round letter (uppercase).
 * @returns {Object} scores, details, answersByPlayer, noWordsByCategory
 */
async function scoreRound(round, categories, letter) {
  // Load dictionary words for all categories in this round
  const categoryDocs = await Category.find({ _id: { $in: categories } })
    .select("words")
    .lean();
  const catMap = new Map(categoryDocs.map((c) => [String(c._id), c]));

  // Containers for results
  const answersByCategory = {}; // all player answers by category
  const countsByCategory = {}; // how many times each word was used
  const noWordsByCategory = {}; // categories that have no words for this letter

  // Process each category
  for (const categoryId of categories) {
    const doc = catMap.get(String(categoryId));

    // Extract dictionary words starting with the current letter
    const dictWords = extractLetterWords(doc, letter);
    const dictSet = new Set(dictWords);

    // Case: no dictionary words exist for this letter
    if (dictSet.size === 0) {
      noWordsByCategory[categoryId] = true;
      answersByCategory[categoryId] = [];
      countsByCategory[categoryId] = {};
      continue;
    }

    noWordsByCategory[categoryId] = false;

    // Map each player's submission for this category
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

    // Count frequency of each valid normalized word
    const counts = {};
    for (const a of answers) {
      if (a.inDict) {
        counts[a.normalized] = (counts[a.normalized] || 0) + 1;
      }
    }
    countsByCategory[categoryId] = counts;
  }

  // Final results containers
  const scores = {}; // total points per player
  const details = {}; // per-player, per-category breakdown
  const answersByPlayer = {}; // raw answers by player

  // Evaluate each player's submissions
  for (const submission of round.submissions || []) {
    const playerId = String(submission.player);
    let totalPoints = 0;
    details[playerId] = {};
    answersByPlayer[playerId] = submission.answers || {};

    for (const categoryId of categories) {
      // Case: no words exist for this category/letter
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

      // Find this player’s answer in this category
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

      // Scoring rules
      // if (!answer.raw) {
      //   result.reason = "empty"; // no input
      // } else if (!answer.startsCorrect) {
      //   result.reason = "wrong-letter"; // wrong starting letter
      // } else if (!answer.inDict) {
      //   result.reason = "not-in-dictionary"; // not found in dictionary
      // } else {
      //   // Valid dictionary word — assign points based on uniqueness
      //   if (count === 1) result.points = 10;   // unique exact word
      //   else if (count === 2) result.points = 4; // used by 2 players
      //   else result.points = 2;                  // used by 3+ players
      //   totalPoints += result.points;
      // }
      if (!answer.raw) {
        result.reason = "empty"; // no input
        result.valid = false;
        result.unique = false;
        result.points = 0;
      } else if (!answer.startsCorrect) {
        result.reason = "wrong-letter";
      } else if (!answer.inDict) {
        result.reason = "not-in-dictionary";
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
