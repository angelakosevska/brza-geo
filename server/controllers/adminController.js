const ReviewWord = require("../models/ReviewWord");
const Category = require("../models/Category");

// GET /api/admin/reviews?status=pending
exports.getReviews = async (req, res) => {
  try {
    const { status = "pending" } = req.query;
    const reviews = await ReviewWord.find({ status })
      .populate("submittedBy", "username email", "category", "name")
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch review words" });
  }
};

// POST /api/admin/reviews/:id/approve
exports.approveReview = async (req, res) => {
  try {
    const review = await ReviewWord.findById(req.params.id);
    if (!review) return res.status(404).json({ error: "Review not found" });

    // додај збор во категорија
    await Category.updateOne(
      { _id: review.category },
      { $addToSet: { words: review.word.toLowerCase().trim() } }
    );

    review.status = "accepted";
    review.decidedAt = new Date();
    await review.save();

    res.json({ success: true, review });
  } catch (err) {
    res.status(500).json({ error: "Failed to approve review word" });
  }
};

// POST /api/admin/reviews/:id/reject
exports.rejectReview = async (req, res) => {
  try {
    const review = await ReviewWord.findById(req.params.id);
    if (!review) return res.status(404).json({ error: "Review not found" });

    review.status = "rejected";
    review.decidedAt = new Date();
    await review.save();

    res.json({ success: true, review });
  } catch (err) {
    res.status(500).json({ error: "Failed to reject review word" });
  }
};
