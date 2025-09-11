// models/Game.js
const mongoose = require("mongoose");

const GameSchema = new mongoose.Schema({
  roomCode: String,
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  rounds: Number,
  categories: [String],
  roundsData: Array, // store everything from Room
  winners: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Game", GameSchema);
