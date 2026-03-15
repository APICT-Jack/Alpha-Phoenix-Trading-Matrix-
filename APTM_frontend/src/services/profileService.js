// src/services/profileService.js
import { socketService } from './socketService';

class ProfileService {
  constructor() {
    this.profileListeners = new Map();
    this.currentProfileId = null;
  }

  // Initialize profile tracking
  trackProfile(profileId) {
    if (!profileId) return;
    
    this.currentProfileId = profileId;
    
    // Request initial status
    this.getUserStatus(profileId);
  }

  // Untrack profile
  untrackProfile() {
    this.currentProfileId = null;
  }

  // Get user online status
  getUserStatus(userId) {
    if (!userId) return false;
    
    if (socketService.isConnected()) {
      socketService.getUserStatus(userId);
      return true;
    }
    return false;
  }

  // ============ EVENT LISTENERS ============

  onUserOnline(callback) {
    const handler = (data) => {
      console.log('🟢 ProfileService: User online', data);
      callback(data);
      
      // If this is the tracked profile, also trigger profile update
      if (this.currentProfileId && data.userId === this.currentProfileId) {
        this.triggerProfileUpdate({
          userId: data.userId,
          online: true,
          userData: data.userData,
          timestamp: new Date()
        });
      }
    };
    
    socketService.on('user:online', handler);
    this.profileListeners.set('user:online', handler);
  }

  onUserOffline(callback) {
    const handler = (data) => {
      console.log('🔴 ProfileService: User offline', data);
      callback(data);
      
      // If this is the tracked profile, also trigger profile update
      if (this.currentProfileId && data.userId === this.currentProfileId) {
        this.triggerProfileUpdate({
          userId: data.userId,
          online: false,
          lastSeen: data.timestamp || new Date(),
          timestamp: new Date()
        });
      }
    };
    
    socketService.on('user:offline', handler);
    this.profileListeners.set('user:offline', handler);
  }

  onUsersOnline(callback) {
    const handler = (users) => {
      console.log('📊 ProfileService: Online users', users);
      callback(users);
      
      // If this is the tracked profile, check its status
      if (this.currentProfileId && users[this.currentProfileId]) {
        this.triggerProfileUpdate({
          userId: this.currentProfileId,
          online: true,
          userData: users[this.currentProfileId].userData,
          timestamp: new Date()
        });
      }
    };
    
    socketService.on('users:online', handler);
    this.profileListeners.set('users:online', handler);
  }

  onUserStatusResponse(callback) {
    const handler = (data) => {
      console.log('📡 ProfileService: User status response', data);
      callback(data);
      
      // If this is the tracked profile, update its status
      if (this.currentProfileId && data.userId === this.currentProfileId) {
        this.triggerProfileUpdate({
          userId: data.userId,
          online: data.isOnline,
          userData: data.userData,
          lastSeen: data.lastSeen,
          timestamp: new Date()
        });
      }
    };
    
    socketService.on('user:status:response', handler);
    this.profileListeners.set('user:status:response', handler);
  }

  onProfileUpdate(callback) {
    this.profileListeners.set('profile:update', callback);
  }

  triggerProfileUpdate(data) {
    const callback = this.profileListeners.get('profile:update');
    if (callback) {
      callback(data);
    }
  }

  // ============ CLEANUP ============

  removeAllListeners() {
    // Remove all socket listeners
    this.profileListeners.forEach((handler, event) => {
      if (event !== 'profile:update') {
        socketService.off(event, handler);
      }
    });
    
    this.profileListeners.clear();
    this.currentProfileId = null;
  }

  removeListener(event) {
    const handler = this.profileListeners.get(event);
    if (handler) {
      socketService.off(event, handler);
      this.profileListeners.delete(event);
    }
  }
}

// Create singleton instance
const profileService = new ProfileService();
export { profileService };