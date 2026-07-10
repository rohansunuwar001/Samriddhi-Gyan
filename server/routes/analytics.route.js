import express from "express";
import { trackVisit, getLocationStats } from "../controllers/analytics.controller.js";
import {
  isAuthenticated,
  isOptionalAuthenticated,
  authorizeRoles
} from "../middlewares/isAuthenticated.js";

const router = express.Router();

// Public route to silently report visits, automatically binding logged in users optionally
router.route("/track-visit").post(isOptionalAuthenticated, trackVisit);

// Protected admin-only route to retrieve aggregated locations statistics
router
  .route("/location-stats")
  .get(isAuthenticated, authorizeRoles("admin"), getLocationStats);

export default router;
