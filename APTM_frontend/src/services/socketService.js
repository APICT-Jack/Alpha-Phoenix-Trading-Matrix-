// services/socketService.js - FIXED CONNECTION LOGIC
import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.currentUser = null;
    this.isConnected = false;
    this.connectionCallbacks = [];
    this.listeners = {
      'message:receive': [],
      'message:sent': [],
      'message:updated': [],
      'message:deleted': [],
      'message:reaction': [],
      'messages:read': [],
      'typing:start': [],
      'typing:stop': [],
      'user:online': [],
      'user:offline': [],
      'users:online': [],
      'user:status:response': [],
      'conversation:update': [],
      'conversation:joined': [],
      'connect': [],
      'disconnect': [],
      'connect_error': [],
      'error': [],
      'reconnect': []
    };
    this.pendingMessages = new Map();
    this.onlineUsers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect(callbacks = {}) {
    // Get the correct socket URL
    let SOCKET_URL;
    const isRenderProduction = window.location.hostname.includes('onrender.com');
    
    if (isRenderProduction) {
      // For Render, use the same origin as the page
      SOCKET_URL = window.location.origin;
      console.log('🌐 Render production mode, using origin:', SOCKET_URL);
    } else if (import.meta.env.PROD) {
      SOCKET_URL = window.location.origin;
      console.log('🌐 Production mode, using origin:', SOCKET_URL);
    } else {
      SOCKET_URL = 'http://localhost:5000';
      console.log('💻 Development mode, using:', SOCKET_URL);
    }
    
    const token = localStorage.getItem('token');
    const userId = this.currentUser?.id || this.currentUser?._id;
    
    if (!token || !userId) {
      console.error('❌ Missing token or userId');
      callbacks.onConnectError?.({ message: 'Missing credentials' });
      return;
    }
    
    console.log('🔌 Connecting to socket:', SOCKET_URL);
    console.log('👤 User ID:', userId);
    
    // Clean the token (remove quotes if any)
    const cleanToken = token.replace(/^"|"$/g, '');
    
    // Socket.IO configuration for Render
    this.socket = io(SOCKET_URL, {
      path: '/socket.io',
      transports: ['polling', 'websocket'], // Try polling first, then upgrade
      auth: { token: cleanToken },
      query: { 
        token: cleanToken,
        userId: userId 
      },
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 30000,
      withCredentials: true,
      forceNew: true
    });
    
    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Socket connected successfully!');
      console.log('📡 Socket ID:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.trigger('connect', { socketId: this.socket.id });
      this.triggerConnectionCallbacks(true);
      
      // Get online users after connection
      setTimeout(() => {
        this.getOnlineUsers();
      }, 500);
      
      this.retryPendingMessages();
      callbacks.onConnect?.();
    });
    
    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      this.isConnected = false;
      this.trigger('disconnect', { reason });
      this.triggerConnectionCallbacks(false);
      callbacks.onDisconnect?.(reason);
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      console.error('❌ Error details:', error);
      this.isConnected = false;
      this.trigger('connect_error', { error: error.message });
      this.triggerConnectionCallbacks(false);
      callbacks.onConnectError?.(error);
    });
    
    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);
      this.isConnected = true;
      this.trigger('reconnect', { attemptNumber });
      this.triggerConnectionCallbacks(true);
      this.getOnlineUsers();
      this.retryPendingMessages();
      callbacks.onReconnect?.();
    });
    
    this.socket.on('reconnect_attempt', (attempt) => {
      console.log(`🔄 Reconnection attempt ${attempt}`);
    });
    
    this.socket.on('reconnect_error', (error) => {
      console.error('❌ Reconnection error:', error);
    });
    
    this.socket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed after max attempts');
      this.triggerConnectionCallbacks(false);
    });
    
    // ============ CHAT EVENT HANDLERS ============
    
    this.socket.on('message:receive', (message) => {
      console.log('📨 Message received:', message?._id);
      const formatted = this.formatMessage(message);
      this.trigger('message:receive', formatted);
    });
    
    this.socket.on('message:sent', (message) => {
      console.log('✅ Message sent confirmation:', message?._id);
      const formatted = this.formatMessage(message);
      this.trigger('message:sent', formatted);
      if (message?.tempId) {
        this.pendingMessages.delete(message.tempId);
      }
    });
    
    this.socket.on('message:updated', (data) => {
      console.log('📝 Message updated:', data?.messageId);
      this.trigger('message:updated', data);
    });
    
    this.socket.on('message:deleted', (data) => {
      console.log('🗑️ Message deleted:', data?.messageId);
      this.trigger('message:deleted', data);
    });
    
    this.socket.on('message:reaction', (data) => {
      console.log('😊 Message reaction:', data?.messageId);
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
      console.log('📊 Online users list:', Object.keys(users || {}).length);
      const onlineMap = {};
      Object.entries(users || {}).forEach(([id, data]) => {
        const isOnline = typeof data === 'boolean' ? data : data?.online || false;
        this.onlineUsers.set(id, isOnline);
        onlineMap[id] = isOnline;
      });
      this.trigger('users:online', onlineMap);
    });
    
    this.socket.on('user:online', (data) => {
      if (data?.userId) {
        console.log('🟢 User online:', data.userId);
        this.onlineUsers.set(data.userId, true);
        this.trigger('user:online', data);
      }
    });
    
    this.socket.on('user:offline', (data) => {
      if (data?.userId) {
        console.log('🔴 User offline:', data.userId);
        this.onlineUsers.set(data.userId, false);
        this.trigger('user:offline', data);
      }
    });
    
    this.socket.on('user:status:response', (data) => {
      if (data?.userId) {
        this.onlineUsers.set(data.userId, data.isOnline);
        this.trigger('user:status:response', data);
      }
    });
    
    // ============ CONVERSATION HANDLERS ============
    
    this.socket.on('conversation:joined', (data) => {
      console.log('✅ Joined conversation:', data?.conversationId);
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
    if (!message) return null;
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
  
  // ============ CONNECTION CALLBACKS ============
  
  onConnectionChange(callback) {
    this.connectionCallbacks.push(callback);
    callback(this.isConnected);
    return () => this.offConnectionChange(callback);
  }
  
  offConnectionChange(callback) {
    const index = this.connectionCallbacks.indexOf(callback);
    if (index !== -1) this.connectionCallbacks.splice(index, 1);
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
      if (callback) {
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
      } else {
        this.listeners[event] = [];
      }
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
    
    console.log('📤 Sending message');
    this.socket.emit('message:send', data);
    return true;
  }
  
  editMessage(messageId, text) {
    if (this.isConnected && messageId) {
      this.socket.emit('message:edit', { messageId, text });
      return true;
    }
    return false;
  }
  
  deleteMessage(messageId, conversationId, receiverId) {
    if (this.isConnected && messageId) {
      this.socket.emit('message:delete', { messageId, conversationId, receiverId });
      return true;
    }
    return false;
  }
  
  reactToMessage(messageId, reaction) {
    if (this.isConnected && messageId && reaction) {
      this.socket.emit('message:react', { messageId, reaction });
      return true;
    }
    return false;
  }
  
  sendTypingStart(conversationId, receiverId) {
    if (this.isConnected && conversationId && receiverId) {
      this.socket.emit('typing:start', { conversationId, receiverId });
      return true;
    }
    return false;
  }
  
  sendTypingStop(conversationId, receiverId) {
    if (this.isConnected && conversationId && receiverId) {
      this.socket.emit('typing:stop', { conversationId, receiverId });
      return true;
    }
    return false;
  }
  
  startTyping(conversationId, receiverId) {
    return this.sendTypingStart(conversationId, receiverId);
  }
  
  stopTyping(conversationId, receiverId) {
    return this.sendTypingStop(conversationId, receiverId);
  }
  
  markMessagesAsRead(conversationId, senderId) {
    if (this.isConnected && conversationId && senderId) {
      this.socket.emit('messages:read', { conversationId, senderId });
      return true;
    }
    return false;
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
        if (this.socket && this.isConnected) {
          this.socket.emit('message:send', data);
          this.pendingMessages.set(tempId, { ...data, attempts: data.attempts + 1 });
        }
      } else {
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
    this.connectionCallbacks = [];
    console.log('🔌 Socket disconnected');
  }
  
  // For backward compatibility
  init(user, callbacks = {}) {
    this.currentUser = user;
    this.connect(callbacks);
  }
}

export const socketService = new SocketService();