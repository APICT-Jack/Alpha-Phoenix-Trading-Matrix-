// models/UserSettings.js - FIXED VERSION

import mongoose from 'mongoose';
import crypto from 'crypto'; // Import crypto at the top

const userSettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  
  // Account Settings
  account: {
    language: {
      type: String,
      enum: ['en', 'es', 'fr', 'de', 'zh', 'ja', 'ar'],
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    dateFormat: {
      type: String,
      enum: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'],
      default: 'MM/DD/YYYY'
    },
    numberFormat: {
      type: String,
      enum: ['en-US', 'en-GB', 'de-DE', 'fr-FR'],
      default: 'en-US'
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  
  // Display Settings
  display: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto', 'system'],
      default: 'dark'
    },
    fontSize: {
      type: String,
      enum: ['small', 'medium', 'large'],
      default: 'medium'
    },
    compactMode: {
      type: Boolean,
      default: false
    },
    animationEnabled: {
      type: Boolean,
      default: true
    },
    soundEnabled: {
      type: Boolean,
      default: true
    },
    soundVolume: {
      type: Number,
      min: 0,
      max: 100,
      default: 70
    },
    vibrationEnabled: {
      type: Boolean,
      default: false
    }
  },
  
  // Notification Preferences
  notifications: {
    email: {
      marketing: { type: Boolean, default: true },
      security: { type: Boolean, default: true },
      tradingSignals: { type: Boolean, default: true },
      communityUpdates: { type: Boolean, default: false },
      weeklyDigest: { type: Boolean, default: true },
      priceAlerts: { type: Boolean, default: true }
    },
    
    push: {
      priceAlerts: { type: Boolean, default: true },
      signalExecutions: { type: Boolean, default: true },
      chatMessages: { type: Boolean, default: true },
      systemMaintenance: { type: Boolean, default: true },
      newFollowers: { type: Boolean, default: true },
      postInteractions: { type: Boolean, default: true }
    },
    
    inApp: {
      newFollowers: { type: Boolean, default: true },
      postInteractions: { type: Boolean, default: true },
      achievementUnlocks: { type: Boolean, default: true },
      tradeExecutions: { type: Boolean, default: true },
      marketUpdates: { type: Boolean, default: true }
    },
    
    digest: {
      enabled: { type: Boolean, default: true },
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'never'],
        default: 'weekly'
      },
      dayOfWeek: {
        type: Number,
        min: 0,
        max: 6,
        default: 1
      },
      timeOfDay: {
        type: String,
        default: '09:00'
      }
    }
  },
  
  // Trading Preferences
  trading: {
    defaultChartType: {
      type: String,
      enum: ['candlestick', 'line', 'bar', 'heikin_ashi', 'area', 'hollow_candle'],
      default: 'candlestick'
    },
    
    defaultTimeframe: {
      type: String,
      enum: ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M'],
      default: '1h'
    },
    
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'dark'
    },
    
    chartColors: {
      upColor: { type: String, default: '#26a69a' },
      downColor: { type: String, default: '#ef5350' },
      wickColor: { type: String, default: '#737373' },
      borderColor: { type: String, default: '#26a69a' },
      backgroundColor: { type: String, default: '#131722' },
      textColor: { type: String, default: '#d1d4dc' },
      gridColor: { type: String, default: '#363c4e' }
    },
    
    indicators: [{
      type: { type: String },
      parameters: { type: mongoose.Schema.Types.Mixed },
      color: { type: String },
      visible: { type: Boolean, default: true }
    }],
    
    soundEnabled: { type: Boolean, default: true },
    autoRefresh: { type: Boolean, default: true },
    refreshInterval: {
      type: Number,
      default: 5000,
      min: 1000,
      max: 60000
    },
    
    defaultOrderSize: { type: Number, default: 0.01 },
    riskPerTrade: { type: Number, default: 1, min: 0.1, max: 100 },
    
    orderDefaults: {
      type: {
        type: String,
        enum: ['market', 'limit', 'stop', 'stop_limit'],
        default: 'market'
      },
      timeInForce: {
        type: String,
        enum: ['GTC', 'IOC', 'FOK'],
        default: 'GTC'
      },
      leverage: {
        type: Number,
        default: 1,
        min: 1,
        max: 100
      }
    },
    
    positionManagement: {
      autoTakeProfit: { type: Boolean, default: false },
      defaultTakeProfit: { type: Number, default: 2 },
      autoStopLoss: { type: Boolean, default: true },
      defaultStopLoss: { type: Number, default: 1 },
      trailingStop: { type: Boolean, default: false },
      trailingStopPercent: { type: Number, default: 0.5 }
    }
  },
  
  // Security Settings
  security: {
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorMethod: {
      type: String,
      enum: ['authenticator', 'sms', 'email'],
      default: 'authenticator'
    },
    twoFactorSecret: { type: String, select: false },
    backupCodes: [{ type: String, select: false }],
    
    loginAlerts: { type: Boolean, default: true },
    withdrawalAlerts: { type: Boolean, default: true },
    apiKeyAlerts: { type: Boolean, default: true },
    
    sessionTimeout: {
      type: Number,
      default: 60,
      min: 5,
      max: 720
    },
    
    rememberMe: {
      type: Boolean,
      default: false
    },
    
    allowedIPs: [{
      ip: String,
      location: String,
      lastUsed: Date,
      addedAt: { type: Date, default: Date.now }
    }],
    
    blockedIPs: [{
      ip: String,
      reason: String,
      blockedAt: { type: Date, default: Date.now }
    }],
    
    lastPasswordChange: Date,
    lastSecurityAudit: Date,
    requirePasswordForWithdrawal: { type: Boolean, default: true },
    maxLoginAttempts: { type: Number, default: 5 }
  },
  
  // Privacy Settings
  privacy: {
    profileVisibility: {
      type: String,
      enum: ['public', 'private', 'followers_only'],
      default: 'public'
    },
    
    showOnlineStatus: { type: Boolean, default: true },
    showLastSeen: { type: Boolean, default: true },
    
    showPortfolioValue: { type: Boolean, default: false },
    showPortfolioComposition: { type: Boolean, default: false },
    showTradingHistory: { type: Boolean, default: false },
    showTradingActivity: { type: Boolean, default: true },
    showWinRate: { type: Boolean, default: true },
    
    allowDirectMessages: {
      type: String,
      enum: ['everyone', 'followers_only', 'nobody'],
      default: 'everyone'
    },
    
    allowMentions: {
      type: String,
      enum: ['everyone', 'followers_only', 'nobody'],
      default: 'everyone'
    },
    
    allowTags: {
      type: String,
      enum: ['everyone', 'followers_only', 'nobody'],
      default: 'everyone'
    },
    
    searchEngineIndexing: { type: Boolean, default: true },
    shareDataForAnalytics: { type: Boolean, default: false },
    allowDataExport: { type: Boolean, default: true }
  },
  
  // API Settings
  api: {
    enabled: { type: Boolean, default: false },
    
    apiKey: {
      type: String,
      select: false,
      unique: true,
      sparse: true
    },
    
    apiSecret: {
      type: String,
      select: false
    },
    
    apiKeyName: { type: String },
    apiKeyPermissions: [{
      type: String,
      enum: ['read', 'trade', 'withdraw', 'admin'],
      default: ['read']
    }],
    
    lastKeyRotation: Date,
    keyExpiresAt: Date,
    
    rateLimit: {
      requestsPerMinute: { type: Number, default: 60 },
      requestsPerHour: { type: Number, default: 1000 },
      requestsPerDay: { type: Number, default: 10000 }
    },
    
    whitelistedIPs: [{
      ip: String,
      description: String,
      addedAt: { type: Date, default: Date.now }
    }],
    
    webhooks: [{
      url: String,
      events: [String],
      isActive: { type: Boolean, default: true },
      secret: String,
      lastTriggered: Date,
      failureCount: { type: Number, default: 0 },
      createdAt: { type: Date, default: Date.now }
    }]
  },
  
  // Data & Export Settings
  data: {
    autoBackup: { type: Boolean, default: false },
    
    backupFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'weekly'
    },
    
    lastBackup: Date,
    nextBackup: Date,
    
    exportFormat: {
      type: String,
      enum: ['csv', 'json', 'excel', 'pdf'],
      default: 'csv'
    },
    
    exportDataTypes: [{
      type: String,
      enum: ['profile', 'trades', 'portfolio', 'activity', 'messages'],
      default: ['profile', 'trades']
    }],
    
    retainDataFor: {
      type: Number,
      default: 24,
      min: 1,
      max: 120
    },
    
    autoDeleteOldData: { type: Boolean, default: false },
    deleteDataAfter: { type: Number, default: 36 }
  },
  
  // Accessibility Settings
  accessibility: {
    highContrast: { type: Boolean, default: false },
    reducedMotion: { type: Boolean, default: false },
    screenReaderOptimized: { type: Boolean, default: false },
    fontSizeMultiplier: { type: Number, default: 1, min: 0.8, max: 1.5 },
    colorBlindMode: {
      type: String,
      enum: ['none', 'protanopia', 'deuteranopia', 'tritanopia'],
      default: 'none'
    }
  },
  
  // Blocked Users
  blockedUsers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    blockedAt: { type: Date, default: Date.now },
    reason: String
  }],
  
  // Muted Words/Phrases
  mutedWords: [{
    word: String,
    addedAt: { type: Date, default: Date.now }
  }],
  
  // Feature Flags
  features: {
    betaFeatures: { type: Boolean, default: false },
    experimentalTrading: { type: Boolean, default: false },
    earlyAccess: { type: Boolean, default: false },
    testingMode: { type: Boolean, default: false }
  }

}, {
  timestamps: true
});

