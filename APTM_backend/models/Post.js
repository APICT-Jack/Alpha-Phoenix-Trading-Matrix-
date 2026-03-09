// models/Post.js
import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['image', 'video', 'document', 'gif'],
    required: true
  },
  thumbnail: String, // For video thumbnails
  duration: Number, // For videos
  size: Number, // File size in bytes
  mimeType: String,
  dimensions: {
    width: Number,
    height: Number
  }
});

// In models/Post.js - Update replySchema
const replySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  parentReplyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reply'
  },
  parentReplyUsername: String, // Store parent username for display
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const commentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  replies: [replySchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const repostSchema = new mongoose.Schema({
  originalPostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    trim: true,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  content: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  media: [mediaSchema],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [commentSchema],
  reposts: [repostSchema],
  shares: {
    type: Number,
    default: 0
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'followers_only', 'mentioned_only'],
    default: 'public'
  },
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  hashtags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
   pollId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Poll'
  },
  location: {
    name: String,
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    },
    placeId: String
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editHistory: [{
    content: String,
    media: [mediaSchema],
    editedAt: {
      type: Date,
      default: Date.now
    }
  }],
  repostOf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  pinnedAt: Date,
  pollId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Poll'
  },
  scheduledFor: Date,
  isScheduled: {
    type: Boolean,
    default: false
  },
  isPublished: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ mentions: 1 });
postSchema.index({ 'location.coordinates': '2dsphere' });
postSchema.index({ repostOf: 1 });
postSchema.index({ scheduledFor: 1 }, { sparse: true });

// Virtuals
postSchema.virtual('likeCount').get(function() {
  return this.likes?.length || 0;
});

postSchema.virtual('commentCount').get(function() {
  return this.comments?.length || 0;
});

postSchema.virtual('repostCount').get(function() {
  return this.reposts?.length || 0;
});

postSchema.virtual('totalInteractionCount').get(function() {
  return (this.likes?.length || 0) + 
         (this.comments?.length || 0) + 
         (this.reposts?.length || 0) + 
         (this.shares || 0);
});

// Methods
postSchema.methods.isLikedByUser = function(userId) {
  return this.likes?.some(id => id.toString() === userId.toString());
};

postSchema.methods.isRepostedByUser = function(userId) {
  return this.reposts?.some(repost => 
    repost.userId.toString() === userId.toString()
  );
};

postSchema.methods.addRepost = function(userId, content = '') {
  this.reposts.push({
    userId,
    content,
    originalPostId: this._id
  });
  return this.save();
};

postSchema.methods.removeRepost = function(userId) {
  this.reposts = this.reposts.filter(
    repost => repost.userId.toString() !== userId.toString()
  );
  return this.save();
};

postSchema.methods.extractHashtags = function() {
  const hashtagRegex = /#(\w+)/g;
  const matches = this.content?.match(hashtagRegex) || [];
  this.hashtags = matches.map(tag => tag.slice(1).toLowerCase());
  return this.hashtags;
};

postSchema.methods.extractMentions = function() {
  const mentionRegex = /@(\w+)/g;
  const matches = this.content?.match(mentionRegex) || [];
  return matches.map(mention => mention.slice(1));
};

// Pre-save middleware
postSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    this.extractHashtags();
  }
  
  if (this.isModified('media') && this.media) {
    // Ensure each media item has required fields
    this.media.forEach(item => {
      if (!item.type || !item.url) {
        throw new Error('Media must have type and url');
      }
    });
  }
  
  next();
});

// Pre-update middleware
postSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  if (update.content || (update.$set && update.$set.content)) {
    const content = update.content || update.$set.content;
    const hashtagRegex = /#(\w+)/g;
    const hashtags = (content.match(hashtagRegex) || [])
      .map(tag => tag.slice(1).toLowerCase());
    
    if (update.$set) {
      update.$set.hashtags = hashtags;
    } else {
      update.hashtags = hashtags;
    }
  }
  next();
});
// In models/Post.js - Check for any middleware that might filter
postSchema.pre('find', function() {
  console.log('🔍 Post find query:', this.getQuery());
});

postSchema.pre('findOne', function() {
  console.log('🔍 Post findOne query:', this.getQuery());
});
// Static methods
postSchema.statics.getFeedForUser = async function(userId, followingIds = [], limit = 20, skip = 0) {
  return this.find({
    $and: [
      { isPublished: true },
      { isScheduled: false },
      {
        $or: [
          { userId: { $in: [userId, ...followingIds] } },
          { visibility: 'public' },
          {
            $and: [
              { visibility: 'followers_only' },
              { userId: { $in: followingIds } }
            ]
          },
          {
            $and: [
              { visibility: 'mentioned_only' },
              { mentions: userId }
            ]
          }
        ]
      }
    ]
  })
  .populate('userId', 'name username avatar isVerified')
  .populate('mentions', 'name username')
  .populate('repostOf')
  .sort({ createdAt: -1 })
  .limit(limit)
  .skip(skip);
};

postSchema.statics.getTrendingHashtags = async function(limit = 10) {
  return this.aggregate([
    { $match: { hashtags: { $exists: true, $ne: [] } } },
    { $unwind: '$hashtags' },
    { $group: { _id: '$hashtags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit }
  ]);
};

export default mongoose.model('Post', postSchema);