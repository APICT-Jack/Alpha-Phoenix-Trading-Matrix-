// server.js - COMPLETE FIXED VERSION (NO DUPLICATES)
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
// SOCKET.IO CONFIGURATION - SINGLE INSTANCE
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
        console.log('❌ CORS blocked:', origin);
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

// ============================================
// FIXED AUTHENTICATION MIDDLEWARE
// ============================================
// In server.js, update the socket authentication middleware
io.use(async (socket, next) => {
  try {
    // Try multiple sources for token with better logging
    let token = socket.handshake.auth?.token;
    
    if (!token && socket.handshake.query?.token) {
      token = socket.handshake.query.token;
      console.log('🔐 Token found in query');
    }
    
    if (!token && socket.handshake.headers?.authorization) {
      token = socket.handshake.headers.authorization.replace('Bearer ', '');
      console.log('🔐 Token found in headers');
    }
    
    console.log('🔐 Socket auth - Token present:', !!token);
    console.log('🔐 Socket handshake details:', {
      auth: !!socket.handshake.auth,
      query: !!socket.handshake.query,
      headers: !!socket.handshake.headers
    });
    
    if (!token) {
      console.log('❌ No token provided in any source');
      return next(new Error('Authentication required: No token'));
    }
    
    // Verify JWT
    let decoded;
    try {
      const jwt = await import('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
      decoded = jwt.verify(token, JWT_SECRET);
      console.log('✅ Token verified for user:', decoded.userId || decoded.id);
    } catch (jwtError) {
      console.error('❌ JWT verification failed:', jwtError.message);
      console.error('Token (first 50 chars):', token.substring(0, 50));
      return next(new Error('Authentication failed: Invalid token - ' + jwtError.message));
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

// ============================================
// SOCKET CONNECTION HANDLER
// ============================================
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

  // Join user's personal room
  socket.join(`user:${userId}`);

  // Broadcast online status
  socket.broadcast.emit('user:online', {
    userId,
    userData: userData,
    timestamp: new Date()
  });

  // Send current online users to new client
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
  // CHAT SOCKET HANDLERS
  // ============================================
  
  // Join conversation room
  socket.on('conversation:join', ({ conversationId }) => {
    if (!conversationId || !userId) return;
    socket.join(`conversation:${conversationId}`);
    console.log(`User ${userId} joined conversation: ${conversationId}`);
  });
  
  // Leave conversation room
  socket.on('conversation:leave', ({ conversationId }) => {
    if (!conversationId || !userId) return;
    socket.leave(`conversation:${conversationId}`);
    console.log(`User ${userId} left conversation: ${conversationId}`);
  });
  
  // Send message via socket
  socket.on('message:send', async (data) => {
    try {
      const { receiverId, text, tempId, replyToId, chart, media } = data;
      const senderId = userId;
      
      if (!receiverId) {
        socket.emit('message:error', { tempId, error: 'Missing receiver' });
        return;
      }
      
      console.log(`📨 Message from ${senderId} to ${receiverId}`);
      
      const sender = await User.findById(senderId).select('name username avatar');
      if (!sender) {
        socket.emit('message:error', { tempId, error: 'Sender not found' });
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
      
      // Handle reply
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
        type: chart ? 'chart' : (media?.length > 0 ? 'mixed' : 'text'),
        status: 'sent',
        replyTo: replyToId || null,
        replyToMessage: replyToMessage
      });
      
      await message.save();
      
      // Format message
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
    }
  });
  
  // React to message
  socket.on('message:react', async ({ messageId, reaction }) => {
    if (!messageId || !reaction || !userId) return;
    
    try {
      const message = await Message.findById(messageId);
      if (!message) return;
      
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
      
    } catch (error) {
      console.error('Error reacting to message:', error);
    }
  });
  
  // Typing indicators
  socket.on('typing:start', ({ receiverId }) => {
    if (!receiverId || !userId) return;
    io.to(`user:${receiverId}`).emit('typing:start', {
      userId,
      username: userData?.name || 'User'
    });
  });
  
  socket.on('typing:stop', ({ receiverId }) => {
    if (!receiverId || !userId) return;
    io.to(`user:${receiverId}`).emit('typing:stop', { userId });
  });
  
  // Mark messages as read
  socket.on('messages:read', async ({ conversationId, senderId }) => {
    if (!conversationId || !senderId || !userId) return;
    
    try {
      const result = await Message.updateMany(
        { senderId, receiverId: userId, status: { $ne: 'read' } },
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
  
  // Get online users
  socket.on('get-online-users', () => {
    const onlineUsersList = {};
    onlineUsers.forEach((data, id) => {
      onlineUsersList[id] = { online: true, userData: data.userData };
    });
    socket.emit('users:online', onlineUsersList);
  });
  
  // Disconnect
  socket.on('disconnect', async () => {
    console.log(`🔌 Client disconnected: ${socket.id} - User: ${userId}`);
    
    if (userId) {
      onlineUsers.delete(userId);
      
      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen: new Date()
      }).catch(err => console.error('Error updating offline status:', err));
      
      io.emit('user:offline', { userId, timestamp: new Date() });
      console.log(`👤 User offline: ${userId}`);
    }
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
// In server.js, add this endpoint for debugging
app.get("/api/debug/verify-token", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, error: "No token provided" });
    }

    const jwt = await import('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await User.findById(decoded.userId).select('_id name email');
    
    res.json({
      success: true,
      tokenValid: true,
      decoded: decoded,
      user: user
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
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
  console.log(`   🔌 Socket:    ✅ Enabled`);
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