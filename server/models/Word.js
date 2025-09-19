const mongoose = require("mongoose");

// Schema for storing individual words under a category
const wordSchema = new mongoose.Schema({
  // Name/ID of the category this word belongs to
  category: {
    type: String,
    required: true,
  },

  // The actual word
  word: {
    type: String,
    required: true,
  },
});

// Export Word model
module.exports = mongoose.model("Word", wordSchema);
