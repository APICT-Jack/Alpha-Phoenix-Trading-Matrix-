// controllers/chatController.js
import mongoose from 'mongoose';
import { Readable } from 'stream';
import { Conversation, Message } from '../models/Chat.js';
import User from '../models/User.js';
import Follow from '../models/Follow.js';
import cloudinary from '../services/cloudinaryService.js';

// ============================================
// MEDIA UPLOAD UTILITY
// ============================================
const uploadChatMedia = async (files) => {
  const uploadedMedia = [];
  
  for (const file of files) {
    try {
      console.log(`📎 Processing chat file: ${file.originalname} (${file.mimetype})`);
      
      let mediaType = 'document';
      if (file.mimetype.startsWith('image/')) mediaType = 'image';
      else if (file.mimetype.startsWith('video/')) mediaType = 'video';
      
      let buffer;
      if (file.buffer) {
        buffer = file.buffer;
      } else if (file.path) {
        const fs = await import('fs');
        buffer = await fs.promises.readFile(file.path);
      } else {
        throw new Error('No file data available');
      }
      
      const result = await new Promise((resolve, reject) => {
        const uploadOptions = {
          folder: 'trading-app/chats',
          resource_type: 'auto',
        };
        
        if (mediaType === 'image') {
          uploadOptions.transformation = [
            { quality: 'auto' },
            { fetch_format: 'auto' },
            { width: 1200, crop: 'limit' }
          ];
        }
        
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        
        const bufferStream = Readable.from(buffer);
        bufferStream.pipe(uploadStream);
      });
      
      const mediaObject = {
        url: result.secure_url,
        type: mediaType,
        size: file.size,
        mimeType: file.mimetype,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format
      };
      
      if (mediaType === 'video') {
        mediaObject.thumbnail = result.secure_url.replace('/upload/', '/upload/video_thumbnail/');
      }
      
      uploadedMedia.push(mediaObject);
      console.log(`✅ Chat file uploaded to Cloudinary: ${result.public_id}`);
      
    } catch (error) {
      console.error('❌ Error uploading chat file:', error);
      throw error;
    }
  }
  
  return uploadedMedia;
};

// ============================================
// DELETE CHAT MEDIA
// ============================================
const deleteChatMedia = async (mediaArray) => {
  for (const media of mediaArray) {
    if (media.publicId && media.type !== 'chart') {
      try {
        const resourceType = media.type === 'video' ? 'video' : 'image';
        await cloudinary.uploader.destroy(media.publicId, { resource_type: resourceType });
        console.log(`🗑️ Deleted chat media: ${media.publicId}`);
      } catch (error) {
        console.error(`Error deleting ${media.publicId}:`, error);
      }
    }
  }
};

