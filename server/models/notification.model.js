import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    /**
     * The user who will receive this notification.
     * This creates a direct link to a document in the 'User' collection.
     */
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true, // Adding an index improves performance for fetching a user's notifications.
    },

    /**
     * The content of the notification message that will be displayed to the user.
     * e.g., "Your password was successfully changed."
     */
    message: {
        type: String,
        required: true,
        trim: true,
    },

    /**
     * The URL path the user should be redirected to upon clicking the notification.
     * This makes notifications actionable.
     * e.g., "/course-progress/60d5f1b2c3a4b9c8d4f0a1b2" or "/profile/security"
     */
    link: {
        type: String,
        required: true,
    },

    /**
     * A boolean flag to track if the user has seen the notification.
     * This is essential for UI features like unread counts and styling.
     */
    read: {
        type: Boolean,
        default: false,
    },

    /**
     * A category for the notification. This is very useful for future features,
     * such as allowing users to filter notifications or applying different icons in the UI.
     */
    type: {
        type: String,
        enum: [
            'course_enrollment',
            'password_update',
            'course_completion',
            'system_alert',
            'new_review', // Example for instructors
            'payout_processed' // Example for instructors
        ],
        default: 'system_alert',
    }
}, {
    /**
     * Automatically adds `createdAt` and `updatedAt` fields to each document.
     * `createdAt` is perfect for displaying "2 hours ago" on notifications.
     */
    timestamps: true
});

export const Notification = mongoose.model("Notification", notificationSchema);