// server/controllers/notification.controller.js
//
// BUGS FIXED:
// 1. getNotifications:       used req.id → WRONG. isAuthenticated sets req.user, not req.id.
//                            Fixed to req.user._id. This was why notifications never loaded.
// 2. markAsRead:             same req.id → req.user._id fix.
// 3. clearAllNotifications:  same req.id → req.user._id fix.
// 4. deleteNotification:     compared notification.user.toString() !== userId
//                            but userId was an ObjectId. Fixed to userId.toString().

import { Notification } from '../models/notification.model.js';

/**
 * GET /api/v1/notifications
 * Returns all notifications for the logged-in user, newest first.
 */
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id; // FIX: was req.id — isAuthenticated sets req.user not req.id

    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 });

    return res.status(200).json(notifications);

  } catch (error) {
    console.error("getNotifications error:", error);
    return res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * POST /api/v1/notifications/read
 * Marks all unread notifications as read for the logged-in user.
 */
export const markAsRead = async (req, res) => {
  try {
    const userId = req.user._id; // FIX: was req.id

    await Notification.updateMany(
      { user: userId, read: false },
      { $set: { read: true } }
    );

    return res.status(200).json({ success: true, message: 'All notifications marked as read.' });

  } catch (error) {
    console.error("markAsRead error:", error);
    return res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * DELETE /api/v1/notifications/:id
 * Deletes a single notification — only if it belongs to the logged-in user.
 */
export const deleteNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user._id;

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }

    // FIX: both sides must be strings for the comparison to work correctly
    if (notification.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this notification." });
    }

    await Notification.findByIdAndDelete(notificationId);

    return res.status(200).json({ success: true, message: "Notification deleted." });

  } catch (error) {
    console.error("deleteNotification error:", error);
    return res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * DELETE /api/v1/notifications
 * Clears ALL notifications for the logged-in user.
 */
export const clearAllNotifications = async (req, res) => {
  try {
    const userId = req.user._id; // FIX: was req.id

    await Notification.deleteMany({ user: userId });

    return res.status(200).json({ success: true, message: "All notifications cleared." });

  } catch (error) {
    console.error("clearAllNotifications error:", error);
    return res.status(500).json({ message: 'Server Error' });
  }
};