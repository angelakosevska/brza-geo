const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const verifyToken = require("..//middleware/auth");


router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/request-password-reset", authController.requestPasswordReset);
router.post("/reset-password", authController.resetPassword);
router.post("/logout", verifyToken, authController.logout);
module.exports = router;
