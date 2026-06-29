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
import { isAuthenticated, authorizeRoles } from "../middlewares/isAuthenticated.js";
import loadUserIfAuthenticated from "../middlewares/loadUserIfAuthenticated.js";
import upload from "../utils/multer.js";

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
router.get("/search",        isAuthenticated,         searchCourse);
router.get("/search-vector", loadUserIfAuthenticated, getSearchResults);  // semantic/vector search
router.get("/recommendations", getRecommendedCourses); // public — no auth

// Creator's own courses
router.get("/creator", isAuthenticated, getCreatorCourses);

// Instructor dashboard routes
router.get("/courses-with-students",          isAuthenticated, getCoursesWithEnrolledStudents);
router.get("/courses-with-students-reviews",  isAuthenticated, getCoursesWithEnrolledStudentsAndReviews);
router.get("/paid-courses-with-payments",     isAuthenticated, getPaidCoursesWithEnrolledStudentsAndPayments);
router.get("/analytics",                      isAuthenticated, authorizeRoles("instructor"), getCourseAnalytics);

// Admin: all purchases
router.get("/course-purchases", isAuthenticated, authorizeRoles("admin"), getAllPurchasedCourse);

// ─── Parameterised routes LAST (:courseId) ────────────────────────────────────
// These must come AFTER all static routes above

// Get a single course (public/guest-friendly via loadUserIfAuthenticated)
router.get("/:courseId", loadUserIfAuthenticated, getCourseById);

// Edit, publish toggle, delete — all require auth
router.put(   "/:courseId", isAuthenticated, upload.single("courseThumbnail"), editCourse);
// router.patch( "/:courseId", isAuthenticated, togglePublishCourse);
router.delete("/:courseId", isAuthenticated, removeCourse);

// Explicit publish route (in case frontend uses this URL pattern)
router.patch("/:courseId/publish", isAuthenticated, togglePublishCourse);

export default router;