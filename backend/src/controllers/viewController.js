const Upload = require("../models/Upload");
const bcrypt = require("bcrypt");

/**
 * PREVIEW (NO VIEW COUNT)
 */
const previewUpload = async (req, res) => {
  try {
    const { shareId } = req.params;
    const { password } = req.query;

    const upload = await Upload.findOne({ shareId });
    if (!upload) {
      return res.status(404).json({ message: "Invalid link" });
    }

    if (upload.expiresAt < new Date()) {
      return res.status(410).json({ message: "Link expired" });
    }

    if (upload.isPasswordProtected) {
      if (!password) {
        return res.status(401).json({ message: "Password required" });
      }

      const ok = await bcrypt.compare(password, upload.passwordHash);
      if (!ok) {
        return res.status(403).json({ message: "Invalid password" });
      }
    }

    if (
      upload.maxViews !== null &&
      upload.viewCount >= upload.maxViews
    ) {
      if (!upload.maxViewsReachedAt) {
        upload.maxViewsReachedAt = new Date();
        await upload.save();
      }
      return res
        .status(410)
        .json({ message: "Maximum views reached" });
    }

    // PREVIEW RESPONSE
    if (upload.type === "text") {
      return res.json({
        type: "text",
        content: upload.textContent,
        viewCount: upload.viewCount,
        maxViews: upload.maxViews,
      });
    }

    return res.json({
      type: "file",
      fileName: upload.originalFileName,
      viewCount: upload.viewCount,
      maxViews: upload.maxViews,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * CONSUME (INCREMENT VIEW COUNT)
 */
const consumeUpload = async (req, res) => {
  try {
    const { shareId } = req.params;
    const { password } = req.query;

    const upload = await Upload.findOne({ shareId });
    if (!upload) {
      return res.status(404).json({ message: "Invalid link" });
    }

    if (upload.expiresAt < new Date()) {
      return res.status(410).json({ message: "Link expired" });
    }

    if (upload.isPasswordProtected) {
      const ok = await bcrypt.compare(password || "", upload.passwordHash);
      if (!ok) {
        return res.status(403).json({ message: "Invalid password" });
      }
    }

    if (
      upload.maxViews !== null &&
      upload.viewCount >= upload.maxViews
    ) {
      return res
        .status(410)
        .json({ message: "Maximum views reached" });
    }

    // 🔢 INCREMENT HERE (ONLY HERE)
    upload.viewCount += 1;
    if (
      upload.maxViews !== null &&
      upload.viewCount >= upload.maxViews &&
      !upload.maxViewsReachedAt
    ) {
      upload.maxViewsReachedAt = new Date();
    }
    await upload.save();

    if (upload.type === "text") {
      return res.json({
        type: "text",
        content: upload.textContent,
        viewCount: upload.viewCount,
        maxViews: upload.maxViews,
      });
    }

    if (req.query.json === "1") {
      return res.json({
        type: "file",
        fileName: upload.originalFileName,
        fileUrl: upload.fileUrl,
        viewCount: upload.viewCount,
        maxViews: upload.maxViews,
      });
    }

    return res.redirect(upload.fileUrl);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { previewUpload, consumeUpload };
