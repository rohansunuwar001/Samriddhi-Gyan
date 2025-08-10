import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import {
  clearAllNotifications,
  deleteNotification,
  getNotifications,
  markAsRead,
} from "../controllers/notification.controller.js";
// Adjust the path if necessary

const notificationRouter = express.Router();

// All routes in this file require the user to be authenticated.
// We can use router.use() to apply the middleware to every route defined below.
notificationRouter.use(isAuthenticated);

/**
 * @route   GET /api/v1/notifications
 * @desc    Get all notifications for the logged-in user
 * @access  Private
 */
notificationRouter.get("/", getNotifications);

/**
 * @route   POST /api/v1/notifications/read
 * @desc    Mark all of the user's unread notifications as read
 * @access  Private
 */
notificationRouter.post("/read", markAsRead);

notificationRouter.delete("/:id", deleteNotification);

notificationRouter.delete("/", clearAllNotifications);

export default notificationRouter;
