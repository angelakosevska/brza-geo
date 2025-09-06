const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const roomController = require("../controllers/roomController");

router.post("/create", verifyToken, roomController.createRoom);
router.post("/join", verifyToken, roomController.joinRoom);
router.get("/:code", verifyToken, roomController.getRoom);

router.patch("/update-categories", verifyToken, roomController.updateCategories);

router.patch("/update-settings", verifyToken, roomController.updateSettings);

router.post("/leave", verifyToken, roomController.leaveRoom);

module.exports = router;
