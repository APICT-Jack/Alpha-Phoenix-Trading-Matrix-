// services/notificationService.js
import { getIO } from '../socket.js';

class NotificationService {
  constructor() {
    this.io = null;
  }

  setIO(io) {
    this.io = io;
  }

  async send({ type, recipientId, senderId, postId, commentId, replyId, content }) {
    if (!this.io) {
      console.warn('Socket.io not initialized for notifications');
      return;
    }

    const notification = {
      _id: `${Date.now()}-${Math.random()}`,
      type,
      recipientId,
      senderId,
      postId,
      commentId,
      replyId,
      content,
      read: false,
      createdAt: new Date()
    };

    // Emit to recipient's room
    this.io.to(`user-${recipientId}`).emit('notification', notification);

    // You would also save to database here
    // await Notification.create(notification);

    return notification;
  }

  async sendBulk(notifications) {
    if (!this.io) return;

    for (const notif of notifications) {
      this.io.to(`user-${notif.recipientId}`).emit('notification', notif);
    }
  }
}

export const notificationService = new NotificationService();