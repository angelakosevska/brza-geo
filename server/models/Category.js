const mongoose = require("mongoose");

// Regex: Macedonian Cyrillic letters (upper/lower), spaces, dash, apostrophe
const CYRILLIC_RE =
  /^[АБВГДЃЕЖЗЅИЈКЛЉМНЊОПРСТЌУФХЦЧЏШабвгдѓежзѕијклљмнњопрстќуфхцчџш\s-'`]+$/;

// Check if a word contains only valid Cyrillic characters
function isCyrillicWord(w) {
  return CYRILLIC_RE.test(String(w || "").trim());
}

// Compute valid starting letters from words (for faster in-game validation)
function computeValidLetters(words = []) {
  const set = new Set();
  for (const w of words || []) {
    const first = String(w).charAt(0).toUpperCase();
    if (CYRILLIC_RE.test(first)) set.add(first);
  }
  return Array.from(set);
}

// Category schema
const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // internal category name
    description: { type: String, default: "", maxlength: 300 }, // optional description
    words: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.every((w) => isCyrillicWord(w)),
        message: "All words must be in Macedonian Cyrillic.",
      },
    },
    validLetters: { type: [String], default: [] }, // pre-computed first letters
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // user reference
    isDefault: { type: Boolean, default: false }, // true if system/admin category
  },
  { collection: "categories", timestamps: true }
);

// Middleware: recompute validLetters when words are updated
CategorySchema.pre("save", function (next) {
  if (this.isModified("words")) {
    this.validLetters = computeValidLetters(this.words);
  }
  next();
});

module.exports = mongoose.model("Category", CategorySchema);
