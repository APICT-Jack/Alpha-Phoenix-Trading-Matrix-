// models/UserSettings.js
import mongoose from 'mongoose';

const userSettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Notification Preferences
  notifications: {
    email: {
      marketing: { type: Boolean, default: true },
      security: { type: Boolean, default: true },
      tradingSignals: { type: Boolean, default: true },
      communityUpdates: { type: Boolean, default: false }
    },
    
    push: {
      priceAlerts: { type: Boolean, default: true },
      signalExecutions: { type: Boolean, default: true },
      chatMessages: { type: Boolean, default: true },
      systemMaintenance: { type: Boolean, default: true }
    },
    
    inApp: {
      newFollowers: { type: Boolean, default: true },
      postInteractions: { type: Boolean, default: true },
      achievementUnlocks: { type: Boolean, default: true }
    }
  },
  
  // Trading Preferences
  trading: {
    defaultChartType: {
      type: String,
      enum: ['candlestick', 'line', 'bar', 'heikin_ashi'],
      default: 'candlestick'
    },
    
    defaultTimeframe: {
      type: String,
      enum: ['1m', '5m', '15m', '1h', '4h', '1d', '1w'],
      default: '1h'
    },
    
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'dark'
    },
    
    soundEnabled: {
      type: Boolean,
      default: true
    },
    
    autoRefresh: {
      type: Boolean,
      default: true
    },
    
    defaultOrderSize: {
      type: Number,
      default: 0.01
    },
    
    riskPerTrade: {
      type: Number,
      default: 1
    }
  },
  
  // Security Settings
  security: {
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    
    loginAlerts: {
      type: Boolean,
      default: true
    },
    
    sessionTimeout: {
      type: Number, // in minutes
      default: 60
    },
    
    allowedIPs: [{
      ip: String,
      location: String,
      lastUsed: Date
    }]
  },
  
  // Privacy Settings
  privacy: {
    showOnlineStatus: {
      type: Boolean,
      default: true
    },
    
    showPortfolioValue: {
      type: Boolean,
      default: false
    },
    
    showTradingActivity: {
      type: Boolean,
      default: true
    },
    
    allowDirectMessages: {
      type: String,
      enum: ['everyone', 'followers_only', 'nobody'],
      default: 'everyone'
    },
    
    searchEngineIndexing: {
      type: Boolean,
      default: true
    }
  },
  
  // API Settings
  api: {
    generateApiKey: {
      type: Boolean,
      default: false
    },
    
    apiKey: {
      type: String,
      select: false
    },
    
    apiSecret: {
      type: String,
      select: false
    },
    
    lastKeyRotation: Date,
    
    webhooks: [{
      url: String,
      events: [String],
      isActive: Boolean
    }]
  },
  
  // Data & Export Settings
  data: {
    autoBackup: {
      type: Boolean,
      default: false
    },
    
    backupFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'weekly'
    },
    
    exportFormat: {
      type: String,
      enum: ['csv', 'json', 'excel'],
      default: 'csv'
    },
    
    retainDataFor: {
      type: Number, // in months
      default: 24
    }
  }

}, {
  timestamps: true
});


// Method to update notification settings
userSettingsSchema.methods.updateNotificationSettings = function(category, updates) {
  this.notifications[category] = { ...this.notifications[category], ...updates };
  return this.save();
};

// Method to update trading preferences
userSettingsSchema.methods.updateTradingPreferences = function(updates) {
  this.trading = { ...this.trading, ...updates };
  return this.save();
};

// Method to add allowed IP
userSettingsSchema.methods.addAllowedIP = function(ip, location) {
  this.security.allowedIPs.push({
    ip,
    location,
    lastUsed: new Date()
  });
  return this.save();
};

// Static method to create default settings
userSettingsSchema.statics.createDefaultSettings = function(userId) {
  return this.create({ userId });
};

export default mongoose.model('UserSettings', userSettingsSchema);