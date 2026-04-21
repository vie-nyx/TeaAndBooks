const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bookId: { type: String, default: "" },
    title: { type: String, required: true, trim: true },
    author: { type: String, default: "", trim: true },
    coverImage: { type: String, default: "" },
    rating: { type: Number, min: 1, max: 5, default: 4 },
    content: { type: String, required: true, trim: true, maxlength: 3000 },
    isPublic: { type: Boolean, default: true },
  },
  { timestamps: true },
);

reviewSchema.index({ user: 1, createdAt: -1 });
reviewSchema.index({ isPublic: 1, createdAt: -1 });

module.exports = mongoose.model("Review", reviewSchema);
