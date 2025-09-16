const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["player", "admin"],
    default: "player",
  },
  resetCode: {
    type: String,
  },
  resetCodeExpires: {
    type: Date,
  },

  wordPower: {
    type: Number,
    default: 0, 
  },
  level: {
    type: Number,
    default: 1, 
  },
});

module.exports = mongoose.model("User", UserSchema);
