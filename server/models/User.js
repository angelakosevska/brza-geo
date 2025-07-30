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

  resetCode: {
    type: String,
  }, 
  resetCodeExpires: {
    type: Date,
  },
});

module.exports = mongoose.model("User", UserSchema);
