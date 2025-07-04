const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const Room = require("../models/Room");
const Submission = require("../models/Submission");
const User = require("../models/User");

// POST /api/game/submit/:code
router.post("/submit/:code", verifyToken, async (req, res) => {
  try {
    const { code } = req.params;
    const { words } = req.body;

    const room = await Room.findOne({ code });
    if (!room) return res.status(404).json({ message: "Собата не постои." });

    const currentRound = room.currentRound;
    const letter = room.letter;

    // Check if already submitted
    const existing = await Submission.findOne({
      room: room._id,
      user: req.user.userId,
      round: currentRound,
    });

    if (existing) {
      return res
        .status(400)
        .json({ message: "Веќе сте поднеле одговори за оваа рунда." });
    }

    const submission = new Submission({
      room: room._id,
      user: req.user.userId,
      round: currentRound,
      letter,
      words,
    });

    await submission.save();
    res.status(201).json({ message: "Одговорите се успешно зачувани!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Грешка при поднесување на одговорите." });
  }
});

// GET /api/game/results/:code
router.get("/results/:code", verifyToken, async (req, res) => {
  try {
    const { code } = req.params;

    const room = await Room.findOne({ code });
    if (!room) return res.status(404).json({ message: "Собата не постои." });

    const submissions = await Submission.find({
      room: room._id,
      round: room.currentRound,
    }).populate("user", "username");

    const categoryWordMap = {};
    submissions.forEach((sub) => {
      Object.entries(sub.words).forEach(([category, word]) => {
        const wordKey = word.trim().toLowerCase();
        if (!categoryWordMap[category]) categoryWordMap[category] = {};
        categoryWordMap[category][wordKey] =
          (categoryWordMap[category][wordKey] || 0) + 1;
      });
    });

    // Assign points
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
      sub.save(); // optional: persist score

      return {
        user: sub.user.username,
        words: scoredWords,
        total: score,
      };
    });

    res.json({
      round: room.currentRound,
      results: scoredSubmissions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Грешка при прикажување резултати." });
  }
});

module.exports = router;
