const mongoose = require("mongoose");

const groupGoalSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
    required: true
  },
  bookTitle: String,
  weeklyGoal: String,
  meetingDate: Date,
  lastMeetingNotes: String,

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model("GroupGoal", groupGoalSchema);