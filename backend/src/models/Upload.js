const mongoose = require("mongoose");

const uploadSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    shareId: { type: String, required: true, unique: true },
    type: { type: String, enum: ["file", "text"], required: true },

    originalFileName: String,
    fileUrl: String,
    textContent: String,

    isPasswordProtected: { type: Boolean, default: false },
    passwordHash: String,

    maxViews: { type: Number, default: null }, // null = unlimited
    viewCount: { type: Number, default: 0 },
    maxViewsReachedAt: { type: Date, default: null },

    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Upload", uploadSchema);
