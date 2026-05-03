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
} = require("../controllers/authController");

const rateLimit = require("express-rate-limit");

const authMiddleware = require("../middleware/authMiddleware");

const User = require("../models/User");

const router = express.Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  message:
    "Too many requests, please try again later.",
});

/* =========================
   AUTH ROUTES
========================= */

router.post("/signup", signup);

router.post(
  "/login",
  limiter,
  login
);

router.post(
  "/google",
  googleLogin
);

router.get(
  "/verify-email/:token",
  verifyEmail
);

router.post(
  "/forgot-password",
  forgotPassword
);

router.post(
  "/reset-password/:token",
  resetPassword
);

router.post(
  "/refresh",
  refreshTokenHandler
);

router.post(
  "/logout",
  logout
);

router.post(
  "/logout-all",
  authMiddleware,
  logoutAll
);

/* =========================
   VERIFY CURRENT USER
========================= */

router.get(
  "/verify",
  authMiddleware,
  async (req, res) => {
    try {
      const user =
        await User.findById(
          req.userId
        ).select("-password");

      if (!user) {
        return res
          .status(404)
          .json({
            valid: false,
            message:
              "User not found",
          });
      }

      return res.json({
        valid: true,
        user,
      });
    } catch (err) {
      return res
        .status(500)
        .json({
          valid: false,
          message:
            err.message ||
            "Verification failed",
        });
    }
  }
);

module.exports = router;