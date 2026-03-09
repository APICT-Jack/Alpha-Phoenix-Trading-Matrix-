// controllers/userNotificationPreferencesController.js
const UserNotificationPreferences = require('../models/UserNotificationPreferences');

class UserNotificationPreferencesController {
  
  // Get user preferences
  async getPreferences(req, res) {
    try {
      const userId = req.user._id;

      let preferences = await UserNotificationPreferences.findOne({ userId });

      // Create default preferences if none exist
      if (!preferences) {
        preferences = await UserNotificationPreferences.create({ userId });
      }

      res.json({
        success: true,
        data: preferences
      });
    } catch (error) {
      console.error('Get preferences error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notification preferences'
      });
    }
  }

  // Update user preferences
  async updatePreferences(req, res) {
    try {
      const userId = req.user._id;
      const updates = req.body;

      let preferences = await UserNotificationPreferences.findOne({ userId });

      if (!preferences) {
        preferences = await UserNotificationPreferences.create({ userId, ...updates });
      } else {
        // Update only provided fields
        Object.keys(updates).forEach(key => {
          if (updates[key] !== undefined) {
            preferences[key] = updates[key];
          }
        });

        await preferences.save();
      }

      res.json({
        success: true,
        data: preferences,
        message: 'Notification preferences updated successfully'
      });
    } catch (error) {
      console.error('Update preferences error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update notification preferences'
      });
    }
  }

  // Update specific notification type preferences
  async updateTypePreferences(req, res) {
    try {
      const userId = req.user._id;
      const { type } = req.params;
      const typeUpdates = req.body;

      const validTypes = ['signal', 'chat', 'community', 'event', 'study', 'bank'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid notification type'
        });
      }

      let preferences = await UserNotificationPreferences.findOne({ userId });

      if (!preferences) {
        preferences = await UserNotificationPreferences.create({ 
          userId,
          types: { [type]: typeUpdates }
        });
      } else {
        // Update specific type preferences
        if (!preferences.types[type]) {
          preferences.types[type] = {};
        }

        Object.keys(typeUpdates).forEach(key => {
          if (typeUpdates[key] !== undefined) {
            preferences.types[type][key] = typeUpdates[key];
          }
        });

        await preferences.save();
      }

      res.json({
        success: true,
        data: preferences.types[type],
        message: `${type} notification preferences updated successfully`
      });
    } catch (error) {
      console.error('Update type preferences error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update type preferences'
      });
    }
  }

  // Enable/disable all notifications
  async toggleNotifications(req, res) {
    try {
      const userId = req.user._id;
      const { enabled } = req.body;

      let preferences = await UserNotificationPreferences.findOne({ userId });

      if (!preferences) {
        preferences = await UserNotificationPreferences.create({ userId, enabled });
      } else {
        preferences.enabled = enabled;
        await preferences.save();
      }

      res.json({
        success: true,
        data: preferences,
        message: `Notifications ${enabled ? 'enabled' : 'disabled'}`
      });
    } catch (error) {
      console.error('Toggle notifications error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to toggle notifications'
      });
    }
  }

  // Reset to default preferences
  async resetToDefaults(req, res) {
    try {
      const userId = req.user._id;

      await UserNotificationPreferences.findOneAndDelete({ userId });

      const defaultPreferences = await UserNotificationPreferences.create({ userId });

      res.json({
        success: true,
        data: defaultPreferences,
        message: 'Notification preferences reset to defaults'
      });
    } catch (error) {
      console.error('Reset preferences error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reset preferences'
      });
    }
  }

  // Get quiet hours status
  async getQuietHours(req, res) {
    try {
      const userId = req.user._id;

      const preferences = await UserNotificationPreferences.findOne({ userId });

      if (!preferences) {
        return res.json({
          success: true,
          data: {
            enabled: false,
            start: '22:00',
            end: '08:00'
          }
        });
      }

      res.json({
        success: true,
        data: preferences.quietHours
      });
    } catch (error) {
      console.error('Get quiet hours error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch quiet hours'
      });
    }
  }

  // Update quiet hours
  async updateQuietHours(req, res) {
    try {
      const userId = req.user._id;
      const { enabled, start, end } = req.body;

      let preferences = await UserNotificationPreferences.findOne({ userId });

      if (!preferences) {
        preferences = await UserNotificationPreferences.create({ 
          userId,
          quietHours: { enabled, start, end }
        });
      } else {
        preferences.quietHours = { enabled, start, end };
        await preferences.save();
      }

      res.json({
        success: true,
        data: preferences.quietHours,
        message: 'Quiet hours updated successfully'
      });
    } catch (error) {
      console.error('Update quiet hours error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update quiet hours'
      });
    }
  }

  // Check if notifications are allowed right now (considering quiet hours)
  async checkNotificationAllowed(req, res) {
    try {
      const userId = req.user._id;
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

      const preferences = await UserNotificationPreferences.findOne({ userId });

      if (!preferences || !preferences.enabled) {
        return res.json({
          success: true,
          data: { allowed: false, reason: 'notifications_disabled' }
        });
      }

      // Check quiet hours
      if (preferences.quietHours.enabled) {
        const { start, end } = preferences.quietHours;
        
        if (currentTime >= start && currentTime <= end) {
          return res.json({
            success: true,
            data: { allowed: false, reason: 'quiet_hours' }
          });
        }
      }

      res.json({
        success: true,
        data: { allowed: true }
      });
    } catch (error) {
      console.error('Check notification allowed error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check notification status'
      });
    }
  }
}

module.exports = new UserNotificationPreferencesController();