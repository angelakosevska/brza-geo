const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const verifyAdmin = require("../middleware/verifyAdmin");
const {
  getReviews,
  approveReview,
  rejectReview,
} = require("../controllers/adminController");


router.use(verifyToken, verifyAdmin);

router.get("/reviews", getReviews);
router.post("/reviews/:id/approve", approveReview);
router.post("/reviews/:id/reject", rejectReview);

module.exports = router;
