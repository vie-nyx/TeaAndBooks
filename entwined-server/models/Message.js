const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  text: {
    type: String,
    default: ""
  },
  imageUrl: {
    type: String
  },
  fileUrl: {
    type: String
  },
  fileType: {
    type: String,
    enum: ["pdf", "epub", "image", null],
    default: null
  },
  fileName: {
    type: String
  },
  fileSize: {
    type: Number // Size in bytes
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post"
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ postId: 1, createdAt: -1 });

module.exports = mongoose.model("Message", messageSchema);