// Indexes for better query performance
userSettingsSchema.index({ userId: 1 });
userSettingsSchema.index({ 'api.apiKey': 1 }, { sparse: true });
userSettingsSchema.index({ 'security.twoFactorEnabled': 1 });

// ============================================
// INSTANCE METHODS
// ============================================

// Update notification settings
userSettingsSchema.methods.updateNotificationSettings = function(category, subcategory, updates) {
  if (this.notifications[category] && this.notifications[category][subcategory]) {
    this.notifications[category][subcategory] = { 
      ...this.notifications[category][subcategory], 
      ...updates 
    };
  } else if (this.notifications[category]) {
    this.notifications[category] = { ...this.notifications[category], ...updates };
  } else {
    this.notifications[category] = updates;
  }
  return this.save();
};

// Update trading preferences
userSettingsSchema.methods.updateTradingPreferences = function(updates) {
  this.trading = { ...this.trading, ...updates };
  return this.save();
};

// Add allowed IP
userSettingsSchema.methods.addAllowedIP = function(ip, location) {
  if (!this.security.allowedIPs.find(existing => existing.ip === ip)) {
    this.security.allowedIPs.push({
      ip,
      location,
      lastUsed: new Date(),
      addedAt: new Date()
    });
  }
  return this.save();
};

