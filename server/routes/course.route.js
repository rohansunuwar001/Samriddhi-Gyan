import express from "express";

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
  togglePublishCourse
} from "../controllers/course.controller.js";
import { getCoursePurchases } from "../controllers/coursePurchase.controller.js";
import { getRecommendedCourses } from "../controllers/recommendation.controller.js";

import upload from "../utils/multer.js";
import { authorizeRoles, isAuthenticated } from "../middlewares/isAuthenticated.js";
import loadUserIfAuthenticated from "../middlewares/loadUserIfAuthenticated.js";

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
router.get("/published",loadUserIfAuthenticated, getPublishedCourse);
router.get("/creator", isAuthenticated, getCreatorCourses);

// Static info routes
router.get("/courses-with-students", isAuthenticated, getCoursesWithEnrolledStudents);
router.get(
  "/courses-with-students-reviews",isAuthenticated,
  getCoursesWithEnrolledStudentsAndReviews
);
router.get(
  "/paid-courses-with-students-payments",isAuthenticated,
  getPaidCoursesWithEnrolledStudentsAndPayments
);
router.get("/analytics",isAuthenticated,authorizeRoles("instructor"), getCourseAnalytics);

// Course purchase related
router.get("/course-purchases", getCoursePurchases);

// Get single course by id (public)
router.route('/:courseId').get(
    loadUserIfAuthenticated, // Use the optional middleware, NOT isAuthenticated
    getCourseById
);

export default router;
