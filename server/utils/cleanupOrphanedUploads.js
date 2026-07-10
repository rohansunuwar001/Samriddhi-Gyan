import fs from "fs";
import path from "path";

/**
 * Deletes any orphaned raw files left over in the uploads directory on startup.
 */
export const cleanupOrphanedUploads = () => {
  try {
    const uploadDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadDir)) return;

    const files = fs.readdirSync(uploadDir);
    let count = 0;
    for (const file of files) {
      const filePath = path.join(uploadDir, file);
      const stat = fs.statSync(filePath);
      if (stat.isFile()) {
        fs.unlinkSync(filePath);
        count++;
      }
    }
    if (count > 0) {
      console.log(`[Cleanup] Successfully deleted ${count} orphaned raw upload file(s) from uploads directory.`);
    }
  } catch (error) {
    console.error("[Cleanup] Error cleaning up orphaned uploads:", error.message);
  }
};
