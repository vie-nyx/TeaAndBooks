const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    
    name:          { type: String, trim: true, default: "" },
    username:      { type: String, required: true, unique: true, trim: true, lowercase: true },
    email:         { type: String, required: true, unique: true },
    password:      { type: String },
    bio:           { type: String, trim: true, maxlength: 250, default: "" },
    profileImage:  { type: String, default: "" },
    avatar:        { type: String, default: "" }, // kept for backward compatibility with chat UI


    favoriteGenres: [{ type: String, trim: true }],
    readingPersona: { type: String, trim: true, default: "" },

    books: [
      {
        bookId:     { type: String, default: "" },
        title:      { type: String, required: true },
        author:     { type: String, default: "" },
        coverImage: { type: String, default: "" },
        status: {
          type: String,
          enum: ["currently_reading", "completed", "want_to_read"],
          default: "want_to_read",
        },
        addedAt: { type: Date, default: Date.now },
      },
    ],

    readingStats: {
      totalBooksRead:  { type: Number, default: 0 },
      currentlyReading:{ type: Number, default: 0 },
      wantToRead:      { type: Number, default: 0 },
      readingStreak:   { type: Number, default: 0 },
      lastUpdatedAt:   { type: Date,   default: Date.now },
    },

    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    posts:     [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],

    isVerified:              { type: Boolean, default: false },
    emailVerificationToken:  { type: String,  default: null },
    emailVerificationExpire: { type: Date,    default: null },

    passwordResetToken:  { type: String, default: null },
    passwordResetExpire: { type: Date,   default: null },

    refreshToken:  { type: String,  default: null },
    tokenVersion:  { type: Number,  default: 0 },

    loginAttempts: { type: Number, default: 0 },
    lockUntil:     { type: Date,   default: null },
  },
  { timestamps: true }
);
userSchema.virtual("followersCount").get(function () {
  return this.followers ? this.followers.length : 0;
});

module.exports = mongoose.model("User", userSchema);