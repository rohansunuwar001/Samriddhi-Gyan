import express from "express";

import isAuthenticated from "../middlewares/isAuthenticated.js";
import {
  createCourse,
  editCourse,
  getCourseAnalytics,
  getCourseById,
  getCoursesWithEnrolledStudents,
  getCoursesWithEnrolledStudentsAndReviews,
  getCreatorCourses,
  getPaidCoursesWithEnrolledStudentsAndPayments,
  getPublishedCourse,
  removeCourse,
  searchCourse,
  togglePublishCourse,
} from "../controllers/course.controller.js";
import upload from "../utils/multer.js";
import { getRecommendedCourses } from "../controllers/recommendation.controller.js";
import { getCoursePurchases } from "../controllers/coursePurchase.controller.js";

const router = express.Router();

// Course creation & management
router.route("/create").post(isAuthenticated, createCourse);
router
  .route("/:courseId")
  .put(isAuthenticated, upload.single("courseThumbnail"), editCourse)
  .patch(isAuthenticated, togglePublishCourse)
  .delete(isAuthenticated, removeCourse);

router.patch("/:courseId/publish", isAuthenticated, togglePublishCourse);

// Fetch courses
router.get("/recommendations", getRecommendedCourses); // No auth required for recommendations
router.route("/search").get(isAuthenticated, searchCourse);
router.get("/published", getPublishedCourse);
router.get("/creator", isAuthenticated, getCreatorCourses);

// Static info routes
router.get("/courses-with-students", getCoursesWithEnrolledStudents);
router.get(
  "/courses-with-students-reviews",
  getCoursesWithEnrolledStudentsAndReviews
);
router.get(
  "/paid-courses-with-students-payments",
  getPaidCoursesWithEnrolledStudentsAndPayments
);
router.get("/analytics", getCourseAnalytics);

// Course purchase related
router.get("/course-purchases", getCoursePurchases);

// Get single course by id (public)
router.get("/:courseId", getCourseById);

export default router;
