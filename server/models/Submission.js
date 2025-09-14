const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Room",
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  round: {
    type: Number,
    required: true,
  },
  letter: {
    type: String,
    required: true,
  },
  words: {
    type: Map,
    of: String,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  score: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("Submission", submissionSchema);
