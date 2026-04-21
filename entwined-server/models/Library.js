const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    bookId: { type: String, default: "" },
    title: { type: String, required: true, trim: true },
    author: { type: String, default: "", trim: true },
    coverImage: { type: String, default: "" },
    notes: { type: String, default: "", trim: true, maxlength: 1000 },
    addedAt: { type: Date, default: Date.now },
    startedAt: { type: Date },
    finishedAt: { type: Date },
  },
  { _id: true },
);

const librarySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    read: [bookSchema],
    currentlyReading: [bookSchema],
    wantToRead: [bookSchema],
  },
  { timestamps: true },
);

librarySchema.index({ user: 1 }, { unique: true });

module.exports = mongoose.model("Library", librarySchema);
