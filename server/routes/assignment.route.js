import express from "express";
import { createAssignment, getCourseAssignments } from "../controllers/assignment.controller.js";
import { submitAssignment, getAssignmentSubmissions, gradeSubmission } from "../controllers/submission.controller.js";
import { isAuthenticated } from "../middlewares/isAuthenticated.js";
import upload from "../utils/multer.js";

const router = express.Router();

router.post("/", isAuthenticated, createAssignment);
router.get("/course/:courseId", isAuthenticated, getCourseAssignments);
router.post("/submit/:assignmentId", isAuthenticated, upload.single("file"), submitAssignment);
router.get("/submissions/:assignmentId", isAuthenticated, getAssignmentSubmissions);
router.post("/grade/:submissionId", isAuthenticated, gradeSubmission);

export default router;
