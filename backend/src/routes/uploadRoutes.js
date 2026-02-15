const express = require("express");
const router = express.Router();
const uploadMiddleware = require("../config/multer");
const requireAuth = require("../middleware/requireAuth");

const {
  createUpload,
  listUploads,
  deleteUpload,
} = require("../controllers/uploadController");
const {
  previewUpload,
  consumeUpload,
} = require("../controllers/viewController");

router.post(
  "/upload",
  requireAuth,
  uploadMiddleware.single("file"),
  createUpload
);
router.get("/list", requireAuth, listUploads);
router.delete("/upload/:shareId", requireAuth, deleteUpload);

// NEW
router.get("/view/:shareId", previewUpload);
router.get("/view/:shareId/consume", consumeUpload);

module.exports = router;
