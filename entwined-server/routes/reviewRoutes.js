const express = require("express");
const auth = require("../middleware/authMiddleware");
const Review = require("../models/Review");

const router = express.Router();

router.get("/me", auth, async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.userId }).sort({ createdAt: -1 });
    return res.json(reviews);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to fetch reviews" });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const { title, content, rating, author, coverImage, bookId, isPublic } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    const review = await Review.create({
      user: req.userId,
      title,
      content,
      rating: rating || 4,
      author: author || "",
      coverImage: coverImage || "",
      bookId: bookId || "",
      isPublic: isPublic !== undefined ? Boolean(isPublic) : true,
    });

    return res.status(201).json(review);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to create review" });
  }
});

router.delete("/:reviewId", auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ message: "Review not found" });
    if (review.user.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    await Review.findByIdAndDelete(review._id);
    return res.json({ message: "Review deleted" });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to delete review" });
  }
});

module.exports = router;
