// routes/chatRoutes.js - COMPLETE FIXED VERSION
import express from 'express';
import multer from 'multer';
import {
  sendMessage,
  getMessages,
  editMessage,
  deleteMessage,
  reactToMessage,
  forwardMessage,
  markMessagesAsRead,
  getConversations,
  getOrCreateConversation,
  searchUsersForChat,
  getUnreadCounts
} from '../controllers/chatController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for memory storage (for Cloudinary upload)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type: ' + file.mimetype), false);
    }
  }
});

// All routes require authentication
router.use(authenticateToken);

// ============================================
// CONVERSATION ROUTES
// ============================================
router.get('/conversations', getConversations);
router.post('/conversation/:userId', getOrCreateConversation);
router.get('/unread/counts', getUnreadCounts);

// ============================================
// MESSAGE ROUTES
// ============================================
// Send message with media support - IMPORTANT: 'media' field name must match frontend
router.post('/messages', upload.array('media', 10), sendMessage);

// Get messages for conversation
router.get('/messages/:conversationId', getMessages);

// Edit message
router.put('/messages/:messageId', editMessage);

// Delete message
router.delete('/messages/:messageId', deleteMessage);

// React to message
router.post('/messages/:messageId/react', reactToMessage);

// Forward message
router.post('/messages/:messageId/forward', forwardMessage);

// Mark messages as read
router.post('/conversations/:conversationId/read', markMessagesAsRead);

// ============================================
// USER SEARCH
// ============================================
router.get('/search/users', searchUsersForChat);

export default router;