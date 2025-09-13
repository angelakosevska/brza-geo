const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema(
  {
    name: String,
    displayName: {
      mk: String,
      en: String,
    },
    words: {
      type: [String],
      default: [],
    },
  },
  { collection: "categories" }
);

module.exports = mongoose.model("Category", CategorySchema);
