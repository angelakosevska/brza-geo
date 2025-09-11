const { distance } = require("fastest-levenshtein");
const { extractLetterWords, normalizeWord } = require("./utils");
const Category = require("../models/Category");

function isCloseMatch(word, dictSet) {
  for (const dictWord of dictSet) {
    if (distance(word, dictWord) === 1) return true;
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
      const isTypo =
        startsCorrect && !isExact && isCloseMatch(normalized, dictSet);

      return {
        player: String(submission.player),
        raw,
        normalized,
        startsCorrect,
        inDict: startsCorrect && (isExact || isTypo),
        isExact,
        isTypo,
      };
    });

    answersByCategory[categoryId] = answers;
    const counts = {};
    for (const a of answers) {
      if (a.inDict) counts[a.normalized] = (counts[a.normalized] || 0) + 1;
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

      if (!answer.raw) result.reason = "empty";
      else if (!answer.startsCorrect) result.reason = "wrong-letter";
      else if (!answer.inDict) result.reason = "not-in-dictionary";
      else {
        if (answer.isExact) {
          result.points = count === 1 ? 10 : count === 2 ? 4 : 2;
        } else if (answer.isTypo) {
          result.points = count === 1 ? 8 : count === 2 ? 3 : 1;
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
