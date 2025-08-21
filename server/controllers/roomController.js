const generateUniqueRoomCode = require("../utils/generateUniqueRoomCode");
const Room = require("../models/Room");
const User = require("../models/User");
const { getIO } = require("../sockets/ioInstance");
exports.createRoom = async (req, res) => {
  try {
    const hostId = req.user.userId;
    let code;
    let exists = true;
    // Keep generating until you get a unique code
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
      categories: [],
    });

    res.json({ room });
  } catch (err) {
    console.error("Error creating room:", err);
    res.status(500).json({ message: "Error creating room" });
  }
};

// JOIN a room (player or host)
exports.joinRoom = async (req, res) => {
  const { code } = req.body;
  try {
    const userId = req.user.userId;
    console.log("JOIN attempt:", { code, userId });
    let room = await Room.findOne({ code: code.toUpperCase() }); // force uppercase here
    if (!room) {
      console.log("Room not found:", code);
      return res.status(404).json({ message: "Room not found" });
    }
    if (!room.players.some((id) => id.toString() === userId)) {
      room.players.push(userId);
      await room.save();
      console.log("User added to room:", userId);
    } else {
      console.log("User already in room:", userId);
    }
    room = await Room.findOne({ code: code.toUpperCase() })
      .populate("players")
      .populate("host");
    const io = getIO();
    io.to(code.toUpperCase()).emit("roomUpdated", { room });
    res.json({ room });
  } catch (err) {
    console.error("Error joining room:", err);
    res.status(500).json({ message: "Error joining room" });
  }
};

// LEAVE a room (player)
exports.leaveRoom = async (req, res) => {
  const { code } = req.body;
  try {
    const userId = req.user.userId;

    let room = await Room.findOne({ code });
    if (!room) return res.status(404).json({ message: "Room not found" });

    room.players = room.players.filter((id) => id.toString() !== userId);
    await room.save();

    room = await Room.findOne({ code }).populate("players").populate("host");

    const io = getIO();
    io.to(code).emit("roomUpdated", { room });

    res.json({ message: "Left room", room });
    console.log("Left room:", { code, userId });
  } catch (err) {
    res.status(500).json({ message: "Error leaving room" });
  }
};

// GET current room info (for reconnect, page reload, etc)
exports.getRoom = async (req, res) => {
  const { code } = req.params;
  try {
    const room = await Room.findOne({ code })
      .populate("players")
      .populate("host");
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json({ room });
  } catch (err) {
    res.status(500).json({ message: "Error fetching room" });
  }
};

// UPDATE room settings (host only: rounds, timer)
exports.updateSettings = async (req, res) => {
  const { code, rounds, timer } = req.body;
  try {
    const roomCode = code.toUpperCase();
    let room = await Room.findOneAndUpdate(
      { code: roomCode },
      { rounds, timer },
      { new: true }
    )
      .populate("players")
      .populate("host");

    const io = getIO();
    console.log("Emitting roomUpdated to:", roomCode);
    io.to(roomCode).emit("roomUpdated", { room });

    res.json({ room });
  } catch (err) {
    res.status(500).json({ message: "Error updating settings" });
  }
};

// UPDATE categories (host only)
exports.updateCategories = async (req, res) => {
  const { code, categories } = req.body;
  try {
    const roomCode = code.toUpperCase();
    let room = await Room.findOneAndUpdate(
      { code: roomCode },
      { categories },
      { new: true }
    )
      .populate("players")
      .populate("host");

    const io = getIO();
    console.log("Emitting roomUpdated to:", roomCode);
    io.to(roomCode).emit("roomUpdated", { room });

    res.json({ room });
  } catch (err) {
    res.status(500).json({ message: "Error updating categories" });
  }
};

// You may want more controllers for game start, scoring, etc.
