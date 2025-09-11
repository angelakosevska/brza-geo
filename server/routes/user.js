const express = require("express");
const { getProfile, addWordPowerToUser } = require("../controllers/userController");

const router = express.Router();

router.get("/profile/:id", getProfile);
router.post("/:id/addWP", addWordPowerToUser);

module.exports = router;
