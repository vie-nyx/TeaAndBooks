const mongoose = require("mongoose");

const postLikeSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

postLikeSchema.index({ post: 1, user: 1 }, { unique: true });
postLikeSchema.index({ user: 1, createdAt: -1 });
postLikeSchema.index({ post: 1, createdAt: -1 });

module.exports = mongoose.model("PostLike", postLikeSchema);
