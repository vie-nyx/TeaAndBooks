const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

/* ================= SIGNUP ================= */

const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 12);

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      emailVerificationToken: hashedToken,
      emailVerificationExpire: Date.now() + 24 * 60 * 60 * 1000,
    });

    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${rawToken}`;

    await sendEmail({
      email: user.email,
      subject: "Verify your Entwined account 📚",
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: auto;">
          <h2>Welcome to Entwined!</h2>
          <p>Thanks for signing up. Please verify your email to get started.</p>
          <p>This link expires in <strong>24 hours</strong>.</p>
          <a href="${verificationUrl}" style="
            display: inline-block;
            background: #6c63ff;
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: bold;
            margin: 16px 0;
          ">Verify Email</a>
          <p style="color: #888; font-size: 13px;">
            If you did not create an account, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    res.status(201).json({
      message: "Signup successful. Please check your email to verify your account.",
    });
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
      emailVerificationExpire: { $gt: Date.now() },
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

/* ================= RESEND VERIFICATION EMAIL ================= */

const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    // Always respond the same way to avoid email enumeration attacks
    if (!user || user.isVerified) {
      return res.json({
        message:
          "If this email exists and is unverified, a new verification link has been sent.",
      });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${rawToken}`;

    await sendEmail({
      email: user.email,
      subject: "Resend: Verify your Entwined account 📚",
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: auto;">
          <h2>Verify your email</h2>
          <p>Here is your new verification link. It expires in <strong>24 hours</strong>.</p>
          <a href="${verificationUrl}" style="
            display: inline-block;
            background: #6c63ff;
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: bold;
            margin: 16px 0;
          ">Verify Email</a>
          <p style="color: #888; font-size: 13px;">
            If you did not request this, you can safely ignore it.
          </p>
        </div>
      `,
    });

    res.json({
      message:
        "If this email exists and is unverified, a new verification link has been sent.",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
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
      return res.status(403).json({
        message: "Please verify your email before logging in.",
        notVerified: true,
      });

    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(403).json({
        message: "Account locked. Try again later.",
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

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false, // set to true in production
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      accessToken,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
      },
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
        message: "If this email exists, a reset link has been sent.",
      });

    const rawToken = crypto.randomBytes(32).toString("hex");

    user.passwordResetToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    user.passwordResetExpire = Date.now() + 15 * 60 * 1000;
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;

    await sendEmail({
      email: user.email,
      subject: "Password Reset - Entwined",
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: auto;">
          <h2>Reset your password</h2>
          <p>Click the button below to reset your password. This link expires in <strong>15 minutes</strong>.</p>
          <a href="${resetUrl}" style="
            display: inline-block;
            background: #6c63ff;
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: bold;
            margin: 16px 0;
          ">Reset Password</a>
          <p style="color: #888; font-size: 13px;">
            If you did not request this, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    res.json({ message: "Reset link sent" });
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
      passwordResetExpire: { $gt: Date.now() },
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

/* ================= GOOGLE LOGIN ================= */

const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        username: name,
        email,
        password: null,
        isVerified: true, // Google accounts skip email verification
      });
    }

    // Use the same access/refresh token pattern as regular login
    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false, // set to true in production
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      accessToken,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
      },
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
        createdAt: user.createdAt,
      },
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
  verifyToken,
};