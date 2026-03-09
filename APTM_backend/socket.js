// socket.js - Real-time online status tracking and post features

import { Server } from 'socket.io';
import UserProfile from './models/UserProfile.js';
import jwt from 'jsonwebtoken';
import User from './models/User.js';

let io;
const onlineUsers = new Map(); // userId -> { socketId, userData }
const userLastActive = new Map(); // userId -> timestamp
const userRooms = new Map(); // userId -> Set of rooms
const typingUsers = new Map(); // postId -> Map of userId -> timeout

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const userId = socket.handshake.query.userId;
      
      if (token) {
        // Verify JWT token if provided
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        const user = await User.findById(decoded.userId).select('-password');
        
        if (user) {
          socket.user = user;
          socket.userId = user._id.toString();
        }
      } else if (userId) {
        // Fallback to userId from query
        socket.userId = userId;
      }
      
      next();
    } catch (error) {
      console.error('Socket auth error:', error);
      next();
    }
  });

  io.on('connection', (socket) => {
    console.log('🔌 New client connected:', socket.id);
    
    const userId = socket.userId || socket.handshake.query.userId;
    const userData = socket.user || { name: 'User', username: 'user' };
    
    if (userId) {
      // Add user to online users with additional data
      onlineUsers.set(userId, {
        socketId: socket.id,
        userData: {
          _id: userId,
          name: userData.name,
          username: userData.username,
          avatar: userData.avatar
        },
        connectedAt: new Date()
      });
      
      userLastActive.set(userId, Date.now());
      
      // Update user's last active in database
      updateUserLastActive(userId);
      
      // Join user's personal room
      socket.join(`user-${userId}`);
      
      // Broadcast to all clients that user is online
      socket.broadcast.emit('user-online', {
        userId,
        userData: onlineUsers.get(userId).userData
      });
      
      // Send current online users to the new client
      const onlineUsersList = Array.from(onlineUsers.entries()).reduce((acc, [id, data]) => {
        acc[id] = {
          online: true,
          userData: data.userData
        };
        return acc;
      }, {});
      
      socket.emit('online-users', onlineUsersList);
      
      console.log('👤 User online:', userId, userData.name);
      console.log('📊 Online users:', onlineUsers.size);
    }

    // ============ POST FEATURES ============

    // Join post room for real-time updates
    socket.on('join-post', ({ postId }) => {
      if (!postId) return;
      
      const roomName = `post-${postId}`;
      socket.join(roomName);
      
      // Track user rooms
      if (!userRooms.has(userId)) {
        userRooms.set(userId, new Set());
      }
      userRooms.get(userId).add(roomName);
      
      console.log(`User ${userId} joined post room: ${postId}`);
    });

    // Leave post room
    socket.on('leave-post', ({ postId }) => {
      if (!postId) return;
      
      const roomName = `post-${postId}`;
      socket.leave(roomName);
      
      // Remove from user rooms
      if (userRooms.has(userId)) {
        userRooms.get(userId).delete(roomName);
      }
      
      console.log(`User ${userId} left post room: ${postId}`);
    });

    // Post created
    socket.on('post-created', ({ post }) => {
      // Broadcast to followers or relevant users
      socket.broadcast.emit('new-post', { post });
      
      // Notify mentioned users
      if (post.mentions && post.mentions.length > 0) {
        post.mentions.forEach(mentionedUserId => {
          io.to(`user-${mentionedUserId}`).emit('user-mentioned', {
            postId: post._id,
            mentionedBy: userId,
            content: post.content?.substring(0, 100)
          });
        });
      }
    });

    // Post liked/unliked
    socket.on('post-liked', ({ postId, liked }) => {
      // Broadcast to post room
      socket.to(`post-${postId}`).emit('like-updated', {
        postId,
        userId,
        liked,
        timestamp: new Date()
      });
    });

    // New comment
    socket.on('new-comment', ({ postId, comment }) => {
      // Broadcast to post room
      io.to(`post-${postId}`).emit('new-comment', {
        postId,
        comment: {
          ...comment,
          userId: {
            _id: userId,
            name: userData.name,
            username: userData.username,
            avatar: userData.avatar
          }
        }
      });
    });

    // New reply
    socket.on('new-reply', ({ postId, commentId, reply }) => {
      io.to(`post-${postId}`).emit('new-reply', {
        postId,
        commentId,
        reply: {
          ...reply,
          userId: {
            _id: userId,
            name: userData.name,
            username: userData.username,
            avatar: userData.avatar
          }
        }
      });
    });

    // Comment liked
    socket.on('comment-liked', ({ postId, commentId, liked }) => {
      socket.to(`post-${postId}`).emit('comment-like-updated', {
        postId,
        commentId,
        userId,
        liked
      });
    });

    // Reply liked
    socket.on('reply-liked', ({ postId, commentId, replyId, liked }) => {
      socket.to(`post-${postId}`).emit('reply-like-updated', {
        postId,
        commentId,
        replyId,
        userId,
        liked
      });
    });

    // Post reposted
    socket.on('post-reposted', ({ postId, repostId }) => {
      io.to(`post-${postId}`).emit('post-reposted', {
        postId,
        userId,
        repostId,
        timestamp: new Date()
      });
    });

    // Post deleted
    socket.on('post-deleted', ({ postId }) => {
      io.to(`post-${postId}`).emit('post-deleted', {
        postId,
        userId
      });
    });

    // Post updated
    socket.on('post-updated', ({ post }) => {
      io.to(`post-${post._id}`).emit('post-updated', { post });
    });

    // ============ TYPING INDICATORS ============

    // User is typing
    socket.on('typing', ({ postId, commentId }) => {
      if (!postId) return;
      
      // Clear existing timeout for this user in this post
      const postTyping = typingUsers.get(postId) || new Map();
      if (postTyping.has(userId)) {
        clearTimeout(postTyping.get(userId));
      }
      
      // Set new timeout
      const timeout = setTimeout(() => {
        socket.to(`post-${postId}`).emit('user-stopped-typing', {
          userId,
          commentId
        });
        postTyping.delete(userId);
        if (postTyping.size === 0) {
          typingUsers.delete(postId);
        }
      }, 2000);
      
      postTyping.set(userId, timeout);
      typingUsers.set(postId, postTyping);
      
      // Broadcast typing status
      socket.to(`post-${postId}`).emit('user-typing', {
        userId,
        username: userData.name,
        commentId
      });
    });

    // User stopped typing
    socket.on('stop-typing', ({ postId, commentId }) => {
      const postTyping = typingUsers.get(postId);
      if (postTyping && postTyping.has(userId)) {
        clearTimeout(postTyping.get(userId));
        postTyping.delete(userId);
        
        if (postTyping.size === 0) {
          typingUsers.delete(postId);
        }
        
        socket.to(`post-${postId}`).emit('user-stopped-typing', {
          userId,
          commentId
        });
      }
    });

    // ============ NOTIFICATIONS ============

    // Send notification
    socket.on('send-notification', ({ recipientId, notification }) => {
      io.to(`user-${recipientId}`).emit('notification', {
        ...notification,
        senderId: userId,
        senderData: {
          name: userData.name,
          username: userData.username,
          avatar: userData.avatar
        },
        createdAt: new Date()
      });
    });

    // Mark notifications as read
    socket.on('notifications-read', ({ notificationIds }) => {
      // You can implement this based on your notification system
      socket.emit('notifications-marked-read', { notificationIds });
    });

    // ============ USER ACTIVITY ============

    // Handle user activity
    socket.on('user-activity', () => {
      if (userId) {
        userLastActive.set(userId, Date.now());
      }
    });

    // Join conversation (for DMs)
    socket.on('join-conversation', ({ conversationId }) => {
      socket.join(`conversation-${conversationId}`);
    });

    // Leave conversation
    socket.on('leave-conversation', ({ conversationId }) => {
      socket.leave(`conversation-${conversationId}`);
    });

    // Send message
    socket.on('send-message', ({ conversationId, message }) => {
      io.to(`conversation-${conversationId}`).emit('new-message', {
        conversationId,
        message: {
          ...message,
          senderId: userId,
          senderData: {
            name: userData.name,
            username: userData.username,
            avatar: userData.avatar
          },
          timestamp: new Date()
        }
      });
    });

    // ============ FOLLOW/UNFOLLOW ============

    // User followed
    socket.on('user-followed', ({ targetUserId }) => {
      io.to(`user-${targetUserId}`).emit('followed', {
        followerId: userId,
        followerData: {
          name: userData.name,
          username: userData.username,
          avatar: userData.avatar
        },
        timestamp: new Date()
      });
    });

    // User unfollowed
    socket.on('user-unfollowed', ({ targetUserId }) => {
      io.to(`user-${targetUserId}`).emit('unfollowed', {
        followerId: userId,
        timestamp: new Date()
      });
    });

    // ============ DISCONNECTION ============

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id);
      
      if (userId) {
        // Clear typing indicators
        typingUsers.forEach((postTyping, postId) => {
          if (postTyping.has(userId)) {
            clearTimeout(postTyping.get(userId));
            postTyping.delete(userId);
            
            io.to(`post-${postId}`).emit('user-stopped-typing', {
              userId,
              commentId: null
            });
            
            if (postTyping.size === 0) {
              typingUsers.delete(postId);
            }
          }
        });
        
        // Remove from online users
        onlineUsers.delete(userId);
        userLastActive.delete(userId);
        
        // Leave all rooms
        if (userRooms.has(userId)) {
          userRooms.get(userId).forEach(room => {
            socket.leave(room);
          });
          userRooms.delete(userId);
        }
        
        // Update last active in database
        updateUserLastActive(userId);
        
        // Broadcast that user is offline
        io.emit('user-offline', {
          userId,
          timestamp: new Date()
        });
        
        console.log('👤 User offline:', userId);
      }
    });
  });

  // Check for inactive users every 30 seconds
  setInterval(() => {
    const now = Date.now();
    const timeout = 30000; // 30 seconds
    
    onlineUsers.forEach((data, userId) => {
      const lastActive = userLastActive.get(userId) || 0;
      
      if (now - lastActive > timeout) {
        // User inactive, mark as offline
        onlineUsers.delete(userId);
        userLastActive.delete(userId);
        
        // Update last active in database
        updateUserLastActive(userId);
        
        // Broadcast offline status
        io.emit('user-offline', {
          userId,
          inactive: true,
          timestamp: new Date()
        });
        
        console.log('⏰ User marked offline due to inactivity:', userId);
      }
    });
  }, 30000);

  return io;
};

