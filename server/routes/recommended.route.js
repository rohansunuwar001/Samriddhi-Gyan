import express from "express";
import { getRecommendedCourses } from "../controllers/recommendation.controller.js";


const router = express.Router();

// GET /api/recommendations - get personalized or popular course recommendations
router.get("/", getRecommendedCourses);

export default router;
