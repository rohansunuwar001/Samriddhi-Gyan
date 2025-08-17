import express from "express";
import jwt from "jsonwebtoken";
import passport from "passport";

// --- Controller Imports ---
import {
  checkUser,
  getMyLearningCourses,
  getPublicUserProfile,
  getUserProfile,
  loadUser,
  login,
  logout,
  register,
  updateUserAvatar,
  updateUserInfo,
  updateUserPassword
} from "../controllers/user.controller.js";

// --- Middleware Imports ---
import { isAuthenticated } from "../middlewares/isAuthenticated.js";
// No authorizeRoles needed HERE, because these routes are for any authenticated user.
// import { authorizeRoles } from '../middlewares/auth.middleware.js'; 
import upload from "../utils/multer.js";
const router = express.Router();


router.route("/register").post(register);
router.route("/login").post(login);
router.route("/logout").get(isAuthenticated, logout);
router.route("/check").get(isAuthenticated, checkUser);
router.route("/me").get(isAuthenticated, loadUser);


router.route("/profile")
  .get(isAuthenticated, getUserProfile)
  .patch(isAuthenticated, updateUserInfo);

router.route("/profile/update-password").patch(isAuthenticated, updateUserPassword);

router.route("/profile/update-avatar").patch(
  isAuthenticated,
  upload.single("profilePhoto"),
  updateUserAvatar
);


router.route("/instructor-profile/:id").get(isAuthenticated, getPublicUserProfile);
router.route('/my-learning').get(isAuthenticated, getMyLearningCourses);


// Google OAuth Authentication Routes 
router.route("/google").get(
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// This is the callback route that Google redirects to after successful login
router.route("/google/callback").get(
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=true`, // Redirect on failure
    session: false, // We are using JWT
  }),
  (req, res) => {

    const payload = {
      userId: req.user._id,
      role: req.user.role
    };

    const token = jwt.sign(payload, process.env.SECRET_KEY, {
      expiresIn: "1d",
    });


    res.redirect(
      `${process.env.FRONTEND_URL}/auth/google/success?token=${token}`
    );
  }
);


export default router;