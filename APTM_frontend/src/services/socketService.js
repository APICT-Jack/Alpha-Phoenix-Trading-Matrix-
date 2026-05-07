// services/socketService.js - UNIFIED SINGLE SOCKET SERVICE
import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.currentUser = null;
    this.isConnected = false;
    this.listeners = {
      // Chat events
      'message:receive': [],
      'message:sent': [],
      'message:updated': [],
      'message:deleted': [],
      'message:reaction': [],
      'messages:read': [],
      'typing:start': [],
      'typing:stop': [],
      // User status events
      'user:online': [],
      'user:offline': [],
      'users:online': [],
      'user:status:response': [],
      // Conversation events
      'conversation:update': [],
      'conversation:joined': [],
      // Connection events
      'connect': [],
      'disconnect': [],
      'connect_error': [],
      'error': []
    };
    this.pendingMessages = new Map();
    this.onlineUsers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
  }

  // Initialize and connect
  init(user, callbacks = {}) {
    this.currentUser = user;
    this.connect(callbacks);
  }

  connect(callbacks = {}) {
    // Determine socket URL
    let SOCKET_URL;
    const isRenderProduction = window.location.hostname.includes('onrender.com');
    
    if (isRenderProduction) {
      SOCKET_URL = 'https://alpha-phoenix-trading-matrix-s78v.onrender.com';
    } else if (import.meta.env.PROD) {
      SOCKET_URL = window.location.origin;
    } else {
      SOCKET_URL = 'http://localhost:5000';
    }
    
    const token = localStorage.getItem('token');
    const userId = this.currentUser?.id || this.currentUser?._id;
    
    if (!token || !userId) {
      console.error('❌ Missing token or userId for socket connection');
      return;
    }
    
    console.log('🔌 Connecting to socket:', SOCKET_URL);
    console.log('👤 User ID:', userId);
    
    // Create socket connection
    this.socket = io(SOCKET_URL, {
      auth: { token },
      query: { token, userId },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
      withCredentials: true
    });
    
    // Setup event listeners
    this.socket.on('connect', () => {
      console.log('✅ Socket connected successfully');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.trigger('connect', { socketId: this.socket.id });
      
      // Join user's personal room
      this.socket.emit('join-user', { userId });
      
      // Get online users
      setTimeout(() => {
        this.getOnlineUsers();
      }, 500);
      
      // Retry pending messages
      this.retryPendingMessages();
      
      callbacks.onConnect?.();
    });
    
    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      this.isConnected = false;
      this.trigger('disconnect', { reason });
      callbacks.onDisconnect?.(reason);
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      this.trigger('connect_error', { error: error.message });
      callbacks.onConnectError?.(error);
    });
    
    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);
      this.isConnected = true;
      this.trigger('reconnect', { attemptNumber });
      this.getOnlineUsers();
      this.retryPendingMessages();
      callbacks.onReconnect?.();
    });
    
    // ============ CHAT EVENT HANDLERS ============
    
    this.socket.on('message:receive', (message) => {
      console.log('📨 Message received:', message._id);
      const formatted = this.formatMessage(message);
      this.trigger('message:receive', formatted);
    });
    
    this.socket.on('message:sent', (message) => {
      console.log('✅ Message sent confirmation:', message._id);
      const formatted = this.formatMessage(message);
      this.trigger('message:sent', formatted);
      if (message.tempId) {
        this.pendingMessages.delete(message.tempId);
      }
    });
    
    this.socket.on('message:updated', (data) => {
      console.log('📝 Message updated:', data.messageId);
      this.trigger('message:updated', data);
    });
    
    this.socket.on('message:deleted', (data) => {
      console.log('🗑️ Message deleted:', data.messageId);
      this.trigger('message:deleted', data);
    });
    
    this.socket.on('message:reaction', (data) => {
      console.log('😊 Message reaction:', data.messageId);
      this.trigger('message:reaction', data);
    });
    
    this.socket.on('messages:read', (data) => {
      console.log('📖 Messages marked as read:', data);
      this.trigger('messages:read', data);
    });
    
    this.socket.on('typing:start', (data) => {
      this.trigger('typing:start', data);
    });
    
    this.socket.on('typing:stop', (data) => {
      this.trigger('typing:stop', data);
    });
    
    // ============ USER STATUS HANDLERS ============
    
    this.socket.on('users:online', (users) => {
      console.log('📊 Online users list:', Object.keys(users).length);
      const onlineMap = {};
      Object.entries(users).forEach(([id, data]) => {
        const isOnline = typeof data === 'boolean' ? data : data?.online || false;
        this.onlineUsers.set(id, isOnline);
        onlineMap[id] = isOnline;
      });
      this.trigger('users:online', onlineMap);
    });
    
    this.socket.on('user:online', (data) => {
      console.log('🟢 User online:', data.userId);
      this.onlineUsers.set(data.userId, true);
      this.trigger('user:online', data);
    });
    
    this.socket.on('user:offline', (data) => {
      console.log('🔴 User offline:', data.userId);
      this.onlineUsers.set(data.userId, false);
      this.trigger('user:offline', data);
    });
    
    this.socket.on('user:status:response', (data) => {
      this.trigger('user:status:response', data);
    });
    
    // ============ CONVERSATION HANDLERS ============
    
    this.socket.on('conversation:joined', (data) => {
      console.log('✅ Joined conversation:', data.conversationId);
      this.trigger('conversation:joined', data);
    });
    
    this.socket.on('conversation:update', (data) => {
      this.trigger('conversation:update', data);
    });
    
    // ============ ERROR HANDLERS ============
    
    this.socket.on('message:error', (data) => {
      console.error('❌ Message error:', data);
      this.trigger('message:error', data);
    });
    
    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
      this.trigger('error', error);
    });
  }
  
  formatMessage(message) {
    return {
      ...message,
      _id: message._id || message.id,
      senderId: message.senderId?._id || message.senderId,
      receiverId: message.receiverId?._id || message.receiverId,
      sender: message.sender || {
        _id: message.senderId?._id || message.senderId,
        name: message.senderName || 'User',
        username: message.senderUsername || '',
        avatar: message.senderAvatar || null
      },
      createdAt: message.createdAt || new Date().toISOString(),
      media: message.media || [],
      reactions: message.reactions || []
    };
  }
  
  // ============ EVENT REGISTRATION ============
  
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
      return () => this.off(event, callback);
    }
    console.warn(`Unknown event: ${event}`);
    return () => {};
  }
  
  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }
  
  trigger(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} handler:`, error);
        }
      });
    }
  }
  
  // ============ CHAT EMIT METHODS ============
  
  sendMessage(data) {
    if (!this.isConnected) {
      console.log('⚠️ Socket not connected, queueing message');
      if (data.tempId) {
        this.pendingMessages.set(data.tempId, {
          ...data,
          attempts: 1,
          timestamp: Date.now()
        });
      }
      return false;
    }
    
    console.log('📤 Sending message:', { ...data, text: data.text?.substring(0, 50) });
    this.socket.emit('message:send', data);
    return true;
  }
  
  editMessage(messageId, text) {
    if (this.isConnected) {
      this.socket.emit('message:edit', { messageId, text });
    }
  }
  
  deleteMessage(messageId, conversationId, receiverId) {
    if (this.isConnected) {
      this.socket.emit('message:delete', { messageId, conversationId, receiverId });
    }
  }
  
  reactToMessage(messageId, reaction) {
    if (this.isConnected) {
      this.socket.emit('message:react', { messageId, reaction });
    }
  }
  
  sendTypingStart(conversationId, receiverId) {
    if (this.isConnected && conversationId && receiverId) {
      this.socket.emit('typing:start', { conversationId, receiverId });
    }
  }
  
  sendTypingStop(conversationId, receiverId) {
    if (this.isConnected && conversationId && receiverId) {
      this.socket.emit('typing:stop', { conversationId, receiverId });
    }
  }
  
  markMessagesAsRead(conversationId, senderId) {
    if (this.isConnected && conversationId && senderId) {
      this.socket.emit('messages:read', { conversationId, senderId });
    }
  }
  
  joinConversation(conversationId) {
    if (this.isConnected && conversationId) {
      console.log('💬 Joining conversation:', conversationId);
      this.socket.emit('conversation:join', { conversationId });
      return true;
    }
    return false;
  }
  
  leaveConversation(conversationId) {
    if (this.isConnected && conversationId) {
      this.socket.emit('conversation:leave', { conversationId });
      return true;
    }
    return false;
  }
  
  // ============ USER STATUS EMIT METHODS ============
  
  getOnlineUsers() {
    if (this.isConnected) {
      this.socket.emit('get-online-users');
      return true;
    }
    return false;
  }
  
  getUserStatus(targetUserId) {
    if (this.isConnected && targetUserId) {
      this.socket.emit('user:status', { targetUserId });
      return true;
    }
    return false;
  }
  
  isUserOnline(userId) {
    return this.onlineUsers.get(userId) || false;
  }
  
  // ============ UTILITY METHODS ============
  
  retryPendingMessages() {
    if (this.pendingMessages.size === 0) return;
    
    console.log(`🔄 Retrying ${this.pendingMessages.size} pending messages`);
    
    this.pendingMessages.forEach((data, tempId) => {
      if (data.attempts < 5) {
        console.log(`📤 Retrying message ${tempId} (attempt ${data.attempts + 1})`);
        this.socket.emit('message:send', data);
        this.pendingMessages.set(tempId, { ...data, attempts: data.attempts + 1 });
      } else {
        console.log(`❌ Max retry attempts reached for message ${tempId}`);
        this.pendingMessages.delete(tempId);
        this.trigger('message:failed', { tempId, error: 'Max retry attempts' });
      }
    });
  }
  
  isConnected() {
    return this.isConnected && this.socket?.connected;
  }
  
  getSocket() {
    return this.socket;
  }
  
  reconnect() {
    if (this.socket && !this.isConnected) {
      console.log('🔄 Attempting to reconnect...');
      this.socket.connect();
    }
  }
  
  disconnect() {
    if (this.socket) {
      this.pendingMessages.clear();
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    console.log('🔌 Socket disconnected');
  }
}

// Export singleton instance
export const socketService = new SocketService();