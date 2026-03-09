// routes/notifications.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const preferencesController = require('../controllers/userNotificationPreferencesController');
const { auth } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

// Notification routes
router.get('/', notificationController.getNotifications);
router.get('/counts', notificationController.getNotificationCounts);
router.get('/grouped', notificationController.getNotificationsByType);
router.post('/', notificationController.createNotification);
router.patch('/:id/read', notificationController.markAsRead);
router.patch('/read-multiple', notificationController.markMultipleAsRead);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:id/dismiss', notificationController.dismissNotification);
router.patch('/dismiss-multiple', notificationController.dismissMultiple);
router.delete('/:id', notificationController.deleteNotification);
router.delete('/cleanup/old', notificationController.cleanupOldNotifications);

// Preferences routes
router.get('/preferences', preferencesController.getPreferences);
router.put('/preferences', preferencesController.updatePreferences);
router.patch('/preferences/:type', preferencesController.updateTypePreferences);
router.patch('/preferences/toggle', preferencesController.toggleNotifications);
router.delete('/preferences/reset', preferencesController.resetToDefaults);
router.get('/preferences/quiet-hours', preferencesController.getQuietHours);
router.put('/preferences/quiet-hours', preferencesController.updateQuietHours);
router.get('/preferences/check-allowed', preferencesController.checkNotificationAllowed);

module.exports = router;