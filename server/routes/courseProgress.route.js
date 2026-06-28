// server/routes/courseProgress.route.js
//
// FIXES:
// 1. Removed getMyLearningCourses — it was a duplicate of the route already
//    handled by GET /api/v1/user/my-learning (user.route.js → user.service.js).
//    Keeping it here would mean two routes doing the same DB work.
//
// 2. Route ordering fix — the original had /my-learning AFTER /:courseId,
//    so Express matched "my-learning" as a courseId and never reached that handler.
//    RULE: static paths always go BEFORE parameterised ones (/:id).

import express from "express";
import { isAuthenticated } from "../middlewares/isAuthenticated.js";
import {
  getCourseProgress,
  updateLectureProgress,
  markAsCompleted,
  markAsInCompleted,
} from "../controllers/courseProgress.controller.js";

const router = express.Router();

// GET  /api/v1/progress/:courseId               — fetch full progress for a course
router.get("/:courseId", isAuthenticated, getCourseProgress);

// POST /api/v1/progress/:courseId/complete       — mark all lectures as viewed
router.post("/:courseId/complete", isAuthenticated, markAsCompleted);

// POST /api/v1/progress/:courseId/incomplete     — reset all lectures to unviewed
router.post("/:courseId/incomplete", isAuthenticated, markAsInCompleted);

// POST /api/v1/progress/:courseId/lecture/:lectureId/view — mark one lecture viewed
router.post("/:courseId/lecture/:lectureId/view", isAuthenticated, updateLectureProgress);

export default router;