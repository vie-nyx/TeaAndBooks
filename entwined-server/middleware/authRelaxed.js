const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authRelaxed = async (req, res, next) => {
  try {
    console.log("🔒 [AUTH RELAXED] ===== Request received =====");
    console.log("🔒 [AUTH RELAXED] Method:", req.method);
    console.log("🔒 [AUTH RELAXED] URL:", req.url);
    console.log("🔒 [AUTH RELAXED] All headers:", JSON.stringify(req.headers, null, 2));
    
    const authHeader = req.headers.authorization;
    console.log("🔒 [AUTH RELAXED] Authorization header:", authHeader);
    console.log("🔒 [AUTH RELAXED] Authorization header type:", typeof authHeader);
    console.log("🔒 [AUTH RELAXED] Authorization header length:", authHeader?.length || 0);

    if (!authHeader) {
      console.log("❌ [AUTH RELAXED] No Authorization header provided");
      return res.status(401).json({ message: "No token provided" });
    }

    if (!authHeader.startsWith("Bearer ")) {
      console.log("❌ [AUTH RELAXED] Malformed Authorization header - doesn't start with 'Bearer '");
      console.log("❌ [AUTH RELAXED] Header value:", authHeader);
      return res.status(401).json({ message: "Malformed token header" });
    }

    const token = authHeader.split(" ")[1];
    console.log("🔒 [AUTH RELAXED] Extracted token:", token ? token.substring(0, 30) + "..." : "null");
    console.log("🔒 [AUTH RELAXED] Token length:", token?.length || 0);
    console.log("🔒 [AUTH RELAXED] Token type:", typeof token);

    if (!token || token === "undefined" || token === "null") {
      console.log("❌ [AUTH RELAXED] Invalid token value:", token);
      return res.status(401).json({ message: "Invalid token" });
    }

    console.log("🔒 [AUTH RELAXED] Verifying JWT token...");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ [AUTH RELAXED] Token verified successfully");
    console.log("🔒 [AUTH RELAXED] Decoded token:", {
      id: decoded.id,
      tokenVersion: decoded.tokenVersion,
      iat: decoded.iat,
      exp: decoded.exp
    });

    console.log("🔒 [AUTH RELAXED] Finding user in database...");
    const user = await User.findById(decoded.id);

    if (!user) {
      console.log("❌ [AUTH RELAXED] User not found for decoded token ID:", decoded.id);
      return res.status(403).json({ message: "User not found" });
    }

    console.log("✅ [AUTH RELAXED] User found:", {
      id: user._id,
      username: user.username,
      email: user.email
    });

    req.user = user;
    req.userId = user._id;

    console.log("✅ [AUTH RELAXED] Authentication successful - proceeding to route handler");
    console.log("🔒 [AUTH RELAXED] ===== End auth check =====\n");

    next();

  } catch (err) {
    console.error("❌ [AUTH RELAXED] Authentication error:", err.message);
    console.error("❌ [AUTH RELAXED] Error stack:", err.stack);
    return res.status(403).json({ message: "Invalid token" });
  }
};

module.exports = authRelaxed;