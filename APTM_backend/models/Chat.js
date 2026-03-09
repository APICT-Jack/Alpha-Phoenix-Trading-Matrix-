// models/Chat.js
import mongoose from 'mongoose';

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
  text: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text'
  },
  status: {
    type: String,
    enum: ['sending', 'sent', 'delivered', 'read'],
    default: 'sending'
  },
  readAt: Date,
  deliveredAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for better performance (NO UNIQUE CONSTRAINTS)
messageSchema.index({ senderId: 1, receiverId: 1 });
messageSchema.index({ createdAt: -1 });

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
  lastMessageTime: {
    type: Date,
    default: Date.now
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

// Create indexes for better performance (NO UNIQUE CONSTRAINTS)
conversationSchema.index({ participants: 1 });
conversationSchema.index({ updatedAt: -1 });
conversationSchema.index({ lastMessageTime: -1 });
conversationSchema.index({ isActive: 1, updatedAt: -1 });

// Pre-save middleware to ensure participants are sorted
conversationSchema.pre('save', function(next) {
  if (this.participants && this.participants.length === 2) {
    // Sort participants to ensure consistent order
    this.participants.sort((a, b) => {
      return a.toString().localeCompare(b.toString());
    });
  }
  this.updatedAt = Date.now();
  next();
});

// Static method to find or create a conversation
conversationSchema.statics.findOrCreate = async function(userId1, userId2) {
  const participants = [userId1, userId2].sort((a, b) => 
    a.toString().localeCompare(b.toString())
  );

  // First try to find existing conversation
  let conversation = await this.findOne({
    participants: { $all: participants },
    isActive: true
  });

  // If not found, create a new one
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
      
      // Try to find one more time (race condition)
      conversation = await this.findOne({
        participants: { $all: participants },
        isActive: true
      });
      
      if (!conversation) {
        throw error;
      }
    }
  } else {
    console.log('Found existing conversation:', conversation._id);
  }

  return conversation;
};

// Create the model
const Conversation = mongoose.model('Conversation', conversationSchema);
const Message = mongoose.model('Message', messageSchema);

export { Conversation, Message };