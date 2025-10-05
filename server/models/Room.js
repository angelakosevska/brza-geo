const mongoose = require("mongoose");

// Schema for answers per category (flexible key-value pairs)
const AnswersSchema = new mongoose.Schema({}, { _id: false, strict: false });

// Schema for a player's submission in one round
const SubmissionSchema = new mongoose.Schema(
  {
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    answers: { type: AnswersSchema, default: {} },
    points: { type: Number, default: 0 },
  },
  { _id: false }
);

// Schema for a single round in a room
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

// Schema for a game room
const roomSchema = new mongoose.Schema(
  {
    // Identification
    code: { type: String, required: true, unique: true },
    host: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    players: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // Game configuration
    rounds: { type: Number },
    timer: { type: Number },
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
    endMode: {
      type: String,
      enum: ["ALL_SUBMIT", "PLAYER_STOP"],
      default: "ALL_SUBMIT",
    },

    // Current game state
    currentRound: { type: Number, default: 0 },
    started: { type: Boolean, default: false },
    letter: { type: String, default: null },
    roundEndTime: { type: Date, default: null },
    currentGameId: { type: mongoose.Schema.Types.ObjectId, ref: "Game" },
    roundsData: { type: [RoundSchema], default: [] },

    // Room activity
    lastActiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// TTL index: remove inactive rooms after 12 hours
roomSchema.index({ lastActiveAt: 1 }, { expireAfterSeconds: 60 * 60 * 12 });

module.exports = mongoose.model("Room", roomSchema);
