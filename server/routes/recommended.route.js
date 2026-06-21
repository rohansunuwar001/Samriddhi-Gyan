import express from "express";
import { getFeaturedCourses, getRecommendedCourses, getTrendingCourses } from "../controllers/recommendation.controller.js";



const router = express.Router();

// GET /api/recommendations - get personalized or popular course recommendations
router.get("/", getRecommendedCourses);
router.get("/trending", getTrendingCourses);
router.get("/featured", getFeaturedCourses); 
export default router;
