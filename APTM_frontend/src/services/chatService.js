// services/chatService.js - SIMPLIFIED, USES SOCKET SERVICE
import { socketService } from './socketService.js';

class ChatService {
  constructor() {
    this.currentUser = null;
    this.socketService = socketService;
  }

  init(user, callbacks = {}) {
    this.currentUser = user;
    
    // Initialize socket service
    this.socketService.init(user, {
      onConnect: () => {
        console.log('✅ Chat service connected');
        callbacks.onConnect?.();
      },
      onConnectError: (error) => {
        console.error('❌ Chat service connection error:', error);
        callbacks.onConnectError?.(error);
      },
      onDisconnect: (reason) => {
        console.log('❌ Chat service disconnected:', reason);
        callbacks.onDisconnect?.(reason);
      },
      onReconnect: () => {
        console.log('🔄 Chat service reconnected');
        callbacks.onReconnect?.();
      }
    });
    
    // Forward events
    this.socketService.on('message:receive', (message) => {
      callbacks.onNewMessage?.(message);
    });
    
    this.socketService.on('message:sent', (message) => {
      callbacks.onMessageSent?.(message);
    });
    
    this.socketService.on('messages:read', (data) => {
      callbacks.onMessagesRead?.(data);
    });
    
    this.socketService.on('typing:start', (data) => {
      callbacks.onTypingStart?.(data);
    });
    
    this.socketService.on('typing:stop', (data) => {
      callbacks.onTypingStop?.(data);
    });
    
    this.socketService.on('user:online', (data) => {
      callbacks.onUserOnline?.(data);
    });
    
    this.socketService.on('user:offline', (data) => {
      callbacks.onUserOffline?.(data);
    });
    
    this.socketService.on('users:online', (users) => {
      callbacks.onOnlineUsers?.(users);
    });
    
    this.socketService.on('conversation:update', (data) => {
      callbacks.onConversationUpdate?.(data);
    });
  }
  
  // Socket methods (pass through)
  sendMessage(data) {
    return this.socketService.sendMessage(data);
  }
  
  joinConversation(conversationId) {
    return this.socketService.joinConversation(conversationId);
  }
  
  leaveConversation(conversationId) {
    return this.socketService.leaveConversation(conversationId);
  }
  
  sendTypingStart(conversationId, receiverId) {
    return this.socketService.sendTypingStart(conversationId, receiverId);
  }
  
  sendTypingStop(conversationId, receiverId) {
    return this.socketService.sendTypingStop(conversationId, receiverId);
  }
  
  markMessagesAsRead(conversationId, senderId) {
    return this.socketService.markMessagesAsRead(conversationId, senderId);
  }
  
  isConnected() {
    return this.socketService.isConnected();
  }
  
  // REST API methods
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
        userId: data.conversation?.userId,
        userName: data.conversation?.userName || 'User',
        userAvatar: data.conversation?.userAvatar,
        lastMessage: data.conversation?.lastMessage || '',
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
  
  disconnect() {
    this.socketService.disconnect();
  }
}

export const chatService = new ChatService();