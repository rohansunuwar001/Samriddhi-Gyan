// server/service/notification.service.js

import { io, userSocketMap } from '../utils/socket.js';
import { Notification } from '../models/notification.model.js';
import { BaseService } from '../core/base.service.js';

export class NotificationService extends BaseService {
  constructor() {
    super(Notification);
  }

  async createNotification(userId, message, link, type) {
    try {
      const notification = await this.create({
        user: userId,
        message,
        link,
        type,
      });

      const recipientSocketId = userSocketMap[userId.toString()];

      if (recipientSocketId && io) {
        io.to(recipientSocketId).emit('new_notification', notification);
        console.log(`[Notification] Real-time sent to user ${userId} on socket ${recipientSocketId}`);
      } else {
        console.log(`[Notification] User ${userId} is offline — saved to DB only.`);
      }

      return notification;
    } catch (error) {
      console.error("[Notification] createNotification failed:", error);
    }
  }
}

export const notificationService = new NotificationService();

export const createNotification = notificationService.createNotification.bind(notificationService);