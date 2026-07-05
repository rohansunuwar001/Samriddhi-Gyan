import { transcodeToHLS } from "../utils/transcoder.js";
import fs from "fs";
import path from "path";
import { Lecture } from "../models/lecture.model.js";
import { Section } from "../models/section.model.js";
import { updateCourseStats } from "../helpers/courseStats.helper.js";
import { spawn } from "child_process";
import ffmpegStatic from "ffmpeg-static";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const extractAudioAndTranscribe = async (videoPath, lectureId) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_api_key_here") {
    console.log("[transcription] Skipping: No valid GEMINI_API_KEY.");
    return "";
  }

  const audioPath = path.join(process.cwd(), "public", "hls", lectureId, "audio.mp3");
  
  try {
    console.log("[transcription] Extracting audio from video...");
    // Create lecture output dir if not exist
    const dir = path.dirname(audioPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // FFmpeg extraction
    await new Promise((resolve, reject) => {
      const args = [
        "-y",
        "-i", videoPath,
        "-vn",
        "-acodec", "libmp3lame",
        "-ab", "96k",
        "-ar", "16000",
        audioPath
      ];
      const proc = spawn(ffmpegStatic, args);
      let stderr = "";
      proc.stderr.on("data", (d) => { stderr += d.toString(); });
      proc.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`FFmpeg audio extraction failed: ${stderr.slice(-300)}`));
      });
    });

    console.log("[transcription] Uploading audio to Gemini File API...");
    const fileManager = new GoogleAIFileManager(apiKey);
    const uploadResult = await fileManager.uploadFile(audioPath, {
      mimeType: "audio/mp3",
      displayName: `Lecture Audio ${lectureId}`,
    });

    console.log("[transcription] File uploaded. URI:", uploadResult.file.uri);
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    console.log("[transcription] Triggering transcription from audio...");
    const result = await model.generateContent([
      {
        fileData: {
          fileUri: uploadResult.file.uri,
          mimeType: uploadResult.file.mimeType,
        },
      },
      { text: "Transcribe the audio speech word-for-word in English. Only output the transcription text, do not add headers or commentary." }
    ]);

    const transcript = await result.response.text();
    console.log("[transcription] Successful. Length:", transcript.length);

    // Clean up file from Gemini manager
    try {
      await fileManager.deleteFile(uploadResult.file.name);
    } catch (delErr) {
      console.warn("[transcription] Failed to delete file in Gemini:", delErr.message);
    }

    return transcript;
  } catch (err) {
    console.error("[transcription] Error:", err.message);
    return "";
  } finally {
    // Delete local audio.mp3
    try {
      if (fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
      }
    } catch {}
  }
};


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
      originalName: req.file.originalname || "",
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

      // Extract and transcribe speech in the background
      let transcriptText = "";
      try {
        transcriptText = await extractAudioAndTranscribe(rawPath, lectureId);
      } catch (trErr) {
        console.error("[uploadVideo] Transcription error:", trErr.message);
      }

      // Generate thumbnail from the raw upload (still available at this point)
      let thumbnailUrl = "";
      try {
        const thumbFilename = "thumb.jpg";
        const thumbPath = path.join(outputDir, thumbFilename);
        await new Promise((resolve, reject) => {
          const proc = spawn(ffmpegStatic, [
            "-i", rawPath,
            "-ss", "00:00:02",
            "-vframes", "1",
            "-vf", "scale=320:-1",
            "-y",
            thumbPath,
          ]);
          proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error("thumb failed"))));
          proc.on("error", reject);
        });
        const bUrl = process.env.BACKEND_URI || "http://localhost:8080";
        thumbnailUrl = `${bUrl}/hls/${lectureId}/${thumbFilename}`;
        console.log(`[uploadVideo] Thumbnail generated: ${thumbnailUrl}`);
      } catch (thumbErr) {
        console.error("[uploadVideo] Thumbnail generation error:", thumbErr.message);
      }

      await Lecture.findByIdAndUpdate(lectureId, {
        videoUrl: masterUrl,
        status: "ready",
        durationInSeconds: Math.round(metadata.duration),
        resolution: `${metadata.width}x${metadata.height}`,
        transcript: transcriptText,
        thumbnail: thumbnailUrl,
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
    const { title, description, isPreview } = req.body;

    const update = {};
    if (title !== undefined) {
      update.title = title.trim();
    }

    if (description !== undefined) {
      update.description = description.trim();
    }

    if (isPreview !== undefined) {
      update.isPreview = isPreview;
    }

    if (req.body.videoUrl !== undefined) {
      update.videoUrl = req.body.videoUrl;
    }

    if (req.body.status !== undefined) {
      update.status = req.body.status;
    }

    if (req.body.durationInSeconds !== undefined) {
      update.durationInSeconds = Number(req.body.durationInSeconds);
    }

    if (req.body.downloadable !== undefined) {
      update.downloadable = req.body.downloadable;
    }

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

// ─── Captions Management ──────────────────────────────────────────────────────

export const uploadCaption = async (req, res) => {
  try {
    const { lectureId } = req.params;
    const { language } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No subtitle file uploaded" });
    }

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      fs.rmSync(req.file.path, { force: true });
      return res.status(404).json({ success: false, message: "Lecture not found" });
    }

    const backendUrl = process.env.BACKEND_URI || "http://localhost:8080";
    const captionUrl = `${backendUrl}/uploads/captions/${req.file.filename}`;

    // Remove existing caption for the same language if present
    lecture.captions = lecture.captions.filter(c => c.language !== language);

    lecture.captions.push({
      language: language || "English (US)",
      url: captionUrl,
      filename: req.file.originalname,
    });

    await lecture.save();

    res.json({ success: true, message: "Caption uploaded successfully", lecture });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const toggleCaptionsDisable = async (req, res) => {
  try {
    const { lectureId } = req.params;
    const { disabled } = req.body;

    const lecture = await Lecture.findByIdAndUpdate(
      lectureId,
      { captionsDisabled: disabled === true || disabled === "true" },
      { new: true }
    );

    if (!lecture) {
      return res.status(404).json({ success: false, message: "Lecture not found" });
    }

    res.json({ success: true, message: "Captions visibility toggled", lecture });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteCaption = async (req, res) => {
  try {
    const { lectureId, captionId } = req.params;

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({ success: false, message: "Lecture not found" });
    }

    const caption = lecture.captions.id(captionId);
    if (caption) {
      try {
        const relativePath = caption.url.split("/uploads/")[1];
        if (relativePath) {
          const filePath = path.join(process.cwd(), "uploads", relativePath);
          fs.rmSync(filePath, { force: true });
        }
      } catch (err) {
        console.error("Failed to delete subtitle file on disk:", err);
      }
      
      lecture.captions.pull(captionId);
      await lecture.save();
    }

    res.json({ success: true, message: "Caption deleted successfully", lecture });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
