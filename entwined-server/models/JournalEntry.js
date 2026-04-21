const mongoose = require("mongoose");

const journalEntrySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    moodTags: [{ type: String, trim: true, lowercase: true }],
    isPublic: { type: Boolean, default: false },
  },
  { timestamps: true },
);

journalEntrySchema.index({ user: 1, createdAt: -1 });
journalEntrySchema.index({ isPublic: 1, createdAt: -1 });

module.exports = mongoose.model("JournalEntry", journalEntrySchema);