// ============================================
// SEND MESSAGE (with media and chart support)
// ============================================
export const sendMessage = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { receiverId, text, replyToId, chart } = req.body;
    
    console.log('📨 Sending message:', { senderId, receiverId, text, replyToId });
    
    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: 'Receiver ID is required'
      });
    }
    
    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }
    
    // Handle media files
    let media = [];
    if (req.files && req.files.length > 0) {
      try {
        media = await uploadChatMedia(req.files);
        console.log(`📎 Uploaded ${media.length} media files`);
      } catch (uploadError) {
        console.error('Media upload failed:', uploadError);
        return res.status(400).json({
          success: false,
          message: 'Media upload failed: ' + uploadError.message
        });
      }
    }
    
    // Handle chart if present
    if (chart && chart !== 'undefined' && chart !== 'null') {
      try {
        const chartData = typeof chart === 'string' ? JSON.parse(chart) : chart;
        console.log('📊 Adding chart to message:', chartData);
        
        if (!chartData.symbol) {
          return res.status(400).json({
            success: false,
            message: 'Chart must have a symbol'
          });
        }
        
        const chartMedia = {
          url: '/api/charts/widget',
          type: 'chart',
          mimeType: 'application/json',
          size: 0,
          chartData: {
            symbol: chartData.symbol || 'BTCUSDT',
            interval: chartData.interval || '30',
            theme: chartData.theme || 'dark',
            indicators: chartData.indicators || [],
            hideToolbar: chartData.hideToolbar || false,
            hideSideToolbar: chartData.hideSideToolbar || false
          }
        };
        
        media.push(chartMedia);
        console.log('✅ Chart added to message');
      } catch (error) {
        console.error('Failed to parse chart data:', error);
        return res.status(400).json({
          success: false,
          message: 'Invalid chart data format'
        });
      }
    }
    
    // Validate content
    const hasText = text && text.trim() !== '';
    const hasMedia = media.length > 0;
    
    if (!hasText && !hasMedia) {
      return res.status(400).json({
        success: false,
        message: 'Message must have text or media'
      });
    }
    
    // Get or create conversation
    const conversation = await Conversation.findOrCreate(senderId, receiverId);
    
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
    
    // Determine message type
    let messageType = 'text';
    if (media.length > 0) {
      if (media.some(m => m.type === 'chart')) {
        messageType = 'chart';
      } else if (media.some(m => m.type === 'image')) {
        messageType = media.length === 1 ? 'image' : 'mixed';
      } else if (media.some(m => m.type === 'video')) {
        messageType = 'video';
      } else {
        messageType = 'file';
      }
    }
    
    // Create message
    const message = new Message({
      senderId,
      receiverId,
      conversationId: conversation._id,
      text: text?.trim() || '',
      media,
      type: messageType,
      status: 'sent',
      replyTo: replyToId || null,
      replyToMessage: replyToMessage
    });
    
    await message.save();
    
    // Populate sender info
    await message.populate('senderId', 'name username avatar email');
    
    // Update conversation
    conversation.lastMessage = message._id;
    conversation.lastMessageText = text?.trim() || (media.length > 0 ? `📎 ${media.length} attachment(s)` : '');
    conversation.lastMessageMedia = media;
    conversation.lastMessageTime = new Date();
    conversation.lastMessageSenderId = senderId;
    
    // Increment unread count for receiver
    const receiverUnread = conversation.unreadCounts.get(receiverId.toString()) || 0;
    conversation.unreadCounts.set(receiverId.toString(), receiverUnread + 1);
    
    await conversation.save();
    
    // Format response
    const formattedMessage = {
      _id: message._id,
      text: message.text,
      media: message.media,
      type: message.type,
      status: message.status,
      senderId: message.senderId._id,
      sender: {
        _id: message.senderId._id,
        name: message.senderId.name,
        username: message.senderId.username,
        avatar: message.senderId.avatar
      },
      receiverId: message.receiverId,
      conversationId: message.conversationId,
      replyTo: message.replyTo,
      replyToMessage: message.replyToMessage,
      createdAt: message.createdAt,
      reactions: []
    };
    
    const conversationData = {
      id: conversation._id,
      _id: conversation._id,
      userId: receiverId,
      userName: receiver.name,
      userUsername: receiver.username,
      userAvatar: receiver.avatar,
      lastMessage: conversation.lastMessageText,
      lastMessageTime: conversation.lastMessageTime,
      unreadCount: receiverUnread + 1
    };
    
    res.status(201).json({
      success: true,
      message: formattedMessage,
      conversation: conversationData
    });
    
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message: ' + error.message
    });
  }
};

