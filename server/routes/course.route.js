import express from "express";
import { createCourse, editCourse, getCourseAnalytics, getCourseById, getCoursesWithEnrolledStudents, getCoursesWithEnrolledStudentsAndReviews, getCreatorCourses, getPaidCoursesWithEnrolledStudentsAndPayments, getPublishedCourse, getRecommendedCourses, removeCourse, searchCourse, togglePublishCourse } from "../controllers/course.controller.js";
import { getCoursePurchases } from '../controllers/coursePurchase.controller.js';
import isAuthenticated from "../middlewares/isAuthenticated.js";
import upload from "../utils/multer.js";
const router = express.Router();

router.route("/create").post(isAuthenticated, createCourse);
router.get('/recommendations', getRecommendedCourses);
router.route("/search").get(isAuthenticated, searchCourse);
router.get('/published', getPublishedCourse);
router.route("/creator").get(isAuthenticated, getCreatorCourses);

// --- STATIC ROUTES FIRST ---
router.get('/courses-with-students', getCoursesWithEnrolledStudents);
router.get('/courses-with-students-reviews', getCoursesWithEnrolledStudentsAndReviews);
router.get('/paid-courses-with-students-payments', getPaidCoursesWithEnrolledStudentsAndPayments);
router.get('/analytics', getCourseAnalytics); // <-- Make sure this is above dynamic routes
router.get('/course-purchases', getCoursePurchases);

router.route("/:courseId").put(isAuthenticated, upload.single("courseThumbnail"), editCourse);
router.get('/:courseId', getCourseById);
router.route("/:courseId").patch(isAuthenticated, togglePublishCourse);
router.patch('/:courseId/publish', togglePublishCourse);
router.delete('/:courseId', isAuthenticated, removeCourse);

export default router;