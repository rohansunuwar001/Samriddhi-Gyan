import fs from "fs";
import path from "path";
import { Lecture } from "../models/lecture.model.js";

/**
 * Scans public/hls/ and deletes any directories belonging to lectures
 * that are either deleted from the database or have a "failed" status.
 */
export const cleanupStaleHLS = async () => {
  try {
    if (!process.env.RENDER) {
      console.log("[Cleanup] Local environment detected. Skipping HLS directory pruning to keep local files safe.");
      return;
    }

    const hlsDir = path.join(process.cwd(), "public", "hls");
    if (!fs.existsSync(hlsDir)) return;

    // Fetch all lectures from database
    const lectures = await Lecture.find({}, "_id status").lean();
    const activeLectureIds = new Set(lectures.map(l => l._id.toString()));
    const failedLectureIds = new Set(
      lectures.filter(l => l.status === "failed").map(l => l._id.toString())
    );

    const folders = fs.readdirSync(hlsDir);
    let count = 0;

    for (const folder of folders) {
      const folderPath = path.join(hlsDir, folder);
      const stat = fs.statSync(folderPath);

      if (stat.isDirectory()) {
        // Extract lecture ID by stripping "promo-" prefix if present
        const lectureId = folder.replace(/^promo-/, "");

        const isNotActive = !activeLectureIds.has(lectureId);
        const isFailed = failedLectureIds.has(lectureId);

        if (isNotActive || isFailed) {
          fs.rmSync(folderPath, { recursive: true, force: true });
          count++;
          console.log(
            `[Cleanup] Deleted stale HLS folder: ${folder} (${
              isNotActive ? "Orphaned/Deleted" : "Transcoding Failed"
            })`
          );
        }
      }
    }

    if (count > 0) {
      console.log(`[Cleanup] Successfully pruned ${count} stale HLS folder(s).`);
    }
  } catch (error) {
    console.error("[Cleanup] Error pruning stale HLS folders:", error.message);
  }
};
