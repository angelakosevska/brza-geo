const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const verifyToken = require("../middleware/auth"); // JWT middleware

//  Public routes
router.get("/", categoryController.getCategories);
router.get("/:id", categoryController.getCategoryById);

// Protected routes (потребен JWT token)
router.post("/", verifyToken, categoryController.createCategory);
router.put("/:id", verifyToken, categoryController.updateCategory);
router.patch("/:id/words", verifyToken, categoryController.appendWords);
router.delete("/:id", verifyToken, categoryController.deleteCategory);

module.exports = router;