// ============================================
// GET MESSAGES
// ============================================
export const getMessages = async (req, res) => {
  try {
    const userId = req.user._id;
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
      conversationId,
      isDeleted: false,
      $or: [
        { deletedFor: { $ne: userId } },
        { deletedFor: { $exists: false } }
      ]
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('senderId', 'name username avatar email')
      .populate('reactions.userId', 'name username avatar')
      .populate('replyTo', 'text media senderId');
    
    // Mark messages as delivered
    await Message.updateMany(
      {
        conversationId,
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
    
    // Reset unread count
    conversation.unreadCounts.set(userId.toString(), 0);
    await conversation.save();
    
    // Format messages
    const formattedMessages = messages.reverse().map(msg => formatMessage(msg, userId));
    
    res.json({
      success: true,
      messages: formattedMessages,
      hasMore: messages.length === parseInt(limit)
    });
    
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

// ============================================
// EDIT MESSAGE
// ============================================
export const editMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { messageId } = req.params;
    const { text, chart } = req.body;
    
    const message = await Message.findOne({
      _id: messageId,
      senderId: userId
    });
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found or you cannot edit it'
      });
    }
    
    // Save edit history
    message.editHistory.push({
      text: message.text,
      media: message.media,
      editedAt: new Date()
    });
    
    // Update message
    if (text !== undefined) message.text = text.trim();
    message.isEdited = true;
    
    // Handle chart update
    if (chart && chart !== 'undefined' && chart !== 'null') {
      try {
        const chartData = typeof chart === 'string' ? JSON.parse(chart) : chart;
        const chartIndex = message.media.findIndex(m => m.type === 'chart');
        
        const chartMedia = {
          url: '/api/charts/widget',
          type: 'chart',
          mimeType: 'application/json',
          size: 0,
          chartData: {
            symbol: chartData.symbol || 'BTCUSDT',
            interval: chartData.interval || '30',
            theme: chartData.theme || 'dark',
            indicators: chartData.indicators || [],
            hideToolbar: chartData.hideToolbar || false,
            hideSideToolbar: chartData.hideSideToolbar || false
          }
        };
        
        if (chartIndex !== -1) {
          message.media[chartIndex] = chartMedia;
        } else {
          message.media.push(chartMedia);
        }
        
        message.type = 'chart';
      } catch (error) {
        console.error('Failed to parse chart data:', error);
      }
    }
    
    await message.save();
    
    // Update conversation last message text
    if (message.conversationId) {
      await Conversation.findByIdAndUpdate(message.conversationId, {
        lastMessageText: message.text || (message.media.length > 0 ? '📎 Media' : ''),
        updatedAt: new Date()
      });
    }
    
    res.json({
      success: true,
      message: {
        _id: message._id,
        text: message.text,
        media: message.media,
        isEdited: true,
        editHistory: message.editHistory,
        updatedAt: message.updatedAt
      }
    });
    
  } catch (error) {
    console.error('Error editing message:', error);
    res.status(500).json({
      success: false,
      message: 'Error editing message: ' + error.message
    });
  }
};

// ============================================
// DELETE MESSAGE
// ============================================
export const deleteMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { messageId } = req.params;
    const { deleteForEveryone = false } = req.body;
    
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    if (deleteForEveryone && message.senderId.toString() === userId.toString()) {
      // Delete for everyone (sender only)
      await deleteChatMedia(message.media);
      await Message.findByIdAndDelete(messageId);
      
      // Update conversation
      const lastMessage = await Message.findOne({
        conversationId: message.conversationId,
        isDeleted: false
      }).sort({ createdAt: -1 });
      
      if (lastMessage) {
        await Conversation.findByIdAndUpdate(message.conversationId, {
          lastMessage: lastMessage._id,
          lastMessageText: lastMessage.text || (lastMessage.media.length > 0 ? '📎 Media' : ''),
          lastMessageTime: lastMessage.createdAt,
          lastMessageSenderId: lastMessage.senderId
        });
      }
      
    } else {
      // Delete for me only
      message.deletedFor.push(userId);
      
      if (message.deletedFor.length === 2) {
        // Both users deleted, remove from DB
        await deleteChatMedia(message.media);
        await Message.findByIdAndDelete(messageId);
      } else {
        await message.save();
      }
    }
    
    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting message: ' + error.message
    });
  }
};

// ============================================
// REACT TO MESSAGE
// ============================================
export const reactToMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { messageId } = req.params;
    const { emoji } = req.body;
    
    if (!emoji) {
      return res.status(400).json({
        success: false,
        message: 'Emoji is required'
      });
    }
    
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    // Check if user already reacted with this emoji
    const existingReactionIndex = message.reactions.findIndex(
      r => r.userId.toString() === userId.toString() && r.emoji === emoji
    );
    
    if (existingReactionIndex !== -1) {
      // Remove reaction
      message.reactions.splice(existingReactionIndex, 1);
    } else {
      // Remove any existing reaction from this user (to replace)
      message.reactions = message.reactions.filter(
        r => r.userId.toString() !== userId.toString()
      );
      // Add new reaction
      message.reactions.push({
        userId,
        emoji,
        createdAt: new Date()
      });
    }
    
    await message.save();
    
    // Populate user info
    await message.populate('reactions.userId', 'name username avatar');
    
    res.json({
      success: true,
      reactions: message.reactions.map(r => ({
        emoji: r.emoji,
        userId: r.userId._id,
        userName: r.userId.name,
        userAvatar: r.userId.avatar
      }))
    });
    
  } catch (error) {
    console.error('Error reacting to message:', error);
    res.status(500).json({
      success: false,
      message: 'Error reacting to message: ' + error.message
    });
  }
};

