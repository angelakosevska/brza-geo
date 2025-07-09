const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const roomController = require("../controllers/roomController");

router.post("/create", verifyToken, roomController.createRoom);
router.post("/join", verifyToken, roomController.joinRoom);
router.post("/set-categories", verifyToken, roomController.setCategories);
router.get("/info/:code", verifyToken, roomController.getRoomInfo);
router.patch("/update-settings", verifyToken, roomController.updateSettings);
router.post("/start", verifyToken, roomController.startGame);
router.post("/leave", verifyToken, roomController.leaveRoom);

module.exports = router;
