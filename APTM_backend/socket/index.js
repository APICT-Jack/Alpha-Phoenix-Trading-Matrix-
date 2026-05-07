// socket/index.js - COMPLETE WORKING VERSION
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { Conversation, Message } from '../models/Chat.js';

let io;
const onlineUsers = new Map(); // userId -> { sockets: Set, userData, connectedAt }
const userSockets = new Map(); // userId -> Set of socketIds
const userConversations = new Map(); // userId -> Set of conversationIds
const typingUsers = new Map(); // conversationId -> Set of userIds

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        const allowedOrigins = [
          'http://localhost:3000',
          'http://localhost:5173',
          'http://localhost:5000',
          'https://alpha-phoenix-trading-matrix-s78v.onrender.com',
          'https://alpha-phoenix-trading-matrix.onrender.com',
          process.env.FRONTEND_URL?.replace(/\/+$/, '')
        ].filter(Boolean);
        
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        
        console.log('⚠️ Socket CORS blocked origin:', origin);
        callback(null, true); // Allow for debugging
      },
      credentials: true,
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // ============================================
  // AUTHENTICATION MIDDLEWARE
  // ============================================
  io.use(async (socket, next) => {
    try {
      console.log('🔐 Socket auth attempt...');
      
      // Try multiple sources for token
      let token = socket.handshake.auth?.token;
      
      if (!token && socket.handshake.query?.token) {
        token = socket.handshake.query.token;
        console.log('🔐 Token found in query');
      }
      
      if (!token && socket.handshake.headers?.authorization) {
        token = socket.handshake.headers.authorization.replace('Bearer ', '');
        console.log('🔐 Token found in headers');
      }
      
      if (!token) {
        console.log('❌ No token provided');
        socket.isAuthenticated = false;
        return next();
      }
      
      // Verify JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
      const userId = decoded.userId || decoded.id;
      
      if (!userId) {
        console.log('❌ No userId in token');
        socket.isAuthenticated = false;
        return next();
      }
      
      // Get user from database
      const user = await User.findById(userId).select('_id name username avatar email');
      
      if (!user) {
        console.log('❌ User not found:', userId);
        socket.isAuthenticated = false;
        return next();
      }
      
      // Attach to socket
      socket.userId = user._id.toString();
      socket.user = {
        _id: user._id,
        name: user.name,
        username: user.username,
        avatar: user.avatar
      };
      socket.isAuthenticated = true;
      
      console.log('✅ Socket authenticated:', socket.userId, user.name);
      next();
      
    } catch (error) {
      console.error('❌ Socket auth error:', error.message);
      socket.isAuthenticated = false;
      next();
    }
  });

  // ============================================
  // CONNECTION HANDLER
  // ============================================
  io.on('connection', (socket) => {
    console.log(`🔌 New connection: ${socket.id}`);
    
    // Check authentication
    if (!socket.isAuthenticated || !socket.userId) {
      console.log(`⚠️ Unauthenticated socket ${socket.id}, disconnecting`);
      socket.emit('error', { message: 'Authentication required' });
      socket.disconnect();
      return;
    }
    
    const userId = socket.userId;
    const userData = socket.user;
    
    console.log(`✅ User connected: ${userId} (${userData.name})`);
    
    // ============================================
    // ONLINE STATUS MANAGEMENT
    // ============================================
    
    // Update database online status
    User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() })
      .catch(err => console.error('Error updating online status:', err));
    
    // Add to online users with multi-socket support
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, {
        sockets: new Set(),
        userData: {
          _id: userId,
          name: userData.name,
          username: userData.username,
          avatar: userData.avatar
        },
        connectedAt: new Date()
      });
    }
    onlineUsers.get(userId).sockets.add(socket.id);
    
    // Track user sockets
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);
    
    // Track user conversations
    if (!userConversations.has(userId)) {
      userConversations.set(userId, new Set());
    }
    
    // Join user's personal room
    socket.join(`user:${userId}`);
    console.log(`👤 User ${userId} joined room user:${userId}`);
    
    // Broadcast online status to other users
    socket.broadcast.emit('user:online', {
      userId: userId,
      userData: userData,
      timestamp: new Date()
    });
    
    // Send current online users list to new client
    const onlineList = {};
    onlineUsers.forEach((data, id) => {
      onlineList[id] = {
        online: true,
        userData: data.userData
      };
    });
    socket.emit('users:online', onlineList);
    console.log(`📊 Sent online users list (${Object.keys(onlineList).length} users)`);
    
    // ============================================
    // CHAT EVENT HANDLERS
    // ============================================
    
    // Join conversation
    socket.on('conversation:join', async ({ conversationId }) => {
      if (!conversationId || !userId) return;
      
      try {
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: userId
        });
        
        if (conversation) {
          // Leave previous conversations for this socket
          userConversations.get(userId).forEach(convId => {
            socket.leave(`conversation:${convId}`);
          });
          userConversations.get(userId).clear();
          
          // Join new conversation
          socket.join(`conversation:${conversationId}`);
          userConversations.get(userId).add(conversationId);
          
          console.log(`User ${userId} joined conversation: ${conversationId}`);
          socket.emit('conversation:joined', { conversationId });
          
          // Mark messages as read when joining
          const otherParticipant = conversation.participants.find(
            p => p.toString() !== userId
          );
          
          if (otherParticipant) {
            const result = await Message.updateMany(
              {
                conversationId,
                senderId: otherParticipant,
                receiverId: userId,
                status: { $ne: 'read' }
              },
              { status: 'read', readAt: new Date() }
            );
            
            if (result.modifiedCount > 0) {
              conversation.unreadCounts.set(userId.toString(), 0);
              await conversation.save();
              
              const readEventData = {
                conversationId,
                readerId: userId,
                count: result.modifiedCount,
                timestamp: new Date()
              };
              
              io.to(`conversation:${conversationId}`).emit('messages:read', readEventData);
              io.to(`user:${otherParticipant}`).emit('messages:read', readEventData);
              
              console.log(`📖 Marked ${result.modifiedCount} messages as read`);
            }
          }
        }
      } catch (error) {
        console.error('Error joining conversation:', error);
      }
    });
    
    // Leave conversation
    socket.on('conversation:leave', ({ conversationId }) => {
      if (!conversationId || !userId) return;
      
      socket.leave(`conversation:${conversationId}`);
      if (userConversations.has(userId)) {
        userConversations.get(userId).delete(conversationId);
      }
      console.log(`User ${userId} left conversation: ${conversationId}`);
    });
    
    // Send message
    socket.on('message:send', async (data) => {
      try {
        const { receiverId, text, media, chart, replyTo, tempId, conversationId: providedConvId } = data;
        const senderId = userId;
        
        if (!receiverId) {
          socket.emit('message:error', { tempId, error: 'Missing receiver' });
          return;
        }
        
        console.log(`📨 Message from ${senderId} to ${receiverId}: ${text?.substring(0, 50)}`);
        
        // Get sender info
        const sender = await User.findById(senderId).select('name username avatar');
        if (!sender) {
          socket.emit('message:error', { tempId, error: 'Sender not found' });
          return;
        }
        
        // Get or create conversation
        let conversation;
        if (providedConvId) {
          conversation = await Conversation.findById(providedConvId);
        }
        
        if (!conversation) {
          conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] },
            isActive: true
          });
        }
        
        if (!conversation) {
          conversation = new Conversation({
            participants: [senderId, receiverId],
            unreadCounts: new Map([
              [senderId.toString(), 0],
              [receiverId.toString(), 0]
            ])
          });
          await conversation.save();
        }
        
        // Handle reply
        let replyToMessage = null;
        if (replyTo) {
          const originalMessage = await Message.findById(replyTo);
          if (originalMessage) {
            const originalSender = await User.findById(originalMessage.senderId);
            replyToMessage = {
              text: originalMessage.text,
              senderId: originalMessage.senderId,
              senderName: originalSender?.name || 'User',
              media: originalMessage.media || []
            };
          }
        }
        
        // Create message
        const message = new Message({
          senderId,
          receiverId,
          conversationId: conversation._id,
          text: text || '',
          media: media || [],
          type: chart ? 'chart' : (media?.length > 0 ? 'mixed' : 'text'),
          status: 'sent',
          replyTo: replyTo || null,
          replyToMessage: replyToMessage
        });
        
        await message.save();
        
        // Format message for sending
        const formattedMessage = {
          _id: message._id,
          tempId: tempId || message._id,
          text: message.text,
          media: message.media,
          type: message.type,
          status: message.status,
          senderId: senderId,
          receiverId: receiverId,
          conversationId: conversation._id,
          sender: {
            _id: senderId,
            name: sender.name,
            username: sender.username,
            avatar: sender.avatar
          },
          replyTo: message.replyTo,
          replyToMessage: message.replyToMessage,
          createdAt: message.createdAt,
          reactions: []
        };
        
        // Update conversation
        conversation.lastMessage = message._id;
        conversation.lastMessageText = text || (media?.length > 0 ? `📎 ${media.length} attachment(s)` : '');
        conversation.lastMessageTime = new Date();
        conversation.lastMessageSenderId = senderId;
        
        const receiverUnread = conversation.unreadCounts.get(receiverId.toString()) || 0;
        conversation.unreadCounts.set(receiverId.toString(), receiverUnread + 1);
        conversation.unreadCounts.set(senderId.toString(), 0);
        await conversation.save();
        
        // Send to receiver's personal room
        io.to(`user:${receiverId}`).emit('message:receive', formattedMessage);
        
        // Also send to conversation room
        io.to(`conversation:${conversation._id}`).emit('message:receive', formattedMessage);
        
        // Send confirmation to sender
        socket.emit('message:sent', formattedMessage);
        
        console.log(`✅ Message sent: ${message._id}`);
        
      } catch (error) {
        console.error('Socket message error:', error);
        socket.emit('message:error', { error: error.message });
      }
    });
    
    // Edit message
    socket.on('message:edit', async ({ messageId, text }) => {
      if (!messageId || !userId) return;
      
      try {
        const message = await Message.findOne({ _id: messageId, senderId: userId });
        if (!message) {
          socket.emit('message:error', { error: 'Message not found' });
          return;
        }
        
        if (!message.editHistory) message.editHistory = [];
        message.editHistory.push({
          text: message.text,
          media: message.media,
          editedAt: new Date()
        });
        
        message.text = text;
        message.isEdited = true;
        await message.save();
        
        const editData = {
          messageId: message._id,
          text: message.text,
          isEdited: true,
          updatedAt: message.updatedAt
        };
        
        io.to(`user:${message.senderId}`).emit('message:updated', editData);
        io.to(`user:${message.receiverId}`).emit('message:updated', editData);
        io.to(`conversation:${message.conversationId}`).emit('message:updated', editData);
        
      } catch (error) {
        console.error('Error editing message:', error);
      }
    });
    
    // Delete message
    socket.on('message:delete', async ({ messageId, deleteForEveryone }) => {
      if (!messageId || !userId) return;
      
      try {
        const message = await Message.findById(messageId);
        if (!message) return;
        
        if (deleteForEveryone && message.senderId.toString() === userId) {
          await Message.findByIdAndDelete(messageId);
          
          const deleteData = {
            messageId: message._id,
            conversationId: message.conversationId,
            deletedForEveryone: true
          };
          
          io.to(`user:${message.senderId}`).emit('message:deleted', deleteData);
          io.to(`user:${message.receiverId}`).emit('message:deleted', deleteData);
          io.to(`conversation:${message.conversationId}`).emit('message:deleted', deleteData);
        } else {
          if (!message.deletedFor) message.deletedFor = [];
          message.deletedFor.push(userId);
          if (message.deletedFor.length === 2) {
            await Message.findByIdAndDelete(messageId);
          } else {
            await message.save();
          }
          
          socket.emit('message:deleted', {
            messageId: message._id,
            conversationId: message.conversationId,
            deletedForMe: true
          });
        }
      } catch (error) {
        console.error('Error deleting message:', error);
      }
    });
    
    // React to message
    socket.on('message:react', async ({ messageId, reaction }) => {
      if (!messageId || !reaction || !userId) return;
      
      try {
        const message = await Message.findById(messageId);
        if (!message) return;
        
        if (!message.reactions) message.reactions = [];
        
        const existingIndex = message.reactions.findIndex(
          r => r.userId.toString() === userId && r.emoji === reaction
        );
        
        if (existingIndex !== -1) {
          message.reactions.splice(existingIndex, 1);
        } else {
          message.reactions = message.reactions.filter(r => r.userId.toString() !== userId);
          message.reactions.push({ userId, emoji: reaction, createdAt: new Date() });
        }
        
        await message.save();
        await message.populate('reactions.userId', 'name username avatar');
        
        const reactionData = {
          messageId: message._id,
          reactions: message.reactions.map(r => ({
            emoji: r.emoji,
            userId: r.userId._id,
            userName: r.userId.name,
            userAvatar: r.userId.avatar
          }))
        };
        
        io.to(`user:${message.senderId}`).emit('message:reaction', reactionData);
        io.to(`user:${message.receiverId}`).emit('message:reaction', reactionData);
        io.to(`conversation:${message.conversationId}`).emit('message:reaction', reactionData);
        
      } catch (error) {
        console.error('Error reacting to message:', error);
      }
    });
    
    // Typing indicators
    socket.on('typing:start', ({ conversationId, receiverId }) => {
      if ((!conversationId && !receiverId) || !userId) return;
      
      if (conversationId) {
        if (!typingUsers.has(conversationId)) {
          typingUsers.set(conversationId, new Set());
        }
        typingUsers.get(conversationId).add(userId);
      }
      
      const targetId = receiverId;
      if (targetId) {
        io.to(`user:${targetId}`).emit('typing:start', {
          userId,
          conversationId,
          username: userData.name
        });
      } else if (conversationId) {
        socket.to(`conversation:${conversationId}`).emit('typing:start', {
          userId,
          conversationId,
          username: userData.name
        });
      }
    });
    
    socket.on('typing:stop', ({ conversationId, receiverId }) => {
      if ((!conversationId && !receiverId) || !userId) return;
      
      if (conversationId && typingUsers.has(conversationId)) {
        typingUsers.get(conversationId).delete(userId);
        if (typingUsers.get(conversationId).size === 0) {
          typingUsers.delete(conversationId);
        }
      }
      
      const targetId = receiverId;
      if (targetId) {
        io.to(`user:${targetId}`).emit('typing:stop', { userId, conversationId });
      } else if (conversationId) {
        socket.to(`conversation:${conversationId}`).emit('typing:stop', { userId, conversationId });
      }
    });
    
    // Mark messages as read
    socket.on('messages:read', async ({ conversationId, senderId }) => {
      if (!conversationId || !senderId) return;
      
      try {
        console.log(`📖 Marking messages as read - conversation: ${conversationId}, sender: ${senderId}`);
        
        const result = await Message.updateMany(
          {
            conversationId,
            senderId: senderId,
            receiverId: userId,
            status: { $ne: 'read' }
          },
          { status: 'read', readAt: new Date() }
        );
        
        if (result.modifiedCount > 0) {
          const conversation = await Conversation.findById(conversationId);
          if (conversation) {
            conversation.unreadCounts.set(userId.toString(), 0);
            await conversation.save();
          }
          
          const readEventData = {
            conversationId,
            readerId: userId,
            count: result.modifiedCount,
            timestamp: new Date()
          };
          
          io.to(`user:${senderId}`).emit('messages:read', readEventData);
          io.to(`conversation:${conversationId}`).emit('messages:read', readEventData);
          
          console.log(`📖 Marked ${result.modifiedCount} messages as read`);
        }
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });
    
    // Get online users
    socket.on('get-online-users', () => {
      const onlineList = {};
      onlineUsers.forEach((data, id) => {
        onlineList[id] = { online: true, userData: data.userData };
      });
      socket.emit('users:online', onlineList);
      console.log(`📊 Sent online users to ${userId}`);
    });
    
    // Check user status
    socket.on('user:status', ({ targetUserId }) => {
      if (!targetUserId) return;
      const isOnline = onlineUsers.has(targetUserId);
      socket.emit('user:status:response', {
        userId: targetUserId,
        isOnline,
        userData: isOnline ? onlineUsers.get(targetUserId)?.userData : null
      });
    });
    
    // ============================================
    // DISCONNECT HANDLER
    // ============================================
    socket.on('disconnect', async () => {
      console.log(`🔌 Disconnected: ${socket.id} - User: ${userId}`);
      
      if (userId) {
        // Remove socket from user's sockets
        if (onlineUsers.has(userId)) {
          onlineUsers.get(userId).sockets.delete(socket.id);
          
          // If no more sockets for this user, mark as offline
          if (onlineUsers.get(userId).sockets.size === 0) {
            onlineUsers.delete(userId);
            userConversations.delete(userId);
            
            // Update database offline status
            await User.findByIdAndUpdate(userId, {
              isOnline: false,
              lastSeen: new Date()
            }).catch(err => console.error('Error updating offline status:', err));
            
            // Clear typing indicators for this user
            typingUsers.forEach((users, convId) => {
              if (users.has(userId)) {
                users.delete(userId);
                io.to(`conversation:${convId}`).emit('typing:stop', {
                  conversationId: convId,
                  userId
                });
              }
            });
            
            // Broadcast offline status
            io.emit('user:offline', { userId, timestamp: new Date() });
            console.log(`👤 User offline: ${userId}`);
          }
        }
        
        if (userSockets.has(userId)) {
          userSockets.get(userId).delete(socket.id);
          if (userSockets.get(userId).size === 0) {
            userSockets.delete(userId);
          }
        }
      }
    });
  });
  
  // Attach onlineUsers to io instance for external access
  io.onlineUsers = onlineUsers;
  
  console.log('✅ Socket.IO initialized successfully');
  return io;
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
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
    userData: data.userData,
    connectedAt: data.connectedAt
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