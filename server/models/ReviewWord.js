const mongoose = require("mongoose");

const reviewWordSchema = new mongoose.Schema({
  word: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  letter: { type: String, required: true },
  roomCode: { type: String, required: true },
  roundId: { type: mongoose.Schema.Types.ObjectId, ref: "Round" },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  votes: [
    {
      player: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      valid: { type: Boolean }
    }
  ],

  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending"
  },
});

module.exports = mongoose.model("ReviewWord", reviewWordSchema);
