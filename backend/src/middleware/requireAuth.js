const { verify } = require("../utils/authToken");

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const token = authHeader.slice(7).trim();
  const secret = process.env.AUTH_TOKEN_SECRET;

  if (!secret) {
    return res.status(500).json({ message: "Auth secret not configured" });
  }

  try {
    const payload = verify(token, secret);
    req.userId = payload.sub;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = requireAuth;
