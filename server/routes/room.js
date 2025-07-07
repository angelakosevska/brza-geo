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
      started: false,
      currentRound:0,
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

//GET /info/:code

router.get("/info/:code", verifyToken, async (req, res) => {
  try {
    const room = await Room.findOne({ code: req.params.code }).populate("players", "username"); // optional: show names
    if (!room) return res.status(404).json({ message: "Собата не постои." });

    res.json({ room });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Грешка при добивање на информации за собата." });
  }
});

//PATCH /update-settings
router.patch("/update-settings", verifyToken, async (req, res) => {
  const { code, rounds, timer } = req.body;

  try {
    const room = await Room.findOne({ code });
    if (!room) return res.status(404).json({ message: "Собата не постои." });

    if (room.host.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Само домаќинот може да ги уредува поставките." });
    }

    if (room.started) {
      return res.status(400).json({ message: "Не можете да ги менувате поставките откако играта е почната." });
    }

    if (rounds !== undefined) room.rounds = rounds;
    if (timer !== undefined) room.timer = timer;

    await room.save();
    res.json({ message: "Поставките се ажурирани!", room });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Грешка при ажурирање на поставките." });
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


//POST /leave
router.post("/leave", verifyToken, async (req, res) => {
  const { code } = req.body;

  try {
    const room = await Room.findOne({ code });
    if (!room) return res.status(404).json({ message: "Собата не постои." });

    room.players = room.players.filter(
      (id) => id.toString() !== req.user.userId
    );

    // Optional: if host leaves, assign new host
    if (room.host.toString() === req.user.userId) {
      if (room.players.length > 0) {
        room.host = room.players[0]; // assign new host
      } else {
        await room.deleteOne(); // if no one left, delete room
        return res.json({ message: "Собата е избришана бидејќи сите излегоа." });
      }
    }

    await room.save();
    res.json({ message: "Успешно излеговте од собата." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Грешка при напуштање на собата." });
  }
});



module.exports = router;
