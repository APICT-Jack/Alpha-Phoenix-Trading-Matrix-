// services/chatService.js - COMPLETE WITH ALL EVENT METHODS
import { socketService } from './socketService.js';

class ChatService {
  constructor() {
    this.currentUser = null;
    this.socketService = socketService;
    this.eventHandlers = {
      messageReceived: new Set(),
      messageSent: new Set(),
      messageUpdated: new Set(),
      messageDeleted: new Set(),
      messageReaction: new Set(),
      messagesRead: new Set(),
      typingStart: new Set(),
      typingStop: new Set(),
      userOnline: new Set(),
      userOffline: new Set(),
      onlineUsers: new Set(),
      conversationUpdate: new Set()
    };
  }

  init(user, callbacks = {}) {
    this.currentUser = user;
    
    // Initialize socket service with callbacks
    this.socketService.onConnectionChange((isConnected) => {
      if (isConnected) {
        callbacks.onConnect?.();
      } else {
        callbacks.onDisconnect?.();
      }
    });
    
    // Register socket event listeners
    this.setupSocketListeners(callbacks);
    
    // Connect the socket
    const token = localStorage.getItem('token');
    const userId = user?.id || user?._id;
    
    if (token && userId) {
      this.socketService.connect(userId, token);
    }
  }
  
