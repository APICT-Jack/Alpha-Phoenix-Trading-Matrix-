// models/Post.js - COMPLETE VERSION WITH CLOUDINARY SUPPORT
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
  parentReplyUsername: String,
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
// MEDIA SCHEMA (with Cloudinary and chart support)
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
  },
  // Analytics fields
  analytics: {
    impressions: {
      type: Number,
      default: 0
    },
    uniqueViews: {
      type: Number,
      default: 0
    },
    engagementRate: {
      type: Number,
      default: 0
    },
    lastViewedAt: Date
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
postSchema.index({ 'media.publicId': 1 }, { sparse: true });
postSchema.index({ 'analytics.impressions': -1 });

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

postSchema.virtual('charts').get(function() {
  return this.media?.filter(item => item.type === 'chart') || [];
});

postSchema.virtual('images').get(function() {
  return this.media?.filter(item => item.type === 'image') || [];
});

postSchema.virtual('videos').get(function() {
  return this.media?.filter(item => item.type === 'video') || [];
});

postSchema.virtual('documents').get(function() {
  return this.media?.filter(item => item.type === 'document') || [];
});

postSchema.virtual('cloudinaryMedia').get(function() {
  return this.media?.filter(item => item.publicId) || [];
});

// ============================================
// METHODS
// ============================================

// Check if user liked the post
postSchema.methods.isLikedByUser = function(userId) {
  if (!userId) return false;
  return this.likes?.some(id => id?.toString() === userId.toString());
};

// Check if user reposted the post
postSchema.methods.isRepostedByUser = function(userId) {
  if (!userId) return false;
  return this.reposts?.some(repost => 
    repost.userId?.toString() === userId.toString()
  );
};

// Add repost
postSchema.methods.addRepost = function(userId, content = '') {
  this.reposts.push({
    userId,
    content,
    originalPostId: this._id
  });
  return this.save();
};

// Remove repost
postSchema.methods.removeRepost = function(userId) {
  this.reposts = this.reposts.filter(
    repost => repost.userId?.toString() !== userId.toString()
  );
  return this.save();
};

// Extract hashtags from content
postSchema.methods.extractHashtags = function() {
  const hashtagRegex = /#(\w+)/g;
  const matches = this.content?.match(hashtagRegex) || [];
  this.hashtags = matches.map(tag => tag.slice(1).toLowerCase());
  return this.hashtags;
};

// Extract mentions from content
postSchema.methods.extractMentions = function() {
  const mentionRegex = /@(\w+)/g;
  const matches = this.content?.match(mentionRegex) || [];
  return matches.map(mention => mention.slice(1));
};

// Add chart to post
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

// Get chart data
postSchema.methods.getChartData = function() {
  const chartMedia = this.media?.find(item => item.type === 'chart');
  return chartMedia?.chartData || null;
};

// Increment impression count
postSchema.methods.incrementImpression = async function(userId = null) {
  this.analytics.impressions += 1;
  if (userId && !this.analytics.uniqueViewers?.includes(userId)) {
    if (!this.analytics.uniqueViewers) this.analytics.uniqueViewers = [];
    this.analytics.uniqueViewers.push(userId);
    this.analytics.uniqueViews = this.analytics.uniqueViewers.length;
  }
  this.analytics.lastViewedAt = new Date();
  this.analytics.engagementRate = this.calculateEngagementRate();
  return this.save();
};

// Calculate engagement rate
postSchema.methods.calculateEngagementRate = function() {
  const totalInteractions = this.likeCount + this.commentCount + this.repostCount;
  if (this.analytics.impressions === 0) return 0;
  return (totalInteractions / this.analytics.impressions) * 100;
};

// Get all Cloudinary public IDs for media deletion
postSchema.methods.getCloudinaryPublicIds = function() {
  const publicIds = [];
  
  this.media?.forEach(media => {
    if (media.publicId) {
      publicIds.push({
        publicId: media.publicId,
        type: media.type,
        url: media.url
      });
    }
  });
  
  return publicIds;
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
      
      // Validate Cloudinary URLs
      if (item.url && item.url.includes('cloudinary')) {
        if (!item.publicId) {
          // Extract publicId from Cloudinary URL if not provided
          const urlParts = item.url.split('/');
          const uploadIndex = urlParts.indexOf('upload');
          if (uploadIndex !== -1) {
            const relevantParts = urlParts.slice(uploadIndex + 2);
            const publicIdWithExt = relevantParts.join('/');
            item.publicId = publicIdWithExt.replace(/\.[^/.]+$/, '');
          }
        }
      }
    });
  }
  
  // Update analytics engagement rate
  if (this.isModified('likes') || this.isModified('comments') || this.isModified('reposts')) {
    this.analytics.engagementRate = this.calculateEngagementRate();
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

// ============================================
// STATIC METHODS
// ============================================

// Get feed for user
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
  .populate('mentions', 'name username avatar')
  .populate({
    path: 'repostOf',
    populate: { path: 'userId', select: 'name username avatar isVerified' }
  })
  .populate('pollId')
  .sort({ createdAt: -1 })
  .limit(limit)
  .skip(skip);
};

