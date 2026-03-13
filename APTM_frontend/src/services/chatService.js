import { io } from 'socket.io-client';

class ChatService {
  constructor() {
    this.socket = null;
    this.currentUser = null;
    this.listeners = {
      messageReceived: [],
      messageSent: [],
      messageUpdated: [],
      messageDeleted: [],
      messagesRead: [],
      typingStart: [],
      typingStop: [],
      userOnline: [],
      userOffline: [],
      conversationUpdate: []
    };
    this.connectionListeners = [];
    this.pendingMessages = new Map();
    this.onlineUsers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  init(user, callbacks = {}) {
    this.currentUser = user;
    this.connect(callbacks);
  }

  connect(callbacks) {
    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    
    this.socket = io(SOCKET_URL, {
      auth: { token: localStorage.getItem('token') },
      query: { userId: this.currentUser?.id },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected');
      this.reconnectAttempts = 0;
      this.emitConnectionChange(true);
      this.retryPendingMessages();
      callbacks.onConnect?.();
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      this.emitConnectionChange(false);
      callbacks.onDisconnect?.();
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);
      this.retryPendingMessages();
    });

    this.socket.on('message:receive', (message) => {
      // Format message for consistency
      const formattedMessage = {
        ...message,
        _id: message._id || message.id,
        senderId: message.senderId?._id || message.senderId,
        sender: message.sender || {
          _id: message.senderId?._id || message.senderId,
          name: message.senderName || 'User',
          avatar: message.senderAvatar || null
        }
      };
      this.listeners.messageReceived.forEach(cb => cb(formattedMessage));
      callbacks.onNewMessage?.(formattedMessage);
    });

    this.socket.on('message:sent', (message) => {
      const formattedMessage = {
        ...message,
        _id: message._id || message.id,
        senderId: message.senderId?._id || message.senderId,
        sender: message.sender || {
          _id: message.senderId?._id || message.senderId,
          name: message.senderName || 'User',
          avatar: message.senderAvatar || null
        }
      };
      this.listeners.messageSent.forEach(cb => cb(formattedMessage));
      if (message.tempId) {
        this.pendingMessages.delete(message.tempId);
      }
    });

    this.socket.on('message:updated', (data) => {
      this.listeners.messageUpdated.forEach(cb => cb(data));
    });

    this.socket.on('message:deleted', (data) => {
      this.listeners.messageDeleted.forEach(cb => cb(data));
    });

    this.socket.on('messages:read', (data) => {
      this.listeners.messagesRead.forEach(cb => cb(data));
      callbacks.onMessagesRead?.(data);
    });

    this.socket.on('typing:start', (data) => {
      this.listeners.typingStart.forEach(cb => cb(data));
      callbacks.onTypingStart?.(data);
    });

    this.socket.on('typing:stop', (data) => {
      this.listeners.typingStop.forEach(cb => cb(data));
      callbacks.onTypingStop?.(data);
    });

    this.socket.on('user:online', (data) => {
      this.onlineUsers.set(data.userId, true);
      this.listeners.userOnline.forEach(cb => cb(data));
      callbacks.onUserOnline?.(data);
    });

    this.socket.on('user:offline', (data) => {
      this.onlineUsers.set(data.userId, false);
      this.listeners.userOffline.forEach(cb => cb(data));
      callbacks.onUserOffline?.(data);
    });

    this.socket.on('users:online', (users) => {
      Object.entries(users).forEach(([id, status]) => {
        this.onlineUsers.set(id, status.online);
      });
      callbacks.onOnlineUsers?.(users);
    });

    this.socket.on('conversation:update', (data) => {
      this.listeners.conversationUpdate.forEach(cb => cb(data));
      callbacks.onConversationUpdate?.(data);
    });

    // Check if already connected
    if (this.socket.connected) {
      console.log('✅ Socket already connected');
      this.emitConnectionChange(true);
      callbacks.onConnect?.();
    }
  }

  // Event listeners
  onMessageReceived(callback) {
    this.listeners.messageReceived.push(callback);
  }

  offMessageReceived(callback) {
    this.listeners.messageReceived = this.listeners.messageReceived.filter(cb => cb !== callback);
  }

  onMessageSent(callback) {
    this.listeners.messageSent.push(callback);
  }

  offMessageSent(callback) {
    this.listeners.messageSent = this.listeners.messageSent.filter(cb => cb !== callback);
  }

  onMessageUpdated(callback) {
    this.listeners.messageUpdated.push(callback);
  }

  offMessageUpdated(callback) {
    this.listeners.messageUpdated = this.listeners.messageUpdated.filter(cb => cb !== callback);
  }

  onMessageDeleted(callback) {
    this.listeners.messageDeleted.push(callback);
  }

  offMessageDeleted(callback) {
    this.listeners.messageDeleted = this.listeners.messageDeleted.filter(cb => cb !== callback);
  }

  onMessagesRead(callback) {
    this.listeners.messagesRead.push(callback);
  }

  offMessagesRead(callback) {
    this.listeners.messagesRead = this.listeners.messagesRead.filter(cb => cb !== callback);
  }

  onTypingStart(callback) {
    this.listeners.typingStart.push(callback);
  }

  offTypingStart(callback) {
    this.listeners.typingStart = this.listeners.typingStart.filter(cb => cb !== callback);
  }

  onTypingStop(callback) {
    this.listeners.typingStop.push(callback);
  }

  offTypingStop(callback) {
    this.listeners.typingStop = this.listeners.typingStop.filter(cb => cb !== callback);
  }

  onUserOnline(callback) {
    this.listeners.userOnline.push(callback);
  }

