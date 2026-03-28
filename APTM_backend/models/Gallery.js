// models/Gallery.js - COMPLETE CLOUDINARY VERSION
import mongoose from 'mongoose';

// ============================================
// GALLERY ITEM SCHEMA (with Cloudinary support)
// ============================================
const galleryItemSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  // Cloudinary-specific fields
  publicId: {
    type: String,
    sparse: true,
    index: true
  },
  cloudinaryUrl: {
    type: String,
    sparse: true
  },
  // Media metadata
  width: {
    type: Number,
    default: null
  },
  height: {
    type: Number,
    default: null
  },
  format: {
    type: String,
    default: null
  },
  duration: {
    type: Number,
    default: null
  },
  thumbnail: {
    type: String,
    default: null
  },
  // Item description and tags
  description: {
    type: String,
    default: ''
  },
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  // Access control
  visibility: {
    type: String,
    enum: ['public', 'private', 'followers_only'],
    default: 'private'
  },
  // Engagement
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
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
  }],
  // Upload metadata
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  lastViewedAt: Date,
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// ============================================
// GALLERY FOLDER SCHEMA
// ============================================
const galleryFolderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  items: [galleryItemSchema],
  coverImage: {
    type: String,
    default: null
  },
  coverImagePublicId: {
    type: String,
    default: null
  },
  itemCount: {
    type: Number,
    default: 0
  },
  totalSize: {
    type: Number,
    default: 0
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'followers_only'],
    default: 'private'
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

// ============================================
// MAIN GALLERY SCHEMA
// ============================================
const gallerySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  folders: [galleryFolderSchema],
  // Gallery-level settings
  settings: {
    defaultVisibility: {
      type: String,
      enum: ['public', 'private', 'followers_only'],
      default: 'private'
    },
    allowComments: {
      type: Boolean,
      default: true
    },
    allowDownloads: {
      type: Boolean,
      default: false
    },
    autoTagging: {
      type: Boolean,
      default: true
    },
    maxFileSize: {
      type: Number,
      default: 50 * 1024 * 1024 // 50MB
    },
    allowedFileTypes: [{
      type: String,
      enum: ['image', 'video', 'document']
    }],
    notifyOnUpload: {
      type: Boolean,
      default: false
    }
  },
  // Gallery statistics
  stats: {
    totalItems: {
      type: Number,
      default: 0
    },
    totalSize: {
      type: Number,
      default: 0
    },
    totalViews: {
      type: Number,
      default: 0
    },
    totalLikes: {
      type: Number,
      default: 0
    },
    lastUploadAt: Date
  }
}, {
  timestamps: true
});

// ============================================
// INDEXES
// ============================================
gallerySchema.index({ userId: 1 });
gallerySchema.index({ 'folders.items.publicId': 1 }, { sparse: true });
gallerySchema.index({ 'folders.items.tags': 1 });
gallerySchema.index({ 'folders.items.uploadedAt': -1 });
gallerySchema.index({ 'stats.totalItems': -1 });

// ============================================
// VIRTUALS
// ============================================

// Get all public items across all folders
gallerySchema.virtual('publicItems').get(function() {
  const publicItems = [];
  this.folders.forEach(folder => {
    folder.items.forEach(item => {
      if (item.visibility === 'public') {
        publicItems.push({
          ...item.toObject(),
          folderName: folder.name,
          folderId: folder._id
        });
      }
    });
  });
  return publicItems;
});

// Get folder count
gallerySchema.virtual('folderCount').get(function() {
  return this.folders?.length || 0;
});

// Get total storage used
gallerySchema.virtual('totalStorageUsed').get(function() {
  return this.stats?.totalSize || 0;
});

// ============================================
// INSTANCE METHODS
// ============================================

// Add item to folder
gallerySchema.methods.addItem = async function(folderId, itemData) {
  let targetFolder;
  
  if (folderId) {
    targetFolder = this.folders.id(folderId);
  } else {
    // Use first folder or create default
    if (this.folders.length === 0) {
      this.folders.push({
        name: 'Default',
        description: 'Default gallery folder',
        items: []
      });
    }
    targetFolder = this.folders[0];
  }
  
  if (!targetFolder) {
    throw new Error('Folder not found');
  }
  
  const galleryItem = {
    ...itemData,
    uploadedAt: new Date(),
    uploadedBy: itemData.userId
  };
  
  targetFolder.items.push(galleryItem);
  
  // Update folder stats
  targetFolder.itemCount = targetFolder.items.length;
  targetFolder.totalSize = targetFolder.items.reduce((sum, item) => sum + (item.size || 0), 0);
  targetFolder.updatedAt = new Date();
  
  // Update gallery stats
  this.stats.totalItems = this.folders.reduce((sum, folder) => sum + folder.itemCount, 0);
  this.stats.totalSize = this.folders.reduce((sum, folder) => sum + (folder.totalSize || 0), 0);
  this.stats.lastUploadAt = new Date();
  
  await this.save();
  
  return galleryItem;
};

