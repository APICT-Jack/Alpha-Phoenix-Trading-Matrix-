// controllers/notificationController.js
const Notification = require('../models/Notification');
const UserNotificationPreferences = require('../models/UserNotificationPreferences');

class NotificationController {
  
  // Get all notifications for a user with pagination and filtering
  async getNotifications(req, res) {
    try {
      const userId = req.user._id;
      const { 
        type, 
        unread, 
        page = 1, 
        limit = 20,
        dismissed = false 
      } = req.query;

      // Build filter
      const filter = { userId, dismissed: dismissed === 'true' };
      if (type) filter.type = type;
      if (unread !== undefined) filter.unread = unread === 'true';

      // Get notifications with pagination
      const notifications = await Notification.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

      // Get total count for pagination
      const total = await Notification.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      // Transform notifications for frontend
      const transformedNotifications = notifications.map(notification => ({
        ...notification,
        time: notification.time // Uses virtual field
      }));

      res.json({
        success: true,
        data: transformedNotifications,
        pagination: {
          current: page,
          pages: totalPages,
          total,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notifications'
      });
    }
  }

  // Get notification counts by type
  async getNotificationCounts(req, res) {
    try {
      const userId = req.user._id;
      
      const counts = await Notification.getNotificationCounts(userId);
      
      // Ensure all types are present with 0 count
      const allTypes = ['signal', 'chat', 'community', 'event', 'study', 'bank'];
      const completeCounts = allTypes.reduce((acc, type) => {
        acc[type] = counts[type] || 0;
        return acc;
      }, {});

      res.json({
        success: true,
        data: completeCounts
      });
    } catch (error) {
      console.error('Get notification counts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notification counts'
      });
    }
  }

  // Get notifications grouped by type (for your tabbed interface)
  async getNotificationsByType(req, res) {
    try {
      const userId = req.user._id;
      const { limitPerType = 10 } = req.query;

      const types = ['signal', 'chat', 'community', 'event', 'study', 'bank'];
      const result = {};

      // Get notifications for each type
      for (const type of types) {
        const notifications = await Notification.find({
          userId,
          type,
          dismissed: false
        })
        .sort({ createdAt: -1 })
        .limit(parseInt(limitPerType))
        .lean();

        result[`${type}s`] = notifications.map(notif => ({
          ...notif,
          time: notif.time // Virtual field
        }));
      }

      // Get counts for tabs
      const counts = await Notification.getNotificationCounts(userId);

      const tabs = [
        { id: 'signals', label: 'Signals', icon: '📈', count: counts.signal || 0 },
        { id: 'chats', label: 'Chats', icon: '💬', count: counts.chat || 0 },
        { id: 'community', label: 'Community', icon: '👥', count: counts.community || 0 },
        { id: 'events', label: 'Events', icon: '📅', count: counts.event || 0 },
        { id: 'study', label: 'Study', icon: '📚', count: counts.study || 0 },
        { id: 'bank', label: 'Bank', icon: '💳', count: counts.bank || 0 }
      ];

      res.json({
        success: true,
        data: {
          tabs,
          notificationsData: result
        }
      });
    } catch (error) {
      console.error('Get notifications by type error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notifications by type'
      });
    }
  }

  // Create a new notification
  async createNotification(req, res) {
    try {
      const {
        userId,
        type,
        title,
        message,
        priority = 'medium',
        metadata = {},
        actionUrl,
        expiresAt
      } = req.body;

      // Check user preferences before creating notification
      const preferences = await UserNotificationPreferences.findOne({ userId });
      if (preferences && !preferences.enabled) {
        return res.json({
          success: true,
          data: null,
          message: 'Notifications disabled for user'
        });
      }

      // Check type-specific preferences
      if (preferences && preferences.types[type] && !preferences.types[type].enabled) {
        return res.json({
          success: true,
          data: null,
          message: `Notifications disabled for type: ${type}`
        });
      }

      const notification = await Notification.create({
        userId,
        type,
        title,
        message,
        priority,
        metadata,
        actionUrl,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined
      });

      // Populate virtual fields
      await notification.populate('userId', 'name email');

      res.status(201).json({
        success: true,
        data: notification,
        message: 'Notification created successfully'
      });
    } catch (error) {
      console.error('Create notification error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create notification'
      });
    }
  }

  // Mark notification as read
  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      const notification = await Notification.findOne({ _id: id, userId });
      
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      await notification.markAsRead();

      res.json({
        success: true,
        data: notification,
        message: 'Notification marked as read'
      });
    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read'
      });
    }
  }

  // Mark multiple notifications as read
  async markMultipleAsRead(req, res) {
    try {
      const { notificationIds } = req.body;
      const userId = req.user._id;

      const result = await Notification.updateMany(
        { 
          _id: { $in: notificationIds },
          userId 
        },
        { 
          $set: { 
            unread: false, 
            readAt: new Date() 
          } 
        }
      );

      res.json({
        success: true,
        data: {
          modifiedCount: result.modifiedCount
        },
        message: `${result.modifiedCount} notifications marked as read`
      });
    } catch (error) {
      console.error('Mark multiple as read error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notifications as read'
      });
    }
  }

  // Mark all notifications as read
  async markAllAsRead(req, res) {
    try {
      const userId = req.user._id;
      const { type } = req.body; // Optional: mark all of specific type

      const filter = { userId, unread: true };
      if (type) filter.type = type;

      const result = await Notification.updateMany(
        filter,
        { 
          $set: { 
            unread: false, 
            readAt: new Date() 
          } 
        }
      );

      res.json({
        success: true,
        data: {
          modifiedCount: result.modifiedCount
        },
        message: `${result.modifiedCount} notifications marked as read`
      });
    } catch (error) {
      console.error('Mark all as read error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark all notifications as read'
      });
    }
  }

  // Dismiss notification
  async dismissNotification(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      const notification = await Notification.findOne({ _id: id, userId });
      
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      await notification.dismiss();

      res.json({
        success: true,
        data: notification,
        message: 'Notification dismissed'
      });
    } catch (error) {
      console.error('Dismiss notification error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to dismiss notification'
      });
    }
  }

  // Dismiss multiple notifications
  async dismissMultiple(req, res) {
    try {
      const { notificationIds } = req.body;
      const userId = req.user._id;

      const result = await Notification.updateMany(
        { 
          _id: { $in: notificationIds },
          userId 
        },
        { 
          $set: { 
            dismissed: true, 
            dismissedAt: new Date() 
          } 
        }
      );

      res.json({
        success: true,
        data: {
          modifiedCount: result.modifiedCount
        },
        message: `${result.modifiedCount} notifications dismissed`
      });
    } catch (error) {
      console.error('Dismiss multiple error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to dismiss notifications'
      });
    }
  }

  // Delete notification permanently
  async deleteNotification(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      const notification = await Notification.findOneAndDelete({ _id: id, userId });
      
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      res.json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      console.error('Delete notification error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete notification'
      });
    }
  }

  // Clean up old notifications (admin only)
  async cleanupOldNotifications(req, res) {
    try {
      const { days = 30 } = req.body;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const result = await Notification.deleteMany({
        createdAt: { $lt: cutoffDate },
        dismissed: true
      });

      res.json({
        success: true,
        data: {
          deletedCount: result.deletedCount
        },
        message: `Cleaned up ${result.deletedCount} old notifications`
      });
    } catch (error) {
      console.error('Cleanup notifications error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cleanup old notifications'
      });
    }
  }
}

module.exports = new NotificationController();