// Remove allowed IP
userSettingsSchema.methods.removeAllowedIP = function(ip) {
  this.security.allowedIPs = this.security.allowedIPs.filter(
    allowed => allowed.ip !== ip
  );
  return this.save();
};

// Block a user
userSettingsSchema.methods.blockUser = function(userId, reason) {
  if (!this.blockedUsers.find(blocked => blocked.userId.toString() === userId.toString())) {
    this.blockedUsers.push({
      userId,
      reason,
      blockedAt: new Date()
    });
  }
  return this.save();
};

// Unblock a user
userSettingsSchema.methods.unblockUser = function(userId) {
  this.blockedUsers = this.blockedUsers.filter(
    blocked => blocked.userId.toString() !== userId.toString()
  );
  return this.save();
};

// Check if a user is blocked
userSettingsSchema.methods.isUserBlocked = function(userId) {
  return this.blockedUsers.some(
    blocked => blocked.userId.toString() === userId.toString()
  );
};

// Add muted word
userSettingsSchema.methods.addMutedWord = function(word) {
  const lowerWord = word.toLowerCase();
  if (!this.mutedWords.find(muted => muted.word === lowerWord)) {
    this.mutedWords.push({ word: lowerWord, addedAt: new Date() });
  }
  return this.save();
};

// Remove muted word
userSettingsSchema.methods.removeMutedWord = function(word) {
  const lowerWord = word.toLowerCase();
  this.mutedWords = this.mutedWords.filter(muted => muted.word !== lowerWord);
  return this.save();
};

// Check if content contains muted words
userSettingsSchema.methods.containsMutedWords = function(content) {
  const lowerContent = content.toLowerCase();
  return this.mutedWords.some(muted => lowerContent.includes(muted.word));
};