// Remove item from gallery
gallerySchema.methods.removeItem = async function(itemId) {
  let removedItem = null;
  
  for (const folder of this.folders) {
    const itemIndex = folder.items.findIndex(item => 
      item._id.toString() === itemId
    );
    
    if (itemIndex > -1) {
      removedItem = folder.items[itemIndex];
      folder.items.splice(itemIndex, 1);
      
      // Update folder stats
      folder.itemCount = folder.items.length;
      folder.totalSize = folder.items.reduce((sum, item) => sum + (item.size || 0), 0);
      folder.updatedAt = new Date();
      break;
    }
  }
  
  if (removedItem) {
    // Update gallery stats
    this.stats.totalItems = this.folders.reduce((sum, folder) => sum + folder.itemCount, 0);
    this.stats.totalSize = this.folders.reduce((sum, folder) => sum + (folder.totalSize || 0), 0);
    
    await this.save();
  }
  
  return removedItem;
};

// Get item by ID
gallerySchema.methods.getItemById = function(itemId) {
  for (const folder of this.folders) {
    const item = folder.items.id(itemId);
    if (item) {
      return {
        ...item.toObject(),
        folderName: folder.name,
        folderId: folder._id
      };
    }
  }
  return null;
};

// Update item metadata
gallerySchema.methods.updateItem = async function(itemId, updates) {
  for (const folder of this.folders) {
    const item = folder.items.id(itemId);
    if (item) {
      Object.assign(item, updates);
      await this.save();
      return item;
    }
  }
  return null;
};

// Increment item view count
gallerySchema.methods.incrementItemView = async function(itemId) {
  for (const folder of this.folders) {
    const item = folder.items.id(itemId);
    if (item) {
      item.views = (item.views || 0) + 1;
      item.lastViewedAt = new Date();
      this.stats.totalViews = (this.stats.totalViews || 0) + 1;
      await this.save();
      return item;
    }
  }
  return null;
};

// Like/unlike item
gallerySchema.methods.toggleItemLike = async function(itemId, userId) {
  for (const folder of this.folders) {
    const item = folder.items.id(itemId);
    if (item) {
      const likeIndex = item.likes.findIndex(id => id.toString() === userId.toString());
      const wasLiked = likeIndex > -1;
      
      if (wasLiked) {
        item.likes.splice(likeIndex, 1);
        this.stats.totalLikes = (this.stats.totalLikes || 0) - 1;
      } else {
        item.likes.push(userId);
        this.stats.totalLikes = (this.stats.totalLikes || 0) + 1;
      }
      
      await this.save();
      return { liked: !wasLiked, likesCount: item.likes.length };
    }
  }
  return null;
};

// Add comment to item
gallerySchema.methods.addItemComment = async function(itemId, userId, content) {
  for (const folder of this.folders) {
    const item = folder.items.id(itemId);
    if (item) {
      if (!item.comments) item.comments = [];
      item.comments.push({
        userId,
        content: content.trim(),
        createdAt: new Date()
      });
      await this.save();
      return item.comments[item.comments.length - 1];
    }
  }
  return null;
};

// Search items by tags
gallerySchema.methods.searchByTags = function(tags) {
  const results = [];
  const searchTags = Array.isArray(tags) ? tags : [tags];
  
  this.folders.forEach(folder => {
    folder.items.forEach(item => {
      if (item.tags.some(tag => searchTags.includes(tag))) {
        results.push({
          ...item.toObject(),
          folderName: folder.name,
          folderId: folder._id
        });
      }
    });
  });
  
  return results;
};

// Search items by name/description
gallerySchema.methods.searchByText = function(query) {
  const searchLower = query.toLowerCase();
  const results = [];
  
  this.folders.forEach(folder => {
    folder.items.forEach(item => {
      if (
        item.originalName?.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower)
      ) {
        results.push({
          ...item.toObject(),
          folderName: folder.name,
          folderId: folder._id
        });
      }
    });
  });
  
  return results;
};

// Get folder statistics
gallerySchema.methods.getFolderStats = function(folderId) {
  const folder = this.folders.id(folderId);
  if (!folder) return null;
  
  const stats = {
    name: folder.name,
    description: folder.description,
    itemCount: folder.items.length,
    totalSize: folder.items.reduce((sum, item) => sum + (item.size || 0), 0),
    totalViews: folder.items.reduce((sum, item) => sum + (item.views || 0), 0),
    totalLikes: folder.items.reduce((sum, item) => sum + (item.likes?.length || 0), 0),
    mediaTypes: {
      image: folder.items.filter(item => item.mimetype?.startsWith('image/')).length,
      video: folder.items.filter(item => item.mimetype?.startsWith('video/')).length,
      document: folder.items.filter(item => item.mimetype === 'application/pdf').length,
      other: folder.items.filter(item => 
        !item.mimetype?.startsWith('image/') && 
        !item.mimetype?.startsWith('video/') && 
        item.mimetype !== 'application/pdf'
      ).length
    },
    oldestItem: folder.items.length > 0 ? 
      new Date(Math.min(...folder.items.map(item => new Date(item.uploadedAt)))) : null,
    newestItem: folder.items.length > 0 ? 
      new Date(Math.max(...folder.items.map(item => new Date(item.uploadedAt)))) : null
  };
  
  return stats;
};

