const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
  type: String,
  required: false,
  unique: true,
  lowercase: true,
  trim: true,
}

}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