// ============================================
// FIXED: Generate new API key - removed await import()
// ============================================
userSettingsSchema.methods.generateApiKey = function(name, permissions = ['read']) {
  // crypto is already imported at the top of the file
  const apiKey = crypto.randomBytes(32).toString('hex');
  const apiSecret = crypto.randomBytes(64).toString('hex');
  
  this.api.enabled = true;
  this.api.apiKey = apiKey;
  this.api.apiSecret = apiSecret;
  this.api.apiKeyName = name;
  this.api.apiKeyPermissions = permissions;
  this.api.lastKeyRotation = new Date();
  this.api.keyExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days
  
  return this.save().then(() => ({ apiKey, apiSecret }));
};

// Revoke API key
userSettingsSchema.methods.revokeApiKey = function() {
  this.api.enabled = false;
  this.api.apiKey = undefined;
  this.api.apiSecret = undefined;
  this.api.apiKeyName = undefined;
  this.api.apiKeyPermissions = [];
  return this.save();
};

// Add webhook
userSettingsSchema.methods.addWebhook = function(url, events, secret) {
  this.api.webhooks.push({
    url,
    events,
    secret,
    isActive: true,
    createdAt: new Date()
  });
  return this.save();
};

// Remove webhook
userSettingsSchema.methods.removeWebhook = function(webhookId) {
  this.api.webhooks = this.api.webhooks.filter(
    webhook => webhook._id.toString() !== webhookId
  );
  return this.save();
};

// Update webhook status
userSettingsSchema.methods.updateWebhookStatus = function(webhookId, isActive) {
  const webhook = this.api.webhooks.id(webhookId);
  if (webhook) {
    webhook.isActive = isActive;
  }
  return this.save();
};

// ============================================
// STATIC METHODS
// ============================================

// Create default settings for a new user
userSettingsSchema.statics.createDefaultSettings = async function(userId) {
  return this.create({ userId });
};

// Get settings with user data
userSettingsSchema.statics.getWithUser = async function(userId) {
  return this.findOne({ userId }).populate('userId', 'name username email avatar');
};

// Find by API key
userSettingsSchema.statics.findByApiKey = async function(apiKey) {
  return this.findOne({ 'api.apiKey': apiKey, 'api.enabled': true })
    .select('+api.apiKey +api.apiSecret');
};

// Get all users with 2FA enabled
userSettingsSchema.statics.getUsersWith2FA = async function() {
  return this.find({ 'security.twoFactorEnabled': true }).populate('userId', 'email');
};

// Get users with expired API keys
userSettingsSchema.statics.getExpiredApiKeys = async function() {
  return this.find({
    'api.enabled': true,
    'api.keyExpiresAt': { $lt: new Date() }
  });
};

// ============================================
// VIRTUAL PROPERTIES
// ============================================

// Get notification summary
userSettingsSchema.virtual('notificationSummary').get(function() {
  const enabled = [];
  const disabled = [];
  
  Object.entries(this.notifications.email).forEach(([key, value]) => {
    if (value) enabled.push(`email:${key}`);
    else disabled.push(`email:${key}`);
  });
  
  Object.entries(this.notifications.push).forEach(([key, value]) => {
    if (value) enabled.push(`push:${key}`);
    else disabled.push(`push:${key}`);
  });
  
  return { enabled, disabled };
});

// Check if user has API access
userSettingsSchema.virtual('hasApiAccess').get(function() {
  return this.api.enabled && this.api.apiKey && this.api.keyExpiresAt > new Date();
});

// ============================================
// PRE-SAVE HOOKS
// ============================================

userSettingsSchema.pre('save', function(next) {
  if (this.account.dateFormat && !['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'].includes(this.account.dateFormat)) {
    this.account.dateFormat = 'MM/DD/YYYY';
  }
  
  const validTimezones = Intl.supportedValuesOf('timeZone');
  if (this.account.timezone && !validTimezones.includes(this.account.timezone)) {
    this.account.timezone = 'UTC';
  }
  
  if (this.notifications.digest.frequency === 'never') {
    this.notifications.digest.enabled = false;
  }
  
  next();
});

// Export the model
export default mongoose.model('UserSettings', userSettingsSchema);