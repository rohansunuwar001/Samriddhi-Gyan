// server/service/notification.service.js
//
// This file is the SINGLE place that creates notifications.
// It does two things:
//   1. Saves the notification to MongoDB
//   2. Emits a real-time socket event to the user if they are online
//
// EVERY place that sends a notification MUST use this function —
// never call Notification.create() directly, because that only saves to DB
// and skips the real-time socket emit entirely.

import { io, userSocketMap } from '../index.js';
import { Notification } from '../models/notification.model.js';

/**
 * Creates a notification in the DB and emits it to the user via socket if online.
 *
 * @param {string|ObjectId} userId  - The recipient user's ID
 * @param {string}          message - The notification text
 * @param {string}          link    - The URL to navigate to when clicked
 * @param {string}          type    - One of the enum values in notification.model.js
 */
export const createNotification = async (userId, message, link, type) => {
  try {
    // Step 1: Save to DB — this persists the notification even if the user is offline
    const notification = await Notification.create({
      user: userId,
      message,
      link,
      type,
    });

    // Step 2: Emit real-time event if the user is currently connected
    const recipientSocketId = userSocketMap[userId.toString()];

    if (recipientSocketId) {
      io.to(recipientSocketId).emit('new_notification', notification);
      console.log(`[Notification] Real-time sent to user ${userId} on socket ${recipientSocketId}`);
    } else {
      console.log(`[Notification] User ${userId} is offline — saved to DB only.`);
    }

    return notification;

  } catch (error) {
    // Never throw — a notification failure should never crash the parent operation
    console.error("[Notification] createNotification failed:", error);
  }
};