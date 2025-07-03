const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    code: {
      //room invite code
      type: String,
      required: true,
      unique: true,
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    players: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    rounds: {
      type: Number,
      default: 3,
    },
    timer: {
      type: Number,
      default: 120,
    }, // seconds per round
    category: {
      type: String,
      default: "Default",
    },
    currentRound: {
      type: Number,
      default: 0,
    },
    started: {
      type: Boolean,
      default: false,
    },
    letter: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Room", roomSchema);