// Get all Cloudinary public IDs for batch deletion
gallerySchema.methods.getAllCloudinaryPublicIds = function() {
  const publicIds = [];
  
  this.folders.forEach(folder => {
    folder.items.forEach(item => {
      if (item.publicId) {
        publicIds.push({
          publicId: item.publicId,
          folderId: folder._id,
          itemId: item._id
        });
      }
    });
  });
  
  return publicIds;
};

// ============================================
// STATIC METHODS
// ============================================

// Get gallery by user ID with populated data
gallerySchema.statics.getByUserId = async function(userId) {
  return this.findOne({ userId })
    .populate('folders.items.comments.userId', 'name username avatar')
    .populate('folders.items.likes', 'name username');
};

// Get public items across all galleries
gallerySchema.statics.getPublicItems = async function(limit = 20, skip = 0) {
  return this.aggregate([
    { $unwind: '$folders' },
    { $unwind: '$folders.items' },
    { $match: { 'folders.items.visibility': 'public' } },
    { $sort: { 'folders.items.uploadedAt': -1 } },
    { $skip: skip },
    { $limit: limit },
    { $lookup: {
      from: 'users',
      localField: 'userId',
      foreignField: '_id',
      as: 'user'
    }},
    { $unwind: '$user' },
    { $project: {
      item: '$folders.items',
      folderName: '$folders.name',
      folderId: '$folders._id',
      user: {
        _id: '$user._id',
        name: '$user.name',
        username: '$user.username',
        avatar: '$user.avatar'
      }
    }}
  ]);
};

// Get trending items (most viewed/liked in last 7 days)
gallerySchema.statics.getTrendingItems = async function(limit = 10) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  return this.aggregate([
    { $unwind: '$folders' },
    { $unwind: '$folders.items' },
    { $match: { 
      'folders.items.uploadedAt': { $gte: sevenDaysAgo },
      'folders.items.visibility': 'public'
    }},
    { $addFields: {
      engagementScore: {
        $add: [
          { $multiply: ['$folders.items.views', 1] },
          { $multiply: [{ $size: '$folders.items.likes' }, 2] },
          { $multiply: [{ $size: '$folders.items.comments' }, 3] }
        ]
      }
    }},
    { $sort: { engagementScore: -1 } },
    { $limit: limit },
    { $lookup: {
      from: 'users',
      localField: 'userId',
      foreignField: '_id',
      as: 'user'
    }},
    { $unwind: '$user' },
    { $project: {
      item: '$folders.items',
      folderName: '$folders.name',
      folderId: '$folders._id',
      engagementScore: 1,
      user: {
        _id: '$user._id',
        name: '$user.name',
        username: '$user.username',
        avatar: '$user.avatar'
      }
    }}
  ]);
};

// Get gallery statistics across all users
gallerySchema.statics.getGlobalStats = async function() {
  return this.aggregate([
    { $group: {
      _id: null,
      totalGalleries: { $sum: 1 },
      totalItems: { $sum: '$stats.totalItems' },
      totalSize: { $sum: '$stats.totalSize' },
      totalViews: { $sum: '$stats.totalViews' },
      totalLikes: { $sum: '$stats.totalLikes' },
      avgItemsPerGallery: { $avg: '$stats.totalItems' },
      avgSizePerGallery: { $avg: '$stats.totalSize' }
    }}
  ]);
};

// ============================================
// PRE-SAVE MIDDLEWARE
// ============================================

gallerySchema.pre('save', function(next) {
  // Update folder timestamps
  this.folders.forEach(folder => {
    if (folder.isModified('items')) {
      folder.updatedAt = new Date();
    }
  });
  
  // Update gallery stats
  this.stats.totalItems = this.folders.reduce((sum, folder) => sum + (folder.itemCount || folder.items.length), 0);
  this.stats.totalSize = this.folders.reduce((sum, folder) => sum + (folder.totalSize || 0), 0);
  
  next();
});

// ============================================
// POST-REMOVE MIDDLEWARE
// ============================================

gallerySchema.post('remove', async function(doc) {
  // This hook runs after a gallery is removed
  // You could add cleanup logic here if needed
  console.log(`🗑️ Gallery removed for user ${doc.userId}`);
});

// ============================================
// EXPORT
// ============================================
export default mongoose.model('Gallery', gallerySchema);