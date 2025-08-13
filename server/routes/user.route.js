import express from "express";
import jwt from "jsonwebtoken";
import passport from "passport";
import {
  checkUser,
  getPublicUserProfile,
  getUserProfile,
  login,
  logout,
  register,
  updateUserAvatar,
  updateUserInfo,
  updateUserPassword,
} from "../controllers/user.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { User } from "../models/user.model.js";
import upload from "../utils/multer.js";
const router = express.Router();

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/logout").get(logout);
router.route("/profile").get(isAuthenticated, getUserProfile);
router.route("/check").get(isAuthenticated, checkUser);

router.patch("/profile/update-info", isAuthenticated, updateUserInfo);

router.patch(
  "/profile/update-avatar",
  isAuthenticated,
  upload.single("profilePhoto"),
  updateUserAvatar
);

// Route to update the password
router.patch("/profile/update-password", isAuthenticated, updateUserPassword);

router.get('/profile', isAuthenticated, getUserProfile);
router.get("/instructor-profile/:id", isAuthenticated,getPublicUserProfile)
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Callback route after Google authentication
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=true`,
    session: false, // Change to false since we won't use session
  }),
  (req, res) => {
    // Generate token immediately after authentication
    const token = jwt.sign({ userId: req.user._id }, process.env.SECRET_KEY, {
      expiresIn: "1d",
    });

    // Redirect to frontend with token in a secure way
    // Use state parameter to prevent CSRF attacks
    res.redirect(
      `${process.env.FRONTEND_URL}/auth/google/success?token=${token}`
    );
  }
);

// Logout route
router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

router.get("/api/auth/session-login", async (req, res) => {
  if (!req.session || !req.session.userId) {
    return res
      .status(401)
      .json({ success: false, message: "No valid session" });
  }

  const user = await User.findById(req.session.userId);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  // Clear the temporary session
  req.session.userId = null;

  // Generate token with your existing function
  return generateToken(res, user, "Successfully logged in with Google");
});
export default router;
