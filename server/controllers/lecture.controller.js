import { transcodeToHLS } from "../utils/transcoder.js";
import {
  uploadHLSToB2,
  deleteHLSFromB2,
  isB2Configured,
  initiateMultipartUpload,
  getMultipartPartSignedUrls,
  completeMultipartUpload,
  abortMultipartUpload,
} from "../utils/b2Storage.js";
import axios from "axios";
import fs from "fs";
import path from "path";
import { Lecture } from "../models/lecture.model.js";
import { Section } from "../models/section.model.js";
import { updateCourseStats } from "../helpers/courseStats.helper.js";
import { spawn } from "child_process";
import ffmpegStatic from "ffmpeg-static";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { uploadDocument, deleteFromCloudinary } from "../utils/cloudinary.js";

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

      // Extract and transcribe speech in non-blocking background task
      extractAudioAndTranscribe(rawPath, lectureId)
        .then(async (transcriptText) => {
          if (transcriptText) {
            await Lecture.findByIdAndUpdate(lectureId, { transcript: transcriptText });
            console.log(`[uploadVideo] Background transcript updated for ${lectureId}`);
          }
        })
        .catch((trErr) => {
          console.error("[uploadVideo] Transcription error:", trErr.message);
        });

      // Generate thumbnail from the raw upload
      const thumbFilename = "thumb.jpg";
      const thumbPath = path.join(outputDir, thumbFilename);
      try {
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
      } catch (thumbErr) {
        console.error("[uploadVideo] Thumbnail generation error:", thumbErr.message);
      }

      let masterUrl = "";
      let thumbnailUrl = "";

      // Upload HLS directory to Backblaze B2 if configured
      if (isB2Configured()) {
        setJob({
          status: "uploading",
          progress: 80,
          phase: "Uploading HLS chunks to Backblaze B2…",
        });

        const b2Result = await uploadHLSToB2(
          outputDir,
          `lectures/${lectureId}`,
          (pct) => {
            setJob({
              status: "uploading",
              progress: 80 + Math.round(pct * 0.18),
              phase: `Uploading to Backblaze B2… ${pct}%`,
            });
          },
        );

        masterUrl = b2Result.masterUrl;
        thumbnailUrl = b2Result.thumbnailUrl;

        // Clean up temporary local HLS output directory
        try {
          fs.rmSync(outputDir, { recursive: true, force: true });
          console.log(`[uploadVideo] Cleaned up local HLS directory: ${outputDir}`);
        } catch (cleanupErr) {
          console.warn("[uploadVideo] Failed to clean up local HLS dir:", cleanupErr.message);
        }
      } else {
        // Fallback to local static serving if B2 is not configured
        const backendUrl = process.env.BACKEND_URI || "http://localhost:8080";
        masterUrl = `${backendUrl}/hls/${lectureId}/master.m3u8`;
        if (fs.existsSync(thumbPath)) {
          thumbnailUrl = `${backendUrl}/hls/${lectureId}/${thumbFilename}`;
        }
      }

      await Lecture.findByIdAndUpdate(lectureId, {
        videoUrl: masterUrl,
        status: "ready",
        durationInSeconds: Math.round(metadata.duration),
        resolution: `${metadata.width}x${metadata.height}`,
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

// ─── Direct-to-Cloud Chunked (Multipart) Upload ─────────────────────────────

export const initiateChunkedUpload = async (req, res) => {
  try {
    const { lectureId } = req.params;
    const { fileName, fileType = "video/mp4", fileSize, chunkSize = 10 * 1024 * 1024 } = req.body;

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({ success: false, message: "Lecture not found" });
    }

    if (!fileSize || fileSize <= 0) {
      return res.status(400).json({ success: false, message: "Valid fileSize is required" });
    }

    const ext = path.extname(fileName || "").toLowerCase() || ".mp4";
    const cleanFileName = (fileName || "video").replace(/[^a-zA-Z0-9._-]/g, "_");
    const rawKey = `raw-uploads/${lectureId}/${Date.now()}-${cleanFileName}`;

    const totalParts = Math.ceil(fileSize / chunkSize);

    const { uploadId } = await initiateMultipartUpload(rawKey, fileType);
    const parts = await getMultipartPartSignedUrls(rawKey, uploadId, totalParts);

    await Lecture.findByIdAndUpdate(lectureId, {
      status: "uploading",
      originalName: fileName || "video.mp4",
    });

    res.json({
      success: true,
      uploadId,
      key: rawKey,
      totalParts,
      chunkSize,
      parts,
    });
  } catch (err) {
    console.error("[initiateChunkedUpload] Error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const completeChunkedUpload = async (req, res) => {
  try {
    const { lectureId } = req.params;
    const { uploadId, key, parts } = req.body;

    if (!uploadId || !key || !parts || !Array.isArray(parts)) {
      return res.status(400).json({
        success: false,
        message: "uploadId, key, and parts array are required",
      });
    }

    const lecture = await Lecture.findById(lectureId).populate({
      path: "section",
      select: "course",
    });

    if (!lecture) {
      return res.status(404).json({ success: false, message: "Lecture not found" });
    }

    // Assemble parts in Backblaze B2
    console.log(`[completeChunkedUpload] Completing B2 multipart upload for lecture ${lectureId}...`);
    await completeMultipartUpload(key, uploadId, parts);

    // Update status to transcoding
    await Lecture.findByIdAndUpdate(lectureId, {
      status: "transcoding",
    });

    // Notify dedicated video transcoder server
    const videoServerUrl = process.env.VIDEO_SERVER_URL || "http://localhost:8081";
    try {
      console.log(`[completeChunkedUpload] Triggering transcoder service at ${videoServerUrl}...`);
      await axios.post(
        `${videoServerUrl}/api/v1/jobs/transcode`,
        {
          lectureId,
          rawKey: key,
          sectionId: lecture.section?._id,
          courseId: lecture.section?.course,
        },
        { timeout: 5000 }
      );
      console.log(`[completeChunkedUpload] Job accepted by transcoder service for ${lectureId}`);
    } catch (workerErr) {
      console.warn(
        `[completeChunkedUpload] Transcoder service not reachable at ${videoServerUrl}. (Make sure video-server is running on port 8081). Error:`,
        workerErr.message
      );
    }

    res.json({
      success: true,
      message: "Chunked upload complete. Video transcoding dispatched.",
      lectureId,
    });
  } catch (err) {
    console.error("[completeChunkedUpload] Error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const abortChunkedUpload = async (req, res) => {
  try {
    const { uploadId, key } = req.body;
    if (uploadId && key) {
      await abortMultipartUpload(key, uploadId);
    }
    res.json({ success: true, message: "Upload aborted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Webhook for Video Server to Update Lecture on Completion ────────────────

export const webhookLectureComplete = async (req, res) => {
  try {
    const { lectureId } = req.params;
    const {
      videoUrl,
      thumbnail,
      durationInSeconds,
      resolution,
      status,
      transcript,
      error,
    } = req.body;

    const lecture = await Lecture.findById(lectureId).populate({
      path: "section",
      select: "course",
    });

    if (!lecture) {
      return res.status(404).json({ success: false, message: "Lecture not found" });
    }

    const update = {};
    if (videoUrl) update.videoUrl = videoUrl;
    if (thumbnail) update.thumbnail = thumbnail;
    if (durationInSeconds !== undefined) update.durationInSeconds = durationInSeconds;
    if (resolution) update.resolution = resolution;
    if (status) update.status = status;
    if (transcript) update.transcript = transcript;

    await Lecture.findByIdAndUpdate(lectureId, update);

    if (status === "ready" && lecture.section?.course) {
      await updateCourseStats(lecture.section.course);
    }

    console.log(`[webhookLectureComplete] Lecture ${lectureId} updated with status: ${status || 'partial update'}`);
    res.json({ success: true });
  } catch (err) {
    console.error("[webhookLectureComplete] Error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Get Transcoding Status (polled by frontend every 3s) ────────────────────

export const getLectureStatus = async (req, res) => {
  try {
    const { lectureId } = req.params;

    // Prevent browser 304 caching confusion
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");

    // 1. Check dedicated video transcoder server first
    const videoServerUrl = process.env.VIDEO_SERVER_URL || "http://localhost:8081";
    try {
      const { data } = await axios.get(`${videoServerUrl}/api/v1/jobs/${lectureId}/status`, {
        timeout: 1500,
      });
      if (data?.success && data?.job) {
        return res.json({
          success: true,
          lectureId,
          ...data.job,
        });
      }
    } catch {
      // Transcoder service either busy or not running local fallback
    }

    // 2. In-memory local job tracker (for backward compatibility if run locally)
    const job = jobs.get(lectureId);
    if (job) {
      return res.json({ success: true, lectureId, ...job });
    }

    // 3. Fallback to DB
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

    // Delete HLS files from Backblaze B2 if configured
    try {
      await deleteHLSFromB2(`lectures/${lectureId}`);
    } catch (b2Err) {
      console.error(`[deleteLecture] Failed to delete B2 objects for lecture ${lectureId}:`, b2Err.message);
    }

    // Delete HLS files from local disk if present
    const hlsDir = path.join(process.cwd(), "public", "hls", lectureId);
    try {
      fs.rmSync(hlsDir, { recursive: true, force: true });
    } catch {}

    // Remove from section
    const updatedSec = await Section.findOneAndUpdate(
      { lectures: lectureId },
      { $pull: { lectures: lectureId } },
      { new: true }
    );

    if (updatedSec?.course) {
      await updateCourseStats(updatedSec.course);
    }

    jobs.delete(lectureId);

    res.json({ success: true, message: "Lecture deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Course Stats Helper for Lecture Updates ─────────────────────────────────
const refreshCourseStatsForLecture = async (lecture) => {
  try {
    if (!lecture) return;
    const section = await Section.findById(lecture.section);
    if (section?.course) {
      await updateCourseStats(section.course);
    }
  } catch (err) {
    console.warn("[refreshCourseStatsForLecture] Warning:", err.message);
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
    await refreshCourseStatsForLecture(lecture);

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

    await refreshCourseStatsForLecture(lecture);

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
      await refreshCourseStatsForLecture(lecture);
    }

    res.json({ success: true, message: "Caption deleted successfully", lecture });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Resources Management ───────────────────────────────────────────────────

export const addLectureResourceLink = async (req, res) => {
  try {
    const { lectureId } = req.params;
    const { title, url } = req.body;

    if (!title?.trim() || !url?.trim()) {
      return res.status(400).json({ success: false, message: "Title and URL are required" });
    }

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({ success: false, message: "Lecture not found" });
    }

    const isPdf = /\.pdf($|\?)/i.test(url) || /drive\.google\.com.*(pdf|view)/i.test(url);
    const newResource = {
      title: title.trim(),
      url: url.trim(),
      type: isPdf ? "pdf" : "link",
    };

    lecture.resources.push(newResource);
    await lecture.save();
    await refreshCourseStatsForLecture(lecture);

    res.json({ success: true, message: "Resource link added successfully", lecture });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const uploadLectureResourceFile = async (req, res) => {
  try {
    const { lectureId } = req.params;
    const { title } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      fs.rmSync(req.file.path, { force: true });
      return res.status(404).json({ success: false, message: "Lecture not found" });
    }

    const uploadRes = await uploadDocument(req.file.path, req.file.originalname);
    if (!uploadRes?.secure_url) {
      return res.status(500).json({ success: false, message: "Failed to upload file to Cloudinary" });
    }

    const isPdf = req.file.mimetype === "application/pdf" || req.file.originalname.toLowerCase().endsWith(".pdf");
    const sizeMb = (req.file.size / (1024 * 1024)).toFixed(2);

    const resourceItem = {
      title: (title || req.file.originalname).trim(),
      url: uploadRes.secure_url,
      type: isPdf ? "pdf" : "file",
      publicId: uploadRes.public_id,
      size: `${sizeMb} MB`,
    };

    lecture.resources.push(resourceItem);
    await lecture.save();
    await refreshCourseStatsForLecture(lecture);

    res.json({ success: true, message: "Resource file uploaded successfully to Cloudinary", lecture });
  } catch (err) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.rmSync(req.file.path, { force: true });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteLectureResource = async (req, res) => {
  try {
    const { lectureId, resourceId } = req.params;

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({ success: false, message: "Lecture not found" });
    }

    const resItem = lecture.resources.id(resourceId);
    if (resItem) {
      if (resItem.publicId) {
        try {
          await deleteFromCloudinary(resItem.publicId, "image");
          await deleteFromCloudinary(resItem.publicId, "raw");
        } catch (delErr) {
          console.warn("Failed to delete resource from Cloudinary:", delErr.message);
        }
      }
      lecture.resources.pull(resourceId);
      await lecture.save();
      await refreshCourseStatsForLecture(lecture);
    }

    res.json({ success: true, message: "Resource deleted successfully", lecture });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Lab Configuration ───────────────────────────────────────────────────────

export const updateLectureLab = async (req, res) => {
  try {
    const { lectureId } = req.params;
    const { title, description, url, pdfUrl, isActive } = req.body;

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({ success: false, message: "Lecture not found" });
    }

    lecture.lab = {
      ...lecture.lab,
      title: title !== undefined ? title.trim() : lecture.lab?.title || "",
      description: description !== undefined ? description.trim() : lecture.lab?.description || "",
      url: url !== undefined ? url.trim() : lecture.lab?.url || "",
      pdfUrl: pdfUrl !== undefined ? pdfUrl.trim() : lecture.lab?.pdfUrl || "",
      isActive: isActive !== undefined ? isActive : true,
      updatedAt: new Date(),
    };

    await lecture.save();
    await refreshCourseStatsForLecture(lecture);
    res.json({ success: true, message: "Lab configuration updated successfully", lecture });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const uploadLectureLabPdf = async (req, res) => {
  try {
    const { lectureId } = req.params;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No PDF file uploaded" });
    }

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      fs.rmSync(req.file.path, { force: true });
      return res.status(404).json({ success: false, message: "Lecture not found" });
    }

    if (lecture.lab?.pdfPublicId) {
      try {
        await deleteFromCloudinary(lecture.lab.pdfPublicId, "image");
        await deleteFromCloudinary(lecture.lab.pdfPublicId, "raw");
      } catch {}
    }

    const uploadRes = await uploadDocument(req.file.path, req.file.originalname);
    if (!uploadRes?.secure_url) {
      return res.status(500).json({ success: false, message: "Failed to upload Lab PDF to Cloudinary" });
    }

    if (!lecture.lab) {
      lecture.lab = {};
    }
    lecture.lab.pdfUrl = uploadRes.secure_url;
    lecture.lab.pdfPublicId = uploadRes.public_id;
    lecture.lab.pdfName = req.file.originalname;
    lecture.lab.isActive = true;
    lecture.lab.updatedAt = new Date();

    await lecture.save();
    await refreshCourseStatsForLecture(lecture);
    res.json({ success: true, message: "Lab assignment PDF uploaded successfully to Cloudinary", lecture });
  } catch (err) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.rmSync(req.file.path, { force: true });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteLectureLab = async (req, res) => {
  try {
    const { lectureId } = req.params;

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({ success: false, message: "Lecture not found" });
    }

    if (lecture.lab?.pdfPublicId) {
      try {
        await deleteFromCloudinary(lecture.lab.pdfPublicId, "image");
        await deleteFromCloudinary(lecture.lab.pdfPublicId, "raw");
      } catch {}
    }

    lecture.lab = {
      title: "",
      description: "",
      url: "",
      pdfUrl: "",
      pdfPublicId: "",
      pdfName: "",
      isActive: false,
    };

    await lecture.save();
    await refreshCourseStatsForLecture(lecture);
    res.json({ success: true, message: "Lab configuration removed", lecture });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
