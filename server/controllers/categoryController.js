const Category = require("../models/Category");

/**
 * Helpers
 */
function normalizeWordsInput(words) {
  if (!words) return [];
  if (Array.isArray(words)) {
    return words.map((w) => String(w || "").trim()).filter(Boolean);
  } else if (typeof words === "string") {
    return words
      .split(",")
      .map((w) => String(w || "").trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * GET /api/categories
 * optional query: ?ids=abc,def
 */
exports.getCategories = async (req, res) => {
  try {
    let query = {};
    if (req.query.ids) {
      const ids = String(req.query.ids)
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
      if (ids.length) query = { _id: { $in: ids } };
    }
    const categories = await Category.find(query).lean();
    return res.json({ categories });
  } catch (err) {
    console.error("❌ Error in getCategories:", err);
    return res.status(500).json({ message: "Failed to get categories" });
  }
};

/**
 * GET /api/categories/:id
 */
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).lean();
    if (!category) return res.status(404).json({ message: "Category not found" });
    return res.json({ category });
  } catch (err) {
    console.error("❌ Error in getCategoryById:", err);
    return res.status(500).json({ message: "Failed to get category" });
  }
};

/**
 * POST /api/categories
 * body: { name, words: string|array }
 */
exports.createCategory = async (req, res) => {
  try {
    const { name, words } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "Name is required" });
    }

    const normalized = normalizeWordsInput(words);

    const category = await Category.create({
      name: String(name).trim(),
      words: normalized,
      createdBy: req.user?.userId || null,
      isDefault: req.user?.role === "admin",
    });

    return res.status(201).json({ category });
  } catch (err) {
    console.error("❌ Error in createCategory:", err);
    return res.status(500).json({ message: "Failed to create category" });
  }
};

/**
 * PUT /api/categories/:id
 * Replace name/words (admin or creator can edit)
 */
exports.updateCategory = async (req, res) => {
  try {
    const id = req.params.id;
    const cat = await Category.findById(id);
    if (!cat) return res.status(404).json({ message: "Category not found" });

    const userId = req.user?.userId;
    const userRole = req.user?.role || "player";
    const isAdmin = userRole === "admin";
    const isCreator = userId && String(cat.createdBy) === String(userId);

    if (!isAdmin && !isCreator) {
      return res.status(403).json({ message: "Not allowed to update category" });
    }

    const { name, words } = req.body;
    if (name) cat.name = String(name).trim();
    if (words !== undefined) {
      cat.words = normalizeWordsInput(words);
    }

    await cat.save(); // pre('save') ќе ја апдејтира validLetters
    return res.json({ category: cat });
  } catch (err) {
    console.error("❌ Error in updateCategory:", err);
    return res.status(500).json({ message: "Failed to update category" });
  }
};

/**
 * PATCH /api/categories/:id/words
 * Append words to existing category
 */
exports.appendWords = async (req, res) => {
  try {
    const id = req.params.id;
    const cat = await Category.findById(id);
    if (!cat) return res.status(404).json({ message: "Category not found" });

    const newWords = normalizeWordsInput(req.body.words);

    const existing = new Set((cat.words || []).map((w) => w.toLowerCase()));
    const toAdd = [];
    for (const w of newWords) {
      const lw = String(w).toLowerCase();
      if (!existing.has(lw)) {
        toAdd.push(w);
        existing.add(lw);
      }
    }

    if (!toAdd.length) {
      return res.status(200).json({ message: "No new words added", added: [] });
    }

    cat.words = [...cat.words, ...toAdd];
    await cat.save(); // validLetters ќе се апдејтира

    return res.json({ added: toAdd, category: cat });
  } catch (err) {
    console.error("❌ Error in appendWords:", err);
    return res.status(500).json({ message: "Failed to append words" });
  }
};

/**
 * DELETE /api/categories/:id
 * Admin only
 */
exports.deleteCategory = async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Only admin can delete categories" });
    }
    await Category.findByIdAndDelete(req.params.id);
    return res.json({ ok: true });
  } catch (err) {
    console.error("❌ Error in deleteCategory:", err);
    return res.status(500).json({ message: "Failed to delete category" });
  }
};
