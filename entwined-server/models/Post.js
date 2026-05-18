const mongoose = require("mongoose");
const { POST_CATEGORIES } = require("../constants/postCategories");

const postSchema = new mongoose.Schema(
{
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  caption: {
    type: String,
    trim: true,
    default: ""
  },

  category: {
    type: String,
    enum: POST_CATEGORIES,
    default: "general",
    index: true
  },

  imageUrl: {
    type: String,
    required: true
  },

  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],

  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment"
    }
  ]
},
{ timestamps: true }
);

postSchema.index({ user: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.model("Post", postSchema);
