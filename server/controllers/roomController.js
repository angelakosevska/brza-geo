const generateUniqueRoomCode = require("../utils/generateUniqueRoomCode");
const Room = require("../models/Room");
const { getIO } = require("../sockets/ioInstance");

// Utility: extract hostId consistently (ObjectId vs populated object)
const getHostId = (host) => (host?._id ? host._id.toString() : host.toString());

/**
 * Create a new room from Main page
 */
exports.createRoom = async (req, res) => {
  try {
    const hostId = req.user.id;
    let code;
    let exists = true;

    // Loop until unique code
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

    const populatedRoom = await Room.findById(room._id)
      .populate("players")
      .populate("host")
      .populate("categories");

    res.json({ room: populatedRoom });
  } catch (err) {
    console.error("❌ Error creating room:", err);
    res.status(500).json({ message: res.__("failed_create_room") });
  }
};

/**
 * Join an existing room from Main Page
 */
exports.joinRoom = async (req, res) => {
  const { code } = req.body;
  try {
    const userId = req.user.id;
    let room = await Room.findOne({ code: code.toUpperCase() });
    if (!room)
      return res.status(404).json({ message: res.__("room_not_found") });

    if (!room.players.some((id) => id.toString() === userId)) {
      room.players.push(userId);
      await room.save();
    }

    room = await Room.findOne({ code: code.toUpperCase() })
      .populate("players")
      .populate("host")
      .populate("categories");

    const io = getIO();
    io.to(code.toUpperCase()).emit("roomUpdated", { room });
    res.json({ room });
  } catch (err) {
    console.error("❌ Error joining room:", err);
    res.status(500).json({ message: res.__("failed_join_room") });
  }
};


exports.leaveRoom = async (req, res) => {
  const { code } = req.params; // 👈 земи од URL params
  try {
    const userId = req.user.id;

    let room = await Room.findOne({ code });
    if (!room) {
      return res.status(404).json({ message: res.__("room_not_found") });
    }

    // тргни го играчот од листата
    room.players = room.players.filter((id) => id.toString() !== userId);

    // ако бил host → пренеси хостирањето на првиот преостанат или null
    if (room.host?.toString() === userId) {
      room.host = room.players.length > 0 ? room.players[0] : null;
    }

    await room.save();

    // репопулирај за ажуриран state
    room = await Room.findOne({ code })
      .populate("players")
      .populate("host")
      .populate("categories");

    // емитирај на сите клиенти во таа соба дека е апдејтната
    const io = getIO();
    io.to(code).emit("roomUpdated", { room });

    res.json({ message: res.__("left_room_success"), room });
    console.log("👋 Player left room:", { code, userId });
  } catch (err) {
    console.error("❌ Error leaving room:", err);
    res.status(500).json({ message: res.__("failed_leave_room") });
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

    if (!room)
      return res.status(404).json({ message: res.__("room_not_found") });
    res.json({ room });
  } catch (err) {
    console.error("❌ Error fetching room:", err);
    res.status(500).json({ message: res.__("failed_load_room") });
  }
};

/**
 * Update settings (host only)
 */
exports.updateSettings = async (req, res) => {
  const { code, rounds, timer, endMode } = req.body;
  try {
    const roomCode = code.toUpperCase();
    let room = await Room.findOne({ code: roomCode })
      .populate("players")
      .populate("host");

    if (!room)
      return res.status(404).json({ message: res.__("room_not_found") });

    const hostId = getHostId(room.host);
    if (hostId !== req.user.id) {
      return res.status(403).json({ message: res.__("only_host_update") });
    }

    room.rounds = Math.max(1, Number(rounds || 5));
    room.timer = Math.max(3, Number(timer || 60));
    room.endMode = endMode === "PLAYER_STOP" ? "PLAYER_STOP" : "ALL_SUBMIT";
    await room.save();

    room = await Room.findOne({ code: roomCode })
      .populate("players")
      .populate("host")
      .populate("categories");

    const io = getIO();
    io.to(roomCode).emit("roomUpdated", { room });

    res.json({ room });
  } catch (err) {
    console.error("❌ Error updating settings:", err);
    res.status(500).json({ message: res.__("failed_update_settings") });
  }
};

/**
 * Update categories (host only)
 */
exports.updateCategories = async (req, res) => {
  const { code, categories } = req.body;
  try {
    const roomCode = code.toUpperCase();
    let room = await Room.findOne({ code: roomCode })
      .populate("players")
      .populate("host");

    if (!room)
      return res.status(404).json({ message: res.__("room_not_found") });

    const hostId = getHostId(room.host);
    if (hostId !== req.user.id) {
      return res.status(403).json({ message: res.__("only_host_update") });
    }

    room.categories = categories;
    await room.save();

    room = await Room.findOne({ code: roomCode })
      .populate("players")
      .populate("host")
      .populate("categories");

    const io = getIO();
    io.to(roomCode).emit("roomUpdated", { room });

    res.json({ room });
  } catch (err) {
    console.error("❌ Error updating categories:", err);
    res.status(500).json({ message: res.__("failed_update_categories") });
  }
};
