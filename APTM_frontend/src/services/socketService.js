import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.connectionAttempts = 0;
    this.maxAttempts = 5;
    this.reconnectTimer = null;
    this.pendingMessages = new Map();
    this.userId = null;
  }

  // Initialize socket connection
  connect(userId, token) {
    if (this.socket && this.socket.connected) {
      console.log('🔄 Socket already connected');
      return this.socket;
    }

    this.userId = userId;
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
      timeout: 20000,
      autoConnect: true,
      forceNew: true
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
      this.retryPendingMessages();
      if (this.userId) {
        this.joinUser(this.userId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
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
      this.connectionAttempts = 0;
      this.retryPendingMessages();
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Socket reconnection attempt #${attemptNumber}`);
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('❌ Socket reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Socket reconnection failed');
    });

    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });
  }

  // ============ CHAT METHODS ============

  joinConversation(conversationId) {
    if (this.isConnected() && conversationId) {
      this.socket.emit('conversation:join', { conversationId });
      console.log(`💬 Joined conversation: ${conversationId}`);
      return true;
    }
    return false;
  }

  leaveConversation(conversationId) {
    if (this.isConnected() && conversationId) {
      this.socket.emit('conversation:leave', { conversationId });
      console.log(`💬 Left conversation: ${conversationId}`);
      return true;
    }
    return false;
  }

  sendMessage(messageData) {
    if (this.isConnected()) {
      const enrichedData = {
        ...messageData,
        senderId: this.userId
      };
      
      this.socket.emit('message:send', enrichedData);
      
      if (messageData.tempId) {
        this.pendingMessages.set(messageData.tempId, {
          ...enrichedData,
          timestamp: Date.now(),
          attempts: 1
        });
        
        setTimeout(() => {
          if (this.pendingMessages.has(messageData.tempId)) {
            console.log('🧹 Clearing pending message:', messageData.tempId);
            this.pendingMessages.delete(messageData.tempId);
          }
        }, 30000);
      }
      
      return true;
    } else {
      console.log('⚠️ Socket not connected, queueing message for retry');
      if (messageData.tempId) {
        this.pendingMessages.set(messageData.tempId, {
          ...messageData,
          senderId: this.userId,
          timestamp: Date.now(),
          attempts: 1,
          queued: true
        });
      }
      return false;
    }
  }

  retryPendingMessages() {
    if (this.pendingMessages.size === 0) return;
    
    console.log(`🔄 Retrying ${this.pendingMessages.size} pending messages`);
    
    this.pendingMessages.forEach((messageData, tempId) => {
      if (messageData.attempts < 3) {
        console.log(`📤 Retrying message ${tempId} (attempt ${messageData.attempts + 1})`);
        this.socket.emit('message:send', messageData);
        
        this.pendingMessages.set(tempId, {
          ...messageData,
          attempts: messageData.attempts + 1
        });
      } else {
        console.log(`❌ Max retry attempts reached for message ${tempId}`);
        this.pendingMessages.delete(tempId);
        this.emit('message:failed', {
          tempId,
          error: 'Max retry attempts reached'
        });
      }
    });
  }

  startTyping(conversationId, receiverId) {
    if (this.isConnected()) {
      this.socket.emit('typing:start', { 
        conversationId, 
        receiverId,
        timestamp: Date.now()
      });
      return true;
    }
    return false;
  }

  stopTyping(conversationId, receiverId) {
    if (this.isConnected()) {
      this.socket.emit('typing:stop', { 
        conversationId, 
        receiverId,
        timestamp: Date.now()
      });
      return true;
    }
    return false;
  }

  // FIXED: Simplified markMessagesAsRead
  markMessagesAsRead(conversationId, senderId) {
    if (this.isConnected()) {
      const readData = { 
        conversationId, 
        senderId,
        readerId: this.userId,
        timestamp: Date.now()
      };
      
      console.log('📤 Emitting messages:read event:', readData);
      this.socket.emit('messages:read', readData);
      
      return true;
    }
    return false;
  }

  deleteMessage(messageId, conversationId, receiverId) {
    if (this.isConnected()) {
      this.socket.emit('message:delete', { 
        messageId, 
        conversationId, 
        receiverId,
        timestamp: Date.now()
      });
      return true;
    }
    return false;
  }

  // ============ USER STATUS METHODS ============

  getOnlineUsers() {
    if (this.isConnected()) {
      this.socket.emit('get-online-users');
      return true;
    }
    return false;
  }

  getUserStatus(targetUserId) {
    if (this.isConnected()) {
      this.socket.emit('user:status', { 
        targetUserId,
        requesterId: this.userId
      });
      return true;
    }
    return false;
  }

  // ============ ROOM MANAGEMENT ============

  joinUser(userId) {
    if (this.isConnected() && userId) {
      this.socket.emit('join-user', { userId });
      console.log(`👤 Joined user room: ${userId}`);
      return true;
    }
    return false;
  }

  leaveUser(userId) {
    if (this.isConnected() && userId) {
      this.socket.emit('leave-user', { userId });
      console.log(`👤 Left user room: ${userId}`);
      return true;
    }
    return false;
  }

  // ============ EVENT LISTENER METHODS ============

  on(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
      this.socket.on(event, callback);
      
      if (!this.listeners.has(event)) {
        this.listeners.set(event, new Set());
      }
      this.listeners.get(event).add(callback);
      
      return true;
    }
    return false;
  }

  off(event, callback) {
    if (this.socket) {
      if (callback && this.listeners.has(event)) {
        this.socket.off(event, callback);
        this.listeners.get(event).delete(callback);
        
        if (this.listeners.get(event).size === 0) {
          this.listeners.delete(event);
        }
        return true;
      } else if (!callback && this.listeners.has(event)) {
        this.listeners.get(event).forEach(cb => {
          this.socket.off(event, cb);
        });
        this.listeners.delete(event);
        return true;
      }
    }
    return false;
  }

  removeAllListeners(event) {
    if (this.socket) {
      if (event) {
        if (this.listeners.has(event)) {
          this.listeners.get(event).forEach(callback => {
            this.socket.off(event, callback);
          });
          this.listeners.delete(event);
        }
        this.socket.removeAllListeners(event);
      } else {
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

  // ============ UTILITY METHODS ============

  getSocket() {
    return this.socket;
  }

  isConnected() {
    return this.socket && this.socket.connected;
  }

  getConnectionStatus() {
    if (!this.socket) return 'disconnected';
    if (this.socket.connected) return 'connected';
    if (this.socket.disconnected) return 'disconnected';
    return 'connecting';
  }

  disconnect() {
    if (this.socket) {
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      this.removeAllListeners();
      this.pendingMessages.clear();
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
      console.log('🔌 Socket disconnected');
    }
  }

  reconnect() {
    if (this.socket) {
      this.socket.connect();
    } else {
      console.log('⚠️ No socket instance to reconnect');
    }
  }

  emit(event, data) {
    if (this.isConnected()) {
      this.socket.emit(event, data);
      return true;
    }
    return false;
  }
}

// Create singleton instance
const socketService = new SocketService();
export { socketService };