const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/* ================= TOKEN HELPERS ================= */

const createAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, tokenVersion: user.tokenVersion },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
};

const createRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id, tokenVersion: user.tokenVersion },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );
};

const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false, // true in production
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};

const serializeAuthUser = (user) => ({
  _id: user._id,
  username: user.username,
  email: user.email
});

const buildUsernameCandidate = (name = "", email = "") => {
  const fallback = email.split("@")[0] || "";
  const base = name || fallback;
  const sanitized = base.toLowerCase().replace(/[^a-z0-9]+/g, "");

  if (sanitized) {
    return sanitized.slice(0, 20);
  }

  return `reader${crypto.randomBytes(3).toString("hex")}`;
};

const createUniqueUsername = async (name, email) => {
  const base = buildUsernameCandidate(name, email);
  let username = base;
  let suffix = 1;

  while (await User.exists({ username })) {
    const suffixText = `${suffix}`;
    const truncatedBase = base.slice(
      0,
      Math.max(1, 20 - suffixText.length)
    );
    username = `${truncatedBase}${suffixText}`;
    suffix += 1;
  }

  return username;
};

const isProduction = process.env.NODE_ENV === "production";

const createVerificationToken = () => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  return { rawToken, hashedToken };
};

const sendVerificationEmail = async (user, rawToken) => {
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${rawToken}`;

  await sendEmail({
    email: user.email,
    subject: "Verify your email",
    html: `<a href="${verificationUrl}">${verificationUrl}</a>`
  });
};

const sendPasswordResetEmail = async (user, rawToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;

  await sendEmail({
    email: user.email,
    subject: "Password Reset",
    html: `<a href="${resetUrl}">${resetUrl}</a>`
  });
};

const handleEmailDeliveryFailure = async (user, error) => {
  if (!isProduction) {
    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();
    return "Email delivery is unavailable in local development, so your account was verified automatically.";
  }

  await User.deleteOne({ _id: user._id });
  throw error;
};

const buildEmailFailureMessage = (fallbackMessage) => {
  return fallbackMessage ||
    "Email delivery is not configured correctly. Use a Gmail app password or configure SMTP credentials.";
};

/* ================= SIGNUP ================= */

const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 12);

    const { rawToken, hashedToken } = createVerificationToken();

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      emailVerificationToken: hashedToken,
      emailVerificationExpire: Date.now() + 24 * 60 * 60 * 1000
    });

    try {
      await sendVerificationEmail(user, rawToken);
      res.json({ message: "Signup successful. Please verify your email." });
    } catch (error) {
      const fallbackMessage = await handleEmailDeliveryFailure(user, error);
      res.status(201).json({ message: buildEmailFailureMessage(fallbackMessage) });
    }

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= VERIFY EMAIL ================= */

const verifyEmail = async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() }
    });

    if (!user)
      return res.status(400).json({ message: "Invalid or expired token" });

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    res.json({ message: "Email verified successfully" });

  } catch {
    res.status(500).json({ message: "Verification failed" });
  }
};

/* ================= LOGIN ================= */

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "User not found" });

    if (!user.isVerified)
      return res.status(400).json({ message: "Please verify your email first" });

    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(403).json({
        message: "Account locked. Try again later."
      });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      user.loginAttempts += 1;

      if (user.loginAttempts >= 5) {
        user.lockUntil = Date.now() + 15 * 60 * 1000;
      }

      await user.save();
      return res.status(400).json({ message: "Invalid password" });
    }

    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    setRefreshTokenCookie(res, refreshToken);

    res.json({
      accessToken,
      user: serializeAuthUser(user)
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= REFRESH TOKEN ================= */

const refreshTokenHandler = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id);
    if (!user || user.tokenVersion !== decoded.tokenVersion)
      return res.sendStatus(403);

    const newAccessToken = createAccessToken(user);
    res.json({ accessToken: newAccessToken });

  } catch {
    res.sendStatus(403);
  }
};

/* ================= LOGOUT ================= */

const logout = async (req, res) => {
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out successfully" });
};

/* ================= LOGOUT ALL DEVICES ================= */

const logoutAll = async (req, res) => {
  const user = await User.findById(req.user.id);

  user.tokenVersion += 1;
  await user.save();

  res.clearCookie("refreshToken");
  res.json({ message: "Logged out from all devices" });
};

/* ================= FORGOT PASSWORD ================= */

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(200).json({
        message: "If this email exists, a reset link has been sent."
      });

    const { rawToken, hashedToken } = createVerificationToken();

    user.passwordResetToken = hashedToken;

    user.passwordResetExpire = Date.now() + 15 * 60 * 1000;
    await user.save();

    try {
      await sendPasswordResetEmail(user, rawToken);
      res.json({ message: "Reset link sent" });
    } catch (error) {
      if (!isProduction) {
        res.json({
          message: "Email delivery is unavailable in local development. Use the reset link returned in this response.",
          resetUrl: `${process.env.CLIENT_URL}/reset-password/${rawToken}`
        });
        return;
      }

      user.passwordResetToken = undefined;
      user.passwordResetExpire = undefined;
      await user.save();

      res.status(500).json({
        message: buildEmailFailureMessage()
      });
    }

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    const { rawToken, hashedToken } = createVerificationToken();

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    try {
      await sendVerificationEmail(user, rawToken);
      res.json({ message: "Verification email sent." });
    } catch (error) {
      if (!isProduction) {
        user.isVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpire = undefined;
        await user.save();

        res.json({
          message: "Email delivery is unavailable in local development, so your account was verified automatically."
        });
        return;
      }

      res.status(500).json({
        message: buildEmailFailureMessage()
      });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= RESET PASSWORD ================= */

const resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpire: { $gt: Date.now() }
    });

    if (!user)
      return res.status(400).json({ message: "Invalid or expired token" });

    user.password = await bcrypt.hash(req.body.password, 12);
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    await user.save();

    res.json({ message: "Password reset successful" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Google token is required" });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, email_verified: emailVerified } = payload;

    if (!email) {
      return res.status(400).json({ message: "Google account email is missing" });
    }

    if (!emailVerified) {
      return res.status(400).json({ message: "Google email is not verified" });
    }

    let user = await User.findOne({ email });

    if (!user) {
      const username = await createUniqueUsername(name, email);

      user = await User.create({
        name: name || "",
        username,
        email,
        password: null,
        isVerified: true
      });
    } else {
      let shouldSave = false;

      if (!user.isVerified) {
        user.isVerified = true;
        shouldSave = true;
      }

      if (!user.name && name) {
        user.name = name;
        shouldSave = true;
      }

      if (shouldSave) {
        await user.save();
      }
    }

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    setRefreshTokenCookie(res, refreshToken);

    res.json({
      accessToken,
      user: serializeAuthUser(user)
    });

  } catch (err) {
    console.error("Google login error:", err);
    res.status(500).json({ message: "Google login failed" });
  }
};

/* ================= VERIFY TOKEN ================= */
// Used by frontend to validate stored access token and fetch current user
const verifyToken = async (req, res) => {
  try {
    const user = req.user;
    res.json({
      valid: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        bio: user.bio,
        profileImage: user.profileImage || user.avatar,
        favoriteGenres: user.favoriteGenres || [],
        readingPersona: user.readingPersona || "",
        readingStats: user.readingStats || {},
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Verification failed" });
  }
};
module.exports = {
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
  verifyToken
};
