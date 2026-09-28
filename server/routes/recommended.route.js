import express from "express";
import {
  getFeaturedCourses,
  getRecommendedCourses,
  getTrendingCourses,
} from "../controllers/recommendation.controller.js";
import loadUserIfAuthenticated from "../middlewares/loadUserIfAuthenticated.js";

 
const router = express.Router();
 
// GET /api/recommendations — personalized or popular recommendations
router.get("/", loadUserIfAuthenticated, getRecommendedCourses);
 
// GET /api/recommendations/trending — needs user context to exclude purchased courses
router.get("/trending", loadUserIfAuthenticated, getTrendingCourses);
 
// GET /api/recommendations/featured — needs user context to exclude purchased courses
router.get("/featured", loadUserIfAuthenticated, getFeaturedCourses);
 
export default router;