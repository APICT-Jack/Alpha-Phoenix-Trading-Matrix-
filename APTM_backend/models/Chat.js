// models/Chat.js - UPDATED with media support
import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['image', 'video', 'document', 'gif', 'chart'],
    required: true
  },
  thumbnail: String,
  duration: Number,
  size: Number,
  mimeType: String,
  publicId: {
    type: String,
    sparse: true,
    index: true
  },
  dimensions: {
    width: Number,
    height: Number
  },
  format: String,
  // Chart-specific fields
  chartData: {
    symbol: {
      type: String,
      default: 'BTCUSDT'
    },
    interval: {
      type: String,
      default: '30'
    },
    theme: {
      type: String,
      enum: ['dark', 'light'],
      default: 'dark'
    },
    indicators: [String],
    height: {
      type: Number,
      default: 300
    },
    width: {
      type: String,
      default: '100%'
    },
    hideToolbar: {
      type: Boolean,
      default: false
    },
    hideSideToolbar: {
      type: Boolean,
      default: false
    }
  }
});

const reactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  emoji: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  text: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  media: [mediaSchema],
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'file', 'chart', 'mixed'],
    default: 'text'
  },
  status: {
    type: String,
    enum: ['sending', 'sent', 'delivered', 'read', 'failed'],
    default: 'sending'
  },
  reactions: [reactionSchema],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  replyToMessage: {
    text: String,
    senderId: mongoose.Schema.Types.ObjectId,
    senderName: String,
    media: [mediaSchema]
  },
  isForwarded: {
    type: Boolean,
    default: false
  },
  forwardedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editHistory: [{
    text: String,
    media: [mediaSchema],
    editedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  readAt: Date,
  deliveredAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, receiverId: 1 });
messageSchema.index({ status: 1 });
messageSchema.index({ 'media.type': 1 });
messageSchema.index({ replyTo: 1 });

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastMessageText: String,
  lastMessageMedia: [mediaSchema],
  lastMessageTime: {
    type: Date,
    default: Date.now
  },
  lastMessageSenderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  unreadCounts: {
    type: Map,
    of: Number,
    default: new Map()
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
conversationSchema.index({ participants: 1 });
conversationSchema.index({ updatedAt: -1 });
conversationSchema.index({ lastMessageTime: -1 });

// Pre-save middleware
conversationSchema.pre('save', function(next) {
  if (this.participants && this.participants.length === 2) {
    this.participants.sort((a, b) => {
      return a.toString().localeCompare(b.toString());
    });
  }
  this.updatedAt = Date.now();
  next();
});

// Static method to find or create conversation
conversationSchema.statics.findOrCreate = async function(userId1, userId2) {
  const participants = [userId1, userId2].sort((a, b) => 
    a.toString().localeCompare(b.toString())
  );

  let conversation = await this.findOne({
    participants: { $all: participants },
    isActive: true
  });

  if (!conversation) {
    console.log('Creating new conversation between:', participants);
    
    conversation = new this({
      participants,
      unreadCounts: new Map([
        [userId1.toString(), 0],
        [userId2.toString(), 0]
      ])
    });
    
    try {
      await conversation.save();
      console.log('Conversation created successfully:', conversation._id);
    } catch (error) {
      console.log('Save failed, trying to find again...', error.message);
      conversation = await this.findOne({
        participants: { $all: participants },
        isActive: true
      });
      
      if (!conversation) {
        throw error;
      }
    }
  }

  return conversation;
};

const Conversation = mongoose.model('Conversation', conversationSchema);
const Message = mongoose.model('Message', messageSchema);

export { Conversation, Message };