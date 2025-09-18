const generateUniqueRoomCode = require("../utils/generateUniqueRoomCode");
const Room = require("../models/Room");
const { getIO } = require("../sockets/ioInstance");

// Utility: normalize hostId (whether it's ObjectId or populated object)
const getHostId = (host) => (host?._id ? host._id.toString() : host.toString());

/**
 * Create a new room
 */
exports.createRoom = async (req, res) => {
  try {
    const hostId = req.user.userId;
    let code;
    let exists = true;

    // Ensure the room code is unique
    while (exists) {
      code = generateUniqueRoomCode().toUpperCase();
      exists = await Room.exists({ code });
    }

    // Create the room with default settings
    const room = await Room.create({
      code,
      host: hostId,
      players: [hostId],
      rounds: 5,
      timer: 60,
      endMode: "ALL_SUBMIT",
      categories: [],
    });

    // Fetch the full room object with populated fields
    const populatedRoom = await Room.findById(room._id)
      .populate("players")
      .populate("host")
      .populate("categories");

    res.json({ room: populatedRoom });
  } catch (err) {
    console.error("❌ Error creating room:", err);
    res.status(500).json({ message: "Failed to create room." });
  }
};

/**
 * Join an existing room
 */
exports.joinRoom = async (req, res) => {
  const { code } = req.body;
  try {
    const userId = req.user.userId;
    let room = await Room.findOne({ code: code.toUpperCase() });
    if (!room) return res.status(404).json({ message: "Room not found." });

    // Add user if not already in room
    if (!room.players.some((id) => id.toString() === userId)) {
      room.players.push(userId);
      await room.save();
    }

    // Re-fetch with all populated fields
    room = await Room.findOne({ code: code.toUpperCase() })
      .populate("players")
      .populate("host")
      .populate("categories");

    const io = getIO();
    io.to(code.toUpperCase()).emit("roomUpdated", { room });
    res.json({ room });
  } catch (err) {
    console.error("❌ Error joining room:", err);
    res.status(500).json({ message: "Failed to join room." });
  }
};

/**
 * Leave a room
 */
exports.leaveRoom = async (req, res) => {
  const { code } = req.body;
  try {
    const userId = req.user.userId;

    let room = await Room.findOne({ code });
    if (!room) return res.status(404).json({ message: "Room not found." });

    // Remove player from room
    room.players = room.players.filter((id) => id.toString() !== userId);

    // If host leaves → transfer to next player or null
    if (room.host.toString() === userId) {
      room.host = room.players.length > 0 ? room.players[0] : null;
    }

    await room.save();

    // Re-fetch with full populate
    room = await Room.findOne({ code })
      .populate("players")
      .populate("host")
      .populate("categories");

    const io = getIO();
    io.to(code).emit("roomUpdated", { room });

    res.json({ message: "Successfully left the room.", room });
    console.log("👋 Player left room:", { code, userId });
  } catch (err) {
    console.error("❌ Error leaving room:", err);
    res.status(500).json({ message: "Failed to leave room." });
  }
};

/**
 * Get room details
 */
exports.getRoom = async (req, res) => {
  const { code } = req.params;
  try {
    const room = await Room.findOne({ code })
      .populate("players")
      .populate("host")
      .populate("categories");

    if (!room) return res.status(404).json({ message: "Room not found." });
    res.json({ room });
  } catch (err) {
    console.error("❌ Error fetching room:", err);
    res.status(500).json({ message: "Failed to load room." });
  }
};

/**
 * Update room settings (host only)
 */
exports.updateSettings = async (req, res) => {
  const { code, rounds, timer, endMode } = req.body;
  try {
    const roomCode = code.toUpperCase();
    let room = await Room.findOne({ code: roomCode })
      .populate("players")
      .populate("host");

    if (!room) return res.status(404).json({ message: "Room not found." });

    // Check host permission
    const hostId = getHostId(room.host);
    if (hostId !== req.user.userId) {
      return res.status(403).json({ message: "Only the host can update settings." });
    }

    // Apply updates
    room.rounds = Math.max(1, Number(rounds || 5));
    room.timer = Math.max(3, Number(timer || 60));
    room.endMode = endMode === "PLAYER_STOP" ? "PLAYER_STOP" : "ALL_SUBMIT";
    await room.save();

    // Re-fetch with categories
    room = await Room.findOne({ code: roomCode })
      .populate("players")
      .populate("host")
      .populate("categories");

    const io = getIO();
    io.to(roomCode).emit("roomUpdated", { room });

    res.json({ room });
  } catch (err) {
    console.error("❌ Error updating settings:", err);
    res.status(500).json({ message: "Failed to update settings." });
  }
};

/**
 * Update room categories (host only)
 */
exports.updateCategories = async (req, res) => {
  const { code, categories } = req.body;
  try {
    const roomCode = code.toUpperCase();
    let room = await Room.findOne({ code: roomCode })
      .populate("players")
      .populate("host");

    if (!room) return res.status(404).json({ message: "Room not found." });

    // Check host permission
    const hostId = getHostId(room.host);
    if (hostId !== req.user.userId) {
      return res.status(403).json({ message: "Only the host can update categories." });
    }

    // Save new categories (array of ObjectIds)
    room.categories = categories;
    await room.save();

    // Re-fetch with category objects
    room = await Room.findOne({ code: roomCode })
      .populate("players")
      .populate("host")
      .populate("categories");

    const io = getIO();
    io.to(roomCode).emit("roomUpdated", { room });

    res.json({ room });
  } catch (err) {
    console.error("❌ Error updating categories:", err);
    res.status(500).json({ message: "Failed to update categories." });
  }
};
