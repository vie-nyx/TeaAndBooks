const express = require("express");
const {
  signup,
  login,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  refreshTokenHandler,
  logout,
  logoutAll,
  googleLogin,
  verifyToken,
} = require("../controllers/authController");
const rateLimit = require("express-rate-limit");
const authMiddleware = require("../middleware/authMiddleware");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  message: "Too many requests, please try again later.",
});

const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5, // Max 5 resend attempts per 15 min per IP
  message: "Too many resend requests. Please wait before trying again.",
});

const router = express.Router();

router.post("/signup", signup);
router.post("/login", limiter, login);
router.post("/google", googleLogin);

// Email verification
router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verification", emailLimiter, resendVerification);

// Password reset
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// Token management
router.post("/refresh", refreshTokenHandler);
router.post("/logout", logout);
router.post("/logout-all", authMiddleware, logoutAll);

// Validate stored token (used on app load)
router.get("/verify-token", authMiddleware, verifyToken);

module.exports = router;