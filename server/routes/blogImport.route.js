// server/routes/blogImport.route.js

import express from "express";
import { isAuthenticated, authorizeRoles } from "../middlewares/isAuthenticated.js";
import { importBlogData } from "../controllers/blogImport.controller.js";

const router = express.Router();

// POST /api/v1/admin/blog-import
// Only authenticated admins can trigger this.
router.post("/blog-import", isAuthenticated, authorizeRoles("admin"), importBlogData);

export default router;