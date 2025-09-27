const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const roomController = require("../controllers/roomController");

router.post("/create", verifyToken, roomController.createRoom);
router.post("/join", verifyToken, roomController.joinRoom);
router.get("/:code", verifyToken, roomController.getRoom);
router.post("/:code/leave", verifyToken, roomController.leaveRoom);

router.patch(
  "/update-categories",
  verifyToken,
  roomController.updateCategories
);
router.patch("/update-settings", verifyToken, roomController.updateSettings);

module.exports = router;
