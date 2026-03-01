const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, lowercase: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  avatar: { type: String },
  createdAt: { type: Date, default: Date.now },
  isVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpire: Date,

  passwordResetToken: String,
  passwordResetExpire: Date,
  refreshToken: String,
  tokenVersion: { type: Number, default: 0 },

  loginAttempts: { type: Number, default: 0 },
  lockUntil: Date
}, { timestamp: true });

module.exports = mongoose.model("User", userSchema);