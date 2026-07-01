import express from "express";
import { isAuthenticated } from "../middlewares/isAuthenticated.js";
import {
  createFlashcard,
  getDueFlashcards,
  reviewFlashcard,
  generateAIFlashcards,
} from "../controllers/flashcard.controller.js";

const router = express.Router();

// All flashcard actions require authentication
router.use(isAuthenticated);

router.post("/", createFlashcard);
router.get("/due/:courseId", getDueFlashcards);
router.post("/review", reviewFlashcard);
router.post("/generate-ai", generateAIFlashcards);

export default router;
