const cron = require("node-cron");
const Upload = require("../models/Upload");

const startCleanupJob = () => {
  // Runs every 1 minute (for demo; can be hourly in production)
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();

      const expiredUploads = await Upload.find({
        expiresAt: { $lt: now },
      });

      if (expiredUploads.length === 0) {
        return;
      }

      console.log(
        `🧹 Cleaning up ${expiredUploads.length} expired uploads`
      );

      await Upload.deleteMany({
        expiresAt: { $lt: now },
      });
    } catch (err) {
      console.error("Cleanup job failed:", err);
    }
  });

  console.log("🕒 Expired uploads cleanup job started");
};

module.exports = startCleanupJob;
