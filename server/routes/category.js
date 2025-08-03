const express = require("express");
const router = express.Router();
const Category = require("../models/Category"); 

router.get("/", async (req, res) => {
  try {
    const categories = await Category.find({});
    res.json({ categories }); 
  } catch (err) {
    console.error("Error in /api/categories:", err); // Print actual error
    res.status(500).json({ message: "Failed to get categories" });
  }
});

module.exports = router;
