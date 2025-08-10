import { Notification } from '../models/notification.model.js';

/**
 * @desc    Get all notifications for the currently authenticated user.
 * @route   GET /api/v1/notifications
 * @access  Private
 */
export const getNotifications = async (req, res) => {
    try {
        // req.id is attached by the isAuthenticated middleware.
        // We find all notifications for that user and sort them by creation date, newest first.
        const notifications = await Notification.find({ user: req.id }).sort({ createdAt: -1 });

        if (!notifications) {
            // This case is unlikely but good to handle.
            return res.status(404).json({ message: "No notifications found for this user." });
        }

        res.status(200).json(notifications);

    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

/**
 * @desc    Mark all unread notifications as read for the currently authenticated user.
 * @route   POST /api/v1/notifications/read
 * @access  Private
 */
export const markAsRead = async (req, res) => {
    try {
        // We find all notifications that belong to the logged-in user AND are currently unread.
        // Then, we update all of them by setting the 'read' field to true.
        await Notification.updateMany(
            { user: req.id, read: false },
            { $set: { read: true } }
        );

        res.status(200).json({ success: true, message: 'All notifications marked as read' });

    } catch (error) {
        console.error("Error marking notifications as read:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// --- ADD THIS NEW FUNCTION ---
/**
 * @desc    Delete a single notification by its ID.
 * @route   DELETE /api/v1/notifications/:id
 * @access  Private
 */
export const deleteNotification = async (req, res) => {
    try {
        const notificationId = req.params.id;
        const userId = req.id;

        const notification = await Notification.findById(notificationId);

        if (!notification) {
            return res.status(404).json({ message: "Notification not found." });
        }

        // Security Check: Ensure the user owns this notification
        if (notification.user.toString() !== userId) {
            return res.status(403).json({ message: "You are not authorized to delete this notification." });
        }

        await Notification.findByIdAndDelete(notificationId);

        res.status(200).json({ success: true, message: "Notification deleted." });

    } catch (error) {
        console.error("Error deleting notification:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// --- ADD THIS SECOND NEW FUNCTION ---
/**
 * @desc    Delete all notifications for the logged-in user.
 * @route   DELETE /api/v1/notifications
 * @access  Private
 */
export const clearAllNotifications = async (req, res) => {
    try {
        await Notification.deleteMany({ user: req.id });
        res.status(200).json({ success: true, message: "All notifications cleared." });
    } catch (error) {
        console.error("Error clearing notifications:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};