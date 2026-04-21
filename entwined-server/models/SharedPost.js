const mongoose = require("mongoose");

const sharedPostSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    sharedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    note: {
      type: String,
      trim: true,
      default: "",
      maxlength: 400,
    },
  },
  { timestamps: true },
);

sharedPostSchema.index({ post: 1, createdAt: -1 });
sharedPostSchema.index({ sharedBy: 1, createdAt: -1 });
sharedPostSchema.index({ conversation: 1, createdAt: -1 });

module.exports = mongoose.model("SharedPost", sharedPostSchema);