  setupSocketListeners(callbacks = {}) {
    // Message events
    this.socketService.on('message:receive', (message) => {
      console.log('📨 Message received in chatService:', message);
      this.trigger('messageReceived', message);
      callbacks.onNewMessage?.(message);
    });
    
    this.socketService.on('message:sent', (message) => {
      console.log('✅ Message sent in chatService:', message);
      this.trigger('messageSent', message);
      callbacks.onMessageSent?.(message);
    });
    
    this.socketService.on('message:updated', (data) => {
      this.trigger('messageUpdated', data);
      callbacks.onMessageUpdated?.(data);
    });
    
    this.socketService.on('message:deleted', (data) => {
      this.trigger('messageDeleted', data);
      callbacks.onMessageDeleted?.(data);
    });
    
    this.socketService.on('message:reaction', (data) => {
      this.trigger('messageReaction', data);
      callbacks.onMessageReaction?.(data);
    });
    
    this.socketService.on('messages:read', (data) => {
      console.log('📖 Messages read in chatService:', data);
      this.trigger('messagesRead', data);
      callbacks.onMessagesRead?.(data);
    });
    
    // Typing events
    this.socketService.on('typing:start', (data) => {
      this.trigger('typingStart', data);
      callbacks.onTypingStart?.(data);
    });
    
    this.socketService.on('typing:stop', (data) => {
      this.trigger('typingStop', data);
      callbacks.onTypingStop?.(data);
    });
    
    // User status events
    this.socketService.on('user:online', (data) => {
      this.trigger('userOnline', data);
      callbacks.onUserOnline?.(data);
    });
    
    this.socketService.on('user:offline', (data) => {
      this.trigger('userOffline', data);
      callbacks.onUserOffline?.(data);
    });
    
    this.socketService.on('users:online', (users) => {
      this.trigger('onlineUsers', users);
      callbacks.onOnlineUsers?.(users);
    });
    
    this.socketService.on('conversation:update', (data) => {
      this.trigger('conversationUpdate', data);
      callbacks.onConversationUpdate?.(data);
    });
    
    // Connection events
    this.socketService.on('connect', () => {
      callbacks.onConnect?.();
    });
    
    this.socketService.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      callbacks.onConnectError?.(error);
    });
    
    this.socketService.on('disconnect', (reason) => {
      callbacks.onDisconnect?.(reason);
    });
    
    this.socketService.on('reconnect', () => {
      callbacks.onReconnect?.();
    });
  }
  
  // ============ EVENT REGISTRATION METHODS ============
  
  onMessageReceived(callback) {
    this.eventHandlers.messageReceived.add(callback);
    return () => this.offMessageReceived(callback);
  }
  
  offMessageReceived(callback) {
    this.eventHandlers.messageReceived.delete(callback);
  }
  
  onMessageSent(callback) {
    this.eventHandlers.messageSent.add(callback);
    return () => this.offMessageSent(callback);
  }
  
  offMessageSent(callback) {
    this.eventHandlers.messageSent.delete(callback);
  }
  
  onMessageUpdated(callback) {
    this.eventHandlers.messageUpdated.add(callback);
    return () => this.offMessageUpdated(callback);
  }
  
  offMessageUpdated(callback) {
    this.eventHandlers.messageUpdated.delete(callback);
  }
  
  onMessageDeleted(callback) {
    this.eventHandlers.messageDeleted.add(callback);
    return () => this.offMessageDeleted(callback);
  }
  
  offMessageDeleted(callback) {
    this.eventHandlers.messageDeleted.delete(callback);
  }
  
  onMessageReaction(callback) {
    this.eventHandlers.messageReaction.add(callback);
    return () => this.offMessageReaction(callback);
  }
  
  offMessageReaction(callback) {
    this.eventHandlers.messageReaction.delete(callback);
  }
  
  onMessagesRead(callback) {
    this.eventHandlers.messagesRead.add(callback);
    return () => this.offMessagesRead(callback);
  }
  
  offMessagesRead(callback) {
    this.eventHandlers.messagesRead.delete(callback);
  }
  
  onTypingStart(callback) {
    this.eventHandlers.typingStart.add(callback);
    return () => this.offTypingStart(callback);
  }
  
  offTypingStart(callback) {
    this.eventHandlers.typingStart.delete(callback);
  }
  
  onTypingStop(callback) {
    this.eventHandlers.typingStop.add(callback);
    return () => this.offTypingStop(callback);
  }
  
  offTypingStop(callback) {
    this.eventHandlers.typingStop.delete(callback);
  }
  
  onUserOnline(callback) {
    this.eventHandlers.userOnline.add(callback);
    return () => this.offUserOnline(callback);
  }
  
  offUserOnline(callback) {
    this.eventHandlers.userOnline.delete(callback);
  }
  
  onUserOffline(callback) {
    this.eventHandlers.userOffline.add(callback);
    return () => this.offUserOffline(callback);
  }
  
  offUserOffline(callback) {
    this.eventHandlers.userOffline.delete(callback);
  }
  
  onOnlineUsers(callback) {
    this.eventHandlers.onlineUsers.add(callback);
    return () => this.offOnlineUsers(callback);
  }
  
  offOnlineUsers(callback) {
    this.eventHandlers.onlineUsers.delete(callback);
  }
  
  onConversationUpdate(callback) {
    this.eventHandlers.conversationUpdate.add(callback);
    return () => this.offConversationUpdate(callback);
  }
  
  offConversationUpdate(callback) {
    this.eventHandlers.conversationUpdate.delete(callback);
  }
  
  trigger(event, data) {
    this.eventHandlers[event]?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} handler:`, error);
      }
    });
  }
  
  // ============ SOCKET ACTION METHODS ============
  
  sendMessage(data) {
    return this.socketService.sendMessage(data);
  }
  
  editMessage(messageId, text) {
    return this.socketService.editMessage(messageId, text);
  }
  
  deleteMessage(messageId, conversationId, receiverId) {
    return this.socketService.deleteMessage(messageId, conversationId, receiverId);
  }
  
  reactToMessage(messageId, reaction) {
    return this.socketService.reactToMessage(messageId, reaction);
  }
  
  sendTypingStart(conversationId, receiverId) {
    return this.socketService.startTyping(conversationId, receiverId);
  }
  
  sendTypingStop(conversationId, receiverId) {
    return this.socketService.stopTyping(conversationId, receiverId);
  }
  
  markMessagesAsRead(conversationId, senderId) {
    return this.socketService.markMessagesAsRead(conversationId, senderId);
  }
  
  joinConversation(conversationId) {
    return this.socketService.joinConversation(conversationId);
  }
  
  leaveConversation(conversationId) {
    return this.socketService.leaveConversation(conversationId);
  }
  
  getOnlineUsers() {
    return this.socketService.getOnlineUsers();
  }
  
  isConnected() {
    return this.socketService.isConnected();
  }
  
  // ============ REST API METHODS ============
  
  async getConversations() {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE}/chat/conversations`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error(`Failed: ${response.status}`);
      const data = await response.json();
      
      if (data.success && Array.isArray(data.conversations)) return data.conversations;
      if (Array.isArray(data)) return data;
      if (data.conversations && Array.isArray(data.conversations)) return data.conversations;
      
      return [];
    } catch (error) {
      console.error('Error getting conversations:', error);
      throw error;
    }
  }
  
  async getOrCreateConversation(userId) {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE}/chat/conversation/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to create conversation');
      const data = await response.json();
      
      return {
        id: data.conversation?.id || data.conversation?._id,
        _id: data.conversation?._id || data.conversation?.id,
        userId: data.conversation?.userId,
        userName: data.conversation?.userName || 'User',
        userAvatar: data.conversation?.userAvatar,
        userUsername: data.conversation?.userUsername,
        lastMessage: data.conversation?.lastMessage || '',
        lastMessageTime: data.conversation?.lastMessageTime || new Date().toISOString(),
        unreadCount: data.conversation?.unreadCount || 0
      };
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }
  
  async getMessages(conversationId, page = 1, limit = 50) {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE}/chat/messages/${conversationId}?page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch messages');
      return await response.json();
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  }
  
  async markMessagesAsReadRest(conversationId, senderId) {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE}/chat/conversations/${conversationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ senderId })
      });
      
      if (!response.ok) throw new Error('Failed to mark as read');
      return await response.json();
    } catch (error) {
      console.error('Error marking as read:', error);
      throw error;
    }
  }
  
  async searchUsers(query) {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const url = query 
        ? `${API_BASE}/chat/search/users?q=${encodeURIComponent(query)}`
        : `${API_BASE}/chat/search/users`;
        
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to search users');
      const data = await response.json();
      
      return (data.users || []).map(user => ({
        id: user.id || user._id,
        _id: user._id || user.id,
        name: user.name || 'User',
        username: user.username || '',
        avatar: user.avatar || null,
        email: user.email,
        isOnline: user.isOnline || false,
        isFollowing: user.isFollowing || false
      }));
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }
  
  disconnect() {
    this.socketService.disconnect();
    // Clear all event handlers
    Object.keys(this.eventHandlers).forEach(key => {
      this.eventHandlers[key].clear();
    });
  }
}

export const chatService = new ChatService();