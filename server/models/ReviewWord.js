const mongoose = require("mongoose");

// Schema for words marked for review during gameplay
const reviewWordSchema = new mongoose.Schema({
  // Reference to game and room
  gameId: { type: mongoose.Schema.Types.ObjectId, ref: "Game", required: true },
  roomCode: { type: String, required: true },
  roundNumber: { type: Number, required: true },
  letter: { type: String, required: true },

  // Category and submitted word
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  word: { type: String, required: true, trim: true },

  // Player who submitted the word
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // Votes from other players
  votes: [
    {
      player: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      valid: { type: Boolean },
    },
  ],

  // Review status
  status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },

  // Whether points were already awarded
  awarded: { type: Boolean, default: false },

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  decidedAt: { type: Date },
});

// Index for faster queries by game and round
reviewWordSchema.index({ gameId: 1, roundNumber: 1 });

module.exports = mongoose.model("ReviewWord", reviewWordSchema);
