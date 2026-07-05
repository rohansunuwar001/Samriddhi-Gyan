// server/routes/user.route.js

import express from "express";
import jwt from "jsonwebtoken";
import passport from "passport";

import { isAuthenticated } from "../middlewares/isAuthenticated.js";
import upload from "../utils/multer.js";

// ── Controller imports ──────────────────────────────────────────────────────
// These names match the refactored user.controller.js exports exactly.
// The "Controller" suffix on some names avoids clashes with service function
// names that are the same (e.g. getUserProfile exists in both controller and service).
import {
  register,
  login,
  logout,
  checkUser,
  loadUser,
  getUserProfileController , 
  updateUserInfoController , 
  updateUserAvatarController , 
  updateUserPasswordController, 
  getPublicUserProfile,
  getMyLearningCoursesController,
  trackCourseViewController,
  archiveCourseController,
  unarchiveCourseController,
  getArchivedCoursesController,
} from "../controllers/user.controller.js";

const router = express.Router();

// ── Auth routes ─────────────────────────────────────────────────────────────
router.route("/register").post(register);
router.route("/login").post(login);
router.route("/logout").get(isAuthenticated, logout);
router.route("/check").get(isAuthenticated, checkUser);
router.route("/me").get(isAuthenticated, loadUser);

// ── Profile routes ───────────────────────────────────────────────────────────
router
  .route("/profile")
  .get(isAuthenticated, getUserProfileController)
  .patch(isAuthenticated, updateUserInfoController);

router
  .route("/profile/update-password")
  .patch(isAuthenticated, updateUserPasswordController);

router
  .route("/profile/update-avatar")
  .patch(isAuthenticated, upload.single("profilePhoto"), updateUserAvatarController);

// ── Learning routes ──────────────────────────────────────────────────────────
router.route("/view-history/:courseId").post(isAuthenticated, trackCourseViewController);
router.route("/my-learning").get(isAuthenticated, getMyLearningCoursesController);
router.route("/archived").get(isAuthenticated, getArchivedCoursesController);
router.route("/archive/:courseId").post(isAuthenticated, archiveCourseController);
router.route("/unarchive/:courseId").post(isAuthenticated, unarchiveCourseController);

// ── Public routes ────────────────────────────────────────────────────────────
router
  .route("/instructor-profile/:id")
  .get(getPublicUserProfile);

// ── Google OAuth routes ──────────────────────────────────────────────────────
router
  .route("/google")
  .get(passport.authenticate("google", { scope: ["profile", "email"] }));

router.route("/google/callback").get(
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=true`,
    session: false,
  }),
  (req, res) => {
    try {
      const payload = { userId: req.user._id, role: req.user.role };

      const token = jwt.sign(payload, process.env.SECRET_KEY, {
        expiresIn: "1d",
      });

      const baseUrl = process.env.FRONTEND_URL.replace(/\/$/, "");
      return res.redirect(`${baseUrl}/auth/google/success?token=${token}`);
    } catch (error) {
      console.error("Google Auth callback error:", error);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=true`);
    }
  },
);

export default router;
