const mongoose = require("mongoose");

// Regex for validating Macedonian Cyrillic letters (uppercase, lowercase, spaces, and dash)
const CYRILLIC_RE =
  /^[АБВГДЃЕЖЗЅИЈКЛЉМНЊОПРСТЌУФХЦЧЏШабвгдѓежзѕијклљмнњопрстќуфхцчџш\s-'`]+$/;

// Helper function: checks if a word contains only valid Cyrillic characters
function isCyrillicWord(w) {
  return CYRILLIC_RE.test(String(w || "").trim());
}

// Helper function: calculates the set of first letters from the given words
// Used for faster validation during gameplay (e.g., check if letter exists in category)
function computeValidLetters(words = []) {
  const set = new Set();
  for (const w of words || []) {
    const first = String(w).charAt(0).toUpperCase();
    if (CYRILLIC_RE.test(first)) set.add(first);
  }
  return Array.from(set);
}

// Category schema definition
const CategorySchema = new mongoose.Schema(
  {
    // Internal identifier for the category (short name, not localized)
    name: { type: String, required: true },

    // Human-readable description of the category (optional, up to 300 chars)
    description: {
      type: String,
      default: "",
      maxlength: 300,
    },

    // List of words belonging to this category
    words: {
      type: [String],
      default: [],
      validate: {
        // Ensure all words are valid Cyrillic
        validator: function (arr) {
          return arr.every((w) => isCyrillicWord(w));
        },
        message: "Сите зборови треба да се на македонски.",
      },
    },

    // Pre-computed list of valid starting letters for faster gameplay checks
    validLetters: {
      type: [String],
      default: [],
    },

    // Reference to the User who created the category (null if system default)
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // Distinguish between categories from admin (default true) and user-created ones (default false)
    isDefault: { type: Boolean, default: false },
  },
  { collection: "categories", timestamps: true }
);

// Middleware: before saving, recompute validLetters if the words list has changed
CategorySchema.pre("save", function (next) {
  if (this.isModified("words")) {
    this.validLetters = computeValidLetters(this.words);
  }
  next();
});

// Export Category model for use throughout the app
module.exports = mongoose.model("Category", CategorySchema);
