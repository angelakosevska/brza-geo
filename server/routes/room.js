const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const Room = require("../models/Room");
const crypto = require("crypto");

// POST /api/rooms/create
router.post("/create", verifyToken, async (req, res) => {
  try {
    const { rounds, timer } = req.body;

    // Generate a random 6-character room code
    const code = crypto.randomBytes(3).toString("hex").toUpperCase();

    const newRoom = new Room({
      code,
      host: req.user.userId,
      players: [req.user.userId],
      rounds,
      timer,
    });

    await newRoom.save();
    res.status(201).json({ message: "Собата е креирана!", room: newRoom });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Проблем на при креирање на соба." });
  }
});

// POST /api/rooms/join
router.post("/join", verifyToken, async (req, res) => {
  const { code } = req.body;

  try {
    const room = await Room.findOne({ code });
    if (!room) return res.status(404).json({ message: "Собата не постои." });

    if (room.players.includes(req.user.userId))
      return res.status(400).json({ message: "Веќе сте во собата." });

    room.players.push(req.user.userId);
    await room.save();

    res.json({ message: "Успешно се приклучивте!", room });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Грешка при приклучување во соба." });
  }
});

// POST /api/rooms/start
router.post("/start", verifyToken, async (req, res) => {
  const { code } = req.body;

  try {
    const room = await Room.findOne({ code });
    if (!room) return res.status(404).json({ message: "Собата не постои." });

    // Only the host can start the game
    if (room.host.toString() !== req.user.userId) {
      return res
        .status(403)
        .json({ message: "Само домаќинот може да ја стартува играта." });
    }

    // Check if already started
    if (room.started) {
      return res.status(400).json({ message: "Играта веќе е стартувана." });
    }

    // Generate random letter (rn in maceodnian)
    const mkLetters = "АБВГДЃЕЖЗЅИЈКЛЉМНЊОПРСТЌУФХЦЧЏШ".split("");
    const randomLetter =
      mkLetters[Math.floor(Math.random() * mkLetters.length)]; //can it be different???

    //Start game
    room.started = true;
    room.currentRound = 1;
    room.letter = randomLetter;

    await room.save();

    res.status(200).json({ message: "✅ Играта е стартувана!", room });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Грешка при стартување на играта." });
  }
});

// POST /api/rooms/set-categories
router.post('/set-categories', verifyToken, async (req, res) => {
  const { code, categories } = req.body;

  if (!Array.isArray(categories) || categories.length === 0) {
    return res.status(400).json({ message: 'Мора да внесите барем три категории.' });
  }

  try {
    const room = await Room.findOne({ code });
    if (!room) return res.status(404).json({ message: 'Собата не постои.' });

    // Only host can set categories
    if (room.host.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Само домаќинот може да ги постави категориите.' });
    }

    room.categories = categories;
    await room.save();

    res.status(200).json({ message: 'Категориите се успешно постаавени!', categories });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Грешка при поставување на категориите.' });
  }
});


module.exports = router;
