// models/Subscription.js
import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Subscription Plan
  plan: {
    type: String,
    enum: ['free', 'basic', 'pro', 'premium', 'enterprise'],
    default: 'free'
  },
  
  // Subscription Status
  status: {
    type: String,
    enum: ['active', 'canceled', 'past_due', 'unpaid', 'incomplete', 'trialing'],
    default: 'active'
  },
  
  // Billing Information
  billing: {
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false
    }
  },
  
  // Payment Method
  paymentMethod: {
    type: String,
    enum: ['card', 'paypal', 'crypto', 'bank_transfer'],
    default: 'card'
  },
  
  // Features based on subscription
  features: {
    // Trading Features
    advancedCharts: { type: Boolean, default: false },
    realTimeSignals: { type: Boolean, default: false },
    automatedTrading: { type: Boolean, default: false },
    customIndicators: { type: Boolean, default: false },
    
    // Community Features
    privateChats: { type: Boolean, default: false },
    expertAccess: { type: Boolean, default: false },
    liveSessions: { type: Boolean, default: false },
    
    // Educational Features
    premiumCourses: { type: Boolean, default: false },
    oneOnOneCoaching: { type: Boolean, default: false },
    tradingTools: { type: Boolean, default: false },
    
    // Limits
    maxPortfolios: { type: Number, default: 1 },
    maxWatchlists: { type: Number, default: 3 },
    apiCallsPerMinute: { type: Number, default: 60 },
    signalAlertsPerDay: { type: Number, default: 10 }
  },
  
  // Usage Tracking
  usage: {
    apiCallsThisMonth: { type: Number, default: 0 },
    signalsUsedThisMonth: { type: Number, default: 0 },
    lastResetDate: { type: Date, default: Date.now }
  },
  
  // Subscription History
  history: [{
    plan: String,
    status: String,
    price: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    reason: String
  }]

}, {
  timestamps: true
});

// Virtual for subscription status
subscriptionSchema.virtual('isActive').get(function() {
  return this.status === 'active' || this.status === 'trialing';
});

// Virtual for days until renewal
subscriptionSchema.virtual('daysUntilRenewal').get(function() {
  if (!this.billing.currentPeriodEnd) return null;
  const now = new Date();
  const end = new Date(this.billing.currentPeriodEnd);
  return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
});

// Virtual for isTrial
subscriptionSchema.virtual('isTrial').get(function() {
  return this.status === 'trialing';
});

// Remove userId index since it's created by unique: true
// subscriptionSchema.index({ userId: 1 }); // REMOVE THIS LINE

// Keep these indexes
subscriptionSchema.index({ 'billing.currentPeriodEnd': 1 });
subscriptionSchema.index({ status: 1 });

// Method to check feature access
subscriptionSchema.methods.hasFeature = function(featureName) {
  return this.features[featureName] === true;
};

// Method to update usage
subscriptionSchema.methods.incrementUsage = function(feature, amount = 1) {
  if (this.usage[`${feature}ThisMonth`] !== undefined) {
    this.usage[`${feature}ThisMonth`] += amount;
  }
  return this.save();
};

// Static method to reset monthly usage
subscriptionSchema.statics.resetMonthlyUsage = async function() {
  const now = new Date();
  await this.updateMany(
    { 
      'usage.lastResetDate': { 
        $lt: new Date(now.getFullYear(), now.getMonth(), 1) 
      } 
    },
    {
      $set: {
        'usage.apiCallsThisMonth': 0,
        'usage.signalsUsedThisMonth': 0,
        'usage.lastResetDate': now
      }
    }
  );
};

export default mongoose.model('Subscription', subscriptionSchema);