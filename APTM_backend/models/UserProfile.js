// models/UserProfile.js - CLEANED VERSION (Removed unnecessary fields)

import mongoose from 'mongoose';

const userProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  // Basic Information
  firstName: { type: String, trim: true, maxlength: 50 },
  lastName: { type: String, trim: true, maxlength: 50 },
  username: { type: String, trim: true, maxlength: 30, unique: true, sparse: true },
  bio: { type: String, maxlength: 500 },
  
  // Contact
  phone: { type: String, trim: true },
  country: { type: String, trim: true },
  
  // Profile Media
  bannerImage: { type: String, default: null },
  
  // Social Links
  socialLinks: {
    twitter: { type: String, trim: true },
    linkedin: { type: String, trim: true },
    website: { type: String, trim: true },
    github: { type: String, trim: true },
    whatsapp: { type: String, trim: true },
    facebook: { type: String, trim: true }
  },
  
  // Trading Platform Connections
  tradingConnections: {
    mt4: {
      connected: { type: Boolean, default: false },
      accountId: String,
      broker: String,
      server: String,
      sessionKey: String,
      connectedAt: Date,
      lastSync: Date
    },
    mt5: {
      connected: { type: Boolean, default: false },
      accountId: String,
      broker: String,
      server: String,
      sessionKey: String,
      connectedAt: Date,
      lastSync: Date
    }
  },
  
  // Trading Statistics (calculated from real data)
  tradingStats: {
    totalTrades: { type: Number, default: 0 },
    winningTrades: { type: Number, default: 0 },
    losingTrades: { type: Number, default: 0 },
    totalNetProfit: { type: Number, default: 0 },
    winRate: { type: Number, default: 0 },
    profitFactor: { type: Number, default: 0 },
    averageWin: { type: Number, default: 0 },
    averageLoss: { type: Number, default: 0 },
    largestWin: { type: Number, default: 0 },
    largestLoss: { type: Number, default: 0 },
    maxDrawdown: { type: Number, default: 0 },
    sharpeRatio: { type: Number, default: 0 },
    expectancy: { type: Number, default: 0 },
    lastUpdated: Date
  },
  
  // Badge System (based on real performance)
  badge: {
    level: {
      type: String,
      enum: ['novice', 'beginner', 'intermediate', 'advanced', 'expert', 'pro'],
      default: 'novice'
    },
    title: { type: String, default: 'Novice Trader' },
    icon: { type: String, default: '📚' },
    color: { type: String, default: '#9CA3AF' },
    score: { type: Number, default: 0 },
    achievedAt: Date,
    updatedAt: Date
  },
  
  // Experience Level (derived from trading data)
  experienceLevel: {
    level: {
      type: String,
      enum: ['novice', 'beginner', 'intermediate', 'advanced', 'expert'],
      default: 'novice'
    },
    title: { type: String, default: 'Novice Trader' },
    score: { type: Number, default: 0 },
    updatedAt: Date
  },
  
  // Privacy Settings
  privacy: {
    profileVisibility: {
      type: String,
      enum: ['public', 'private', 'followers_only'],
      default: 'public'
    },
    showTradingStats: { type: Boolean, default: true },
    showOnlineStatus: { type: Boolean, default: true },
    allowMessages: {
      type: String,
      enum: ['everyone', 'followers_only', 'nobody'],
      default: 'everyone'
    },
    searchEngineIndexing: { type: Boolean, default: true }
  },
  
  // Statistics
  stats: {
    joinDate: { type: Date, default: Date.now },
    lastActive: { type: Date, default: Date.now },
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 }
  }

}, { timestamps: true });

// Virtual for full name
userProfileSchema.virtual('fullName').get(function() {
  return `${this.firstName || ''} ${this.lastName || ''}`.trim() || null;
});

// Virtual for display name
userProfileSchema.virtual('displayName').get(function() {
  return this.username || this.firstName || 'User';
});

// Update last active
userProfileSchema.methods.updateLastActive = function() {
  this.stats.lastActive = new Date();
  return this.save();
};

// Update trading stats
userProfileSchema.methods.updateTradingStats = function(stats) {
  this.tradingStats = {
    totalTrades: stats.totalTrades || 0,
    winningTrades: stats.winningTrades || 0,
    losingTrades: stats.losingTrades || 0,
    totalNetProfit: stats.totalNetProfit || 0,
    winRate: stats.winRate || 0,
    profitFactor: stats.profitFactor || 0,
    averageWin: stats.averageWin || 0,
    averageLoss: stats.averageLoss || 0,
    largestWin: stats.largestWin || 0,
    largestLoss: stats.largestLoss || 0,
    maxDrawdown: stats.maxDrawdown || 0,
    sharpeRatio: stats.sharpeRatio || 0,
    expectancy: stats.expectancy || 0,
    lastUpdated: new Date()
  };
  return this.save();
};

// Update badge
userProfileSchema.methods.updateBadge = function(badgeData) {
  this.badge = {
    level: badgeData.level,
    title: badgeData.title,
    icon: badgeData.icon,
    color: badgeData.color,
    score: badgeData.score,
    achievedAt: this.badge.level !== badgeData.level ? new Date() : this.badge.achievedAt,
    updatedAt: new Date()
  };
  return this.save();
};

// Update experience level
userProfileSchema.methods.updateExperienceLevel = function(levelData) {
  this.experienceLevel = {
    level: levelData.level,
    title: levelData.title,
    score: levelData.score,
    updatedAt: new Date()
  };
  return this.save();
};

// Check if connected to any trading platform
userProfileSchema.methods.hasTradingConnection = function() {
  return this.tradingConnections.mt4.connected || this.tradingConnections.mt5.connected;
};

// Get connected platforms list
userProfileSchema.methods.getConnectedPlatforms = function() {
  const platforms = [];
  if (this.tradingConnections.mt4.connected) platforms.push('mt4');
  if (this.tradingConnections.mt5.connected) platforms.push('mt5');
  return platforms;
};

// Indexes
userProfileSchema.index({ userId: 1 });
userProfileSchema.index({ username: 1 });
userProfileSchema.index({ 'badge.level': 1 });
userProfileSchema.index({ 'tradingStats.totalTrades': -1 });
userProfileSchema.index({ 'tradingStats.winRate': -1 });
userProfileSchema.index({ 'stats.followersCount': -1 });
userProfileSchema.index({ 'stats.lastActive': -1 });

export default mongoose.model('UserProfile', userProfileSchema);