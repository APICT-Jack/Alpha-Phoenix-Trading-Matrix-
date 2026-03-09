// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // User reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Notification type (maps to your tabs)
  type: {
    type: String,
    required: true,
    enum: ['signal', 'chat', 'community', 'event', 'study', 'bank'],
    index: true
  },
  
  // Notification content
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  
  // Status and metadata
  unread: {
    type: Boolean,
    default: true,
    index: true
  },
  
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Additional data for different notification types
  metadata: {
    // For signal notifications
    signalData: {
      symbol: String,
      action: {
        type: String,
        enum: ['buy', 'sell', 'hold', 'take_profit', 'stop_loss']
      },
      timeframe: String,
      price: Number,
      rsi: Number,
      confidence: Number
    },
    
    // For chat notifications
    chatData: {
      roomId: mongoose.Schema.Types.ObjectId,
      roomName: String,
      senderId: mongoose.Schema.Types.ObjectId,
      senderName: String,
      messageId: mongoose.Schema.Types.ObjectId
    },
    
    // For community notifications
    communityData: {
      postId: mongoose.Schema.Types.ObjectId,
      postTitle: String,
      commentId: mongoose.Schema.Types.ObjectId,
      action: {
        type: String,
        enum: ['comment', 'like', 'reply', 'mention', 'follow']
      },
      actorId: mongoose.Schema.Types.ObjectId,
      actorName: String
    },
    
    // For event notifications
    eventData: {
      eventId: mongoose.Schema.Types.ObjectId,
      eventTitle: String,
      startTime: Date,
      duration: Number,
      hostId: mongoose.Schema.Types.ObjectId,
      hostName: String,
      joinLink: String
    },
    
    // For study notifications
    studyData: {
      courseId: mongoose.Schema.Types.ObjectId,
      courseTitle: String,
      lessonId: mongoose.Schema.Types.ObjectId,
      lessonTitle: String,
      action: {
        type: String,
        enum: ['new_lesson', 'completion', 'reminder', 'achievement']
      }
    },
    
    // For bank notifications
    bankData: {
      transactionId: mongoose.Schema.Types.ObjectId,
      amount: Number,
      currency: {
        type: String,
        default: 'USD'
      },
      action: {
        type: String,
        enum: ['deposit', 'withdrawal', 'transfer', 'fee', 'bonus']
      },
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'cancelled']
      },
      balance: Number
    }
  },
  
  // Action links
  actionUrl: {
    type: String,
    trim: true
  },
  
  // Expiration for time-sensitive notifications
  expiresAt: {
    type: Date,
    index: { expireAfterSeconds: 0 }
  },
  
  // Read/Dismiss tracking
  readAt: {
    type: Date
  },
  
  dismissed: {
    type: Boolean,
    default: false
  },
  
  dismissedAt: {
    type: Date
  }
  
}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for efficient queries
notificationSchema.index({ userId: 1, type: 1, unread: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, unread: 1, createdAt: -1 });

// Virtual for formatted time (like "5 min ago")
notificationSchema.virtual('time').get(function() {
  const now = new Date();
  const diffMs = now - this.createdAt;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return this.createdAt.toLocaleDateString();
});

// Static method to get notification counts by type
notificationSchema.statics.getNotificationCounts = async function(userId) {
  const counts = await this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        unread: true,
        dismissed: false
      }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 }
      }
    }
  ]);
  
  // Convert to object format
  return counts.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});
};

// Instance method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.unread = false;
  this.readAt = new Date();
  return this.save();
};

// Instance method to dismiss
notificationSchema.methods.dismiss = function() {
  this.dismissed = true;
  this.dismissedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Notification', notificationSchema);