// Get trending hashtags
postSchema.statics.getTrendingHashtags = async function(limit = 10) {
  return this.aggregate([
    { $match: { hashtags: { $exists: true, $ne: [] } } },
    { $unwind: '$hashtags' },
    { $group: { _id: '$hashtags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit }
  ]);
};

// Get posts with charts
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

// Get trending chart symbols
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

// Get posts by media type
postSchema.statics.getPostsByMediaType = async function(mediaType, limit = 20, skip = 0) {
  return this.find({
    'media.type': mediaType,
    isPublished: true,
    isScheduled: false
  })
  .populate('userId', 'name username avatar isVerified')
  .sort({ createdAt: -1 })
  .limit(limit)
  .skip(skip);
};

// Get user's media posts
postSchema.statics.getUserMediaPosts = async function(userId, mediaType = null, limit = 20, skip = 0) {
  const query = {
    userId,
    isPublished: true,
    isScheduled: false,
    media: { $exists: true, $ne: [] }
  };
  
  if (mediaType) {
    query['media.type'] = mediaType;
  }
  
  return this.find(query)
    .populate('userId', 'name username avatar isVerified')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Get trending posts by engagement
postSchema.statics.getTrendingPosts = async function(limit = 10, timeWindow = '24h') {
  let dateFilter = {};
  const now = new Date();
  
  switch(timeWindow) {
    case '24h':
      dateFilter = { createdAt: { $gte: new Date(now - 24 * 60 * 60 * 1000) } };
      break;
    case '7d':
      dateFilter = { createdAt: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } };
      break;
    case '30d':
      dateFilter = { createdAt: { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) } };
      break;
  }
  
  return this.aggregate([
    { $match: { ...dateFilter, isPublished: true, isScheduled: false } },
    { $addFields: {
      engagementScore: {
        $add: [
          { $multiply: [{ $size: '$likes' }, 1] },
          { $multiply: [{ $size: '$comments' }, 2] },
          { $multiply: [{ $size: '$reposts' }, 3] },
          { $multiply: ['$shares', 4] }
        ]
      }
    }},
    { $sort: { engagementScore: -1 } },
    { $limit: limit },
    { $lookup: {
      from: 'users',
      localField: 'userId',
      foreignField: '_id',
      as: 'userId'
    }},
    { $unwind: '$userId' },
    { $project: {
      'userId.password': 0
    }}
  ]);
};

// Get analytics summary for user
postSchema.statics.getUserAnalytics = async function(userId) {
  return this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), isPublished: true } },
    { $group: {
      _id: null,
      totalPosts: { $sum: 1 },
      totalLikes: { $sum: { $size: '$likes' } },
      totalComments: { $sum: { $size: '$comments' } },
      totalReposts: { $sum: { $size: '$reposts' } },
      totalShares: { $sum: '$shares' },
      totalImpressions: { $sum: '$analytics.impressions' },
      totalUniqueViews: { $sum: '$analytics.uniqueViews' },
      avgEngagementRate: { $avg: '$analytics.engagementRate' }
    }},
    { $project: {
      totalPosts: 1,
      totalLikes: 1,
      totalComments: 1,
      totalReposts: 1,
      totalShares: 1,
      totalImpressions: 1,
      totalUniqueViews: 1,
      avgEngagementRate: { $round: ['$avgEngagementRate', 2] }
    }}
  ]);
};

// ============================================
// EXPORT
// ============================================
export default mongoose.model('Post', postSchema);