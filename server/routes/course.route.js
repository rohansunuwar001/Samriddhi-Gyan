import express from "express";
import { createCourse, editCourse, getCourseById, getCreatorCourses, getPublishedCourse, getRecommendedCourses, searchCourse, togglePublishCourse } from "../controllers/course.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import upload from "../utils/multer.js";
const router = express.Router();

router.route("/create").post(isAuthenticated,createCourse);
router.get('/recommendations', getRecommendedCourses);
router.route("/search").get(isAuthenticated, searchCourse);
router.get('/course/published', getPublishedCourse); // <-- static first
router.route("/creator").get(isAuthenticated,getCreatorCourses);
router.route("/:courseId").put(isAuthenticated,upload.single("courseThumbnail"),editCourse);
router.get('/course/:courseId', getCourseById);       // <-- dynamic after
// router.route("/:courseId/lecture").post(isAuthenticated, createLecture);
// router.route("/:courseId/lecture").get(isAuthenticated, getCourseLecture);
// router.route("/:courseId/lecture/:lectureId").post(isAuthenticated, editLecture);
// router.route("/lecture/:lectureId").delete(isAuthenticated, removeLecture);
// router.route("/lecture/:lectureId").get(isAuthenticated, getLectureById);
router.route("/:courseId").patch(isAuthenticated, togglePublishCourse);
router.patch('/:courseId/publish', togglePublishCourse);



export default router;