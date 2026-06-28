import { transcodeToHLS } from "../utils/transcoder.js";
import fs from "fs";
import path from "path";
import { Lecture } from "../models/lecture.model.js";
import { Section } from "../models/section.model.js";
import { updateCourseStats } from "../helpers/courseStats.helper.js";


/**
 * In-memory transcoding job tracker.
 * Stores live progress so the frontend can poll without hammering the DB.
 * On completion or failure, status is persisted to MongoDB.
 */
const jobs = new Map();

// ─── Create Lecture ───────────────────────────────────────────────────────────

export const createLecture = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { title, isPreview = false } = req.body;

    if (!title?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Title is required" });
    }

    const lecture = await Lecture.create({
      title: title.trim(),
      isPreview,
      videoUrl: null,
      status: "pending",
      section: sectionId, // required by Lecture schema
    });

    await Section.findByIdAndUpdate(sectionId, {
      $push: { lectures: lecture._id },
    });

    const section = await Section.findById(sectionId);

    await updateCourseStats(section.course);

    res.status(201).json({ success: true, lecture });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Upload Video ─────────────────────────────────────────────────────────────

export const uploadVideo = async (req, res) => {
  try {
    const { lectureId } = req.params;

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No video file uploaded" });
    }

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      fs.rmSync(req.file.path, { force: true });
      return res
        .status(404)
        .json({ success: false, message: "Lecture not found" });
    }

    // Initialise job tracker
    jobs.set(lectureId, {
      status: "transcoding",
      progress: 0,
      phase: "Starting FFmpeg…",
      error: null,
    });

    // Persist status immediately so the UI sees "processing" right away
    await Lecture.findByIdAndUpdate(lectureId, {
      status: "transcoding",
      videoUrl: null,
    });

    // Respond now — transcoding runs in the background
    res.json({
      success: true,
      message: "Video received. Transcoding started.",
      lectureId,
    });

    // ── Background pipeline ──────────────────────────────────────────────────
    const rawPath = req.file.path;

    // HLS output goes directly into public/hls/{lectureId}/
    // Express will serve this directory as static files
    const outputDir = path.join(process.cwd(), "public", "hls", lectureId);

    const setJob = (update) =>
      jobs.set(lectureId, { ...jobs.get(lectureId), ...update });

    try {
      // FFmpeg → HLS (single phase, 0 → 100%)
      const { renditions, metadata } = await transcodeToHLS(
        rawPath,
        outputDir,
        (pct) => {
          setJob({
            status: "transcoding",
            progress: pct,
            phase: `Transcoding… ${pct}%`,
          });
        },
      );

      console.log(
        `[uploadVideo] Done. Renditions: ${renditions.map((r) => r.name).join(", ")}`,
      );

      // Build the public URL for the master playlist
      // Express serves /public/hls/ at the /hls route (see app.js snippet below)
      const backendUrl = process.env.BACKEND_URI || "http://localhost:8080";
      const masterUrl = `${backendUrl}/hls/${lectureId}/master.m3u8`;

      await Lecture.findByIdAndUpdate(lectureId, {
        videoUrl: masterUrl,
        status: "ready",
        durationInSeconds: Math.round(metadata.duration),
        resolution: `${metadata.width}x${metadata.height}`,
      });

      const updatedLecture = await Lecture.findById(lectureId).populate({
        path: "section",
        select: "course",
      });

      await updateCourseStats(updatedLecture.section.course);

      setJob({ status: "ready", progress: 100, phase: "Ready" });
      console.log(`[uploadVideo] Lecture ${lectureId} live at ${masterUrl}`);
    } catch (err) {
      console.error(`[uploadVideo] Failed for ${lectureId}:`, err.message);
      setJob({
        status: "failed",
        progress: 0,
        phase: "Failed",
        error: err.message,
      });
      await Lecture.findByIdAndUpdate(lectureId, { status: "failed" });

      // Clean up partial HLS output on failure
      try {
        fs.rmSync(outputDir, { recursive: true, force: true });
      } catch {}
    } finally {
      // Always delete the raw upload — we don't need it after transcoding
      try {
        fs.rmSync(rawPath, { force: true });
      } catch {}
    }
    // ── End background pipeline ──────────────────────────────────────────────
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Get Transcoding Status (polled by frontend every 3s) ────────────────────

export const getLectureStatus = async (req, res) => {
  try {
    const { lectureId } = req.params;

    // In-memory is most current during active transcoding
    const job = jobs.get(lectureId);
    if (job) {
      return res.json({ success: true, lectureId, ...job });
    }

    // Fallback to DB (completed before server restart, or never started)
    const lecture = await Lecture.findById(lectureId).select(
      "status videoUrl durationInSeconds resolution",
    );
    if (!lecture) {
      return res
        .status(404)
        .json({ success: false, message: "Lecture not found" });
    }

    res.json({
      success: true,
      lectureId,
      status: lecture.status,
      progress: lecture.status === "ready" ? 100 : 0,
      phase: lecture.status === "ready" ? "Ready" : "Pending",
      videoUrl: lecture.videoUrl,
      durationInSeconds: lecture.durationInSeconds,
      resolution: lecture.resolution,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Update Lecture Metadata ──────────────────────────────────────────────────

export const updateLecture = async (req, res) => {
  try {
    const { lectureId } = req.params;
    const { title, isPreview } = req.body;

    const update = {};
    if (title !== undefined) update.title = title.trim();
    if (isPreview !== undefined) update.isPreview = isPreview;

    const lecture = await Lecture.findByIdAndUpdate(lectureId, update, {
      new: true,
    });
    if (!lecture) {
      return res
        .status(404)
        .json({ success: false, message: "Lecture not found" });
    }

    res.json({ success: true, lecture });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Delete Lecture ───────────────────────────────────────────────────────────

export const deleteLecture = async (req, res) => {
  try {
    const { lectureId } = req.params;

    const lecture = await Lecture.findByIdAndDelete(lectureId);
    if (!lecture) {
      return res
        .status(404)
        .json({ success: false, message: "Lecture not found" });
    }

    // Delete HLS files from disk
    const hlsDir = path.join(process.cwd(), "public", "hls", lectureId);
    try {
      fs.rmSync(hlsDir, { recursive: true, force: true });
    } catch {}

    // Remove from section
    await Section.findOneAndUpdate(
      { lectures: lectureId },
      { $pull: { lectures: lectureId } },
    );

    jobs.delete(lectureId);

    res.json({ success: true, message: "Lecture deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Get Lecture By ID ────────────────────────────────────────────────────────

export const getLectureById = async (req, res) => {
  try {
    const { lectureId } = req.params;
    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res
        .status(404)
        .json({ success: false, message: "Lecture not found" });
    }
    res.json({ success: true, lecture });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
