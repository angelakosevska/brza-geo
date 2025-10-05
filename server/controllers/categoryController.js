const Category = require("../models/Category");

/**
 * Normalize input words
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
    return res.status(500).json({ message: res.__("failed_get_categories") });
  }
};

/**
 * GET /api/categories/:id
 */
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).lean();
    if (!category)
      return res.status(404).json({ message: res.__("category_not_found") });
    return res.json({ category });
  } catch (err) {
    console.error("❌ Error in getCategoryById:", err);
    return res.status(500).json({ message: res.__("failed_get_category") });
  }
};

/**
 * POST /api/categories
 * body: { name, description?, words: string|array }
 */
exports.createCategory = async (req, res) => {
  try {
    const { name, words, description } = req.body;
    if (!name || !String(name).trim()) {
      return res
        .status(400)
        .json({ message: res.__("category_name_required") });
    }

    const normalized = normalizeWordsInput(words);

    const category = await Category.create({
      name: String(name).trim(),
      description: description ? String(description).trim() : "",
      words: normalized,
      createdBy: req.user?.id || null, // ✅ FIXED HERE
      isDefault: req.user?.role === "admin",
    });

    return res.status(201).json({ category });
  } catch (err) {
    console.error("❌ Error in createCategory:", err);
    return res.status(500).json({ message: res.__("failed_create_category") });
  }
};

/**
 * PUT /api/categories/:id
 * Replace name/description/words (admin or creator can edit)
 */
exports.updateCategory = async (req, res) => {
  try {
    const id = req.params.id;
    const cat = await Category.findById(id);
    if (!cat)
      return res.status(404).json({ message: res.__("category_not_found") });

    const userId = req.user?.id; // ✅ FIXED HERE
    const userRole = req.user?.role || "player";
    const isAdmin = userRole === "admin";
    const isCreator = userId && String(cat.createdBy) === String(userId);

    if (!isAdmin && !isCreator) {
      return res
        .status(403)
        .json({ message: res.__("not_allowed_update_category") });
    }

    const { name, words, description } = req.body;
    if (name) cat.name = String(name).trim();
    if (description !== undefined) cat.description = String(description).trim();
    if (words !== undefined) {
      cat.words = normalizeWordsInput(words);
    }

    await cat.save();
    return res.json({ category: cat });
  } catch (err) {
    console.error("❌ Error in updateCategory:", err);
    return res.status(500).json({ message: res.__("failed_update_category") });
  }
};

/**
 * DELETE /api/categories/:id
 * Admin or creator can delete
 */
exports.deleteCategory = async (req, res) => {
  try {
    const cat = await Category.findById(req.params.id);
    if (!cat)
      return res.status(404).json({ message: res.__("category_not_found") });

    const userId = req.user?.id; // ✅ FIXED HERE
    const userRole = req.user?.role || "player";
    const isAdmin = userRole === "admin";
    const isCreator = userId && String(cat.createdBy) === String(userId);

    if (!isAdmin && !isCreator) {
      return res
        .status(403)
        .json({ message: res.__("not_allowed_delete_category") });
    }

    await cat.deleteOne();
    return res.json({ message: res.__("category_deleted") });
  } catch (err) {
    return res.status(500).json({ message: res.__("failed_delete_category") });
  }
};
