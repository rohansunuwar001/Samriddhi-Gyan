
// Import the io instance and user map from your main server file
import { io, userSocketMap } from '../index.js';
import { Notification } from '../models/notification.model.js';


export const createNotification = async (userId, message, link, type) => {
  try {
    // Step 1: Create and save the notification document in the database.
    const notification = await Notification.create({
      user: userId,
      message,
      link,
      type,
    });

    // Step 2: Check if the recipient user is currently connected via Socket.IO.
    const recipientSocketId = userSocketMap[userId];

    if (recipientSocketId) {
      // Step 3: If the user is online, emit a 'new_notification' event directly to their socket.
      // The frontend will be listening for this event.
      io.to(recipientSocketId).emit('new_notification', notification);
      console.log(`Real-time notification sent to user ${userId} on socket ${recipientSocketId}`);
    } else {
      console.log(`User ${userId} is not online. Notification saved to DB.`);
    }

    return notification;

  } catch (error) {
    // Log any errors that occur during the process.
    console.error("Error in createNotification service:", error);
    // We don't re-throw the error, as failing to send a notification should not crash the primary operation (e.g., a course purchase).
  }
};