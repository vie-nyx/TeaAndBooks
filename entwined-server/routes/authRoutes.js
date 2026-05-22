const express = require("express");
const {
  signup,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  refreshTokenHandler,
  logout,
  logoutAll,
  googleLogin,
  verifyToken
} = require("../controllers/authController");
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests, please try again later."
});


const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", limiter, login);
router.post("/google", googleLogin);
router.get("/verify-email/:token", verifyEmail);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

router.post("/refresh", refreshTokenHandler);
router.post("/logout", logout);
router.post("/logout-all", authMiddleware, logoutAll);

// Validate access token and return current user
router.get("/verify", authMiddleware, verifyToken);
// Legacy /me route expected by frontend — reuse verifyToken
router.get("/me", authMiddleware, verifyToken);

module.exports = router;