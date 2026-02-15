const bcrypt = require("bcrypt");
const User = require("../models/User");
const { issueAuthToken } = require("../utils/authToken");

const normalizeEmail = (email = "") => email.trim().toLowerCase();

const register = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = req.body.password || "";

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash });

    const secret = process.env.AUTH_TOKEN_SECRET;
    if (!secret) {
      return res.status(500).json({ message: "Auth secret not configured" });
    }

    const token = issueAuthToken(String(user._id), secret);

    return res.status(201).json({
      token,
      user: { id: String(user._id), email: user.email },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

const login = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = req.body.password || "";

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const secret = process.env.AUTH_TOKEN_SECRET;
    if (!secret) {
      return res.status(500).json({ message: "Auth secret not configured" });
    }

    const token = issueAuthToken(String(user._id), secret);

    return res.json({
      token,
      user: { id: String(user._id), email: user.email },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

const me = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("_id email");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user: { id: String(user._id), email: user.email } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { register, login, me };
