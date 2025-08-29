// middlewares/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    let token = req.headers.authorization;

    if (token && token.startsWith("Bearer")) {
      token = token.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      console.log("Decoded JWT:", decoded); // Debug
      req.user = await User.findById(decoded.id || decoded._id).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "User not found" });
      }

      next();
    } else {
      return res.status(401).json({ message: "Please login to access this route" });
    }
  } catch (error) {
    console.error("JWT ERROR:", error);
    return res.status(401).json({ message: "Token failed", error: error.message });
  }
};

module.exports = { protect };