// ============================================
// FORWARD MESSAGE
// ============================================
export const forwardMessage = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { messageId, targetUserId } = req.body;
    
    const originalMessage = await Message.findById(messageId)
      .populate('senderId', 'name username');
    
    if (!originalMessage) {
      return res.status(404).json({
        success: false,
        message: 'Original message not found'
      });
    }
    
    // Check if target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Target user not found'
      });
    }
    
    // Get or create conversation
    const conversation = await Conversation.findOrCreate(senderId, targetUserId);
    
    // Create forwarded message
    const forwardedMessage = new Message({
      senderId,
      receiverId: targetUserId,
      conversationId: conversation._id,
      text: originalMessage.text,
      media: originalMessage.media.map(m => ({ ...m })), // Clone media
      type: originalMessage.type,
      status: 'sent',
      isForwarded: true,
      forwardedFrom: messageId
    });
    
    await forwardedMessage.save();
    await forwardedMessage.populate('senderId', 'name username avatar');
    
    // Update conversation
    conversation.lastMessage = forwardedMessage._id;
    conversation.lastMessageText = forwardedMessage.text || (forwardedMessage.media.length > 0 ? `📎 Forwarded ${forwardedMessage.media.length} attachment(s)` : '');
    conversation.lastMessageMedia = forwardedMessage.media;
    conversation.lastMessageTime = new Date();
    conversation.lastMessageSenderId = senderId;
    
    const receiverUnread = conversation.unreadCounts.get(targetUserId.toString()) || 0;
    conversation.unreadCounts.set(targetUserId.toString(), receiverUnread + 1);
    await conversation.save();
    
    res.json({
      success: true,
      message: {
        _id: forwardedMessage._id,
        text: forwardedMessage.text,
        media: forwardedMessage.media,
        type: forwardedMessage.type,
        isForwarded: true,
        sender: forwardedMessage.senderId,
        createdAt: forwardedMessage.createdAt
      },
      conversation: {
        id: conversation._id,
        userId: targetUserId,
        userName: targetUser.name,
        userAvatar: targetUser.avatar
      }
    });
    
  } catch (error) {
    console.error('Error forwarding message:', error);
    res.status(500).json({
      success: false,
      message: 'Error forwarding message: ' + error.message
    });
  }
};

// ============================================
// MARK MESSAGES AS READ
// ============================================
export const markMessagesAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;
    
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
    
    await Message.updateMany(
      {
        conversationId,
        receiverId: userId,
        status: { $in: ['sent', 'delivered'] }
      },
      {
        $set: {
          status: 'read',
          readAt: new Date()
        }
      }
    );
    
    conversation.unreadCounts.set(userId.toString(), 0);
    await conversation.save();
    
    res.json({
      success: true,
      message: 'Messages marked as read'
    });
    
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

// ============================================
// GET CONVERSATIONS
// ============================================
export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const conversations = await Conversation.find({
      participants: userId,
      isActive: true
    })
      .populate('participants', 'name username avatar email isOnline lastSeen')
      .sort({ lastMessageTime: -1, updatedAt: -1 });
    
    const formattedConversations = await Promise.all(conversations.map(async (conv) => {
      const otherParticipant = conv.participants.find(
        p => p._id.toString() !== userId.toString()
      );
      
      if (!otherParticipant) return null;
      
      const unreadCount = conv.unreadCounts?.get(userId.toString()) || 0;
      
      // Get last message
      let lastMessageData = null;
      if (conv.lastMessage) {
        const lastMsg = await Message.findById(conv.lastMessage);
        if (lastMsg && !lastMsg.deletedFor?.includes(userId)) {
          lastMessageData = {
            text: lastMsg.text,
            media: lastMsg.media,
            type: lastMsg.type,
            createdAt: lastMsg.createdAt
          };
        }
      }
      
      return {
        id: conv._id.toString(),
        _id: conv._id.toString(),
        userId: otherParticipant._id.toString(),
        userName: otherParticipant.name || otherParticipant.username || 'User',
        userAvatar: otherParticipant.avatar,
        userUsername: otherParticipant.username || '',
        isOnline: otherParticipant.isOnline || false,
        lastMessage: conv.lastMessageText || lastMessageData?.text || '',
        lastMessageMedia: conv.lastMessageMedia || lastMessageData?.media || [],
        lastMessageType: lastMessageData?.type || 'text',
        lastMessageTime: conv.lastMessageTime || conv.updatedAt,
        unreadCount,
        updatedAt: conv.updatedAt
      };
    }));
    
    const validConversations = formattedConversations.filter(c => c !== null);
    
    res.json({
      success: true,
      conversations: validConversations
    });
    
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

