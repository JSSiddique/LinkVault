const crypto = require("crypto");
const bcrypt = require("bcrypt");
const Upload = require("../models/Upload");
const bucket = require("../config/firebase");

const createUpload = async (req, res) => {
  try {
    const { text, password, maxViews } = req.body;
    const owner = req.userId;

    if (!owner) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!text && !req.file) {
      return res.status(400).json({ message: "Text or file required" });
    }

    if (text && req.file) {
      return res.status(400).json({ message: "Only one allowed" });
    }

    const shareId = crypto.randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const uploadData = {
      owner,
      shareId,
      type: req.file ? "file" : "text",
      expiresAt,
      maxViews: maxViews ? Number(maxViews) : null,
      viewCount: 0,
    };

    if (password) {
      uploadData.isPasswordProtected = true;
      uploadData.passwordHash = await bcrypt.hash(password, 10);
    }

    if (req.file) {
      const fileName = `${shareId}-${req.file.originalname}`;
      const file = bucket.file(fileName);

      await file.save(req.file.buffer, {
        metadata: { contentType: req.file.mimetype },
      });

      await file.makePublic();

      uploadData.fileUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      uploadData.originalFileName = req.file.originalname;
    } else {
      uploadData.textContent = text;
    }

    await Upload.create(uploadData);
    res.status(201).json({ shareId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const listUploads = async (req, res) => {
  try {
    const owner = req.userId;

    if (!owner) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const uploads = await Upload.find({ owner }).sort({ createdAt: -1 });
    const now = new Date();

    const tenMinutesMs = 10 * 60 * 1000;

    return res.json(
      uploads
        .filter((u) => u.expiresAt >= now)
        .filter((u) => {
          const maxReached =
            u.maxViews !== null && u.viewCount >= u.maxViews;
          if (!maxReached) return true;
          const reachedAt = u.maxViewsReachedAt || now;
          return now - reachedAt <= tenMinutesMs;
        })
        .map((u) => {
          const maxReached =
            u.maxViews !== null && u.viewCount >= u.maxViews;
          return {
            shareId: u.shareId,
            type: u.type,
            originalFileName: u.originalFileName,
            expired: u.expiresAt < now,
            isPasswordProtected: u.isPasswordProtected,
            maxViews: u.maxViews,
            viewCount: u.viewCount,
            maxViewsReached: maxReached,
            maxViewsReachedAt: u.maxViewsReachedAt,
          };
        })
    );
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

const deleteUpload = async (req, res) => {
  try {
    const { shareId } = req.params;
    const owner = req.userId;

    if (!owner) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const upload = await Upload.findOne({ shareId });

    if (!upload) {
      return res.status(404).json({ message: "Link not found" });
    }

    if (String(upload.owner) !== owner) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (upload.type === "file" && upload.fileUrl) {
      try {
        const parsedUrl = new URL(upload.fileUrl);
        const objectPath = decodeURIComponent(
          parsedUrl.pathname.replace(/^\//, "").replace(`${bucket.name}/`, "")
        );

        if (objectPath) {
          await bucket.file(objectPath).delete({ ignoreNotFound: true });
        }
      } catch (err) {
        console.error("Failed to delete file from storage", err);
      }
    }

    await Upload.deleteOne({ _id: upload._id });
    return res.json({ message: "Link deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { createUpload, listUploads, deleteUpload };
