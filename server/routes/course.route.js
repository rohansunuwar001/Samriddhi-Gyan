// server/routes/course.route.js
//
// CRITICAL FIX — Route ordering:
// The original file defined router.route("/:courseId") BEFORE the static routes
// like /search, /published, /creator etc. Express matches routes top-to-bottom,
// so "/:courseId" was swallowing those static paths — e.g. GET /search was being
// treated as GET /:courseId with courseId="search".
//
// RULE: Always define specific/static routes BEFORE parameterised routes (/:id).

import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { isAuthenticated, authorizeRoles } from "../middlewares/isAuthenticated.js";
import loadUserIfAuthenticated from "../middlewares/loadUserIfAuthenticated.js";
import upload from "../utils/multer.js";

const bulkStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), "uploads", "library");
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase() || ".mp4";
    cb(null, `video-${uniqueSuffix}${ext}`);
  },
});

const uploadBulk = multer({
  storage: bulkStorage,
  limits: { fileSize: 4 * 1024 * 1024 * 1024 },
});

import {
  createCourse,
  editCourse,
  removeCourse,
  togglePublishCourse,
  getPublishedCourse,
  getCourseById,
  getCreatorCourses,
  getSearchResults,
  searchCourse,
  getCoursesWithEnrolledStudents,
  getCoursesWithEnrolledStudentsAndReviews,
  getPaidCoursesWithEnrolledStudentsAndPayments,
  getCourseAnalytics,
  bulkUploadCourseVideos,
  deletePromoVideo,
  listAllCoursesBrief,
} from "../controllers/course.controller.js";

import { getRecommendedCourses } from "../controllers/recommendation.controller.js";
import { getAllPurchasedCourse } from "../controllers/coursePurchase.controller.js";

const router = express.Router();

// ─── Static routes FIRST (no params) ─────────────────────────────────────────
// These MUST come before /:courseId or Express will treat them as courseId values

// Course creation
router.post("/create", isAuthenticated, createCourse);

// Browse & search
router.get("/published",     loadUserIfAuthenticated, getPublishedCourse);
router.get("/search",        loadUserIfAuthenticated, searchCourse);
router.get("/search-vector", loadUserIfAuthenticated, getSearchResults);  // semantic/vector search
router.get("/recommendations", getRecommendedCourses); // public — no auth

// Creator's own courses
router.get("/creator", isAuthenticated, getCreatorCourses);
router.get("/list-brief", isAuthenticated, listAllCoursesBrief);

// Instructor dashboard routes
router.get("/courses-with-students",          isAuthenticated, getCoursesWithEnrolledStudents);
router.get("/courses-with-students-reviews",  isAuthenticated, getCoursesWithEnrolledStudentsAndReviews);
router.get("/paid-courses-with-payments",     isAuthenticated, getPaidCoursesWithEnrolledStudentsAndPayments);
router.get("/paid-courses-with-students-payments", isAuthenticated, getPaidCoursesWithEnrolledStudentsAndPayments);
router.get("/analytics",                      isAuthenticated, authorizeRoles("instructor"), getCourseAnalytics);

// Admin: all purchases
router.get("/course-purchases", isAuthenticated, authorizeRoles("admin"), getAllPurchasedCourse);

// ─── Parameterised routes LAST (:courseId) ────────────────────────────────────
// These must come AFTER all static routes above

// Get a single course (public/guest-friendly via loadUserIfAuthenticated)
router.get("/:courseId", loadUserIfAuthenticated, getCourseById);

// Edit, publish toggle, delete — all require auth
router.put(
  "/:courseId",
  isAuthenticated,
  upload.fields([
    { name: "courseThumbnail", maxCount: 1 },
    { name: "coursePromoVideo", maxCount: 1 }
  ]),
  // Multer error handler: when multer calls next(err), Express routes to this
  // 4-argument handler. Without it, Express forwards the error into editCourse
  // as (err, req, res) — making `next` the real `res`, hence "next is not a function".
  (err, req, res, next) => {
    if (err) {
      console.error("Multer upload error on PUT /:courseId:", err.message);
      return res.status(400).json({ success: false, message: `File upload error: ${err.message}` });
    }
    next();
  },
  editCourse
);
router.post(  "/:courseId/bulk-upload", isAuthenticated, uploadBulk.array("videos", 10), bulkUploadCourseVideos);
// router.patch( "/:courseId", isAuthenticated, togglePublishCourse);
// NOTE: More-specific sub-path routes MUST come before /:courseId or Express
// will treat the sub-path segment (e.g. "promo-video") as the courseId value.
router.delete("/:courseId/promo-video", isAuthenticated, deletePromoVideo);
router.delete("/:courseId", isAuthenticated, removeCourse);

// Explicit publish route (in case frontend uses this URL pattern)
router.patch("/:courseId/publish", isAuthenticated, togglePublishCourse);

export default router;