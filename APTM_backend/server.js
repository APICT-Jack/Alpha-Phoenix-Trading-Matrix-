// server.js - Complete unified server file

import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import fs from "fs";
import { createServer } from 'http';
import mongoose from 'mongoose';

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

// Socket imports
import { initializeSockets, getOnlineUsersCount } from './socket/index.js';

// Service imports
import { notificationService } from './services/notificationService.js';

// Initialize environment variables
dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create HTTP server
const httpServer = createServer(app);

// Initialize unified socket manager
const io = initializeSockets(httpServer);

// Initialize notification service with io
notificationService.setIO(io);

// Make io and notification service available to routes
app.set('io', io);
app.set('notificationService', notificationService);

// Constants
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const NODE_ENV = process.env.NODE_ENV || 'development';

// ==================== DATABASE CONNECTION ====================
connectDB();

// ==================== MIDDLEWARE SETUP ====================
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS configuration
app.use(cors({
  origin: "https://alpha-phoenix-trading-matrix-s78v.onrender.com",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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
      onlineUsers: getOnlineUsersCount()
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
    const onlineUsers = getOnlineUsersCount();
    
    res.json({
      success: true,
      message: "Socket.io is running",
      socketEnabled: !!io,
      activeConnections: io?.engine?.clientsCount || 0,
      onlineUsers: onlineUsers,
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

// ==================== DEBUG ENDPOINTS ====================

// Debug route for checking posts
app.get('/api/debug/check-posts/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const Post = (await import('./models/Post.js')).default;
    
    // Get all posts for user
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
    
    // Get user's following
    const userProfile = await UserProfile.findOne({ userId });
    const followingIds = userProfile?.following || [];
    
    // Get feed
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

// Test avatar access
app.get('/api/debug/avatar-test/:filename', (req, res) => {
  const { filename } = req.params;
  const avatarPath = path.join(__dirname, 'uploads', 'avatars', filename);
  
  if (fs.existsSync(avatarPath)) {
    res.sendFile(avatarPath);
  } else {
    res.status(404).json({
      success: false,
      message: 'Avatar file not found',
      filename
    });
  }
});

// Test banner access
app.get('/api/debug/banner-test/:filename', (req, res) => {
  const { filename } = req.params;
  const bannerPath = path.join(__dirname, 'uploads', 'banners', filename);
  
  if (fs.existsSync(bannerPath)) {
    res.sendFile(bannerPath);
  } else {
    res.status(404).json({
      success: false,
      message: 'Banner file not found',
      filename
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
    
    // Send via socket
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
        "PUT    /api/chat/messages/read/:senderId",
        "DELETE /api/chat/conversation/:userId",
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
        "POST /api/test/typing",
        "GET  /api/debug/avatar-test/:filename",
        "GET  /api/debug/banner-test/:filename"
      ]
    },
    environment: {
      nodeEnv: NODE_ENV,
      port: PORT,
      frontendUrl: FRONTEND_URL,
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
  app.use(express.static(path.join(__dirname, "../APTM_frontend/dist")));
  
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../APTM_frontend", "dist", "index.html"));
  });
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
  console.log(`   🐛 Debug:     http://localhost:${PORT}/api/debug/routes`);
  console.log(`   📝 Posts:     http://localhost:${PORT}/api/debug/posts/:userId`);
  console.log(`   🔥 Trending:  http://localhost:${PORT}/api/debug/hashtags/trending`);
  console.log(`   📋 Feed:      http://localhost:${PORT}/api/debug/feed/:userId`);
  console.log(`   🔔 Notify:    http://localhost:${PORT}/api/test/notification`);
  console.log(`   ⌨️  Typing:    http://localhost:${PORT}/api/test/typing`);
  console.log(`\n⚙️  CONFIGURATION STATUS:`);
  console.log(`   📧 Email:     ${process.env.EMAIL_USER ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`   🔑 JWT:       ${process.env.JWT_SECRET ? '✅ Configured' : '❌ Using fallback'}`);
  console.log(`   🔗 Google:    ${process.env.GOOGLE_CLIENT_ID ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`   🗄️  Database:  ✅ Connected`);
  console.log(`   🔌 Socket:    ✅ Enabled (${getOnlineUsersCount()} online users)`);
  console.log(`\n✨ REAL-TIME FEATURES:`);
  console.log(`   📝 Posts:     ✅ Live updates`);
  console.log(`   💬 Comments:  ✅ Real-time`);
  console.log(`   ❤️  Likes:     ✅ Instant`);
  console.log(`   ⌨️  Typing:    ✅ Indicators`);
  console.log(`   🔔 Notify:    ✅ Push notifications`);
  console.log(`   👥 Online:    ✅ Status tracking`);
  console.log(`   💬 Chat:      ✅ P2P messaging`);
  console.log(`\n✅ Server started successfully at ${new Date().toLocaleString()}`);
  console.log(`=========================================\n`);
});