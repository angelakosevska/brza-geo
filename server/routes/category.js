const express = require("express");
const router = express.Router();
const Category = require("../models/Category");

// ✅ GET /api/categories
router.get("/", async (req, res) => {
  try {
    let query = {};

    if (req.query.ids) {
      const ids = String(req.query.ids)
        .split(",")
        .map((id) => id.trim());
      query = { _id: { $in: ids } };
    }

    const categories = await Category.find(query);

    return res.json({ categories });
  } catch (err) {
    console.error("❌ Error in GET /api/categories:", err);
    return res.status(500).json({ message: "Failed to get categories" });
  }
});

// ✅ GET /api/categories/:id
router.get("/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    return res.json(category);
  } catch (err) {
    console.error("❌ Error in GET /api/categories/:id:", err);
    return res.status(500).json({ message: "Failed to get category" });
  }
});

module.exports = router;
