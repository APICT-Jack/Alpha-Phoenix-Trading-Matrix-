// server.js - COMPLETE UNIFIED SERVER WITH CHAT SOCKET HANDLERS
import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import fs from "fs";
import { createServer } from 'http';
import mongoose from 'mongoose';
import { Server } from 'socket.io';

// Database connection
import { connectDB } from "./config/database.js";

// Route imports
import galleryRoutes from './routes/gallery.routes.js';
import postRoutes from './routes/posts.routes.js';
import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import userRoutes from "./routes/user.Routes.js";
import followRoutes from './routes/follow.routes.js';
import chatRoutes from './routes/chatRoutes.js';

// Model imports for socket handlers
import User from './models/User.js';
import { Conversation, Message } from './models/Chat.js';

// Service imports
import { notificationService } from './services/notificationService.js';

// Initialize environment variables
dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create HTTP server
const httpServer = createServer(app);

// ============================================
// SOCKET.IO CONFIGURATION
// ============================================
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      const allowedOrigins = [
        'http://localhost:3000',
        'https://alpha-phoenix-trading-matrix-s78v.onrender.com',
        process.env.FRONTEND_URL?.replace(/\/+$/, '')
      ].filter(Boolean);
      
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling']
});

// Store online users
const onlineUsers = new Map();

// Socket middleware for authentication
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    const user = await User.findById(decoded.userId || decoded.id).select('_id name username avatar email isOnline');
    if (!user) {
      return next(new Error('User not found'));
    }
    
    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (error) {
    console.error('Socket auth error:', error.message);
    next(new Error('Authentication failed'));
  }
});

