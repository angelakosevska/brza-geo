const mongoose = require("mongoose");

// Schema for storing answers per category
// Flexible: allows any category name as a key with the answer as value
const AnswersSchema = new mongoose.Schema({}, { _id: false, strict: false });

// Schema for one player’s submission in a round
const SubmissionSchema = new mongoose.Schema(
  {
    // Reference to the User who submitted
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Object: categoryName → answer
    answers: { type: AnswersSchema, default: {} },

    // Points earned in this round
    points: { type: Number, default: 0 },
  },
  { _id: false } // no separate _id for submissions
);

// Schema for a single round inside a room
const RoundSchema = new mongoose.Schema(
  {
    roundNumber: { type: Number, required: true }, // index of the round
    letter: { type: String, required: true }, // the chosen starting letter
    startedAt: { type: Date, default: Date.now }, // when round started
    endedAt: { type: Date, default: null }, // when round ended
    submissions: { type: [SubmissionSchema], default: [] }, // all player submissions
  },
  { _id: false }
);

// Schema for a live game room
const roomSchema = new mongoose.Schema(
  {
    // Unique room code (short string like "ABCD")
    code: { type: String, required: true, unique: true },

    // User who is the host of the room
    host: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // Players currently in the room
    players: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // Game settings chosen by host
    rounds: { type: Number }, // total number of rounds
    timer: { type: Number }, // seconds per round
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
    endMode: {
      type: String,
      enum: ["ALL_SUBMIT", "PLAYER_STOP"], // end condition
      default: "ALL_SUBMIT",
    },

    // Live game state
    currentRound: { type: Number, default: 0 }, // current round number
    started: { type: Boolean, default: false }, // has the game started
    letter: { type: String, default: null }, // active letter for this round
    roundEndTime: { type: Date, default: null }, // timestamp when round should end
    currentGameId: { type: mongoose.Schema.Types.ObjectId, ref: "Game" },
    // Complete history of all played rounds in this room
    roundsData: { type: [RoundSchema], default: [] },

    // Last activity timestamp (used for cleanup of inactive rooms)
    lastActiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// TTL index: automatically delete room documents 12 hours after last activity
roomSchema.index({ lastActiveAt: 1 }, { expireAfterSeconds: 60 * 60 * 12 });

// Export Room model
module.exports = mongoose.model("Room", roomSchema);
