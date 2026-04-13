// socket/index.js - COMPLETE WORKING VERSION
import { Server } from 'socket.io';
import { Conversation, Message } from '../models/Chat.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

let io;
const onlineUsers = new Map();
const userSockets = new Map();
const typingUsers = new Map();
const userConversations = new Map();

export const initializeSockets = (server) => {
  io = new Server(server, {
    cors: {
      origin: function(origin, callback) {
        const allowedOrigins = [
          'http://localhost:3000',
          'https://alpha-phoenix-trading-matrix.onrender.com',
          'https://alpha-phoenix-trading-matrix-s78v.onrender.com',
          process.env.FRONTEND_URL
        ].filter(Boolean);
        
        if (!origin || allowedOrigins.includes(origin)) {
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
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // ============================================
  // FIXED AUTHENTICATION MIDDLEWARE
  // ============================================
  io.use(async (socket, next) => {
    try {
      // Try multiple sources for token
      let token = socket.handshake.auth?.token;
      
      if (!token && socket.handshake.query?.token) {
        token = socket.handshake.query.token;
      }
      
      if (!token && socket.handshake.headers?.authorization) {
        token = socket.handshake.headers.authorization.replace('Bearer ', '');
      }
      
      console.log('🔐 Socket auth - Token present:', !!token);
      
      if (!token) {
        console.log('❌ No token provided');
        return next(new Error('Authentication required: No token'));
      }
      
      // Verify JWT
      let decoded;
      try {
        const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
        decoded = jwt.verify(token, JWT_SECRET);
        console.log('✅ Token verified for user:', decoded.userId || decoded.id);
      } catch (jwtError) {
        console.error('❌ JWT verification failed:', jwtError.message);
        return next(new Error('Authentication failed: Invalid token'));
      }
      
      const userId = decoded.userId || decoded.id;
      if (!userId) {
        return next(new Error('Authentication failed: No user ID in token'));
      }
      
      // Get user from database
      const user = await User.findById(userId).select('_id name username avatar email');
      if (!user) {
        console.log('❌ User not found:', userId);
        return next(new Error('Authentication failed: User not found'));
      }
      
      // Attach to socket
      socket.userId = user._id.toString();
      socket.user = {
        _id: user._id,
        name: user.name,
        username: user.username,
        avatar: user.avatar
      };
      
      console.log('✅ Socket authenticated:', socket.userId, user.name);
      next();
      
    } catch (error) {
      console.error('❌ Socket auth error:', error);
      next(new Error('Authentication failed: ' + error.message));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    const userData = socket.user;
    
    console.log(`🔌 Client connected: ${socket.id} - User: ${userId}`);
    
    if (!userId || !userData) {
      console.log('❌ No user data, disconnecting');
      socket.disconnect();
      return;
    }

    // Update user online status
    User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() })
      .catch(err => console.error('Error updating online status:', err));

    // Store online user
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

    // Track sockets per user
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);

    // Initialize user conversations
    if (!userConversations.has(userId)) {
      userConversations.set(userId, new Set());
    }

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Broadcast online status
    socket.broadcast.emit('user:online', {
      userId,
      userData: userData,
      timestamp: new Date()
    });

    // Send online users list to new client
    const onlineUsersList = {};
    onlineUsers.forEach((data, id) => {
      onlineUsersList[id] = {
        online: true,
        userData: data.userData
      };
    });
    socket.emit('users:online', onlineUsersList);

    console.log(`👤 User online: ${userId} (${userData.name}) - Total online: ${onlineUsers.size}`);

    // ============================================
    // CONVERSATION JOIN
    // ============================================
    socket.on('conversation:join', async ({ conversationId }) => {
      if (!conversationId || !userId) return;

      try {
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: userId
        });

        if (conversation) {
          // Leave previous conversations
          if (userConversations.has(userId)) {
            userConversations.get(userId).forEach(convId => {
              socket.leave(`conversation:${convId}`);
            });
            userConversations.get(userId).clear();
          }

          socket.join(`conversation:${conversationId}`);
          userConversations.get(userId).add(conversationId);
          
          console.log(`User ${userId} joined conversation: ${conversationId}`);
        }
      } catch (error) {
        console.error('Error joining conversation:', error);
      }
    });

    // ============================================
    // CONVERSATION LEAVE
    // ============================================
    socket.on('conversation:leave', ({ conversationId }) => {
      if (!conversationId || !userId) return;
      socket.leave(`conversation:${conversationId}`);
      if (userConversations.has(userId)) {
        userConversations.get(userId).delete(conversationId);
      }
    });

    // ============================================
    // SEND MESSAGE
    // ============================================
    socket.on('message:send', async (data) => {
      const { receiverId, text, tempId, replyToId, chart, media } = data;
      
      if (!receiverId || !userId) {
        socket.emit('message:error', { tempId, error: 'Missing receiver or sender' });
        return;
      }

      try {
        console.log(`📨 Message from ${userId} to ${receiverId}`);
        
        const sender = await User.findById(userId).select('name username avatar');
        if (!sender) {
          socket.emit('message:error', { tempId, error: 'Sender not found' });
          return;
        }
        
        let conversation = await Conversation.findOne({
          participants: { $all: [userId, receiverId] },
          isActive: true
        });
        
        if (!conversation) {
          conversation = new Conversation({
            participants: [userId, receiverId],
            unreadCounts: new Map([
              [userId.toString(), 0],
              [receiverId.toString(), 0]
            ])
          });
          await conversation.save();
        }
        
        let replyToMessage = null;
        if (replyToId) {
          const originalMessage = await Message.findById(replyToId);
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
        
        const message = new Message({
          senderId: userId,
          receiverId,
          conversationId: conversation._id,
          text: text || '',
          media: media || [],
          type: chart ? 'chart' : (media?.length > 0 ? 'mixed' : 'text'),
          status: 'sent',
          replyTo: replyToId || null,
          replyToMessage: replyToMessage
        });
        
        await message.save();
        
        const formattedMessage = {
          _id: message._id,
          tempId: tempId || message._id,
          text: message.text,
          media: message.media,
          type: message.type,
          status: message.status,
          senderId: userId,
          receiverId: receiverId,
          conversationId: conversation._id,
          sender: {
            _id: userId,
            name: sender.name,
            username: sender.username,
            avatar: sender.avatar
          },
          replyTo: message.replyTo,
          replyToMessage: message.replyToMessage,
          createdAt: message.createdAt,
          reactions: []
        };
        
        conversation.lastMessage = message._id;
        conversation.lastMessageText = text || (media?.length > 0 ? `📎 ${media.length} attachment(s)` : '');
        conversation.lastMessageMedia = media || [];
        conversation.lastMessageTime = new Date();
        conversation.lastMessageSenderId = userId;
        
        const receiverUnread = conversation.unreadCounts.get(receiverId.toString()) || 0;
        conversation.unreadCounts.set(receiverId.toString(), receiverUnread + 1);
        await conversation.save();
        
        // Send to receiver if online
        io.to(`user:${receiverId}`).emit('message:receive', formattedMessage);
        
        // Send confirmation to sender
        socket.emit('message:sent', formattedMessage);
        
        console.log(`✅ Message sent: ${message._id}`);
        
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message:error', { tempId, error: error.message });
      }
    });

    // ============================================
    // EDIT MESSAGE
    // ============================================
    socket.on('message:edit', async ({ messageId, text }) => {
      if (!messageId || !userId) return;

      try {
        const message = await Message.findOne({
          _id: messageId,
          senderId: userId
        });
        
        if (!message) {
          socket.emit('message:error', { error: 'Message not found' });
          return;
        }
        
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
          media: message.media,
          isEdited: true,
          updatedAt: message.updatedAt
        };
        
        io.to(`user:${message.senderId}`).emit('message:updated', editData);
        io.to(`user:${message.receiverId}`).emit('message:updated', editData);
        
      } catch (error) {
        console.error('Error editing message:', error);
        socket.emit('message:error', { error: error.message });
      }
    });

    // ============================================
    // DELETE MESSAGE
    // ============================================
    socket.on('message:delete', async ({ messageId, conversationId, receiverId, deleteForEveryone }) => {
      if (!messageId || !userId) return;

      try {
        const message = await Message.findById(messageId);
        
        if (!message) {
          socket.emit('message:error', { error: 'Message not found' });
          return;
        }
        
        if (deleteForEveryone && message.senderId.toString() === userId.toString()) {
          await Message.findByIdAndDelete(messageId);
          
          io.to(`user:${message.senderId}`).emit('message:deleted', {
            messageId: message._id,
            conversationId: message.conversationId,
            deletedForEveryone: true
          });
          
          io.to(`user:${message.receiverId}`).emit('message:deleted', {
            messageId: message._id,
            conversationId: message.conversationId,
            deletedForEveryone: true
          });
        } else {
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
        socket.emit('message:error', { error: error.message });
      }
    });

    // ============================================
    // REACT TO MESSAGE
    // ============================================
    socket.on('message:react', async ({ messageId, reaction }) => {
      if (!messageId || !reaction || !userId) return;

      try {
        const message = await Message.findById(messageId);
        
        if (!message) {
          socket.emit('message:error', { error: 'Message not found' });
          return;
        }
        
        const existingReactionIndex = message.reactions.findIndex(
          r => r.userId.toString() === userId.toString() && r.emoji === reaction
        );
        
        if (existingReactionIndex !== -1) {
          message.reactions.splice(existingReactionIndex, 1);
        } else {
          message.reactions = message.reactions.filter(
            r => r.userId.toString() !== userId.toString()
          );
          message.reactions.push({
            userId,
            emoji: reaction,
            createdAt: new Date()
          });
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
        
      } catch (error) {
        console.error('Error reacting to message:', error);
        socket.emit('message:error', { error: error.message });
      }
    });

    // ============================================
    // TYPING INDICATORS
    // ============================================
    socket.on('typing:start', ({ receiverId }) => {
      if (!receiverId || !userId) return;
      io.to(`user:${receiverId}`).emit('typing:start', {
        userId,
        username: userData.name
      });
    });

    socket.on('typing:stop', ({ receiverId }) => {
      if (!receiverId || !userId) return;
      io.to(`user:${receiverId}`).emit('typing:stop', { userId });
    });

    // ============================================
    // MARK MESSAGES AS READ
    // ============================================
    socket.on('messages:read', async ({ conversationId, senderId }) => {
      if (!conversationId || !senderId || !userId) return;
      
      try {
        const result = await Message.updateMany(
          {
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
          
          io.to(`user:${senderId}`).emit('messages:read', {
            conversationId,
            readerId: userId,
            count: result.modifiedCount
          });
        }
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // ============================================
    // GET ONLINE USERS
    // ============================================
    socket.on('get-online-users', () => {
      const onlineUsersList = {};
      onlineUsers.forEach((data, id) => {
        onlineUsersList[id] = {
          online: true,
          userData: data.userData
        };
      });
      socket.emit('users:online', onlineUsersList);
    });

    // ============================================
    // GET USER STATUS
    // ============================================
    socket.on('user:status', ({ targetUserId }) => {
      if (!targetUserId) return;
      const isOnline = onlineUsers.has(targetUserId);
      socket.emit('user:status:response', {
        userId: targetUserId,
        isOnline,
        userData: isOnline ? onlineUsers.get(targetUserId).userData : null
      });
    });

    // ============================================
    // DISCONNECT
    // ============================================
    socket.on('disconnect', async () => {
      console.log(`🔌 Client disconnected: ${socket.id} - User: ${userId}`);
      
      if (userId) {
        if (userSockets.has(userId)) {
          userSockets.get(userId).delete(socket.id);
          
          if (userSockets.get(userId).size === 0) {
            userSockets.delete(userId);
            onlineUsers.delete(userId);
            userConversations.delete(userId);
            
            await User.findByIdAndUpdate(userId, {
              isOnline: false,
              lastSeen: new Date()
            }).catch(err => console.error('Error updating offline status:', err));
            
            io.emit('user:offline', { userId, timestamp: new Date() });
            console.log(`👤 User offline: ${userId}`);
          }
        }
      }
    });
  });

  return io;
};

// Helper functions
export const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

export const isUserOnline = (userId) => onlineUsers.has(userId);
export const getOnlineUsersCount = () => onlineUsers.size;
export const getOnlineUsers = () => Array.from(onlineUsers.entries()).map(([id, data]) => ({
  userId: id,
  ...data
}));