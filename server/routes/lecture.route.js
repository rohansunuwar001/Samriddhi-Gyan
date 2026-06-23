import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { isAuthenticated } from '../middlewares/isAuthenticated.js';
import {
  createLecture,
  uploadVideo,
  getLectureStatus,
  updateLecture,
  deleteLecture,
  getLectureById,
} from '../controllers/lecture.controller.js';

const router = express.Router();

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

// Upload video to an existing lecture + trigger FFmpeg + R2
router.post('/lectures/:lectureId/upload', isAuthenticated, uploadMiddleware.single('video'), uploadVideo);

// Poll transcoding/upload progress (frontend polls this every 3s)
router.get('/lectures/:lectureId/status', isAuthenticated, getLectureStatus);

// Update lecture title / isPreview
router.patch('/lectures/:lectureId', isAuthenticated, updateLecture);

// Delete lecture + R2 cleanup
router.delete('/lectures/:lectureId', isAuthenticated, deleteLecture);

// Get lecture (used by student player to get the videoUrl)
router.get('/lectures/:lectureId', getLectureById);

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