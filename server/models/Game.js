const mongoose = require("mongoose");

// Schema for storing finished or ongoing games
const GameSchema = new mongoose.Schema({
  // Code of the room this game belongs to (e.g. "ABCD")
  roomCode: String,

  // Players who participated in the game (references User documents)
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  // Total number of rounds in the game
  rounds: Number,

  // List of category IDs or names used in this game
  categories: [String],

  // Snapshot of round-by-round data (submissions, scores, letters, etc.)
  // Usually copied from Room state at the end of each round
  roundsData: Array,

  // References to winning players (can be multiple in case of a tie)
  winners: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  // Creation timestamp for when the game record was stored
  createdAt: { type: Date, default: Date.now },
});

// Export the Game model
module.exports = mongoose.model("Game", GameSchema);