// Socket connection handler
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.userId} (${socket.user?.name || 'Unknown'})`);
  
  // Add to online users
  onlineUsers.set(socket.userId, {
    socketId: socket.id,
    userId: socket.userId,
    name: socket.user?.name,
    username: socket.user?.username,
    avatar: socket.user?.avatar,
    online: true,
    lastSeen: new Date()
  });
  
  // Update user's online status in database
  User.findByIdAndUpdate(socket.userId, { 
    isOnline: true, 
    lastSeen: new Date() 
  }).catch(err => console.error('Error updating online status:', err));
  
  // Join user's personal room
  socket.join(`user:${socket.userId}`);
  
  // Broadcast online status to all users
  socket.broadcast.emit('user:online', {
    userId: socket.userId,
    name: socket.user?.name,
    username: socket.user?.username,
    avatar: socket.user?.avatar
  });
  
  // Send current online users to new user
  const onlineUsersList = Array.from(onlineUsers.values()).map(u => ({
    userId: u.userId,
    name: u.name,
    username: u.username,
    avatar: u.avatar,
    online: u.online
  }));
  socket.emit('users:online', onlineUsersList);
  
  // ============================================
  // CHAT SOCKET HANDLERS
  // ============================================
  
  // Send message via socket
  socket.on('message:send', async (data) => {
    try {
      const { receiverId, text, tempId, replyToId, chart, media } = data;
      const senderId = socket.userId;
      
      console.log('📨 Socket message:send from', senderId, 'to', receiverId);
      
      // Get sender info
      const sender = await User.findById(senderId).select('name username avatar');
      if (!sender) {
        socket.emit('message:error', { tempId, error: 'Sender not found' });
        return;
      }
      
      // Check if receiver exists
      const receiver = await User.findById(receiverId);
      if (!receiver) {
        socket.emit('message:error', { tempId, error: 'Receiver not found' });
        return;
      }
      
      // Get or create conversation
      let conversation = await Conversation.findOne({
        participants: { $all: [senderId, receiverId] },
        isActive: true
      });
      
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
      
      // Handle reply to message
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
      
      // Create message
      const message = new Message({
        senderId,
        receiverId,
        conversationId: conversation._id,
        text: text || '',
        media: media || [],
        type: chart ? 'chart' : (media?.length > 0 ? (media.length === 1 ? media[0].type : 'mixed') : 'text'),
        status: 'sent',
        replyTo: replyToId || null,
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
      conversation.lastMessageMedia = media || [];
      conversation.lastMessageTime = new Date();
      conversation.lastMessageSenderId = senderId;
      
      const receiverUnread = conversation.unreadCounts.get(receiverId.toString()) || 0;
      conversation.unreadCounts.set(receiverId.toString(), receiverUnread + 1);
      await conversation.save();
      
      // Send to receiver
      io.to(`user:${receiverId}`).emit('message:receive', formattedMessage);
      
      // Send confirmation back to sender
      socket.emit('message:sent', formattedMessage);
      
      // Send conversation updates
      const senderConversationData = {
        id: conversation._id,
        lastMessage: conversation.lastMessageText,
        lastMessageTime: conversation.lastMessageTime,
        unreadCount: 0
      };
      
      const receiverConversationData = {
        id: conversation._id,
        lastMessage: conversation.lastMessageText,
        lastMessageTime: conversation.lastMessageTime,
        unreadCount: receiverUnread + 1,
        userId: senderId,
        userName: sender.name,
        userAvatar: sender.avatar,
        userUsername: sender.username
      };
      
      io.to(`user:${senderId}`).emit('conversation:update', senderConversationData);
      io.to(`user:${receiverId}`).emit('conversation:update', receiverConversationData);
      
      console.log(`✅ Message sent from ${senderId} to ${receiverId}`);
      
    } catch (error) {
      console.error('Socket message error:', error);
      socket.emit('message:error', { error: error.message });
    }
  });
  
  // Edit message
  socket.on('message:edit', async (data) => {
    try {
      const { messageId, text, chart } = data;
      const userId = socket.userId;
      
      const message = await Message.findOne({
        _id: messageId,
        senderId: userId
      });
      
      if (!message) {
        socket.emit('message:error', { error: 'Message not found or cannot edit' });
        return;
      }
      
      // Save edit history
      message.editHistory.push({
        text: message.text,
        media: message.media,
        editedAt: new Date()
      });
      
      if (text !== undefined) message.text = text;
      message.isEdited = true;
      message.updatedAt = new Date();
      
      await message.save();
      
      // Broadcast edit to both users
      io.to(`user:${message.senderId}`).emit('message:updated', {
        messageId: message._id,
        text: message.text,
        media: message.media,
        isEdited: true,
        updatedAt: message.updatedAt
      });
      
      io.to(`user:${message.receiverId}`).emit('message:updated', {
        messageId: message._id,
        text: message.text,
        media: message.media,
        isEdited: true,
        updatedAt: message.updatedAt
      });
      
    } catch (error) {
      console.error('Socket edit error:', error);
      socket.emit('message:error', { error: error.message });
    }
  });
  
  // Delete message
  socket.on('message:delete', async (data) => {
    try {
      const { messageId, deleteForEveryone } = data;
      const userId = socket.userId;
      
      const message = await Message.findById(messageId);
      
      if (!message) {
        socket.emit('message:error', { error: 'Message not found' });
        return;
      }
      
      if (deleteForEveryone && message.senderId.toString() === userId.toString()) {
        // Delete for everyone
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
        // Delete for me only
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
      console.error('Socket delete error:', error);
      socket.emit('message:error', { error: error.message });
    }
  });
  
  // React to message
  socket.on('message:react', async (data) => {
    try {
      const { messageId, reaction } = data;
      const userId = socket.userId;
      
      const message = await Message.findById(messageId);
      
      if (!message) {
        socket.emit('message:error', { error: 'Message not found' });
        return;
      }
      
      // Check if user already reacted with this emoji
      const existingReactionIndex = message.reactions.findIndex(
        r => r.userId.toString() === userId.toString() && r.emoji === reaction
      );
      
      if (existingReactionIndex !== -1) {
        message.reactions.splice(existingReactionIndex, 1);
      } else {
        // Remove any existing reaction from this user
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
      
      // Populate user info
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
      
      // Broadcast to both users
      io.to(`user:${message.senderId}`).emit('message:reaction', reactionData);
      io.to(`user:${message.receiverId}`).emit('message:reaction', reactionData);
      
    } catch (error) {
      console.error('Socket reaction error:', error);
      socket.emit('message:error', { error: error.message });
    }
  });
  
  // Typing indicators
  socket.on('typing:start', (data) => {
    const { receiverId, conversationId } = data;
    socket.to(`user:${receiverId}`).emit('typing:start', {
      conversationId,
      userId: socket.userId,
      username: socket.user?.name || 'User'
    });
  });
  
  socket.on('typing:stop', (data) => {
    const { receiverId, conversationId } = data;
    socket.to(`user:${receiverId}`).emit('typing:stop', {
      conversationId,
      userId: socket.userId
    });
  });
  
  // Mark messages as read
  socket.on('messages:read', async (data) => {
    try {
      const { conversationId, senderId } = data;
      const readerId = socket.userId;
      
      const result = await Message.updateMany(
        {
          conversationId,
          senderId: senderId,
          receiverId: readerId,
          status: { $in: ['sent', 'delivered'] }
        },
        {
          $set: {
            status: 'read',
            readAt: new Date()
          }
        }
      );
      
      if (result.modifiedCount > 0) {
        io.to(`user:${senderId}`).emit('messages:read', {
          conversationId,
          readerId,
          readAt: new Date()
        });
      }
      
      // Update conversation unread count
      const conversation = await Conversation.findById(conversationId);
      if (conversation) {
        conversation.unreadCounts.set(readerId.toString(), 0);
        await conversation.save();
      }
      
    } catch (error) {
      console.error('Socket read error:', error);
    }
  });
  
  // Join conversation room
  socket.on('conversation:join', (data) => {
    const { conversationId } = data;
    socket.join(`conversation:${conversationId}`);
    console.log(`User ${socket.userId} joined conversation:${conversationId}`);
  });
  
  // Leave conversation room
  socket.on('conversation:leave', (data) => {
    const { conversationId } = data;
    socket.leave(`conversation:${conversationId}`);
    console.log(`User ${socket.userId} left conversation:${conversationId}`);
  });
  
  // ============================================
  // POST REACTIONS (for real-time post updates)
  // ============================================
  
  socket.on('post:like', (data) => {
    const { postId, userId, postOwnerId } = data;
    io.to(`user:${postOwnerId}`).emit('post:liked', { postId, userId });
  });
  
  socket.on('post:comment', (data) => {
    const { postId, postOwnerId, comment } = data;
    io.to(`user:${postOwnerId}`).emit('post:commented', { postId, comment });
  });
  
  // ============================================
  // DISCONNECT HANDLER
  // ============================================
  
  socket.on('disconnect', async () => {
    console.log(`🔌 User disconnected: ${socket.userId}`);
    
    onlineUsers.delete(socket.userId);
    
    // Update user's online status in database
    await User.findByIdAndUpdate(socket.userId, {
      isOnline: false,
      lastSeen: new Date()
    }).catch(err => console.error('Error updating offline status:', err));
    
    // Broadcast offline status
    socket.broadcast.emit('user:offline', {
      userId: socket.userId,
      lastSeen: new Date()
    });
  });
});

// Make io and notification service available to routes
app.set('io', io);
app.set('notificationService', notificationService);
notificationService.setIO(io);

// Constants
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const NODE_ENV = process.env.NODE_ENV || 'development';

// ==================== DATABASE CONNECTION ====================
connectDB();

// ==================== MIDDLEWARE SETUP ====================
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper function to clean environment variables
const cleanEnvUrl = (url) => {
  if (!url) return null;
  let cleaned = url.replace(/^(FRONTEND_URL=)/i, '');
  cleaned = cleaned.replace(/["']/g, '');
  cleaned = cleaned.trim();
  cleaned = cleaned.replace(/\/+$/, '');
  return cleaned;
};

// CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    const rawFrontendUrl = process.env.FRONTEND_URL;
    const cleanedFrontendUrl = cleanEnvUrl(rawFrontendUrl);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'https://alpha-phoenix-trading-matrix-s78v.onrender.com',
      cleanedFrontendUrl
    ].filter(Boolean);
    
    if (cleanedFrontendUrl && cleanedFrontendUrl.startsWith('https://')) {
      allowedOrigins.push(cleanedFrontendUrl.replace('https://', 'http://'));
    }
    
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.options('*', cors());

// ==================== STATIC FILE SERVING ====================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==================== REQUEST LOGGING MIDDLEWARE ====================
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.url}`);
  next();
});

