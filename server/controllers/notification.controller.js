// server/controllers/notification.controller.js

import { BaseController } from '../core/base.controller.js';
import { Notification } from '../models/notification.model.js';

export class NotificationController extends BaseController {
  constructor() {
    super();
  }

  getNotifications = async (req, res) => {
    try {
      const userId = req.user._id;

      const notifications = await Notification.find({ user: userId })
        .sort({ createdAt: -1 });

      return res.status(200).json(notifications);
    } catch (error) {
      console.error("getNotifications error:", error);
      return this.sendError(res, 'Server Error', 500);
    }
  };

  markAsRead = async (req, res) => {
    try {
      const userId = req.user._id;

      await Notification.updateMany(
        { user: userId, read: false },
        { $set: { read: true } }
      );

      return this.sendSuccess(res, {}, 'All notifications marked as read.');
    } catch (error) {
      console.error("markAsRead error:", error);
      return this.sendError(res, 'Server Error', 500);
    }
  };

  deleteNotification = async (req, res) => {
    try {
      const notificationId = req.params.id;
      const userId = req.user._id;

      const notification = await Notification.findById(notificationId);
      if (!notification) {
        return this.sendError(res, "Notification not found.", 404);
      }

      if (notification.user.toString() !== userId.toString()) {
        return this.sendError(res, "Not authorized to delete this notification.", 403);
      }

      await Notification.findByIdAndDelete(notificationId);

      return this.sendSuccess(res, {}, "Notification deleted.");
    } catch (error) {
      console.error("deleteNotification error:", error);
      return this.sendError(res, 'Server Error', 500);
    }
  };

  clearAllNotifications = async (req, res) => {
    try {
      const userId = req.user._id;

      await Notification.deleteMany({ user: userId });

      return this.sendSuccess(res, {}, "All notifications cleared.");
    } catch (error) {
      console.error("clearAllNotifications error:", error);
      return this.sendError(res, 'Server Error', 500);
    }
  };
}

export const notificationController = new NotificationController();

export const getNotifications = notificationController.getNotifications;
export const markAsRead = notificationController.markAsRead;
export const deleteNotification = notificationController.deleteNotification;
export const clearAllNotifications = notificationController.clearAllNotifications;