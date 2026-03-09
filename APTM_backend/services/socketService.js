import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(userId, token) {
    if (this.socket?.connected) return this.socket;

    this.socket = io('http://localhost:5000', {
      query: { userId },
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.setupListeners();
    return this.socket;
  }

  setupListeners() {
    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  // Chat Events
  joinConversation(conversationId) {
    this.socket?.emit('conversation:join', { conversationId });
  }

  leaveConversation(conversationId) {
    this.socket?.emit('conversation:leave', { conversationId });
  }

  sendMessage(messageData) {
    this.socket?.emit('message:send', messageData);
  }

  startTyping(conversationId, receiverId) {
    this.socket?.emit('typing:start', { conversationId, receiverId });
  }

  stopTyping(conversationId, receiverId) {
    this.socket?.emit('typing:stop', { conversationId, receiverId });
  }

  markMessagesAsRead(conversationId, senderId) {
    this.socket?.emit('messages:read', { conversationId, senderId });
  }

  deleteMessage(messageId, conversationId, receiverId) {
    this.socket?.emit('message:delete', { messageId, conversationId, receiverId });
  }

  // Event listeners
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    this.socket?.on(event, callback);
  }

  off(event, callback) {
    if (callback && this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
    this.socket?.off(event, callback);
  }

  removeAllListeners(event) {
    if (event) {
      this.listeners.delete(event);
      this.socket?.removeAllListeners(event);
    } else {
      this.listeners.clear();
      this.socket?.removeAllListeners();
    }
  }

  disconnect() {
    if (this.socket) {
      this.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected() {
    return this.socket?.connected || false;
  }

  getSocket() {
    return this.socket;
  }
}

export const socketService = new SocketService();