// models/Post.js - COMPLETE FIXED VERSION WITH CORRECT SCHEMA ORDER
import mongoose from 'mongoose';

// ============================================
// REPLY SCHEMA (must be defined first)
// ============================================
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

// ============================================
// COMMENT SCHEMA (depends on replySchema)
// ============================================
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
  replies: [replySchema], // Now replySchema is defined
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// ============================================
// REPOST SCHEMA
// ============================================
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

// ============================================
// MEDIA SCHEMA (with chart support)
// ============================================
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
  dimensions: {
    width: Number,
    height: Number
  },
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

// ============================================
// MAIN POST SCHEMA
// ============================================
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
  comments: [commentSchema], // Now commentSchema is defined
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
      type: [Number],
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

// ============================================
// INDEXES
// ============================================
postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ mentions: 1 });
postSchema.index({ 'location.coordinates': '2dsphere' });
postSchema.index({ repostOf: 1 });
postSchema.index({ scheduledFor: 1 }, { sparse: true });
postSchema.index({ 'media.type': 1, 'media.chartData.symbol': 1 });

// ============================================
// VIRTUALS
// ============================================
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

// Virtual for chart media only
postSchema.virtual('charts').get(function() {
  return this.media?.filter(item => item.type === 'chart') || [];
});

// ============================================
// METHODS
// ============================================
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

// Method to add chart to post
postSchema.methods.addChart = function(chartData) {
  if (!this.media) {
    this.media = [];
  }
  
  this.media.push({
    url: '/api/charts/widget',
    type: 'chart',
    mimeType: 'application/json',
    chartData: {
      symbol: chartData.symbol || 'BTCUSDT',
      interval: chartData.interval || '30',
      theme: chartData.theme || 'dark',
      indicators: chartData.indicators || [],
      height: chartData.height || 300,
      width: chartData.width || '100%',
      hideToolbar: chartData.hideToolbar || false,
      hideSideToolbar: chartData.hideSideToolbar || false
    }
  });
  
  return this.save();
};

// Method to get chart data
postSchema.methods.getChartData = function() {
  const chartMedia = this.media?.find(item => item.type === 'chart');
  return chartMedia?.chartData || null;
};

// ============================================
// PRE-SAVE MIDDLEWARE
// ============================================
postSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    this.extractHashtags();
  }
  
  if (this.isModified('media') && this.media) {
    this.media.forEach(item => {
      if (!item.type || !item.url) {
        throw new Error('Media must have type and url');
      }
      
      if (item.type === 'chart' && item.chartData) {
        if (!item.chartData.symbol) {
          throw new Error('Chart must have a symbol');
        }
      }
    });
  }
  
  next();
});

// ============================================
// PRE-UPDATE MIDDLEWARE
// ============================================
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

// Query middleware for debugging
postSchema.pre('find', function() {
  console.log('🔍 Post find query:', this.getQuery());
});

postSchema.pre('findOne', function() {
  console.log('🔍 Post findOne query:', this.getQuery());
});

// ============================================
// STATIC METHODS
// ============================================
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
  .populate('pollId')
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

// Static method to get posts with charts
postSchema.statics.getChartPosts = async function(symbol = null, limit = 20, skip = 0) {
  const query = {
    'media.type': 'chart',
    isPublished: true,
    isScheduled: false
  };
  
  if (symbol) {
    query['media.chartData.symbol'] = symbol;
  }
  
  return this.find(query)
    .populate('userId', 'name username avatar isVerified')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get trending chart symbols
postSchema.statics.getTrendingChartSymbols = async function(limit = 10) {
  return this.aggregate([
    { $match: { 'media.type': 'chart', isPublished: true } },
    { $unwind: '$media' },
    { $match: { 'media.type': 'chart' } },
    { $group: { 
      _id: '$media.chartData.symbol', 
      count: { $sum: 1 },
      posts: { $addToSet: '$_id' }
    }},
    { $sort: { count: -1 } },
    { $limit: limit },
    { $project: {
      symbol: '$_id',
      count: 1,
      postCount: { $size: '$posts' }
    }}
  ]);
};

// ============================================
// EXPORT
// ============================================
export default mongoose.model('Post', postSchema);