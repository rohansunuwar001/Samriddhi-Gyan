import express from "express";
import {
  createTopic,
  getAllTopics,
  getTopicBySlug,
  updateTopic,
  deleteTopic,
} from "../controllers/topic.controller.js";
import { isAuthenticated, authorizeRoles } from "../middlewares/isAuthenticated.js";

const router = express.Router();

// Public routes
router.route("/").get(getAllTopics);
router.route("/detail/:slug").get(getTopicBySlug);

// Admin-only write routes
router.route("/").post(isAuthenticated, authorizeRoles("admin"), createTopic);
router.route("/:id")
  .patch(isAuthenticated, authorizeRoles("admin"), updateTopic)
  .delete(isAuthenticated, authorizeRoles("admin"), deleteTopic);

export default router;
