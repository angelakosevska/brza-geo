const Room = require("../models/Room");
const Submission = require("../models/Submission");
const User = require("../models/User");
const Category = require("../models/Category");
const { getIO } = require("../sockets/ioInstance");
const io = getIO();

/**
 * Handle player submitting answers for current round
 */
exports.submitAnswers = async (req, res) => {
  try {
    const { code } = req.params;
    const { words } = req.body;

    // Populate categories so we can access .words arrays
    const room = await Room.findOne({ code }).populate("categories");
    if (!room) return res.status(404).json({ message: res.__("room_not_found") });

    const currentRound = room.currentRound;
    const letter = room.letter.toUpperCase();

    // Prevent duplicate submissions
    const existing = await Submission.findOne({
      room: room._id,
      user: req.user.userId,
      round: currentRound,
    });
    if (existing) {
      return res.status(400).json({ message: res.__("already_submitted") });
    }

    const invalidEntries = [];

    for (const cat of room.categories) {
      const categoryId = cat._id.toString();
      const displayName = cat.displayName?.mk || cat.name;
      const answer = (words[categoryId] || "").trim();

      // Empty answer → check if dictionary had valid words
      if (!answer) {
        const hasMatching = cat.words.some(w =>
          w.toUpperCase().startsWith(letter)
        );
        if (hasMatching) {
          invalidEntries.push({
            category: displayName,
            reason: res.__("must_enter_word", { category: displayName }),
          });
        }
        continue;
      }

      // Wrong starting letter
      if (!answer.toUpperCase().startsWith(letter)) {
        invalidEntries.push({
          category: displayName,
          reason: res.__("wrong_start_letter", { answer, letter }),
        });
        continue;
      }

      // Not in dictionary
      const isValid = cat.words.some(
        w => w.toLowerCase() === answer.toLowerCase()
      );
      if (!isValid) {
        invalidEntries.push({
          category: displayName,
          reason: res.__("invalid_word", { answer, category: displayName }),
        });
      }
    }

    if (invalidEntries.length > 0) {
      return res.status(400).json({
        message: res.__("some_invalid_answers"),
        errors: invalidEntries,
      });
    }

    // Save submission
    const submission = new Submission({
      room: room._id,
      user: req.user.userId,
      round: currentRound,
      letter,
      words,
    });

    await submission.save();

    const user = await User.findById(req.user.userId);
    io.to(code).emit("playerSubmittedUpdate", { username: user.username });

    res.status(201).json({ message: res.__("answers_saved") });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: res.__("submit_error") });
  }
};

/**
 * Get results for current round
 */
exports.getRoundResults = async (req, res) => {
  try {
    const { code } = req.params;

    const room = await Room.findOne({ code });
    if (!room) return res.status(404).json({ message: res.__("room_not_found") });

    const submissions = await Submission.find({
      room: room._id,
      round: room.currentRound,
    }).populate("user", "username");

    // Count how many times each word was used per category
    const categoryWordMap = {};
    submissions.forEach((sub) => {
      Object.entries(sub.words).forEach(([category, word]) => {
        const wordKey = word.trim().toLowerCase();
        if (!categoryWordMap[category]) categoryWordMap[category] = {};
        categoryWordMap[category][wordKey] =
          (categoryWordMap[category][wordKey] || 0) + 1;
      });
    });

    // Score submissions
    const scoredSubmissions = submissions.map((sub) => {
      let score = 0;
      const scoredWords = {};

      Object.entries(sub.words).forEach(([category, word]) => {
        const wordKey = word.trim().toLowerCase();
        const count = categoryWordMap[category][wordKey];

        let wordScore = 0;
        if (!word) {
          wordScore = 0;
        } else if (count === 1) {
          wordScore = 10;
        } else {
          wordScore = 5;
        }

        score += wordScore;
        scoredWords[category] = { word, points: wordScore };
      });

      sub.score = score;
      sub.save(); // optional persistence

      return {
        user: sub.user.username,
        words: scoredWords,
        total: score,
      };
    });

    io.to(code).emit("roundResults", {
      round: room.currentRound,
      results: scoredSubmissions,
    });

    res.json({
      round: room.currentRound,
      results: scoredSubmissions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: res.__("results_error") });
  }
};
