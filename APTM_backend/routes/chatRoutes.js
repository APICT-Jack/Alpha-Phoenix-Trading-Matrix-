// routes/chatRoutes.js
import express from 'express';
import mongoose from 'mongoose';
import { Conversation, Message } from '../models/Chat.js';
import User from '../models/User.js';
import Follow from '../models/Follow.js'; // Add this import
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all conversations for current user
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    
    console.log('📋 Fetching conversations for user:', userId);
    
    const conversations = await Conversation.find({
      participants: userId,
      isActive: true
    })
    .populate({
      path: 'participants',
      select: 'name username avatar email isOnline lastSeen',
      model: 'User'
    })
    .populate('lastMessage')
    .sort({ lastMessageTime: -1, updatedAt: -1 });

    // Format conversations for frontend
    const formattedConversations = await Promise.all(conversations.map(async (conv) => {
      const otherParticipant = conv.participants.find(
        p => p._id.toString() !== userId.toString()
      );
      
      if (!otherParticipant) {
        return null;
      }
      
      // Get online status
      let isOnline = false;
      try {
        const { isUserOnline } = await import('../socket/index.js');
        isOnline = isUserOnline(otherParticipant._id.toString());
      } catch (error) {
        isOnline = otherParticipant.isOnline || false;
      }
      
      const unreadCount = conv.unreadCounts?.get(userId.toString()) || 0;
      
      // Format avatar URL properly
      let avatarUrl = otherParticipant.avatar;
      if (avatarUrl && !avatarUrl.startsWith('http')) {
        if (avatarUrl.startsWith('/uploads/')) {
          avatarUrl = `http://localhost:5000${avatarUrl}`;
        } else if (avatarUrl.startsWith('uploads/')) {
          avatarUrl = `http://localhost:5000/${avatarUrl}`;
        } else {
          avatarUrl = `http://localhost:5000/uploads/avatars/${avatarUrl}`;
        }
      }
      
      return {
        id: conv._id.toString(),
        _id: conv._id.toString(),
        userId: otherParticipant._id.toString(),
        userName: otherParticipant.name || otherParticipant.username || 'User',
        userAvatar: avatarUrl || null,
        userUsername: otherParticipant.username || '',
        isOnline,
        lastMessage: conv.lastMessageText || '',
        lastMessageTime: conv.lastMessageTime || conv.updatedAt || conv.createdAt,
        unreadCount,
        updatedAt: conv.updatedAt
      };
    }));

    // Filter out null values
    const validConversations = formattedConversations.filter(c => c !== null);

    res.json({
      success: true,
      conversations: validConversations
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Get or create conversation with specific user
router.post('/conversation/:userId', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.id || req.user._id;
    const otherUserId = req.params.userId;

    console.log('Creating/finding conversation between:', currentUserId, 'and', otherUserId);

    if (currentUserId.toString() === otherUserId.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot chat with yourself' 
      });
    }

    // Validate other user exists and get full profile
    const otherUser = await User.findById(otherUserId).select('name username avatar email isOnline lastSeen');
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is followed (optional - for UI)
    const isFollowing = await Follow.findOne({
      follower: currentUserId,
      following: otherUserId
    });

    // Find or create conversation
    const participants = [currentUserId, otherUserId].sort((a, b) => 
      a.toString().localeCompare(b.toString())
    );

    let conversation = await Conversation.findOne({
      participants: { $all: participants },
      isActive: true
    });

    if (!conversation) {
      console.log('Creating new conversation between:', participants);
      
      conversation = new Conversation({
        participants,
        unreadCounts: new Map([
          [currentUserId.toString(), 0],
          [otherUserId.toString(), 0]
        ])
      });
      
      await conversation.save();
      console.log('Conversation created successfully:', conversation._id);
    } else {
      console.log('Found existing conversation:', conversation._id);
    }

    // Get online status
    let isOnline = false;
    try {
      const { isUserOnline } = await import('../socket/index.js');
      isOnline = isUserOnline(otherUserId);
    } catch (error) {
      isOnline = otherUser.isOnline || false;
    }

    // Format avatar URL properly
    let avatarUrl = otherUser.avatar;
    if (avatarUrl && !avatarUrl.startsWith('http')) {
      if (avatarUrl.startsWith('/uploads/')) {
        avatarUrl = `http://localhost:5000${avatarUrl}`;
      } else if (avatarUrl.startsWith('uploads/')) {
        avatarUrl = `http://localhost:5000/${avatarUrl}`;
      } else {
        avatarUrl = `http://localhost:5000/uploads/avatars/${avatarUrl}`;
      }
    }

    res.json({
      success: true,
      conversation: {
        id: conversation._id.toString(),
        _id: conversation._id.toString(),
        userId: otherUser._id.toString(),
        userName: otherUser.name || otherUser.username || 'User',
        userAvatar: avatarUrl || null,
        userUsername: otherUser.username || '',
        isOnline,
        isFollowing: !!isFollowing,
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
    const userId = req.user.id || req.user._id;
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
        { 
          $and: [
            { senderId: userId },
            { receiverId: { $in: conversation.participants } }
          ]
        },
        { 
          $and: [
            { senderId: { $in: conversation.participants } },
            { receiverId: userId }
          ]
        }
      ]
    })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate({
      path: 'senderId',
      select: 'name username avatar email',
      model: 'User'
    });

    // Mark messages as delivered if they're sent and received by current user
    await Message.updateMany(
      {
        receiverId: userId,
        status: 'sent'
      },
      {
        $set: {
          status: 'delivered',
          deliveredAt: new Date()
        }
      }
    );

    // Reset unread count for this user
    conversation.unreadCounts.set(userId.toString(), 0);
    await conversation.save();

    // Format messages with proper avatar URLs
    const formattedMessages = messages.map(msg => {
      const msgObj = msg.toObject();
      
      // Format sender avatar
      let senderAvatar = null;
      if (msgObj.senderId && msgObj.senderId.avatar) {
        if (msgObj.senderId.avatar.startsWith('http')) {
          senderAvatar = msgObj.senderId.avatar;
        } else if (msgObj.senderId.avatar.startsWith('/uploads/')) {
          senderAvatar = `http://localhost:5000${msgObj.senderId.avatar}`;
        } else {
          senderAvatar = `http://localhost:5000/uploads/avatars/${msgObj.senderId.avatar}`;
        }
      }
      
      return {
        ...msgObj,
        _id: msgObj._id.toString(),
        senderId: msgObj.senderId?._id?.toString() || msgObj.senderId?.toString(),
        sender: msgObj.senderId ? {
          _id: msgObj.senderId._id.toString(),
          name: msgObj.senderId.name,
          username: msgObj.senderId.username,
          avatar: senderAvatar
        } : null,
        receiverId: msgObj.receiverId?.toString(),
        createdAt: msgObj.createdAt,
        status: msgObj.status
      };
    });

    res.json({
      success: true,
      messages: formattedMessages.reverse(),
      hasMore: messages.length === parseInt(limit)
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Search users for chat (include followed users)
router.get('/search/users', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { q } = req.query;

    // Build search query
    let searchQuery = {
      _id: { $ne: userId }
    };

    if (q && q.length >= 2) {
      searchQuery.$or = [
        { name: { $regex: q, $options: 'i' } },
        { username: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ];
    }

    // Get users
    const users = await User.find(searchQuery)
      .select('name username avatar email isOnline lastSeen')
      .limit(20)
      .lean();

    // Get following status for each user
    const followingStatus = await Follow.find({
      follower: userId,
      following: { $in: users.map(u => u._id) }
    }).lean();

    const followingMap = {};
    followingStatus.forEach(f => {
      followingMap[f.following.toString()] = true;
    });

    // Format users with proper avatar URLs
    const formattedUsers = users.map(user => {
      // Format avatar URL
      let avatarUrl = user.avatar;
      if (avatarUrl && !avatarUrl.startsWith('http')) {
        if (avatarUrl.startsWith('/uploads/')) {
          avatarUrl = `http://localhost:5000${avatarUrl}`;
        } else if (avatarUrl.startsWith('uploads/')) {
          avatarUrl = `http://localhost:5000/${avatarUrl}`;
        } else {
          avatarUrl = `http://localhost:5000/uploads/avatars/${avatarUrl}`;
        }
      }

      return {
        id: user._id.toString(),
        _id: user._id.toString(),
        name: user.name,
        username: user.username,
        avatar: avatarUrl || null,
        email: user.email,
        isOnline: user.isOnline || false,
        lastSeen: user.lastSeen,
        isFollowing: followingMap[user._id.toString()] || false
      };
    });

    // Sort: followed users first, then online, then alphabetically
    formattedUsers.sort((a, b) => {
      if (a.isFollowing && !b.isFollowing) return -1;
      if (!a.isFollowing && b.isFollowing) return 1;
      if (a.isOnline && !b.isOnline) return -1;
      if (!a.isOnline && b.isOnline) return 1;
      return (a.name || '').localeCompare(b.name || '');
    });

    res.json({
      success: true,
      users: formattedUsers
    });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Get unread counts for all conversations
router.get('/unread/counts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    
    const conversations = await Conversation.find({
      participants: userId,
      isActive: true
    });

    const unreadCounts = {};
    conversations.forEach(conv => {
      unreadCounts[conv._id.toString()] = conv.unreadCounts?.get(userId.toString()) || 0;
    });

    res.json({
      success: true,
      unreadCounts,
      total: Object.values(unreadCounts).reduce((a, b) => a + b, 0)
    });
  } catch (error) {
    console.error('Error getting unread counts:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

export default router;