const mongoose = require("mongoose");

// Regex for validating Macedonian Cyrillic letters (uppercase + lowercase + space + dash)
const CYRILLIC_RE =
  /^[АБВГДЃЕЖЗЅИЈКЛЉМНЊОПРСТЌУФХЦЧЏШабвгдѓежзѕијклљмнњопрстќуфхцчџш\s-]+$/;

// Helper: check if a word is valid Cyrillic
function isCyrillicWord(w) {
  return CYRILLIC_RE.test(String(w || "").trim());
}

// Helper: compute all valid first letters from a list of words
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
    // Category name (short identifier)
    name: { type: String, required: true },

    // Category description (optional, limited to 300 chars)
    description: {
      type: String,
      default: "",
      maxlength: 300,
    },

    // Word list for the category
    words: {
      type: [String],
      default: [],
      validate: {
        validator: function (arr) {
          return arr.every((w) => isCyrillicWord(w));
        },
        message: "All words must be in Cyrillic.",
      },
    },

    // Letters automatically derived from the words (first letters)
    validLetters: {
      type: [String],
      default: [],
    },

    // Reference to user who created the category
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // Flag for default system categories
    isDefault: { type: Boolean, default: false },
  },
  { collection: "categories", timestamps: true }
);

// Middleware: automatically update validLetters when words change
CategorySchema.pre("save", function (next) {
  if (this.isModified("words")) {
    this.validLetters = computeValidLetters(this.words);
  }
  next();
});

module.exports = mongoose.model("Category", CategorySchema);
