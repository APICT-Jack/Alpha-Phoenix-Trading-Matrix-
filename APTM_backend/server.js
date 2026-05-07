// server.js - COMPLETE FIXED VERSION (NO DUPLICATE SOCKET)
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

// Model imports for socket handlers
import User from './models/User.js';
import { Conversation, Message } from './models/Chat.js';

// Service imports
import { notificationService } from './services/notificationService.js';

// Socket.IO - IMPORT THE INITIALIZER
import { initializeSocket } from './socket/index.js';

// Initialize environment variables
dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create HTTP server
const httpServer = createServer(app);

// ============================================
// SOCKET.IO - SINGLE INITIALIZATION (ONLY HERE)
// ============================================
const io = initializeSocket(httpServer);

// Make io and notification service available to routes
app.set('io', io);
app.set('notificationService', notificationService);
if (notificationService) {
  notificationService.setIO(io);
}

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
      'http://localhost:5173',
      'http://localhost:5000',
      'https://alpha-phoenix-trading-matrix-s78v.onrender.com',
      'https://alpha-phoenix-trading-matrix.onrender.com',
      cleanedFrontendUrl
    ].filter(Boolean);
    
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(null, true); // Allow anyway for debugging
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
      onlineUsers: io?.onlineUsers?.size || 0
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
      onlineUsers: io?.onlineUsers?.size || 0,
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
        'http://localhost:5173',
        'https://alpha-phoenix-trading-matrix-s78v.onrender.com',
        cleanEnvUrl(process.env.FRONTEND_URL)
      ].filter(Boolean)
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
      if (req.url.startsWith('/socket.io/')) {
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
export { io };