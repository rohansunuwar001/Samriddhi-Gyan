import express from "express";
import { createAssignment, getCourseAssignments, deleteAssignment } from "../controllers/assignment.controller.js";
import {
  submitAssignment,
  getAssignmentSubmissions,
  getCourseSubmissions,
  getSubmissionById,
  gradeSubmission
} from "../controllers/submission.controller.js";
import { isAuthenticated } from "../middlewares/isAuthenticated.js";
import upload from "../utils/multer.js";

const router = express.Router();

router.post("/", isAuthenticated, createAssignment);
router.delete("/:assignmentId", isAuthenticated, deleteAssignment);
router.get("/course/:courseId", isAuthenticated, getCourseAssignments);
router.post("/submit/:assignmentId", isAuthenticated, upload.single("file"), submitAssignment);
router.get("/submissions/:assignmentId", isAuthenticated, getAssignmentSubmissions);
router.get("/submissions/course/:courseId", isAuthenticated, getCourseSubmissions);
router.get("/submission/:submissionId", isAuthenticated, getSubmissionById);
router.post("/grade/:submissionId", isAuthenticated, gradeSubmission);

export default router;

