const mongoose = require("mongoose");

// Schema for user accounts in the system
const UserSchema = new mongoose.Schema({
  // Unique username for login/identification
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true, // stored in lowercase for consistency
  },

  // User's email address (also unique)
  email: {
    type: String,
    required: true,
    unique: true,
  },

  // Hashed password (never store raw password)
  password: {
    type: String,
    required: true,
  },

  // Role of the user (default = "player", "admin" for elevated privileges)
  role: {
    type: String,
    enum: ["player", "admin"],
    default: "player",
  },

  // Password reset fields
  resetCode: {
    type: String, // temporary code/token for password reset
  },
  resetCodeExpires: {
    type: Date, // expiration timestamp for the reset code
  },

  // Gameplay progression fields
  wordPower: {
    type: Number,
    default: 0, // total XP-like score earned
  },
  level: {
    type: Number,
    default: 1, // current level of the player
  },
  currentSessionId: { type: String, default: null }, // active session
  lastLoginAt: { type: Date },
});

// Export User model
module.exports = mongoose.model("User", UserSchema);
