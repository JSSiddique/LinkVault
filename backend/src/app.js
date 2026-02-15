const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const startCleanupJob = require("./jobs/cleanupExpiredUploads");

dotenv.config();

const connectDB = require("./config/db");
const uploadRoutes = require("./routes/uploadRoutes");
const authRoutes = require("./routes/authRoutes");
const multer = require("multer");

const app = express();

app.use(cors());
app.use(express.json());

const bucket = require("./config/firebase");

app.use("/api/auth", authRoutes);
app.use("/api", uploadRoutes);

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ message: "File size is too large" });
    }
    return res.status(400).json({ message: err.message });
  }

  if (err && err.message === "Invalid file type") {
    return res.status(400).json({ message: "Invalid file type" });
  }

  if (err) {
    return res.status(500).json({ message: "Server error" });
  }

  return next();
});

app.get("/", (req, res) => {
  res.send("LinkVault backend is running");
});

const PORT = 3000;

const startServer = async () => {
  await connectDB();

  // 🕒 Start background cleanup job
  startCleanupJob();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
