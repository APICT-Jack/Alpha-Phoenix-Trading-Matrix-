// socket/index.js - COMPLETE WORKING VERSION WITH ROBUST CORS HANDLING

import { Server } from 'socket.io';
import { Conversation, Message } from '../models/Chat.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

let io;
const onlineUsers = new Map(); // userId -> { socketId, userData, sockets: Set }
const userSockets = new Map(); // userId -> Set of socketIds
const typingUsers = new Map(); // conversationId -> Set of userIds
const userConversations = new Map(); // userId -> Set of conversationIds

// Helper function to aggressively clean environment URLs
const cleanEnvUrl = (url) => {
  if (!url) return null;
  
  // Convert to string if it's not already
  let cleaned = String(url);
  
  // Remove any 'FRONTEND_URL=' prefix (case insensitive)
  cleaned = cleaned.replace(/^FRONTEND_URL=/i, '');
  
  // Remove any quotes (single or double)
  cleaned = cleaned.replace(/["']/g, '');
  
  // Trim whitespace
  cleaned = cleaned.trim();
  
  // Remove trailing slashes
  cleaned = cleaned.replace(/\/+$/, '');
  
  return cleaned;
};

export const initializeSockets = (server) => {
  io = new Server(server, {
    cors: {
      origin: function(origin, callback) {
        // Get the raw FRONTEND_URL from env
        const rawUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        
        // Clean it aggressively
        const cleanedUrl = cleanEnvUrl(rawUrl);
        
        // Define allowed origins
        const allowedOrigins = [
          'http://localhost:3000',
          'https://alpha-phoenix-trading-matrix-s78v.onrender.com',
          cleanedUrl
        ].filter(Boolean);
        
        // Also add the URL without https:// for flexibility
        if (cleanedUrl && cleanedUrl.startsWith('https://')) {
          allowedOrigins.push(cleanedUrl.replace('https://', 'http://'));
        }
        
        console.log('🔧 Socket CORS Check:', { 
          origin, 
          rawUrl, 
          cleanedUrl,
          allowedOrigins 
        });
        
        // Allow requests with no origin (like mobile apps, Postman)
        if (!origin) {
          console.log('✅ Allowing request with no origin');
          callback(null, true);
          return;
        }
        
        // Check if origin is allowed
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          console.log('❌ CORS blocked for origin:', origin);
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true, // Enable compatibility
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const userId = socket.handshake.query.userId;

      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        const user = await User.findById(decoded.userId).select('-password');
        
        if (user) {
          socket.user = user;
          socket.userId = user._id.toString();
        }
      } else if (userId) {
        socket.userId = userId;
        const user = await User.findById(userId).select('-password');
        if (user) {
          socket.user = user;
        }
      }
      
      next();
    } catch (error) {
      console.error('Socket auth error:', error);
      next();
    }
  });

  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);
    
    const userId = socket.userId;
    const userData = socket.user || { 
      _id: userId,
      name: 'User', 
      username: 'user',
      avatar: null
    };

    if (userId) {
      // Update user online status in database
      User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() }).exec();

      // Add user to online users
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

      // Track multiple sockets per user (for multiple tabs)
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId).add(socket.id);

      // Initialize user conversations set
      if (!userConversations.has(userId)) {
        userConversations.set(userId, new Set());
      }

      // Join user's personal room
      socket.join(`user:${userId}`);

      // Broadcast online status
      socket.broadcast.emit('user:online', {
        userId,
        userData: onlineUsers.get(userId).userData,
        timestamp: new Date()
      });

      // Send current online users to new client
      const onlineUsersList = Array.from(onlineUsers.entries()).reduce((acc, [id, data]) => {
        acc[id] = {
          online: true,
          userData: data.userData
        };
        return acc;
      }, {});

      socket.emit('users:online', onlineUsersList);

      console.log('👤 User online:', userId, userData.name);
      console.log('📊 Online users:', onlineUsers.size);
    }

    // ============ CHAT EVENTS ============

    // Join conversation room
    socket.on('conversation:join', async ({ conversationId }) => {
      if (!conversationId || !userId) return;

      try {
        // Verify user is part of conversation
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: userId
        });

        if (conversation) {
          // Leave all previous conversations for this user on this socket
          if (userConversations.has(userId)) {
            userConversations.get(userId).forEach(convId => {
              socket.leave(`conversation:${convId}`);
            });
            userConversations.get(userId).clear();
          }

          // Join new conversation
          socket.join(`conversation:${conversationId}`);
          userConversations.get(userId).add(conversationId);
          
          console.log(`User ${userId} joined conversation: ${conversationId}`);

          // Find the other participant
          const otherParticipant = conversation.participants.find(
            p => p.toString() !== userId
          );

          if (otherParticipant) {
            // Mark messages as read when joining
            const result = await Message.updateMany(
              {
                senderId: otherParticipant,
                receiverId: userId,
                status: { $ne: 'read' }
              },
              {
                status: 'read',
                readAt: new Date()
              }
            );

            if (result.modifiedCount > 0) {
              // Reset unread count
              conversation.unreadCounts.set(userId.toString(), 0);
              await conversation.save();

              // Broadcast to ALL participants
              const readEventData = {
                conversationId,
                readerId: userId,
                count: result.modifiedCount,
                timestamp: new Date()
              };

              // Emit to conversation room (all participants)
              io.to(`conversation:${conversationId}`).emit('messages:read', readEventData);
              
              // Also emit to individual user rooms
              conversation.participants.forEach(participantId => {
                io.to(`user:${participantId}`).emit('messages:read', readEventData);
              });

              console.log(`📖 Messages auto-marked as read when joining: ${result.modifiedCount} messages`);
            }
          }
        }
      } catch (error) {
        console.error('Error joining conversation:', error);
      }
    });

    // Leave conversation room
    socket.on('conversation:leave', ({ conversationId }) => {
      if (!conversationId || !userId) return;
      
      socket.leave(`conversation:${conversationId}`);
      if (userConversations.has(userId)) {
        userConversations.get(userId).delete(conversationId);
      }
    });

    // Send message
    socket.on('message:send', async ({ conversationId, receiverId, text, type = 'text', tempId }) => {
      if (!text || !receiverId || !userId) return;

      try {
        // Find or create conversation
        const participants = [userId, receiverId].sort((a, b) => 
          a.toString().localeCompare(b.toString())
        );

        let conversation = await Conversation.findOne({
          participants: { $all: participants },
          isActive: true
        });

        if (!conversation) {
          conversation = new Conversation({
            participants,
            unreadCounts: new Map([
              [userId.toString(), 0],
              [receiverId.toString(), 0]
            ])
          });
          await conversation.save();
        }

        // Create message
        const message = new Message({
          senderId: userId,
          receiverId,
          text,
          type,
          status: 'sent'
        });

        await message.save();

        // Update conversation
        conversation.lastMessage = message._id;
        conversation.lastMessageText = text;
        conversation.lastMessageTime = new Date();
        
        // Only increment unread count for the receiver
        const receiverUnreadCount = conversation.unreadCounts.get(receiverId.toString()) || 0;
        conversation.unreadCounts.set(receiverId.toString(), receiverUnreadCount + 1);
        
        // Sender's unread count remains 0
        conversation.unreadCounts.set(userId.toString(), 0);
        
        await conversation.save();

        // Populate sender info
        await message.populate('senderId', 'name username avatar');

        // Prepare message data
        const messageData = {
          ...message.toObject(),
          conversationId: conversation._id,
          sender: {
            _id: userId,
            name: userData.name,
            username: userData.username,
            avatar: userData.avatar
          },
          tempId // Include tempId for client to match
        };

        // Send to receiver
        if (onlineUsers.has(receiverId)) {
          io.to(`user:${receiverId}`).emit('message:receive', messageData);
          io.to(`conversation:${conversation._id}`).emit('message:receive', messageData);
        }

        // Send back to sender for confirmation
        socket.emit('message:sent', messageData);

        console.log(`📨 Message sent in conversation ${conversation._id} from ${userId} to ${receiverId}`);

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message:error', { 
          error: 'Failed to send message',
          text,
          receiverId,
          tempId
        });
      }
    });

    // Typing indicator
    socket.on('typing:start', ({ conversationId, receiverId }) => {
      if (!conversationId || !receiverId || !userId) return;

      if (!typingUsers.has(conversationId)) {
        typingUsers.set(conversationId, new Set());
      }
      typingUsers.get(conversationId).add(userId);

      // Notify receiver
      io.to(`user:${receiverId}`).emit('typing:start', {
        conversationId,
        userId,
        username: userData.name
      });
    });

    socket.on('typing:stop', ({ conversationId, receiverId }) => {
      if (!conversationId || !receiverId || !userId) return;

      if (typingUsers.has(conversationId)) {
        typingUsers.get(conversationId).delete(userId);
        if (typingUsers.get(conversationId).size === 0) {
          typingUsers.delete(conversationId);
        }
      }

      io.to(`user:${receiverId}`).emit('typing:stop', {
        conversationId,
        userId
      });
    });

    // Mark messages as read
    socket.on('messages:read', async ({ conversationId, senderId, readerId }) => {
      // Use readerId if provided, otherwise fall back to socket.userId
      const actualReaderId = readerId || userId;
      
      if (!conversationId || !senderId || !actualReaderId) {
        console.log('❌ Missing required fields for messages:read', { conversationId, senderId, actualReaderId });
        return;
      }

      try {
        console.log(`📖 Processing messages:read for conversation ${conversationId}, sender ${senderId}, reader ${actualReaderId}`);
        
        // Find the conversation first
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          console.log('❌ Conversation not found:', conversationId);
          return;
        }

        // Update messages
        const result = await Message.updateMany(
          {
            senderId: senderId,
            receiverId: actualReaderId,
            status: { $ne: 'read' }
          },
          {
            $set: {
              status: 'read',
              readAt: new Date()
            }
          }
        );

        console.log(`📖 Marked ${result.modifiedCount} messages as read`);

        if (result.modifiedCount > 0) {
          // Reset unread count for the reader
          conversation.unreadCounts.set(actualReaderId.toString(), 0);
          await conversation.save();

          // Create read event data
          const readEventData = {
            conversationId: conversationId.toString(),
            readerId: actualReaderId.toString(),
            count: result.modifiedCount,
            timestamp: new Date().toISOString()
          };

          console.log(`📖 Emitting messages:read to conversation room:`, readEventData);

          // Emit to conversation room
          io.to(`conversation:${conversationId}`).emit('messages:read', readEventData);
          
          // Also emit to sender's personal room
          io.to(`user:${senderId}`).emit('messages:read', readEventData);
        }
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Delete message
    socket.on('message:delete', async ({ messageId, conversationId, receiverId }) => {
      if (!messageId || !userId) return;

      try {
        const message = await Message.findById(messageId);
        if (message && message.senderId.toString() === userId) {
          await Message.findByIdAndDelete(messageId);

          // Notify both users
          io.to(`conversation:${conversationId}`).emit('message:deleted', {
            messageId,
            conversationId,
            deletedBy: userId
          });

          io.to(`user:${receiverId}`).emit('message:deleted', {
            messageId,
            conversationId,
            deletedBy: userId
          });
        }
      } catch (error) {
        console.error('Error deleting message:', error);
      }
    });

    // Get user online status
    socket.on('user:status', ({ targetUserId }) => {
      if (!targetUserId) return;
      
      const isOnline = onlineUsers.has(targetUserId);
      socket.emit('user:status:response', {
        userId: targetUserId,
        isOnline,
        userData: isOnline ? onlineUsers.get(targetUserId).userData : null
      });
    });

    // Get online users
    socket.on('get-online-users', () => {
      const onlineUsersList = Array.from(onlineUsers.entries()).reduce((acc, [id, data]) => {
        acc[id] = {
          online: true,
          userData: data.userData
        };
        return acc;
      }, {});
      
      socket.emit('users:online', onlineUsersList);
    });

    // Disconnect
    socket.on('disconnect', async () => {
      console.log('🔌 Client disconnected:', socket.id);

      if (userId) {
        // Remove socket from user's sockets
        if (userSockets.has(userId)) {
          userSockets.get(userId).delete(socket.id);
          
          // If no more sockets for this user, mark as offline
          if (userSockets.get(userId).size === 0) {
            userSockets.delete(userId);
            onlineUsers.delete(userId);
            userConversations.delete(userId);

            // Update user online status in database
            await User.findByIdAndUpdate(userId, { 
              isOnline: false, 
              lastSeen: new Date() 
            });

            // Clear typing indicators
            typingUsers.forEach((users, convId) => {
              if (users.has(userId)) {
                users.delete(userId);
                
                // Notify conversation participants
                io.to(`conversation:${convId}`).emit('typing:stop', {
                  conversationId: convId,
                  userId
                });
              }
            });

            // Broadcast offline status
            io.emit('user:offline', {
              userId,
              timestamp: new Date()
            });

            console.log('👤 User offline:', userId);
          }
        }
      }
    });
  });

  return io;
};

// Helper functions
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

export const isUserOnline = (userId) => {
  return onlineUsers.has(userId);
};

export const getUserSockets = (userId) => {
  return userSockets.get(userId) || new Set();
};

export const getUserOnlineData = (userId) => {
  return onlineUsers.get(userId) || null;
};

export const sendToUser = (userId, event, data) => {
  if (io && onlineUsers.has(userId)) {
    io.to(`user:${userId}`).emit(event, data);
    return true;
  }
  return false;
};

export const sendToConversation = (conversationId, event, data) => {
  if (io) {
    io.to(`conversation:${conversationId}`).emit(event, data);
    return true;
  }
  return false;
};

export const getOnlineUsers = () => {
  return Array.from(onlineUsers.entries()).map(([id, data]) => ({
    userId: id,
    ...data
  }));
};

export const getOnlineUsersCount = () => {
  return onlineUsers.size;
};

export const getTypingUsers = (conversationId) => {
  const users = typingUsers.get(conversationId);
  if (!users) return [];
  
  return Array.from(users).map(userId => ({
    userId,
    userData: onlineUsers.get(userId)?.userData || null
  }));
};