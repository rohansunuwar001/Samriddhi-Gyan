import express from "express";
import { getCourseSequencing, getCareerRoadmap, getCourseFrictionAnalytics } from "../controllers/pathways.controller.js";
import { isAuthenticated } from "../middlewares/isAuthenticated.js";

const router = express.Router();

router.get("/sequencing", getCourseSequencing);
router.get("/career-roadmap", isAuthenticated, getCareerRoadmap);
router.get("/friction/:courseId", isAuthenticated, getCourseFrictionAnalytics);

export default router;
