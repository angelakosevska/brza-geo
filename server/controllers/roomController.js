const Room = require("../models/Room");
const crypto = require("crypto");
const { getIO } = require("../sockets/ioInstance");

exports.createRoom = async (req, res) => {
  try {
     console.log("👤 Authenticated user:", req.user);
    const { rounds = 3, timer = 120 } = req.body;
    const code = crypto.randomBytes(3).toString("hex").toUpperCase();

    const newRoom = new Room({
      code,
      host: req.user.userId,
      players: [req.user.userId],
      rounds,
      timer,
      started: false,
      currentRound: 0,
    });

    await newRoom.save();
    res.status(201).json({ message: "Собата е креирана!", room: newRoom });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Проблем на при креирање на соба." });
  }
};

exports.joinRoom = async (req, res) => {
  const { code } = req.body;

  try {
    const room = await Room.findOne({ code });
    if (!room) {
      return res.status(404).json({ message: "Собата не постои." });
    }

    const isAlreadyInRoom = room.players.some(
      (id) => id.toString() === req.user.userId
    );

    if (isAlreadyInRoom) {
      console.log("Already in room:", req.user.userId, "in room", code);
      return res.status(400).json({ message: "Веќе сте во собата." });
    }

    room.players.push(req.user.userId);
    await room.save();

    const io = getIO();
    io.to(code).emit("userJoined", { userId: req.user.userId });

    res.json({ message: "Успешно се приклучивте!", room });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Грешка при приклучување во соба." });
  }
};

exports.setCategories = async (req, res) => {
  const { code, categories } = req.body;
  if (!Array.isArray(categories) || categories.length === 0) {
    return res
      .status(400)
      .json({ message: "Мора да внесите барем три категории." });
  }

  try {
    const room = await Room.findOne({ code });
    if (!room) return res.status(404).json({ message: "Собата не постои." });

    if (room.host.toString() !== req.user.userId) {
      return res
        .status(403)
        .json({ message: "Само домаќинот може да ги постави категориите." });
    }

    room.categories = categories;
    await room.save();

    const io = getIO();
    io.to(code).emit("categoriesSet", { categories });

    res
      .status(200)
      .json({ message: "Категориите се успешно постаавени!", categories });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Грешка при поставување на категориите." });
  }
};

exports.getRoomInfo = async (req, res) => {
  try {
    const room = await Room.findOne({ code: req.params.code })
      .populate("players", "username")
      .populate("host", "username"); // 👈 Add this line

    if (!room) return res.status(404).json({ message: "Собата не постои." });

    res.json({ room });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Грешка при добивање на информации за собата." });
  }
};

exports.updateSettings = async (req, res) => {
  const { code, rounds, timer } = req.body;

  try {
    const room = await Room.findOne({ code });
    if (!room) return res.status(404).json({ message: "Собата не постои." });

    if (room.host.toString() !== req.user.userId) {
      return res
        .status(403)
        .json({ message: "Само домаќинот може да ги уредува поставките." });
    }

    if (room.started) {
      return res.status(400).json({
        message: "Не можете да ги менувате поставките откако играта е почната.",
      });
    }

    if (rounds !== undefined) room.rounds = rounds;
    if (timer !== undefined) room.timer = timer;

    await room.save();

    const io = getIO();
    io.to(code).emit("settingsUpdated", {
      rounds: room.rounds,
      timer: room.timer,
    });

    res.json({ message: "Поставките се ажурирани!", room });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Грешка при ажурирање на поставките." });
  }
};

exports.startGame = async (req, res) => {
  const { code } = req.body;

  try {
    const room = await Room.findOne({ code });
    if (!room) return res.status(404).json({ message: "Собата не постои." });

    if (room.host.toString() !== req.user.userId) {
      return res
        .status(403)
        .json({ message: "Само домаќинот може да ја стартува играта." });
    }

    if (room.started) {
      return res.status(400).json({ message: "Играта веќе е стартувана." });
    }

    const mkLetters = "АБВГДЃЕЖЗЅИЈКЛЉМНЊОПРСТЌУФХЦЧЏШ".split("");
    const randomLetter =
      mkLetters[Math.floor(Math.random() * mkLetters.length)];

    room.started = true;
    room.currentRound = 1;
    room.letter = randomLetter;

    await room.save();

    const io = getIO();
    io.to(code).emit("gameStarted", {
      letter: randomLetter,
      round: room.currentRound,
    });

    res.status(200).json({ message: "✅ Играта е стартувана!", room });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Грешка при стартување на играта." });
  }
};

exports.leaveRoom = async (req, res) => {
  const { code } = req.body;
  const io = getIO();

  try {
    const room = await Room.findOne({ code });
    if (!room) return res.status(404).json({ message: "Собата не постои." });

    room.players = room.players.filter(
      (id) => id.toString() !== req.user.userId
    );

    if (room.host.toString() === req.user.userId) {
      if (room.players.length > 0) {
        room.host = room.players[0];
      } else {
        await room.deleteOne();
        io.to(code).emit("roomDeleted", { message: "Собата е избришана." });

        return res.json({
          message: "Собата е избришана бидејќи сите излегоа.",
        });
      }
    }

    await room.save();
    io.to(code).emit("userLeft", { userId: req.user.userId });

    res.json({ message: "Успешно излеговте од собата." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Грешка при напуштање на собата." });
  }
};