// Helper function to update user's last active timestamp
const updateUserLastActive = async (userId) => {
  try {
    await UserProfile.findOneAndUpdate(
      { userId },
      { 'stats.lastActive': new Date() },
      { upsert: true }
    );
  } catch (error) {
    console.error('Error updating last active:', error);
  }
};

// Get online status of a user with their data
export const isUserOnline = (userId) => {
  return onlineUsers.has(userId);
};

// Get user online data
export const getUserOnlineData = (userId) => {
  return onlineUsers.get(userId) || null;
};

// Get all online users with their data
export const getOnlineUsers = () => {
  return Array.from(onlineUsers.entries()).map(([id, data]) => ({
    userId: id,
    ...data
  }));
};

// Get online users count
export const getOnlineUsersCount = () => {
  return onlineUsers.size;
};

// Get users typing in a post
export const getTypingUsers = (postId) => {
  const postTyping = typingUsers.get(postId);
  if (!postTyping) return [];
  
  return Array.from(postTyping.keys()).map(userId => ({
    userId,
    userData: onlineUsers.get(userId)?.userData || null
  }));
};

// Send notification to specific user
export const sendNotification = (userId, notification) => {
  if (!io) return false;
  
  io.to(`user-${userId}`).emit('notification', notification);
  return true;
};

// Broadcast to all users
export const broadcastToAll = (event, data) => {
  if (!io) return false;
  
  io.emit(event, data);
  return true;
};

// Broadcast to specific room
export const broadcastToRoom = (room, event, data) => {
  if (!io) return false;
  
  io.to(room).emit(event, data);
  return true;
};

// Get io instance
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

// Get socket by user ID
export const getUserSocket = (userId) => {
  const userData = onlineUsers.get(userId);
  if (!userData) return null;
  
  return io.sockets.sockets.get(userData.socketId);
};

// Disconnect user
export const disconnectUser = (userId) => {
  const socket = getUserSocket(userId);
  if (socket) {
    socket.disconnect();
    return true;
  }
  return false;
};

// Get user's rooms
export const getUserRooms = (userId) => {
  return userRooms.get(userId) || new Set();
};