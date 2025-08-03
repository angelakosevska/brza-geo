const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const roomController = require("../controllers/roomController");

router.post("/create", verifyToken, roomController.createRoom);
router.post("/join", verifyToken, roomController.joinRoom);
router.get("/:code", verifyToken, roomController.getRoom); // FIXED HERE

router.post("/set-categories", verifyToken, roomController.updateCategories); // FIXED HERE

router.patch("/update-settings", verifyToken, roomController.updateSettings);
//router.post("/start", verifyToken, roomController.startGame); // Make sure you have this in your controller!
router.post("/leave", verifyToken, roomController.leaveRoom);

module.exports = router;
