const generateUniqueRoomCode = require("../utils/generateUniqueRoomCode");
const Room = require("../models/Room");
const { getIO } = require("../sockets/ioInstance");

// Utility: извлечи hostId без разлика дали е ObjectId или популиран објект
const getHostId = (host) => (host?._id ? host._id.toString() : host.toString());

// Креирање нова соба
exports.createRoom = async (req, res) => {
  try {
    const hostId = req.user.userId;
    let code;
    let exists = true;

    while (exists) {
      code = generateUniqueRoomCode().toUpperCase();
      exists = await Room.exists({ code });
    }

    const room = await Room.create({
      code,
      host: hostId,
      players: [hostId],
      rounds: 5,
      timer: 60,
      endMode: "ALL_SUBMIT",
      categories: [],
    });

    res.json({ room });
  } catch (err) {
    console.error("❌ Грешка при креирање соба:", err);
    res.status(500).json({ message: "Грешка при креирање на собата." });
  }
};

// Приклучување во соба
exports.joinRoom = async (req, res) => {
  const { code } = req.body;
  try {
    const userId = req.user.userId;
    let room = await Room.findOne({ code: code.toUpperCase() });
    if (!room) {
      return res.status(404).json({ message: "Собата не е пронајдена." });
    }

    if (!room.players.some((id) => id.toString() === userId)) {
      room.players.push(userId);
      await room.save();
    }

    room = await Room.findOne({ code: code.toUpperCase() })
      .populate("players")
      .populate("host");

    const io = getIO();
    io.to(code.toUpperCase()).emit("roomUpdated", { room });
    res.json({ room });
  } catch (err) {
    console.error("❌ Грешка при приклучување:", err);
    res.status(500).json({ message: "Грешка при приклучување во собата." });
  }
};

// Напуштање на соба
exports.leaveRoom = async (req, res) => {
  const { code } = req.body;
  try {
    const userId = req.user.userId;

    let room = await Room.findOne({ code });
    if (!room)
      return res.status(404).json({ message: "Собата не е пронајдена." });

    // Избриши го играчот од листата
    room.players = room.players.filter((id) => id.toString() !== userId);

    // Ако хостот ја напушта собата → префрли на следниот играч
    if (room.host.toString() === userId) {
      if (room.players.length > 0) {
        room.host = room.players[0]; // првиот играч станува нов хост
      } else {
        room.host = null; // нема играчи → нема хост
      }
    }

    await room.save();

    room = await Room.findOne({ code }).populate("players").populate("host");

    const io = getIO();
    io.to(code).emit("roomUpdated", { room });

    res.json({ message: "Успешно ја напуштивте собата.", room });
    console.log("👋 Играч излезе од соба:", { code, userId });
  } catch (err) {
    console.error("❌ Грешка при напуштање соба:", err);
    res.status(500).json({ message: "Грешка при напуштање на собата." });
  }
};

// Земaње информации за собата
exports.getRoom = async (req, res) => {
  const { code } = req.params;
  try {
    const room = await Room.findOne({ code })
      .populate("players")
      .populate("host");
    if (!room)
      return res.status(404).json({ message: "Собата не е пронајдена." });
    res.json({ room });
  } catch (err) {
    console.error("❌ Грешка при земање соба:", err);
    res.status(500).json({ message: "Грешка при вчитување на собата." });
  }
};

// Ажурирање на подесувања (само хост)
exports.updateSettings = async (req, res) => {
  const { code, rounds, timer, endMode } = req.body;
  try {
    const roomCode = code.toUpperCase();
    let room = await Room.findOne({ code: roomCode })
      .populate("players")
      .populate("host");

    if (!room)
      return res.status(404).json({ message: "Собата не е пронајдена." });

    const hostId = getHostId(room.host);
    if (hostId !== req.user.userId) {
      return res
        .status(403)
        .json({ message: "Само хостот може да ги ажурира подесувањата." });
    }

    room.rounds = Math.max(1, Number(rounds || 5));
    room.timer = Math.max(3, Number(timer || 60));
    room.endMode = endMode === "PLAYER_STOP" ? "PLAYER_STOP" : "ALL_SUBMIT";
    await room.save();

    const io = getIO();
    io.to(roomCode).emit("roomUpdated", { room });

    res.json({ room });
  } catch (err) {
    console.error("❌ Грешка при ажурирање подесувања:", err);
    res.status(500).json({ message: "Грешка при ажурирање на подесувањата." });
  }
};

// Ажурирање на категории (само хост)
exports.updateCategories = async (req, res) => {
  const { code, categories } = req.body;
  try {
    const roomCode = code.toUpperCase();
    let room = await Room.findOne({ code: roomCode })
      .populate("players")
      .populate("host");

    if (!room)
      return res.status(404).json({ message: "Собата не е пронајдена." });

    const hostId = getHostId(room.host);
    if (hostId !== req.user.userId) {
      return res
        .status(403)
        .json({ message: "Само хостот може да ги ажурира категориите." });
    }

    room.categories = categories;
    await room.save();

    const io = getIO();
    io.to(roomCode).emit("roomUpdated", { room });

    res.json({ room });
  } catch (err) {
    console.error("❌ Грешка при ажурирање категории:", err);
    res.status(500).json({ message: "Грешка при ажурирање на категориите." });
  }
};
