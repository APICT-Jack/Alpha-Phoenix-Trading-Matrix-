// src/services/userStatusService.js
import { io } from 'socket.io-client';

class UserStatusService {
  constructor() {
    this.socket = null;
    this.currentUser = null;
    this.listeners = {
      userOnline: [],
      userOffline: [],
      usersOnline: [],
      userStatusResponse: [],
      connectionChange: []
    };
    this.onlineUsers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  init(user, callbacks = {}) {
    this.currentUser = user;
    this.connect(callbacks);
  }

  connect(callbacks) {
    const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 
                      (import.meta.env.PROD ? window.location.origin : 'http://localhost:5000');
    
    console.log('🔌 UserStatusService connecting to:', SOCKET_URL);
    
    this.socket = io(SOCKET_URL, {
      auth: { token: localStorage.getItem('token') },
      query: { userId: this.currentUser?.id },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      console.log('✅ UserStatusService connected');
      this.reconnectAttempts = 0;
      this.emitConnectionChange(true);
      callbacks.onConnect?.();
      
      // Request online users when connected
      this.getOnlineUsers();
    });

    this.socket.on('disconnect', () => {
      console.log('❌ UserStatusService disconnected');
      this.emitConnectionChange(false);
      callbacks.onDisconnect?.();
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 UserStatusService reconnected after ${attemptNumber} attempts`);
      this.getOnlineUsers();
    });

    this.socket.on('users:online', (users) => {
      console.log('📊 Online users received:', users);
      Object.entries(users).forEach(([id, status]) => {
        this.onlineUsers.set(id, status.online);
      });
      this.listeners.usersOnline.forEach(cb => cb(users));
      callbacks.onOnlineUsers?.(users);
    });

    this.socket.on('user:online', (data) => {
      console.log('🟢 User online event:', data);
      this.onlineUsers.set(data.userId, true);
      this.listeners.userOnline.forEach(cb => cb(data));
      callbacks.onUserOnline?.(data);
    });

    this.socket.on('user:offline', (data) => {
      console.log('🔴 User offline event:', data);
      this.onlineUsers.set(data.userId, false);
      this.listeners.userOffline.forEach(cb => cb(data));
      callbacks.onUserOffline?.(data);
    });

    this.socket.on('user:status:response', (data) => {
      console.log('📡 User status response:', data);
      this.onlineUsers.set(data.userId, data.isOnline);
      this.listeners.userStatusResponse.forEach(cb => cb(data));
      callbacks.onUserStatusResponse?.(data);
    });

    // Check if already connected
    if (this.socket.connected) {
      console.log('✅ UserStatusService already connected');
      this.emitConnectionChange(true);
      callbacks.onConnect?.();
      this.getOnlineUsers();
    }
  }

  // Event listeners
  onUserOnline(callback) {
    this.listeners.userOnline.push(callback);
    return () => this.offUserOnline(callback);
  }

  offUserOnline(callback) {
    this.listeners.userOnline = this.listeners.userOnline.filter(cb => cb !== callback);
  }

  onUserOffline(callback) {
    this.listeners.userOffline.push(callback);
    return () => this.offUserOffline(callback);
  }

  offUserOffline(callback) {
    this.listeners.userOffline = this.listeners.userOffline.filter(cb => cb !== callback);
  }

  onUsersOnline(callback) {
    this.listeners.usersOnline.push(callback);
    return () => this.offUsersOnline(callback);
  }

  offUsersOnline(callback) {
    this.listeners.usersOnline = this.listeners.usersOnline.filter(cb => cb !== callback);
  }

  onUserStatusResponse(callback) {
    this.listeners.userStatusResponse.push(callback);
    return () => this.offUserStatusResponse(callback);
  }

  offUserStatusResponse(callback) {
    this.listeners.userStatusResponse = this.listeners.userStatusResponse.filter(cb => cb !== callback);
  }

  onConnectionChange(callback) {
    this.listeners.connectionChange.push(callback);
    return () => this.offConnectionChange(callback);
  }

  offConnectionChange(callback) {
    this.listeners.connectionChange = this.listeners.connectionChange.filter(cb => cb !== callback);
  }

  emitConnectionChange(isConnected) {
    this.listeners.connectionChange.forEach(cb => cb(isConnected));
  }

  // Socket actions
  getOnlineUsers() {
    if (this.socket?.connected) {
      this.socket.emit('get-online-users');
      return true;
    }
    return false;
  }

  getUserStatus(userId) {
    if (this.socket?.connected && userId) {
      this.socket.emit('user:status', { targetUserId: userId });
      return true;
    }
    return false;
  }

  isUserOnline(userId) {
    return this.onlineUsers.get(userId) || false;
  }

  getOnlineUsersMap() {
    return new Map(this.onlineUsers);
  }

  getOnlineUsersList() {
    const list = [];
    this.onlineUsers.forEach((online, userId) => {
      if (online) list.push(userId);
    });
    return list;
  }

  isConnected() {
    return this.socket?.connected || false;
  }

  getSocket() {
    return this.socket;
  }

  reconnect() {
    if (this.socket && !this.socket.connected) {
      console.log('🔄 Attempting to reconnect UserStatusService...');
      this.socket.connect();
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners = {
      userOnline: [],
      userOffline: [],
      usersOnline: [],
      userStatusResponse: [],
      connectionChange: []
    };
    this.onlineUsers.clear();
    this.currentUser = null;
    console.log('🔌 UserStatusService disconnected');
  }
}

// Create singleton instance
export const userStatusService = new UserStatusService();