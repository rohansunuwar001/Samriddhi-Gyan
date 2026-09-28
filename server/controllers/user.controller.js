// server/controllers/user.controller.js
//
// PURPOSE: HTTP layer controller for user operations using OOP BaseController.

import { BaseController } from "../core/base.controller.js";
import { generateToken } from "../utils/generateToken.js";
import { userService } from "../service/user.service.js";
import { validateEmail, validatePassword, validateRequiredFields } from "../helpers/validate.helper.js";

export class UserController extends BaseController {
  constructor(service = userService) {
    super();
    this.service = service;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // AUTH CONTROLLERS
  // ─────────────────────────────────────────────────────────────────────────────

  register = async (req, res) => {
    try {
      const { name, email, password } = req.body;

      validateRequiredFields({ name, email, password });
      validateEmail(email);
      validatePassword(password);

      let locationDetails = null;
      if (req.body.locationDetails) {
        locationDetails = req.body.locationDetails;
      } else if (req.cookies?.user_location) {
        try {
          locationDetails = JSON.parse(req.cookies.user_location);
        } catch (err) {
          console.warn("Failed to parse user_location cookie in register controller:", err.message);
        }
      }

      await this.service.registerUser({ name, email, password, locationDetails });

      return this.sendSuccess(res, {}, "Account created successfully.", 201);
    } catch (error) {
      console.error("register error:", error.message);
      return this.sendError(res, error.message || "Failed to register.", error.statusCode || 500);
    }
  };

  login = async (req, res) => {
    try {
      const { email, password } = req.body;

      validateRequiredFields({ email, password });

      const user = await this.service.loginUser({ email, password });

      return generateToken(res, user, `Welcome back ${user.name}`);
    } catch (error) {
      console.error("login error:", error.message);
      return this.sendError(res, error.message || "Failed to login.", error.statusCode || 500);
    }
  };

  logout = (_, res) => {
    return res
      .status(200)
      .cookie("token", "", { maxAge: 0 })
      .json({ success: true, message: "Logged out successfully." });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // PROFILE CONTROLLERS
  // ─────────────────────────────────────────────────────────────────────────────

  getUserProfileController = async (req, res) => {
    try {
      const user = await this.service.getUserProfile(req.user._id);
      return this.sendSuccess(res, { user });
    } catch (error) {
      console.error("getUserProfile error:", error.message);
      return this.sendError(res, error.message || "Failed to load profile.", error.statusCode || 500);
    }
  };

  loadUser = (req, res) => {
    if (!req.user) {
      return this.sendError(res, "User not found.", 404);
    }
    return this.sendSuccess(res, { user: req.user });
  };

  checkUser = async (req, res) => {
    try {
      const user = await this.service.getUserProfile(req.user._id);
      return generateToken(res, user, `Welcome back ${user.name}`);
    } catch (error) {
      console.error("checkUser error:", error.message);
      return this.sendError(res, error.message || "Failed to load user.", error.statusCode || 500);
    }
  };

  getPublicUserProfile = async (req, res) => {
    try {
      const { id } = req.params;
      validateRequiredFields({ id });

      const { user, courses } = await this.service.getPublicProfile(id);

      return this.sendSuccess(res, { user, courses });
    } catch (error) {
      console.error("getPublicUserProfile error:", error.message);
      return this.sendError(res, error.message || "Server Error", error.statusCode || 500);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // PROFILE UPDATES
  // ─────────────────────────────────────────────────────────────────────────────

  updateUserInfoController = async (req, res) => {
    try {
      const updatedUser = await this.service.updateUserInfo(req.user._id, req.body);
      return this.sendSuccess(res, { user: updatedUser }, "Profile updated successfully.");
    } catch (error) {
      console.error("updateUserInfo error:", error.message);
      return this.sendError(res, error.message || "Failed to update profile.", error.statusCode || 500);
    }
  };

  updateUserAvatarController = async (req, res) => {
    try {
      if (!req.file) {
        return this.sendError(res, "No image file provided.", 400);
      }

      const newPhotoUrl = await this.service.updateUserAvatar(req.user._id, req.file.path);

      return this.sendSuccess(res, { photoUrl: newPhotoUrl }, "Avatar updated successfully.");
    } catch (error) {
      console.error("updateUserAvatar error:", error.message);
      return this.sendError(res, error.message || "Failed to update avatar.", error.statusCode || 500);
    }
  };

  updateUserPasswordController = async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      validateRequiredFields({ currentPassword, newPassword });
      validatePassword(newPassword);

      await this.service.updateUserPassword(req.user._id, { currentPassword, newPassword });

      return this.sendSuccess(res, {}, "Password updated successfully.");
    } catch (error) {
      console.error("updateUserPassword error:", error.message);
      return this.sendError(res, error.message || "Failed to update password.", error.statusCode || 500);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // LEARNING CONTROLLERS
  // ─────────────────────────────────────────────────────────────────────────────

  getMyLearningCoursesController = async (req, res) => {
    try {
      const courses = await this.service.getMyLearningCourses(req.user._id);
      return this.sendSuccess(res, { courses });
    } catch (error) {
      console.error("getMyLearningCourses error:", error.message);
      return this.sendError(res, error.message || "Server Error", error.statusCode || 500);
    }
  };

  trackCourseViewController = async (req, res) => {
    try {
      const { courseId } = req.params;
      validateRequiredFields({ courseId });

      await this.service.trackCourseView(req.user._id, courseId);

      return this.sendSuccess(res);
    } catch (error) {
      console.error("trackCourseView error:", error.message);
      return this.sendError(res, error.message || "Failed to track view.", error.statusCode || 500);
    }
  };

  saveSearchTermController = async (req, res) => {
    try {
      const { term } = req.body;
      if (!term?.trim()) return this.sendError(res, "Search term is required.", 400);

      await this.service.saveSearchTerm(req.user._id, term);
      return this.sendSuccess(res, {}, "Search term saved.");
    } catch (error) {
      console.error("saveSearchTerm error:", error.message);
      return this.sendError(res, "Failed to save search term.", 500);
    }
  };

  archiveCourseController = async (req, res) => {
    try {
      const { courseId } = req.params;
      await this.service.archiveCourse(req.user._id, courseId);
      return this.sendSuccess(res, {}, "Course archived successfully.");
    } catch (error) {
      console.error("archiveCourse error:", error.message);
      return this.sendError(res, error.message || "Failed to archive course.", error.statusCode || 500);
    }
  };

  unarchiveCourseController = async (req, res) => {
    try {
      const { courseId } = req.params;
      await this.service.unarchiveCourse(req.user._id, courseId);
      return this.sendSuccess(res, {}, "Course unarchived successfully.");
    } catch (error) {
      console.error("unarchiveCourse error:", error.message);
      return this.sendError(res, error.message || "Failed to unarchive course.", error.statusCode || 500);
    }
  };

  getArchivedCoursesController = async (req, res) => {
    try {
      const courses = await this.service.getArchivedCourses(req.user._id);
      return this.sendSuccess(res, { courses });
    } catch (error) {
      console.error("getArchivedCourses error:", error.message);
      return this.sendError(res, error.message || "Failed to load archived courses.", error.statusCode || 500);
    }
  };

  getNearbyTutorsController = async (req, res) => {
    try {
      const lat = parseFloat(req.query.lat);
      const lon = parseFloat(req.query.lon);

      if (isNaN(lat) || isNaN(lon)) {
        return this.sendError(res, "Valid 'lat' and 'lon' query parameters are required.", 400);
      }

      const tutors = await this.service.getNearbyTutors(lat, lon);
      return this.sendSuccess(res, { tutors });
    } catch (error) {
      console.error("getNearbyTutorsController error:", error.message);
      return this.sendError(res, "Failed to load nearby tutors.", 500);
    }
  };

  getNearbyPeersController = async (req, res) => {
    try {
      const lat = parseFloat(req.query.lat);
      const lon = parseFloat(req.query.lon);

      if (isNaN(lat) || isNaN(lon)) {
        return this.sendError(res, "Valid 'lat' and 'lon' query parameters are required.", 400);
      }

      const peers = await this.service.getNearbyPeers(req.user._id, lat, lon);
      return this.sendSuccess(res, { peers });
    } catch (error) {
      console.error("getNearbyPeersController error:", error.message);
      return this.sendError(res, "Failed to load nearby study circles.", 500);
    }
  };

  deleteAccountController = async (req, res) => {
    try {
      const result = await this.service.deleteAccount(req.user._id);
      return res
        .status(200)
        .cookie("token", "", { maxAge: 0 })
        .json({ success: true, message: result.message });
    } catch (error) {
      console.error("deleteAccountController error:", error.message);
      return this.sendError(res, error.message || "Failed to delete account.", error.statusCode || 500);
    }
  };
}

// Export singleton instance
export const userController = new UserController();

// Backward-compatible individual handler exports
export const register = userController.register;
export const login = userController.login;
export const logout = userController.logout;
export const getUserProfileController = userController.getUserProfileController;
export const loadUser = userController.loadUser;
export const checkUser = userController.checkUser;
export const getPublicUserProfile = userController.getPublicUserProfile;
export const updateUserInfoController = userController.updateUserInfoController;
export const updateUserAvatarController = userController.updateUserAvatarController;
export const updateUserPasswordController = userController.updateUserPasswordController;
export const getMyLearningCoursesController = userController.getMyLearningCoursesController;
export const trackCourseViewController = userController.trackCourseViewController;
export const saveSearchTermController = userController.saveSearchTermController;
export const archiveCourseController = userController.archiveCourseController;
export const unarchiveCourseController = userController.unarchiveCourseController;
export const getArchivedCoursesController = userController.getArchivedCoursesController;
export const getNearbyTutorsController = userController.getNearbyTutorsController;
export const getNearbyPeersController = userController.getNearbyPeersController;
export const deleteAccountController = userController.deleteAccountController;