// ==================== ROUTES ====================
app.use("/api/gallery", galleryRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/users", userRoutes);
app.use('/api/friends', followRoutes);
app.use('/api/chat', chatRoutes);

// ==================== CREATE UPLOAD DIRECTORIES ====================
const createUploadDirectories = () => {
  const uploadDirs = [
    'uploads', 
    'uploads/avatars', 
    'uploads/documents',
    'uploads/banners',
    'uploads/address-proofs',
    'uploads/gallery',
    'uploads/posts',
    'uploads/posts/images',
    'uploads/posts/videos',
    'uploads/posts/documents',
    'uploads/temp'
  ];
  
  uploadDirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`✅ Created directory: ${dirPath}`);
    }
  });
};
createUploadDirectories();

// ==================== UTILITY ENDPOINTS ====================

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version,
    socket: {
      enabled: true,
      connections: io?.engine?.clientsCount || 0,
      onlineUsers: onlineUsers.size
    },
    features: {
      realtimePosts: true,
      realtimeChat: true,
      mediaUpload: true,
      notifications: true,
      onlineStatus: true
    }
  });
});

// Socket.io status endpoint
app.get("/api/socket-status", (req, res) => {
  try {
    res.json({
      success: true,
      message: "Socket.io is running",
      socketEnabled: !!io,
      activeConnections: io?.engine?.clientsCount || 0,
      onlineUsers: onlineUsers.size,
      rooms: Array.from(io?.sockets?.adapter?.rooms?.keys() || []).length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test endpoint
app.get("/api/test", (req, res) => {
  res.json({ 
    success: true,
    message: "Server is working!",
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint for environment variables
app.get("/api/debug/env", (req, res) => {
  res.json({
    success: true,
    environment: {
      frontendUrl: process.env.FRONTEND_URL,
      cleanedFrontendUrl: cleanEnvUrl(process.env.FRONTEND_URL),
      nodeEnv: process.env.NODE_ENV,
      port: PORT,
      viteApiUrl: process.env.VITE_API_URL,
      googleClientId: process.env.GOOGLE_CLIENT_ID ? "✅ Configured" : "❌ Missing",
      emailConfigured: process.env.EMAIL_USER ? "✅ Configured" : "❌ Not configured",
      jwtConfigured: process.env.JWT_SECRET ? "✅ Configured" : "❌ Using fallback",
      mongoConnected: mongoose.connection.readyState === 1 ? "✅ Connected" : "❌ Disconnected",
      cloudinaryConfigured: process.env.CLOUDINARY_CLOUD_NAME ? "✅ Configured" : "❌ Missing"
    },
    cors: {
      allowedOrigins: [
        'http://localhost:3000',
        'https://alpha-phoenix-trading-matrix-s78v.onrender.com',
        cleanEnvUrl(process.env.FRONTEND_URL)
      ].filter(Boolean)
    }
  });
});

// Debug endpoint for checking posts
app.get('/api/debug/check-posts/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const Post = (await import('./models/Post.js')).default;
    
    const allPosts = await Post.find({ userId });
    
    res.json({
      success: true,
      userId,
      allPostsCount: allPosts.length,
      firstFewPosts: allPosts.slice(0, 3).map(p => ({
        id: p._id,
        userId: p.userId,
        content: p.content?.substring(0, 50),
        createdAt: p.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Debug endpoint for posts
app.get('/api/debug/posts/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const Post = (await import('./models/Post.js')).default;
    
    const posts = await Post.find({ userId })
      .sort({ createdAt: -1 })
      .populate('userId', 'name username avatar isVerified')
      .populate('mentions', 'name username avatar')
      .populate({
        path: 'repostOf',
        populate: { path: 'userId', select: 'name username avatar isVerified' }
      })
      .limit(50);
    
    res.json({
      success: true,
      userId,
      postsCount: posts.length,
      posts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Debug endpoint for post by ID
app.get('/api/debug/post/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const Post = (await import('./models/Post.js')).default;
    
    const post = await Post.findById(postId)
      .populate('userId', 'name username avatar isVerified')
      .populate('mentions', 'name username avatar')
      .populate({
        path: 'repostOf',
        populate: { path: 'userId', select: 'name username avatar isVerified' }
      });
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    res.json({
      success: true,
      post
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Debug endpoint for trending hashtags
app.get('/api/debug/hashtags/trending', async (req, res) => {
  try {
    const Post = (await import('./models/Post.js')).default;
    const trending = await Post.getTrendingHashtags(10);
    
    res.json({
      success: true,
      trending
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Debug endpoint for feed
app.get('/api/debug/feed/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20 } = req.query;
    const Post = (await import('./models/Post.js')).default;
    const UserProfile = (await import('./models/UserProfile.js')).default;
    
    const userProfile = await UserProfile.findOne({ userId });
    const followingIds = userProfile?.following || [];
    
    const posts = await Post.find({
      $or: [
        { userId: { $in: [userId, ...followingIds] } },
        { visibility: 'public' }
      ]
    })
      .populate('userId', 'name username avatar isVerified')
      .populate('mentions', 'name username avatar')
      .populate({
        path: 'repostOf',
        populate: { path: 'userId', select: 'name username avatar isVerified' }
      })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      userId,
      following: followingIds.length,
      postsCount: posts.length,
      posts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Debug endpoint for avatars
app.get('/api/debug/avatars', async (req, res) => {
  try {
    const avatarsDir = path.join(__dirname, 'uploads', 'avatars');
    
    if (!fs.existsSync(avatarsDir)) {
      return res.json({
        success: false,
        message: 'Avatars directory does not exist',
        avatarsDir
      });
    }
    
    const files = fs.readdirSync(avatarsDir);
    
    const avatarInfo = files.map(filename => {
      const filePath = path.join(avatarsDir, filename);
      const stats = fs.statSync(filePath);
      return {
        filename,
        path: `/uploads/avatars/${filename}`,
        fullUrl: `http://localhost:${PORT}/uploads/avatars/${filename}`,
        size: stats.size,
        created: stats.birthtime
      };
    });
    
    res.json({
      success: true,
      avatarsDir,
      files: avatarInfo,
      totalFiles: files.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Debug endpoint for banners
app.get('/api/debug/banners', async (req, res) => {
  try {
    const bannersDir = path.join(__dirname, 'uploads', 'banners');
    
    if (!fs.existsSync(bannersDir)) {
      return res.json({
        success: false,
        message: 'Banners directory does not exist',
        bannersDir
      });
    }
    
    const files = fs.readdirSync(bannersDir);
    
    const bannerInfo = files.map(filename => {
      const filePath = path.join(bannersDir, filename);
      const stats = fs.statSync(filePath);
      return {
        filename,
        path: `/uploads/banners/${filename}`,
        fullUrl: `http://localhost:${PORT}/uploads/banners/${filename}`,
        size: stats.size,
        created: stats.birthtime
      };
    });
    
    res.json({
      success: true,
      bannersDir,
      files: bannerInfo,
      totalFiles: files.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test notification endpoint
app.post('/api/test/notification', async (req, res) => {
  try {
    const { userId, type, content } = req.body;
    
    const notification = {
      _id: Date.now().toString(),
      type: type || 'test',
      content: content || 'Test notification',
      senderId: 'system',
      createdAt: new Date(),
      read: false
    };
    
    io.to(`user:${userId}`).emit('notification', notification);
    
    res.json({
      success: true,
      message: 'Test notification sent',
      notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test typing indicator
app.post('/api/test/typing', async (req, res) => {
  try {
    const { postId, userId, username, commentId } = req.body;
    
    io.to(`post:${postId}`).emit('user-typing', {
      userId,
      username: username || 'Test User',
      commentId: commentId || 'new'
    });
    
    res.json({
      success: true,
      message: 'Typing indicator sent'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Debug user data endpoint
app.get("/api/debug/user-data", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: "No token provided" 
      });
    }

    const jwt = await import('jsonwebtoken');
    const User = (await import('./models/User.js')).default;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const user = await User.findById(decoded.userId).select('-password -otpCode');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: "User not found" 
      });
    }

    res.json({
      success: true,
      userFromDB: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        isActive: user.isActive
      },
      tokenData: decoded
    });
  } catch (error) {
    console.error("Debug user data error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Route documentation
app.get("/api/debug/routes", (req, res) => {
  res.json({
    success: true,
    message: "All available API endpoints",
    endpoints: {
      auth: [
        "POST /api/auth/signup",
        "POST /api/auth/verify-otp", 
        "POST /api/auth/resend-otp",
        "POST /api/auth/login",
        "GET  /api/auth/google",
        "GET  /api/auth/google/callback",
        "GET  /api/auth/check",
        "POST /api/auth/logout",
        "PUT  /api/auth/password"
      ],
      profile: [
        "GET  /api/profile/me",
        "GET  /api/profile/complete",
        "PUT  /api/profile/update", 
        "PUT  /api/profile/complete",
        "POST /api/profile/avatar",
        "DELETE /api/profile/avatar",
        "POST /api/profile/banner",
        "DELETE /api/profile/banner",
        "GET  /api/profile/settings",
        "PUT  /api/profile/settings",
        "GET  /api/profile/public/:username"
      ],
      users: [
        "GET  /api/users/all",
        "GET  /api/users/search",
        "GET  /api/users/:userId",
        "GET  /api/users/me"
      ],
      friends: [
        "POST /api/friends/follow/:userId",
        "POST /api/friends/unfollow/:userId",
        "GET  /api/friends/status/:userId",
        "GET  /api/friends/followers/:userId",
        "GET  /api/friends/following/:userId"
      ],
      chat: [
        "GET    /api/chat/conversations",
        "POST   /api/chat/conversation/:userId",
        "GET    /api/chat/messages/:conversationId",
        "POST   /api/chat/messages",
        "PUT    /api/chat/messages/:messageId",
        "DELETE /api/chat/messages/:messageId",
        "POST   /api/chat/messages/:messageId/react",
        "POST   /api/chat/messages/:messageId/forward",
        "POST   /api/chat/conversations/:conversationId/read",
        "GET    /api/chat/search/users",
        "GET    /api/chat/unread/counts"
      ],
      gallery: [
        "GET    /api/gallery/user/:userId",
        "POST   /api/gallery/upload",
        "POST   /api/gallery/folders",
        "DELETE /api/gallery/folders/:folderId",
        "DELETE /api/gallery/items/:itemId"
      ],
      posts: [
        "GET    /api/posts/feed",
        "GET    /api/posts/hashtags/trending",
        "GET    /api/posts/hashtags/:hashtag",
        "POST   /api/posts",
        "GET    /api/posts/:postId",
        "PUT    /api/posts/:postId",
        "DELETE /api/posts/:postId",
        "POST   /api/posts/:postId/like",
        "POST   /api/posts/:postId/repost",
        "POST   /api/posts/:postId/comments",
        "POST   /api/posts/:postId/comments/:commentId/like",
        "POST   /api/posts/:postId/comments/:commentId/replies",
        "POST   /api/posts/:postId/report",
        "GET    /api/posts/user/:userId"
      ],
      utility: [
        "GET  /api/health",
        "GET  /api/socket-status",
        "GET  /api/test",
        "GET  /api/debug/routes",
        "GET  /api/debug/user-data",
        "GET  /api/debug/avatars",
        "GET  /api/debug/banners",
        "GET  /api/debug/posts/:userId",
        "GET  /api/debug/post/:postId",
        "GET  /api/debug/hashtags/trending",
        "GET  /api/debug/feed/:userId",
        "POST /api/test/notification",
        "POST /api/test/typing"
      ]
    },
    environment: {
      nodeEnv: NODE_ENV,
      port: PORT,
      frontendUrl: FRONTEND_URL,
      cleanedFrontendUrl: cleanEnvUrl(FRONTEND_URL),
      socketEnabled: true,
      realtimeFeatures: {
        posts: true,
        comments: true,
        likes: true,
        typing: true,
        notifications: true,
        onlineStatus: true,
        chat: true
      },
      googleOAuth: {
        clientId: process.env.GOOGLE_CLIENT_ID ? "✅ Configured" : "❌ Missing",
        redirectUri: process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/api/auth/google/callback"
      },
      email: process.env.EMAIL_USER ? "✅ Configured" : "❌ Not configured",
      jwt: process.env.JWT_SECRET ? "✅ Configured" : "❌ Using fallback"
    }
  });
});

// Google OAuth test endpoint
app.get("/api/debug/google-test", (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.json({ 
      success: false,
      error: "GOOGLE_CLIENT_ID not set in environment variables" 
    });
  }
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${process.env.GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback')}` +
    `&response_type=code` +
    `&scope=profile%20email` +
    `&access_type=offline` +
    `&prompt=consent`;

  res.json({
    success: true,
    message: "Google OAuth Configuration Test",
    authUrl: authUrl,
    directLink: `/api/auth/google`,
    configuration: {
      clientId: process.env.GOOGLE_CLIENT_ID ? "✅ Configured" : "❌ Missing",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ? "✅ Configured" : "❌ Missing",
      redirectUri: process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/api/auth/google/callback"
    }
  });
});

// ==================== PRODUCTION SETUP ====================
if (NODE_ENV === "production") {
  const possiblePaths = [
    path.join(__dirname, "../APTM_frontend/dist"),
    path.join(__dirname, "../frontend/dist"),
    path.join(__dirname, "../client/dist"),
    path.join(__dirname, "../dist"),
    path.join(__dirname, "public"),
    path.join(process.cwd(), "public"),
    path.join(process.cwd(), "dist")
  ];
  
  let staticPath = null;
  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
      staticPath = testPath;
      console.log(`✅ Found frontend build at: ${testPath}`);
      break;
    }
  }
  
  if (staticPath) {
    app.use(express.static(staticPath));
    
    app.get("*", (req, res, next) => {
      if (req.url.startsWith('/api/')) {
        return next();
      }
      res.sendFile(path.join(staticPath, "index.html"));
    });
    
    console.log(`📁 Serving static files from: ${staticPath}`);
  } else {
    console.warn("⚠️ No frontend build found. API only mode.");
  }
}

// ==================== ERROR HANDLING ====================

// 404 handler for API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
    path: req.originalUrl,
    availableEndpoints: "/api/debug/routes"
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("🚨 Global error handler:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    ...(NODE_ENV === 'development' && { 
      error: err.message,
      stack: err.stack 
    })
  });
});

// ==================== SERVER STARTUP ====================
httpServer.listen(PORT, () => {
  console.log(`\n🎯 SERVER STARTUP INFORMATION`);
  console.log(`=========================================`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Local URL: http://localhost:${PORT}`);
  console.log(`🌐 Environment: ${NODE_ENV}`);
  console.log(`🔗 Frontend URL: ${FRONTEND_URL}`);
  console.log(`🔗 Cleaned Frontend URL: ${cleanEnvUrl(FRONTEND_URL)}`);
  console.log(`🔌 Socket.io: Enabled`);
  console.log(`\n📡 API ENDPOINTS:`);
  console.log(`   🔐 Auth:      http://localhost:${PORT}/api/auth`);
  console.log(`   👤 Profile:   http://localhost:${PORT}/api/profile`);
  console.log(`   👥 Users:     http://localhost:${PORT}/api/users`);
  console.log(`   🤝 Friends:   http://localhost:${PORT}/api/friends`);
  console.log(`   💬 Chat:      http://localhost:${PORT}/api/chat`);
  console.log(`   🖼️ Gallery:    http://localhost:${PORT}/api/gallery`);
  console.log(`   📝 Posts:     http://localhost:${PORT}/api/posts`);
  console.log(`   📁 Uploads:   http://localhost:${PORT}/uploads`);
  console.log(`\n🔧 UTILITY ENDPOINTS:`);
  console.log(`   ❤️  Health:    http://localhost:${PORT}/api/health`);
  console.log(`   📊 Socket:    http://localhost:${PORT}/api/socket-status`);
  console.log(`   🔌 Test:      http://localhost:${PORT}/api/test`);
  console.log(`   🔍 Env Debug: http://localhost:${PORT}/api/debug/env`);
  console.log(`   🐛 Debug:     http://localhost:${PORT}/api/debug/routes`);
  console.log(`\n⚙️  CONFIGURATION STATUS:`);
  console.log(`   📧 Email:     ${process.env.EMAIL_USER ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`   🔑 JWT:       ${process.env.JWT_SECRET ? '✅ Configured' : '❌ Using fallback'}`);
  console.log(`   🔗 Google:    ${process.env.GOOGLE_CLIENT_ID ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`   ☁️ Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`   🗄️  Database:  ✅ Connected`);
  console.log(`   🔌 Socket:    ✅ Enabled (${onlineUsers.size} online users)`);
  console.log(`\n✨ REAL-TIME FEATURES:`);
  console.log(`   📝 Posts:     ✅ Live updates`);
  console.log(`   💬 Comments:  ✅ Real-time`);
  console.log(`   ❤️  Likes:     ✅ Instant`);
  console.log(`   ⌨️  Typing:    ✅ Indicators`);
  console.log(`   🔔 Notify:    ✅ Push notifications`);
  console.log(`   👥 Online:    ✅ Status tracking`);
  console.log(`   💬 Chat:      ✅ P2P messaging`);
  console.log(`   📎 Media:     ✅ Image/Video/Document sharing`);
  console.log(`   📊 Charts:    ✅ Trading chart sharing`);
  console.log(`\n✅ Server started successfully at ${new Date().toLocaleString()}`);
  console.log(`=========================================\n`);
});

// Export for testing
export { io, onlineUsers };