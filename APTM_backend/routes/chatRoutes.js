// routes/chatRoutes.js
import express from 'express';
import mongoose from 'mongoose';
import { Conversation, Message } from '../models/Chat.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all conversations for current user
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const conversations = await Conversation.find({
      participants: userId,
      isActive: true
    })
    .populate('participants', 'name username avatar email isOnline lastSeen')
    .populate('lastMessage')
    .sort({ lastMessageTime: -1, updatedAt: -1 });

    // Format conversations for frontend
    const formattedConversations = await Promise.all(conversations.map(async (conv) => {
      const otherParticipant = conv.participants.find(
        p => p._id.toString() !== userId
      );
      
      // Get online status from global store or database
      let isOnline = false;
      try {
        const { isUserOnline } = await import('../socket/index.js');
        isOnline = isUserOnline(otherParticipant._id.toString());
      } catch (error) {
        isOnline = otherParticipant.isOnline || false;
      }
      
      return {
        id: conv._id,
        userId: otherParticipant._id,
        userName: otherParticipant.name,
        userAvatar: otherParticipant.avatar,
        userUsername: otherParticipant.username,
        isOnline,
        lastMessage: conv.lastMessageText || '',
        lastMessageTime: conv.lastMessageTime || conv.updatedAt,
        unreadCount: conv.unreadCounts?.get(userId.toString()) || 0
      };
    }));

    res.json({
      success: true,
      conversations: formattedConversations
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get or create conversation with specific user - FIXED
router.post('/conversation/:userId', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = req.params.userId;

    console.log('Creating/finding conversation between:', currentUserId, 'and', otherUserId);

    if (currentUserId === otherUserId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot chat with yourself' 
      });
    }

    // Validate other user exists
    const otherUser = await User.findById(otherUserId).select('name username avatar');
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Use the static method to find or create conversation
    const conversation = await Conversation.findOrCreate(currentUserId, otherUserId);

    // Get online status
    let isOnline = false;
    try {
      const { isUserOnline } = await import('../socket/index.js');
      isOnline = isUserOnline(otherUserId);
    } catch (error) {
      isOnline = false;
    }

    res.json({
      success: true,
      conversation: {
        id: conversation._id,
        userId: otherUser._id,
        userName: otherUser.name,
        userAvatar: otherUser.avatar,
        userUsername: otherUser.username,
        isOnline,
        lastMessage: conversation.lastMessageText || '',
        lastMessageTime: conversation.lastMessageTime || conversation.createdAt,
        unreadCount: 0
      }
    });
  } catch (error) {
    console.error('Error getting conversation:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// Get messages for a conversation
router.get('/messages/:conversationId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify user is part of conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });

    if (!conversation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Conversation not found' 
      });
    }

    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: { $in: conversation.participants } },
        { senderId: { $in: conversation.participants }, receiverId: userId }
      ]
    })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate('senderId', 'name username avatar');

    // Mark messages as delivered if they're sent
    await Message.updateMany(
      {
        receiverId: userId,
        status: 'sent'
      },
      {
        status: 'delivered',
        deliveredAt: new Date()
      }
    );

    // Reset unread count
    conversation.unreadCounts.set(userId.toString(), 0);
    await conversation.save();

    res.json({
      success: true,
      messages: messages.reverse(),
      hasMore: messages.length === parseInt(limit)
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Send a message (HTTP fallback)
router.post('/messages', authenticateToken, async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId, text, type = 'text' } = req.body;

    if (!receiverId || !text) {
      return res.status(400).json({ 
        success: false, 
        message: 'Receiver and text are required' 
      });
    }

    // Find or create conversation using static method
    const conversation = await Conversation.findOrCreate(senderId, receiverId);

    // Create message
    const message = new Message({
      senderId,
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
    conversation.unreadCounts.set(
      receiverId.toString(), 
      (conversation.unreadCounts.get(receiverId.toString()) || 0) + 1
    );
    await conversation.save();

    // Populate sender info
    await message.populate('senderId', 'name username avatar');

    // Try to emit via socket if available
    try {
      const { sendToUser } = await import('../socket/index.js');
      sendToUser(receiverId, 'message:receive', {
        ...message.toObject(),
        conversationId: conversation._id
      });
    } catch (error) {
      console.log('Socket not available for real-time message');
    }

    res.json({
      success: true,
      message,
      conversationId: conversation._id
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Mark messages as read
router.put('/messages/read/:senderId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { senderId } = req.params;

    const result = await Message.updateMany(
      {
        senderId,
        receiverId: userId,
        status: { $ne: 'read' }
      },
      {
        status: 'read',
        readAt: new Date()
      }
    );

    // Update conversation unread count
    const participants = [userId, senderId].sort((a, b) => 
      a.toString().localeCompare(b.toString())
    );
    
    const conversation = await Conversation.findOne({
      participants: { $all: participants }
    });

    if (conversation) {
      conversation.unreadCounts.set(userId.toString(), 0);
      await conversation.save();
    }

    // Notify sender via socket
    try {
      const { sendToUser } = await import('../socket/index.js');
      sendToUser(senderId, 'messages:read', {
        readerId: userId,
        conversationId: conversation?._id,
        count: result.modifiedCount
      });
    } catch (error) {}

    res.json({
      success: true,
      updated: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete conversation
router.delete('/conversation/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const otherUserId = req.params.userId;

    const participants = [userId, otherUserId].sort((a, b) => 
      a.toString().localeCompare(b.toString())
    );
    
    const conversation = await Conversation.findOne({
      participants: { $all: participants }
    });

    if (!conversation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Conversation not found' 
      });
    }

    // Soft delete - just mark as inactive
    conversation.isActive = false;
    await conversation.save();

    res.json({
      success: true,
      message: 'Conversation deleted'
    });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Search users for chat
router.get('/search/users', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json({ success: true, users: [] });
    }

    const users = await User.find({
      _id: { $ne: userId },
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { username: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    })
    .select('name username avatar email isOnline')
    .limit(20);

    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get unread counts for all conversations
router.get('/unread/counts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const conversations = await Conversation.find({
      participants: userId,
      isActive: true
    });

    const unreadCounts = {};
    conversations.forEach(conv => {
      unreadCounts[conv._id] = conv.unreadCounts?.get(userId.toString()) || 0;
    });

    res.json({
      success: true,
      unreadCounts,
      total: Object.values(unreadCounts).reduce((a, b) => a + b, 0)
    });
  } catch (error) {
    console.error('Error getting unread counts:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;