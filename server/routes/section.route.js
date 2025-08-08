import { Router } from "express";
import {
  createSection,
  updateSection,
  deleteSection,
} from "../controllers/section.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
// Assuming you have an auth middleware

const sectionRouter = Router();

// Routes for handling sections
// A middleware should be added to ensure only the course creator can modify sections
sectionRouter
  .route("/courses/:courseId/sections")
  .post(isAuthenticated, createSection);
sectionRouter
  .route("/sections/:sectionId")
  .put(isAuthenticated, updateSection)
  .delete(isAuthenticated, deleteSection);

export default sectionRouter;
