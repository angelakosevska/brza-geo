const mongoose = require("mongoose");

const CYRILLIC_RE =
  /^[АБВГДЃЕЖЗЅИЈКЛЉМНЊОПРСТЌУФХЦЧЏШабвгдѓежзѕијклљмнњопрстќуфхцчџш\s-]+$/;

function isCyrillicWord(w) {
  return CYRILLIC_RE.test(String(w || "").trim());
}

function computeValidLetters(words = []) {
  const set = new Set();
  for (const w of words || []) {
    const first = String(w).charAt(0).toUpperCase();
    if (CYRILLIC_RE.test(first)) set.add(first);
  }
  return Array.from(set);
}

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    words: {
      type: [String],
      default: [],
      validate: {
        validator: function (arr) {
          return arr.every((w) => isCyrillicWord(w));
        },
        message: "Сите зборови мора да бидат на кирилица.",
      },
    },
    validLetters: {
      type: [String],
      default: [],
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isDefault: { type: Boolean, default: false },
  },
  { collection: "categories", timestamps: true }
);

// ✅ Middleware за автоматско пополнување на validLetters
CategorySchema.pre("save", function (next) {
  if (this.isModified("words")) {
    this.validLetters = computeValidLetters(this.words);
  }
  next();
});

module.exports = mongoose.model("Category", CategorySchema);
