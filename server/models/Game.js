const mongoose = require("mongoose");

// Schema for storing finished games (game history)
const GameSchema = new mongoose.Schema({
  // Room code this game belongs to
  roomCode: String,

  // Players who participated
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  // Total rounds played
  rounds: Number,

  // Categories used in the game
  categories: [String],

  // Round-by-round snapshot (submissions, scores, letters, etc.)
  roundsData: Array,

  // Winning players (can be multiple in case of a tie)
  winners: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  // Timestamp when the game was stored
  createdAt: { type: Date, default: Date.now },
});

// Export model
module.exports = mongoose.model("Game", GameSchema);
