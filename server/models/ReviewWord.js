const mongoose = require("mongoose");

const reviewWordSchema = new mongoose.Schema({
  gameId: { type: mongoose.Schema.Types.ObjectId, ref: "Game", required: true },
  roomCode: { type: String, required: true },
  roundNumber: { type: Number, required: true },
  letter: { type: String, required: true },

  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  word: { type: String, required: true, trim: true },

  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  votes: [
    {
      player: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      valid: { type: Boolean },
    },
  ],

  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },

  createdAt: { type: Date, default: Date.now },
  decidedAt: { type: Date },
});

// Индекс за побрзо пребарување
reviewWordSchema.index({ gameId: 1, roundNumber: 1 });

module.exports = mongoose.model("ReviewWord", reviewWordSchema);
