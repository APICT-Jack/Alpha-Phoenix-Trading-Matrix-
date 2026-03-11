// services/notificationService.js
class NotificationService {
  constructor() {
    this.listeners = new Map();
    this.notifications = [];
    this.unreadCounts = {};
    this.processedIds = new Set();
  }

  // Add notification
  addNotification(notification) {
    // Prevent duplicates
    const notifId = notification.id || notification._id || `${notification.conversationId}-${Date.now()}`;
    if (this.processedIds.has(notifId)) return null;
    
    this.processedIds.add(notifId);
    setTimeout(() => this.processedIds.delete(notifId), 5000);

    const newNotification = {
      id: notifId,
      type: notification.type || 'message',
      title: notification.title || 'New Message',
      body: notification.body || notification.text || '',
      conversationId: notification.conversationId,
      userId: notification.userId || notification.senderId,
      senderName: notification.senderName || notification.sender?.name || 'Someone',
      timestamp: notification.timestamp || new Date().toISOString(),
      read: false
    };

    this.notifications = [newNotification, ...this.notifications].slice(0, 50);
    this.notifyListeners('notifications', this.notifications);
    
    return newNotification;
  }

  // Update unread count
  updateUnreadCount(conversationId, count) {
    const oldCount = this.unreadCounts[conversationId] || 0;
    if (count === oldCount) return;
    
    this.unreadCounts[conversationId] = count;
    this.notifyListeners('unread', { 
      conversationId, 
      count,
      total: this.getTotalUnread()
    });
  }

  // Clear conversation unread
  clearConversationUnread(conversationId) {
    if (this.unreadCounts[conversationId]) {
      delete this.unreadCounts[conversationId];
      this.notifyListeners('unread', { 
        conversationId, 
        count: 0,
        total: this.getTotalUnread()
      });
    }
  }

  // Get total unread
  getTotalUnread() {
    return Object.values(this.unreadCounts).reduce((a, b) => a + b, 0);
  }

  // Clear all for conversation
  clearConversation(conversationId) {
    this.clearConversationUnread(conversationId);
    this.notifications = this.notifications.filter(n => n.conversationId !== conversationId);
    this.notifyListeners('notifications', this.notifications);
  }

  // Subscribe to changes
  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.unsubscribe(event, callback);
  }

  unsubscribe(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }
}

export const notificationService = new NotificationService();