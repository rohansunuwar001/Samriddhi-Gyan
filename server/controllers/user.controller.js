// server/controllers/user.controller.js
//
// RULE: Controllers only do 3 things:
//   1. Read from req (body, params, user, file)
//   2. Call the service function
//   3. Send the HTTP response
//
// No model imports. No bcrypt. No Cloudinary. All of that lives in user.service.js.

import { generateToken } from "../utils/generateToken.js";
// import { validateRequiredFields, validatePassword, validateEmail } from "../helpers/validate.helper.js";
import {
  registerUser,
  loginUser,
  getUserProfile,
  getPublicProfile,
  updateUserInfo,
  updateUserAvatar,
  updateUserPassword,
  trackCourseView,
  getMyLearningCourses,
  archiveCourse,
  unarchiveCourse,
  getArchivedCourses,
} from "../service/user.service.js";
import { validateEmail, validatePassword, validateRequiredFields } from "../helpers/validate.helper.js";

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // validate.helper.js replaces the repeated `if (!name || !email...)` pattern
    validateRequiredFields({ name, email, password });
    validateEmail(email);
    validatePassword(password);

    await registerUser({ name, email, password }); // ← service

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
    });
  } catch (error) {
    console.error("register error:", error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to register.",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    validateRequiredFields({ email, password });

    const user = await loginUser({ email, password }); // ← service

    // generateToken lives in utils/ — it's generic (sets cookie + returns JSON)
    return generateToken(res, user, `Welcome back ${user.name}`);
  } catch (error) {
    console.error("login error:", error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to login.",
    });
  }
};

export const logout = (_, res) => {
  // No async needed — just clear the cookie
  return res
    .status(200)
    .cookie("token", "", { maxAge: 0 })
    .json({ success: true, message: "Logged out successfully." });
};

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /profile
 * Returns the logged-in user's own full profile.
 * FIX: The original had getUserProfile AND checkUser doing the same DB query.
 *      checkUser also regenerated the token on every call which is unnecessary.
 *      One clean function now handles both use cases.
 */
export const getUserProfileController = async (req, res) => {
  try {
    const user = await getUserProfile(req.user._id); // ← service
    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("getUserProfile error:", error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to load profile.",
    });
  }
};

/**
 * GET /me
 * Lightweight — just returns the user already attached by isAuthenticated middleware.
 * No extra DB call needed. Used for session checks on the frontend.
 */
export const loadUser = (req, res) => {
  if (!req.user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }
  return res.status(200).json({ success: true, user: req.user });
};

/**
 * GET /profile/check
 * Refreshes the auth token. Kept separate from loadUser because it
 * explicitly issues a new token (e.g. after role changes or on app start).
 */
export const checkUser = async (req, res) => {
  try {
    const user = await getUserProfile(req.user._id); // ← service (fresh from DB)
    return generateToken(res, user, `Welcome back ${user.name}`);
  } catch (error) {
    console.error("checkUser error:", error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to load user.",
    });
  }
};

/**
 * GET /instructor/:id
 * Returns a public instructor profile + their published courses.
 */
export const getPublicUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    validateRequiredFields({ id });

    const { user, courses } = await getPublicProfile(id); // ← service

    return res.status(200).json({ success: true, user, courses });
  } catch (error) {
    console.error("getPublicUserProfile error:", error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE UPDATES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * PUT /profile
 * Updates text fields: name, headline, description, links, occupation, interests.
 */
export const updateUserInfoController = async (req, res) => {
  try {
    const updatedUser = await updateUserInfo(req.user._id, req.body); // ← service
    return res.status(200).json({
      success: true,
      user: updatedUser,
      message: "Profile updated successfully.",
    });
  } catch (error) {
    console.error("updateUserInfo error:", error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to update profile.",
    });
  }
};

/**
 * PUT /profile/avatar
 * Replaces the user's avatar on Cloudinary and updates the DB.
 * Requires multer middleware on the route to provide req.file.
 */
export const updateUserAvatarController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file provided." });
    }

    // req.file.path is the local temp file path written by multer
    const newPhotoUrl = await updateUserAvatar(req.user._id, req.file.path); // ← service

    return res.status(200).json({
      success: true,
      photoUrl: newPhotoUrl,
      message: "Avatar updated successfully.",
    });
  } catch (error) {
    console.error("updateUserAvatar error:", error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to update avatar.",
    });
  }
};

/**
 * PUT /profile/password
 * Validates current password, hashes new one, saves, sends notification.
 */
export const updateUserPasswordController = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    validateRequiredFields({ currentPassword, newPassword });
    validatePassword(newPassword); // ensure new password meets requirements

    await updateUserPassword(req.user._id, { currentPassword, newPassword }); // ← service

    return res.status(200).json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    console.error("updateUserPassword error:", error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to update password.",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// LEARNING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /my-learning
 * Returns all enrolled courses with progress percentages.
 */
export const getMyLearningCoursesController = async (req, res) => {
  try {
    const courses = await getMyLearningCourses(req.user._id); // ← service
    return res.status(200).json({ success: true, courses });
  } catch (error) {
    console.error("getMyLearningCourses error:", error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

/**
 * POST /view/:courseId
 * Records that the user viewed a course (for recommendation history).
 */
export const trackCourseViewController = async (req, res) => {
  try {
    const { courseId } = req.params;
    validateRequiredFields({ courseId });

    await trackCourseView(req.user._id, courseId); // ← service

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("trackCourseView error:", error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to track view.",
    });
  }
};

// Archive course
export const archiveCourseController = async (req, res) => {
  try {
    const { courseId } = req.params;
    await archiveCourse(req.user._id, courseId);
    return res.status(200).json({ success: true, message: "Course archived successfully." });
  } catch (error) {
    console.error("archiveCourse error:", error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to archive course.",
    });
  }
};

// Unarchive course
export const unarchiveCourseController = async (req, res) => {
  try {
    const { courseId } = req.params;
    await unarchiveCourse(req.user._id, courseId);
    return res.status(200).json({ success: true, message: "Course unarchived successfully." });
  } catch (error) {
    console.error("unarchiveCourse error:", error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to unarchive course.",
    });
  }
};

// Get archived courses
export const getArchivedCoursesController = async (req, res) => {
  try {
    const courses = await getArchivedCourses(req.user._id);
    return res.status(200).json({ success: true, courses });
  } catch (error) {
    console.error("getArchivedCourses error:", error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to load archived courses.",
    });
  }
};