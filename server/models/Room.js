const mongoose = require("mongoose");

// Flexible per-category answers (keys = category names)
const AnswersSchema = new mongoose.Schema({}, { _id: false, strict: false });

const SubmissionSchema = new mongoose.Schema(
  {
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    answers: { type: AnswersSchema, default: {} },
    points: { type: Number, default: 0 }, // points earned this round
  },
  { _id: false }
);

const RoundSchema = new mongoose.Schema(
  {
    roundNumber: { type: Number, required: true },
    letter: { type: String, required: true },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date, default: null },
    submissions: { type: [SubmissionSchema], default: [] },
  },
  { _id: false }
);

const roomSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    host: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    players: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // Game settings
    rounds: { type: Number },
    timer: { type: Number }, // seconds per round
    categories: { type: [String], default: [] },

    // Live state
    currentRound: { type: Number, default: 0 },
    started: { type: Boolean, default: false },
    letter: { type: String, default: null },
    roundEndTime: { type: Date, default: null },

    // Full history of all rounds in this game
    roundsData: { type: [RoundSchema], default: [] },

    lastActiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

roomSchema.index({ lastActiveAt: 1 }, { expireAfterSeconds: 60 * 60 * 12 });
module.exports = mongoose.model("Room", roomSchema);
