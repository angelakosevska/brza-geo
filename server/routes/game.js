const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const gameController = require("../controllers/gameController");

router.post("/submit/:code", verifyToken, gameController.submitAnswers);
router.get("/results/:code", verifyToken, gameController.getRoundResults);

module.exports = router;
