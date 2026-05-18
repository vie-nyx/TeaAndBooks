const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authRelaxed = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Malformed token header" });
    }

    const token = authHeader.split(" ")[1];

    if (!token || token === "undefined" || token === "null") {
      return res.status(401).json({ message: "Invalid token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(403).json({ message: "User not found" });
    }

    req.user = user;
    req.userId = user._id;

    next();

  } catch (err) {
    return res.status(403).json({ message: "Invalid token" });
  }
};

module.exports = authRelaxed;