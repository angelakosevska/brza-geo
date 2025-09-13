const { distance } = require("fastest-levenshtein");
const { extractLetterWords, normalizeWord } = require("./utils");
const Category = require("../models/Category");

/**
 * Check if a word is within 1 character edit distance of any dictionary word.
 * (Levenshtein distance = 1 means one typo: add/remove/replace a single character)
 */
function isCloseMatch(word, dictSet) {
  for (const dictWord of dictSet) {
    if (distance(word, dictWord) === 1) return true;
  }
  return false;
}

/**
 * Score all submissions for one round.
 * @param {Object} round - The round object from the DB (includes submissions).
 * @param {Array} categories - Array of category IDs used this round.
 * @param {String} letter - The current round letter (uppercase).
 * @returns {Object} scores, details, answersByPlayer, noWordsByCategory
 */
async function scoreRound(round, categories, letter) {
  // Load dictionary words for all categories
  const categoryDocs = await Category.find({ _id: { $in: categories } })
    .select("words")
    .lean();
  const catMap = new Map(categoryDocs.map((c) => [String(c._id), c]));

  // Store per-category results
  const answersByCategory = {};   // answers for each category
  const countsByCategory = {};    // how many times each normalized word was used
  const noWordsByCategory = {};   // mark categories with no words for this letter

  // Process each category
  for (const categoryId of categories) {
    const doc = catMap.get(String(categoryId));

    // Get dictionary words that start with the current letter
    const dictWords = extractLetterWords(doc, letter);
    const dictSet = new Set(dictWords);

    // Case 1: no words exist for this letter in this category
    if (dictSet.size === 0) {
      noWordsByCategory[categoryId] = true;
      answersByCategory[categoryId] = [];
      countsByCategory[categoryId] = {};
      continue;
    }

    noWordsByCategory[categoryId] = false;

    // Map each player's submission in this category
    const answers = (round.submissions || []).map((submission) => {
      const raw = (submission.answers?.[categoryId] || "").trim();
      const normalized = normalizeWord(raw);
      const startsCorrect = !!raw && raw[0]?.toUpperCase() === letter;

      // Check if answer is exact or a close typo match
      const isExact = startsCorrect && dictSet.has(normalized);
      const isTypo =
        startsCorrect && !isExact && isCloseMatch(normalized, dictSet);

      return {
        player: String(submission.player),
        raw,                // raw user input
        normalized,         // lowercased/trimmed
        startsCorrect,      // starts with the round letter?
        inDict: startsCorrect && (isExact || isTypo), // valid word
        isExact,            // exact dictionary match
        isTypo,             // close typo (1 distance)
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

  // Final results
  const scores = {};           // total points per player
  const details = {};          // per-player, per-category explanation
  const answersByPlayer = {};  // raw answers for each player

  // Process each player's submission across all categories
  for (const submission of round.submissions || []) {
    const playerId = String(submission.player);
    let totalPoints = 0;
    details[playerId] = {};
    answersByPlayer[playerId] = submission.answers || {};

    for (const categoryId of categories) {
      // If no dictionary words exist for this category/letter
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

      // Determine why it scored the way it did
      if (!answer.raw) result.reason = "empty"; // no input
      else if (!answer.startsCorrect) result.reason = "wrong-letter"; // wrong starting letter
      else if (!answer.inDict) result.reason = "not-in-dictionary"; // not valid dictionary word
      else {
        // Valid word — award points depending on exact/typo & uniqueness
        if (answer.isExact) {
          if (count === 1) result.points = 10;  // unique exact word
          else if (count === 2) result.points = 4;  // duplicate exact word
          else result.points = 2;                   // 3+ players used it
        } else if (answer.isTypo) {
          if (count === 1) result.points = 8;   // unique typo match
          else if (count === 2) result.points = 3;
          else result.points = 1;
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
