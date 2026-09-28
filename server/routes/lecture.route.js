import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { isAuthenticated } from '../middlewares/isAuthenticated.js';
import {
  createLecture,
  uploadVideo,
  initiateChunkedUpload,
  completeChunkedUpload,
  abortChunkedUpload,
  webhookLectureComplete,
  getLectureStatus,
  updateLecture,
  deleteLecture,
  getLectureById,
  uploadCaption,
  toggleCaptionsDisable,
  deleteCaption,
  addLectureResourceLink,
  uploadLectureResourceFile,
  deleteLectureResource,
  updateLectureLab,
  uploadLectureLabPdf,
  deleteLectureLab,
} from '../controllers/lecture.controller.js';
import { webhookPromoComplete } from '../controllers/course.controller.js';

const router = express.Router();

// ─── Multer config for resource/document uploads (PDFs, files, zips) ─────────
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), 'uploads', 'documents');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${req.params.lectureId}-${Date.now()}${ext}`);
  },
});

const uploadDocumentMiddleware = multer({
  storage: documentStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
});

// ─── Multer config for captions uploads ──────────────────────────────────────
const captionsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), 'uploads', 'captions');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.vtt';
    cb(null, `${req.params.lectureId}-${Date.now()}${ext}`);
  },
});

const uploadCaptionMiddleware = multer({
  storage: captionsStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
});

// ─── Multer config for raw video uploads ──────────────────────────────────────

const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), 'uploads', 'raw');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Use lectureId as filename so we can find and clean it up later
    const ext = path.extname(file.originalname).toLowerCase() || '.mp4';
    cb(null, `${req.params.lectureId}${ext}`);
  },
});

const uploadMiddleware = multer({
  storage: videoStorage,
  // 20GB limit — supports 4K files. Adjust if you need more.
  limits: { fileSize: 20 * 1024 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-matroska'];
    if (allowed.includes(file.mimetype) || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Please upload a video file.`));
    }
  },
});

// ─── Routes ───────────────────────────────────────────────────────────────────

// Create a lecture entry (no video yet)
router.post('/sections/:sectionId/lectures', isAuthenticated, createLecture);

// Upload video to an existing lecture + trigger FFmpeg + R2 (legacy fallback)
router.post('/lectures/:lectureId/upload', isAuthenticated, uploadMiddleware.single('video'), uploadVideo);

// Direct-to-Cloud Chunked (Multipart) Upload
router.post('/lectures/:lectureId/multipart/initiate', isAuthenticated, initiateChunkedUpload);
router.post('/lectures/:lectureId/multipart/complete', isAuthenticated, completeChunkedUpload);
router.post('/lectures/:lectureId/multipart/abort', isAuthenticated, abortChunkedUpload);

// Internal webhook for Dedicated Video Transcoder Server
router.post('/internal/lectures/:lectureId/complete', webhookLectureComplete);
router.post('/internal/promo/:courseId/complete', webhookPromoComplete);

// Poll transcoding/upload progress (frontend polls this every 3s)
router.get('/lectures/:lectureId/status', isAuthenticated, getLectureStatus);

// Update lecture title / isPreview
router.patch('/lectures/:lectureId', isAuthenticated, updateLecture);

// Delete lecture + R2 cleanup
router.delete('/lectures/:lectureId', isAuthenticated, deleteLecture);

// Get lecture (used by student player to get the videoUrl)
router.get('/lectures/:lectureId', getLectureById);

// Upload subtitle file as caption
router.post('/lectures/:lectureId/captions', isAuthenticated, uploadCaptionMiddleware.single('caption'), uploadCaption);

// Toggle captions visibility status (disable/enable)
router.put('/lectures/:lectureId/captions/toggle-disable', isAuthenticated, toggleCaptionsDisable);

// Delete caption from a lecture
router.delete('/lectures/:lectureId/captions/:captionId', isAuthenticated, deleteCaption);

// ─── Resources Endpoints ──────────────────────────────────────────────────────
router.post('/lectures/:lectureId/resources/link', isAuthenticated, addLectureResourceLink);
router.post('/lectures/:lectureId/resources/upload', isAuthenticated, uploadDocumentMiddleware.single('file'), uploadLectureResourceFile);
router.delete('/lectures/:lectureId/resources/:resourceId', isAuthenticated, deleteLectureResource);

// ─── Lab Endpoints ────────────────────────────────────────────────────────────
router.put('/lectures/:lectureId/lab', isAuthenticated, updateLectureLab);
router.post('/lectures/:lectureId/lab/upload', isAuthenticated, uploadDocumentMiddleware.single('file'), uploadLectureLabPdf);
router.delete('/lectures/:lectureId/lab', isAuthenticated, deleteLectureLab);

// ─── Multer error handler ─────────────────────────────────────────────────────

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ success: false, message: 'File too large. Maximum size is 20GB.' });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
});

export default router;