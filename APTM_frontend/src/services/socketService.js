// socketService.js - COMPLETE UPDATED VERSION
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
    this.connectionCallbacks = new Set();
    this.disconnectionCallbacks = new Set();
    this.reconnectStrategy = 'exponential'; // 'exponential' or 'linear'
    this.baseDelay = 1000;
    this.maxDelay = 10000;
  }

  // Initialize socket connection
  // socketService.js - Updated connect method
connect(userId, token) {
  // If already connected with same userId, return existing socket
  if (this.socket && this.socket.connected && this.userId === userId) {
    console.log('🔄 Socket already connected with same user');
    this.triggerConnectionCallbacks(true);
    return this.socket;
  }
  
  // If socket exists but different user, disconnect first
  if (this.socket) {
    console.log('🔄 Disconnecting existing socket for different user');
    this.disconnect();
  }

  this.userId = userId;
  
  // FIXED: Better URL construction for production
  let SOCKET_URL;
  
  if (import.meta.env.PROD) {
    // In production, use the current origin (Render URL)
    SOCKET_URL = window.location.origin;
    console.log('🌐 Production mode, using origin:', SOCKET_URL);
  } else {
    // In development, use localhost with port 5000
    SOCKET_URL = 'http://localhost:5000';
    console.log('💻 Development mode, using:', SOCKET_URL);
  }
  
  // Fallback to environment variable if available
  if (import.meta.env.VITE_API_URL && !import.meta.env.PROD) {
    SOCKET_URL = import.meta.env.VITE_API_URL.replace('/api', '');
  }
  
  console.log('🔌 Connecting to socket server at:', SOCKET_URL);
  console.log('🔑 Token present:', !!token);
  
  // IMPORTANT: Send token in BOTH auth and query for maximum compatibility
  this.socket = io(SOCKET_URL, {
    auth: { token: token },
    query: { 
      userId: userId,
      token: token  // Also include in query as fallback
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    autoConnect: true,
    forceNew: true,
    path: '/socket.io/',
    // Add extra headers for authentication
    extraHeaders: {
      Authorization: `Bearer ${token}`
    }
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
      this.triggerConnectionCallbacks(true);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      this.triggerConnectionCallbacks(false);
      
      if (reason === 'io server disconnect') {
        // Reconnect manually if server disconnected
        setTimeout(() => this.socket?.connect(), 1000);
      }
    });

    this.socket.on('connect_error', (error) => {
      this.connectionAttempts++;
      console.error('❌ Socket connection error:', error.message);
      this.triggerConnectionCallbacks(false);
      
      // Implement exponential backoff
      if (this.connectionAttempts >= this.maxAttempts) {
        console.log('⚠️ Max connection attempts reached, falling back to polling');
        if (this.socket) {
          this.socket.io.opts.transports = ['polling', 'websocket'];
        }
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);
      this.connectionAttempts = 0;
      this.retryPendingMessages();
      this.triggerConnectionCallbacks(true);
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

  // Check connection status with timeout
  async checkConnection(timeoutMs = 5000) {
    return new Promise((resolve) => {
      if (this.isConnected()) {
        resolve(true);
        return;
      }
      
      const timeout = setTimeout(() => {
        this.off('connect', connectHandler);
        resolve(false);
      }, timeoutMs);
      
      const connectHandler = () => {
        clearTimeout(timeout);
        this.off('connect', connectHandler);
        resolve(true);
      };
      
      this.on('connect', connectHandler);
      
      if (!this.socket) {
        clearTimeout(timeout);
        resolve(false);
      }
    });
  }

  // Add connection status callbacks
  onConnectionChange(callback) {
    this.connectionCallbacks.add(callback);
    // Immediately call with current status
    if (this.socket) {
      callback(this.socket.connected);
    }
  }

  removeConnectionChange(callback) {
    this.connectionCallbacks.delete(callback);
  }

  triggerConnectionCallbacks(isConnected) {
    this.connectionCallbacks.forEach(callback => {
      try {
        callback(isConnected);
      } catch (error) {
        console.error('Error in connection callback:', error);
      }
    });
  }

  // ============ CHAT METHODS ============

  joinConversation(conversationId) {
    if (this.isConnected() && conversationId) {
      console.log(`💬 Joining conversation: ${conversationId}`);
      this.socket.emit('conversation:join', { conversationId });
      return true;
    } else {
      console.log('⚠️ Cannot join conversation - socket not connected');
      return false;
    }
  }

  leaveConversation(conversationId) {
    if (this.isConnected() && conversationId) {
      console.log(`💬 Leaving conversation: ${conversationId}`);
      this.socket.emit('conversation:leave', { conversationId });
      return true;
    }
    return false;
  }

  sendMessage(messageData) {
    if (this.isConnected()) {
      const enrichedData = {
        ...messageData,
        senderId: this.userId,
        timestamp: Date.now()
      };
      
      console.log('📤 Sending message:', enrichedData);
      this.socket.emit('message:send', enrichedData);
      
      if (messageData.tempId) {
        this.pendingMessages.set(messageData.tempId, {
          ...enrichedData,
          attempts: 1,
          timestamp: Date.now()
        });
        
        // Auto-clear after 30 seconds
        setTimeout(() => {
          if (this.pendingMessages.has(messageData.tempId)) {
            console.log('🧹 Clearing pending message:', messageData.tempId);
            this.pendingMessages.delete(messageData.tempId);
            this.emit('message:timeout', { tempId: messageData.tempId });
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
          attempts: 1,
          queued: true,
          timestamp: Date.now()
        });
        
        // Try to reconnect if not connected
        this.reconnect();
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
    if (this.isConnected() && conversationId && receiverId) {
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
    if (this.isConnected() && conversationId && receiverId) {
      this.socket.emit('typing:stop', { 
        conversationId, 
        receiverId,
        timestamp: Date.now()
      });
      return true;
    }
    return false;
  }

  markMessagesAsRead(conversationId, senderId) {
    if (this.isConnected() && conversationId && senderId) {
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
    if (this.isConnected() && targetUserId) {
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
      // Remove existing listener to avoid duplicates
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
      this.connectionCallbacks.clear();
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

  // Get connection stats
  getConnectionStats() {
    return {
      connected: this.isConnected(),
      userId: this.userId,
      connectionAttempts: this.connectionAttempts,
      pendingMessages: this.pendingMessages.size,
      listeners: Array.from(this.listeners.keys()),
      transport: this.socket?.io?.engine?.transport?.name || 'none',
      socketId: this.socket?.id || null
    };
  }
}

// Create singleton instance
const socketService = new SocketService();
export { socketService };