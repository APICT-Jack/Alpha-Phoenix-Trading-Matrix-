import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.connectionAttempts = 0;
    this.maxAttempts = 5;
  }

  // Initialize socket connection
  connect(userId, token) {
    if (this.socket && this.socket.connected) {
      console.log('🔄 Socket already connected');
      return this.socket;
    }

    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    
    console.log('🔌 Connecting to socket server...');
    
    this.socket = io(SOCKET_URL, {
      auth: { token },
      query: { userId },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });

    this.setupEventListeners();
    
    return this.socket;
  }

  // Setup default event listeners
  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Socket connected successfully');
      this.connectionAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Reconnect manually if server disconnected
        setTimeout(() => this.socket?.connect(), 1000);
      }
    });

    this.socket.on('connect_error', (error) => {
      this.connectionAttempts++;
      console.error('❌ Socket connection error:', error.message);
      
      if (this.connectionAttempts >= this.maxAttempts) {
        console.log('⚠️ Max connection attempts reached, falling back to polling');
        if (this.socket) {
          this.socket.io.opts.transports = ['polling'];
        }
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Socket reconnection attempt #${attemptNumber}`);
    });

    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });
  }

  // ============ CHAT METHODS ============

  // Join a conversation room
  joinConversation(conversationId) {
    if (this.isConnected() && conversationId) {
      this.socket.emit('conversation:join', { conversationId });
      console.log(`💬 Joined conversation: ${conversationId}`);
    }
  }

  // Leave a conversation room
  leaveConversation(conversationId) {
    if (this.isConnected() && conversationId) {
      this.socket.emit('conversation:leave', { conversationId });
      console.log(`💬 Left conversation: ${conversationId}`);
    }
  }

  // Send a message
  sendMessage(messageData) {
    if (this.isConnected()) {
      this.socket.emit('message:send', messageData);
    }
  }

  // Start typing indicator
  startTyping(conversationId, receiverId) {
    if (this.isConnected()) {
      this.socket.emit('typing:start', { conversationId, receiverId });
    }
  }

  // Stop typing indicator
  stopTyping(conversationId, receiverId) {
    if (this.isConnected()) {
      this.socket.emit('typing:stop', { conversationId, receiverId });
    }
  }

  // Mark messages as read
  markMessagesAsRead(conversationId, senderId) {
    if (this.isConnected()) {
      this.socket.emit('messages:read', { conversationId, senderId });
    }
  }

  // Delete a message
  deleteMessage(messageId, conversationId, receiverId) {
    if (this.isConnected()) {
      this.socket.emit('message:delete', { messageId, conversationId, receiverId });
    }
  }

  // ============ POST METHODS ============

  // Join a post room
  joinPost(postId) {
    if (this.isConnected() && postId) {
      this.socket.emit('join-post', { postId });
      console.log(`📌 Joined post room: ${postId}`);
    }
  }

  // Leave a post room
  leavePost(postId) {
    if (this.isConnected() && postId) {
      this.socket.emit('leave-post', { postId });
      console.log(`📌 Left post room: ${postId}`);
    }
  }

  // Join user room (for private messages/notifications)
  joinUser(userId) {
    if (this.isConnected() && userId) {
      this.socket.emit('join-user', { userId });
      console.log(`👤 Joined user room: ${userId}`);
    }
  }

  // Send typing indicator (for posts)
  sendTyping(data) {
    if (this.isConnected()) {
      this.socket.emit('typing', data);
    }
  }

  // Send stop typing indicator (for posts)
  sendStopTyping(data) {
    if (this.isConnected()) {
      this.socket.emit('stop-typing', data);
    }
  }

  // Emit post liked event
  emitPostLiked(data) {
    if (this.isConnected()) {
      this.socket.emit('post-liked', data);
    }
  }

  // Emit new comment
  emitNewComment(data) {
    if (this.isConnected()) {
      this.socket.emit('new-comment', data);
    }
  }

  // Emit new reply
  emitNewReply(data) {
    if (this.isConnected()) {
      this.socket.emit('new-reply', data);
    }
  }

  // Emit reply liked
  emitReplyLiked(data) {
    if (this.isConnected()) {
      this.socket.emit('reply-liked', data);
    }
  }

  // Emit post shared
  emitPostShared(data) {
    if (this.isConnected()) {
      this.socket.emit('post-shared', data);
    }
  }

  // Emit post saved
  emitPostSaved(data) {
    if (this.isConnected()) {
      this.socket.emit('post-saved', data);
    }
  }

  // Emit post deleted
  emitPostDeleted(postId) {
    if (this.isConnected()) {
      this.socket.emit('post-deleted', { postId });
    }
  }

  // ============ NOTIFICATION METHODS ============

  // Send notification
  sendNotification(recipientId, notification) {
    if (this.isConnected()) {
      this.socket.emit('send-notification', { recipientId, notification });
    }
  }

  // Mark notifications as read
  markNotificationsRead(notificationIds) {
    if (this.isConnected()) {
      this.socket.emit('notifications-read', { notificationIds });
    }
  }

  // ============ USER STATUS METHODS ============

  // Send user activity
  sendUserActivity() {
    if (this.isConnected()) {
      this.socket.emit('user-activity');
    }
  }

  // Get user online status
  getUserStatus(userId) {
    if (this.isConnected()) {
      this.socket.emit('user:status', { targetUserId: userId });
    }
  }

  // ============ FOLLOW METHODS ============

  // Emit user followed
  emitUserFollowed(targetUserId) {
    if (this.isConnected()) {
      this.socket.emit('user-followed', { targetUserId });
    }
  }

  // Emit user unfollowed
  emitUserUnfollowed(targetUserId) {
    if (this.isConnected()) {
      this.socket.emit('user-unfollowed', { targetUserId });
    }
  }

  // ============ EVENT LISTENER METHODS ============

  // Add event listener
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
      
      // Store listener for cleanup
      if (!this.listeners.has(event)) {
        this.listeners.set(event, new Set());
      }
      this.listeners.get(event).add(callback);
      
      return true;
    }
    return false;
  }

  // Remove event listener
  off(event, callback) {
    if (this.socket) {
      if (callback && this.listeners.has(event)) {
        // Remove specific callback
        this.socket.off(event, callback);
        this.listeners.get(event).delete(callback);
        
        // Clean up event set if empty
        if (this.listeners.get(event).size === 0) {
          this.listeners.delete(event);
        }
      } else if (!callback && this.listeners.has(event)) {
        // Remove all callbacks for this event
        this.listeners.get(event).forEach(cb => {
          this.socket.off(event, cb);
        });
        this.listeners.delete(event);
      }
      return true;
    }
    return false;
  }

  // Remove all event listeners
  removeAllListeners(event) {
    if (this.socket) {
      if (event) {
        // Remove specific event listeners
        if (this.listeners.has(event)) {
          this.listeners.get(event).forEach(callback => {
            this.socket.off(event, callback);
          });
          this.listeners.delete(event);
        }
        this.socket.removeAllListeners(event);
      } else {
        // Remove all listeners
        this.listeners.forEach((callbacks, evt) => {
          callbacks.forEach(callback => {
            this.socket.off(evt, callback);
          });
        });
        this.listeners.clear();
        this.socket.removeAllListeners();
      }
      console.log('🧹 Removed all socket listeners');
      return true;
    }
    return false;
  }

  // Get socket instance
  getSocket() {
    return this.socket;
  }

  // Check if connected
  isConnected() {
    return this.socket && this.socket.connected;
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      // Remove all listeners
      this.removeAllListeners();
      
      // Disconnect
      this.socket.disconnect();
      this.socket = null;
      console.log('🔌 Socket disconnected');
    }
  }

  // Reconnect socket
  reconnect() {
    if (this.socket) {
      this.socket.connect();
    }
  }
  // Emit get online users event
  getOnlineUsers() {
  if (this.isConnected()) {
    this.socket.emit('get-online-users');
  }
}
}

// Create singleton instance
const socketService = new SocketService();
export { socketService };