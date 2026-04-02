const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["one-to-one", "group"],
    required: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }],
  groupName: {
    type: String,
    required: function() {
      return this.type === "group";
    }
  },
  groupType: {
    type: String,
    enum: ["discussion", "bookclub"],
    default: "discussion"
  },
  groupAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: function() {
      return this.type === "group";
    }
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message"
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

// Index for faster lookups
conversationSchema.index({ participants: 1 });
conversationSchema.index({ type: 1 });
conversationSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model("Conversation", conversationSchema);

