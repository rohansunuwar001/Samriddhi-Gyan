import express from "express";
import { isAuthenticated } from "../middlewares/isAuthenticated.js";
import {
  createQuestion,
  getCourseQuestions,
  toggleUpvote,
  addAnswer,
} from "../controllers/question.controller.js";

const router = express.Router();

router.post("/:courseId", isAuthenticated, createQuestion);
router.get("/:courseId", isAuthenticated, getCourseQuestions);
router.post("/:questionId/upvote", isAuthenticated, toggleUpvote);
router.post("/:questionId/answer", isAuthenticated, addAnswer);

export default router;
