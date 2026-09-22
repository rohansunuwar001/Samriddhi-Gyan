import express from "express";
import {
  getPublicExploreSections,
  getAllExploreSectionsAdmin,
  createExploreSectionItem,
  updateExploreSectionItem,
  deleteExploreSectionItem,
} from "../controllers/exploreSection.controller.js";
import { isAuthenticated, authorizeRoles } from "../middlewares/isAuthenticated.js";

const router = express.Router();

// Public routes
router.get("/", getPublicExploreSections);

// Admin routes
router.get("/admin", isAuthenticated, authorizeRoles("admin", "superadmin"), getAllExploreSectionsAdmin);
router.post("/", isAuthenticated, authorizeRoles("admin", "superadmin"), createExploreSectionItem);
router.put("/:id", isAuthenticated, authorizeRoles("admin", "superadmin"), updateExploreSectionItem);
router.delete("/:id", isAuthenticated, authorizeRoles("admin", "superadmin"), deleteExploreSectionItem);

export default router;