// ============================================
// GET OR CREATE CONVERSATION
// ============================================
export const getOrCreateConversation = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { userId: otherUserId } = req.params;
    
    if (currentUserId.toString() === otherUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot chat with yourself'
      });
    }
    
    const otherUser = await User.findById(otherUserId).select('name username avatar email isOnline lastSeen');
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const isFollowing = await Follow.findOne({
      follower: currentUserId,
      following: otherUserId
    });
    
    const conversation = await Conversation.findOrCreate(currentUserId, otherUserId);
    
    res.json({
      success: true,
      conversation: {
        id: conversation._id.toString(),
        _id: conversation._id.toString(),
        userId: otherUser._id.toString(),
        userName: otherUser.name || otherUser.username || 'User',
        userAvatar: otherUser.avatar,
        userUsername: otherUser.username || '',
        isOnline: otherUser.isOnline || false,
        isFollowing: !!isFollowing,
        lastMessage: conversation.lastMessageText || '',
        lastMessageTime: conversation.lastMessageTime,
        unreadCount: 0
      }
    });
    
  } catch (error) {
    console.error('Error getting conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

// ============================================
// SEARCH USERS FOR CHAT
// ============================================
export const searchUsersForChat = async (req, res) => {
  try {
    const userId = req.user._id;
    const { q } = req.query;
    
    let searchQuery = { _id: { $ne: userId } };
    
    if (q && q.length >= 2) {
      searchQuery.$or = [
        { name: { $regex: q, $options: 'i' } },
        { username: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ];
    }
    
    const users = await User.find(searchQuery)
      .select('name username avatar email isOnline lastSeen')
      .limit(20)
      .lean();
    
    const followingStatus = await Follow.find({
      follower: userId,
      following: { $in: users.map(u => u._id) }
    }).lean();
    
    const followingMap = {};
    followingStatus.forEach(f => {
      followingMap[f.following.toString()] = true;
    });
    
    const formattedUsers = users.map(user => ({
      id: user._id.toString(),
      _id: user._id.toString(),
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      email: user.email,
      isOnline: user.isOnline || false,
      lastSeen: user.lastSeen,
      isFollowing: followingMap[user._id.toString()] || false
    }));
    
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
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

// ============================================
// GET UNREAD COUNTS
// ============================================
export const getUnreadCounts = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const conversations = await Conversation.find({
      participants: userId,
      isActive: true
    });
    
    const unreadCounts = {};
    let total = 0;
    
    conversations.forEach(conv => {
      const count = conv.unreadCounts?.get(userId.toString()) || 0;
      unreadCounts[conv._id.toString()] = count;
      total += count;
    });
    
    res.json({
      success: true,
      unreadCounts,
      total
    });
    
  } catch (error) {
    console.error('Error getting unread counts:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

// ============================================
// HELPER: Format message
// ============================================
function formatMessage(message, currentUserId) {
  const msgObj = message.toObject ? message.toObject() : message;
  
  return {
    _id: msgObj._id.toString(),
    text: msgObj.text,
    media: msgObj.media || [],
    type: msgObj.type,
    status: msgObj.status,
    senderId: msgObj.senderId?._id?.toString() || msgObj.senderId?.toString(),
    sender: msgObj.senderId ? {
      _id: msgObj.senderId._id?.toString(),
      name: msgObj.senderId.name,
      username: msgObj.senderId.username,
      avatar: msgObj.senderId.avatar
    } : null,
    receiverId: msgObj.receiverId?.toString(),
    conversationId: msgObj.conversationId?.toString(),
    reactions: (msgObj.reactions || []).map(r => ({
      emoji: r.emoji,
      userId: r.userId?._id?.toString() || r.userId?.toString(),
      userName: r.userId?.name,
      userAvatar: r.userId?.avatar
    })),
    replyTo: msgObj.replyTo?.toString(),
    replyToMessage: msgObj.replyToMessage,
    isForwarded: msgObj.isForwarded || false,
    isEdited: msgObj.isEdited || false,
    isDeleted: msgObj.isDeleted || false,
    createdAt: msgObj.createdAt,
    updatedAt: msgObj.updatedAt
  };
}