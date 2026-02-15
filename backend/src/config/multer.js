const multer = require("multer");

const storage = multer.memoryStorage();

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const allowedMimeTypes = [
  "application/pdf",
  "application/json",
];

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const isAllowed =
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("video/") ||
      file.mimetype.startsWith("text/") ||
      allowedMimeTypes.includes(file.mimetype);

    if (!isAllowed) {
      return cb(new Error("Invalid file type"));
    }

    return cb(null, true);
  },
});

module.exports = upload;
