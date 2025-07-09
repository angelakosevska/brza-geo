const Room = require("../models/Room");
const Submission = require("../models/Submission");
const User = require("../models/User");
const Word = require("../models/Word");
const { getIO } = require("../sockets/ioInstance");
const io = getIO();


exports.submitAnswers = async (req, res) => {
  try {
    const { code } = req.params;
    const { words } = req.body;

    const room = await Room.findOne({ code });
    if (!room) return res.status(404).json({ message: "Собата не постои." });

    const currentRound = room.currentRound;
    const letter = room.letter.toUpperCase();

    const existing = await Submission.findOne({
      room: room._id,
      user: req.user.userId,
      round: currentRound,
    });
    if (existing) {
      return res.status(400).json({ message: "Веќе сте поднеле одговори за оваа рунда." });
    }

    const categories = room.categories;
    const invalidEntries = [];

    for (const category of categories) {
      const answer = (words[category] || "").trim();
      if (!answer) {
        const validWords = await Word.find({
          category,
          word: { $regex: `^${letter}`, $options: "i" },
        });
        if (validWords.length > 0) {
          invalidEntries.push({
            category,
            reason: `Мора да внесете збор за категоријата "${category}".`,
          });
        }
        continue;
      }

      if (!answer.toUpperCase().startsWith(letter)) {
        invalidEntries.push({
          category,
          reason: `Зборот "${answer}" не почнува со буквата "${letter}".`,
        });
        continue;
      }

      const validWord = await Word.findOne({
        category,
        word: { $regex: `^${answer}$`, $options: "i" },
      });

      if (!validWord) {
        invalidEntries.push({
          category,
          reason: `Зборот "${answer}" не е валиден за категоријата "${category}".`,
        });
      }
    }

    if (invalidEntries.length > 0) {
      return res.status(400).json({
        message: "Некои одговори не се валидни.",
        errors: invalidEntries,
      });
    }

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

    res.status(201).json({ message: "Одговорите се успешно зачувани!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Грешка при поднесување на одговорите." });
  }
};

exports.getRoundResults = async (req, res) => {
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
      sub.save(); // Optional: persist score

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
    res.status(500).json({ message: "Грешка при прикажување резултати." });
  }
};
