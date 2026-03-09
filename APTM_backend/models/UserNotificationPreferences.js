// models/UserNotificationPreferences.js
import mongoose from 'mongoose';

const userNotificationPreferencesSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Global settings
  enabled: {
    type: Boolean,
    default: true
  },
  
  emailNotifications: {
    type: Boolean,
    default: false
  },
  
  pushNotifications: {
    type: Boolean,
    default: true
  },
  
  // Per-type settings
  types: {
    signal: {
      enabled: { type: Boolean, default: true },
      email: { type: Boolean, default: false },
      push: { type: Boolean, default: true },
      priority: { type: String, enum: ['low', 'medium', 'high'], default: 'high' }
    },
    chat: {
      enabled: { type: Boolean, default: true },
      email: { type: Boolean, default: false },
      push: { type: Boolean, default: true },
      priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
    },
    community: {
      enabled: { type: Boolean, default: true },
      email: { type: Boolean, default: false },
      push: { type: Boolean, default: true },
      priority: { type: String, enum: ['low', 'medium', 'high'], default: 'low' }
    },
    event: {
      enabled: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
    },
    study: {
      enabled: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: false },
      priority: { type: String, enum: ['low', 'medium', 'high'], default: 'low' }
    },
    bank: {
      enabled: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      priority: { type: String, enum: ['low', 'medium', 'high'], default: 'high' }
    }
  },
  
  // Quiet hours
  quietHours: {
    enabled: { type: Boolean, default: false },
    start: { type: String, default: '22:00' }, // 10 PM
    end: { type: String, default: '08:00' }    // 8 AM
  },
  
  // Maximum notifications per day
  dailyLimit: {
    type: Number,
    default: 50
  }
  
}, {
  timestamps: true
});

// No need for userId index since it's created by unique: true
// Remove if you have: userNotificationPreferencesSchema.index({ userId: 1 });

export default mongoose.model('UserNotificationPreferences', userNotificationPreferencesSchema);