  offUserOnline(callback) {
    this.listeners.userOnline = this.listeners.userOnline.filter(cb => cb !== callback);
  }

  onUserOffline(callback) {
    this.listeners.userOffline.push(callback);
  }

  offUserOffline(callback) {
    this.listeners.userOffline = this.listeners.userOffline.filter(cb => cb !== callback);
  }

  onConversationUpdate(callback) {
    this.listeners.conversationUpdate.push(callback);
  }

  offConversationUpdate(callback) {
    this.listeners.conversationUpdate = this.listeners.conversationUpdate.filter(cb => cb !== callback);
  }

  onConnectionChange(callback) {
    this.connectionListeners.push(callback);
  }

  offConnectionChange(callback) {
    this.connectionListeners = this.connectionListeners.filter(cb => cb !== callback);
  }

  emitConnectionChange(isConnected) {
    this.connectionListeners.forEach(cb => cb(isConnected));
  }

  // Socket actions
  sendMessage(data) {
    if (!this.socket?.connected) {
      console.log('⚠️ Socket not connected, queueing message');
      this.pendingMessages.set(data.tempId, {
        ...data,
        attempts: 1,
        timestamp: Date.now()
      });
      
      // Try to reconnect
      this.reconnect();
      return false;
    }
    
    console.log('📤 Emitting message:send:', data);
    this.socket.emit('message:send', data);
    return true;
  }

  retryPendingMessages() {
    if (this.pendingMessages.size === 0) return;
    
    console.log(`🔄 Retrying ${this.pendingMessages.size} pending messages`);
    
    this.pendingMessages.forEach((data, tempId) => {
      if (data.attempts < 3) {
        console.log(`📤 Retrying message ${tempId} (attempt ${data.attempts + 1})`);
        this.socket.emit('message:send', data);
        this.pendingMessages.set(tempId, { ...data, attempts: data.attempts + 1 });
      } else {
        console.log(`❌ Max retry attempts reached for message ${tempId}`);
        this.pendingMessages.delete(tempId);
        this.emit('message:failed', { tempId, error: 'Max retry attempts reached' });
      }
    });
  }

  reconnect() {
    if (this.socket && !this.socket.connected) {
      console.log('🔄 Attempting to reconnect...');
      this.socket.connect();
    }
  }

  editMessage(messageId, text) {
    this.socket?.emit('message:edit', { messageId, text });
  }

  deleteMessage(messageId, conversationId, receiverId) {
    this.socket?.emit('message:delete', { messageId, conversationId, receiverId });
  }

  reactToMessage(messageId, reaction) {
    this.socket?.emit('message:react', { messageId, reaction });
  }

  sendTypingStart(conversationId, receiverId) {
    this.socket?.emit('typing:start', { conversationId, receiverId });
  }

  sendTypingStop(conversationId, receiverId) {
    this.socket?.emit('typing:stop', { conversationId, receiverId });
  }

  markMessagesAsRead(conversationId, senderId) {
    this.socket?.emit('messages:read', { conversationId, senderId });
  }

  joinConversation(conversationId) {
    this.socket?.emit('conversation:join', { conversationId });
  }

  leaveConversation(conversationId) {
    this.socket?.emit('conversation:leave', { conversationId });
  }

  isUserOnline(userId) {
    return this.onlineUsers.get(userId) || false;
  }

  // API calls
  async getConversations() {
    const response = await fetch('http://localhost:5000/api/chat/conversations', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch conversations');
    const data = await response.json();
    return data.conversations || [];
  }

  async getOrCreateConversation(userId) {
    try {
      const response = await fetch(`http://localhost:5000/api/chat/conversation/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create conversation');
      }
      
      const data = await response.json();
      
      // Format the conversation data consistently
      return {
        id: data.conversation.id || data.conversation._id,
        _id: data.conversation._id || data.conversation.id,
        userId: data.conversation.userId,
        userName: data.conversation.userName || 'User',
        userAvatar: data.conversation.userAvatar || null,
        userUsername: data.conversation.userUsername || '',
        lastMessage: data.conversation.lastMessage || '',
        lastMessageTime: data.conversation.lastMessageTime || new Date().toISOString(),
        unreadCount: 0
      };
    } catch (error) {
      console.error('Error in getOrCreateConversation:', error);
      throw error;
    }
  }

  async getMessages(conversationId, page = 1, limit = 50) {
    const response = await fetch(
      `http://localhost:5000/api/chat/messages/${conversationId}?page=${page}&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    
    if (!response.ok) throw new Error('Failed to fetch messages');
    return await response.json();
  }

  async searchUsers(query) {
    try {
      const url = query 
        ? `http://localhost:5000/api/chat/search/users?q=${encodeURIComponent(query)}`
        : 'http://localhost:5000/api/chat/search/users?q=';
        
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to search users');
      const data = await response.json();
      
      // Format users to ensure consistent structure
      const users = (data.users || []).map(user => ({
        id: user.id || user._id,
        _id: user._id || user.id,
        name: user.name || 'User',
        username: user.username || '',
        avatar: user.avatar || null,
        email: user.email,
        isOnline: user.isOnline || false,
        isFollowing: user.isFollowing || false
      }));
      
      return users;
    } catch (error) {
      console.error('Error in searchUsers:', error);
      return [];
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners = {
      messageReceived: [],
      messageSent: [],
      messageUpdated: [],
      messageDeleted: [],
      messagesRead: [],
      typingStart: [],
      typingStop: [],
      userOnline: [],
      userOffline: [],
      conversationUpdate: []
    };
    this.connectionListeners = [];
    this.onlineUsers.clear();
    this.pendingMessages.clear();
  }
}

export const chatService = new ChatService();