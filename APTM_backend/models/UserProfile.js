// models/UserProfile.js - FIXED VERSION
import mongoose from 'mongoose';

const userProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Personal Information
  firstName: {
    type: String,
    trim: true,
    maxlength: 50
  },
  
  lastName: {
    type: String,
    trim: true,
    maxlength: 50
  },
  
  username: {
    type: String,
    trim: true,
    maxlength: 30
  },
  
  bio: {
    type: String,
    maxlength: 500
  },
  
  // Contact Information
  phone: {
    type: String,
    trim: true
  },
  
  country: {
    type: String,
    trim: true
  },
  
  timezone: {
    type: String,
    default: 'UTC'
  },
  
  // Profile Media
  avatar: {
    url: String,
    publicId: String
  },
  
  // Banner Image
  bannerImage: {
    type: String,
    default: null
  },
  
  // Social Links
  socialLinks: {
    twitter: { type: String, trim: true },
    linkedin: { type: String, trim: true },
    website: { type: String, trim: true },
    github: { type: String, trim: true },
    whatsapp: { type: String, trim: true },
    facebook: { type: String, trim: true }
  },
  
  // Trading Preferences
  tradingExperience: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'beginner'
  },
  
  preferredMarkets: [{
    type: String,
    enum: ['forex', 'crypto', 'stocks', 'commodities', 'indices']
  }],
  
  // Synthetic Indices
  syntheticIndices: [{
    type: String,
    enum: [
      'synthetic_boom_1000',
      'synthetic_crash_1000',
      'synthetic_volatility_10',
      'synthetic_volatility_25',
      'synthetic_volatility_50',
      'synthetic_volatility_75',
      'synthetic_volatility_100',
      'synthetic_jump_10',
      'synthetic_jump_25',
      'synthetic_jump_50',
      'synthetic_jump_75',
      'synthetic_jump_100'
    ]
  }],
  
  riskAppetite: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  
  // Trading Platform Connections
  tradingPlatforms: {
    mt4: {
      connected: { type: Boolean, default: false },
      accountId: String,
      broker: String,
      server: String,
      lastSync: Date
    },
    mt5: {
      connected: { type: Boolean, default: false },
      accountId: String,
      broker: String,
      server: String,
      lastSync: Date
    },
    tradingview: {
      connected: { type: Boolean, default: false },
      username: String,
      accountType: String,
      lastSync: Date
    }
  },
  
  // Interests & Skills
  interests: [{
    type: String,
    enum: ['trading', 'student', 'mentor', 'developer', 'investing', 'analysis', 
           'programming', 'data-science', 'blockchain', 'mentoring', 'machine-learning']
  }],
  
  // Skills with Levels
  skills: [{
    name: { type: String, required: true },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'beginner'
    },
    category: {
      type: String,
      enum: ['technical', 'trading', 'analytical', 'soft_skills', 'language', 'other'],
      default: 'technical'
    },
    addedAt: { type: Date, default: Date.now }
  }],
  
  codingExperience: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert', 'professional'],
    default: 'beginner'
  },
  
  // Personal Details
  gender: {
    type: String,
    enum: ['male', 'female', 'non-binary', 'prefer-not-to-say', 'other'],
    trim: true
  },
  
  idNumber: {
    type: String,
    trim: true
  },
  
  dateOfBirth: {
    type: Date
  },
  
  // Documents
  documents: {
    idCopy: {
      url: String,
      publicId: String,
      uploadedAt: Date,
      verified: {
        type: Boolean,
        default: false
      }
    },
    bankStatement: {
      url: String,
      publicId: String,
      uploadedAt: Date,
      verified: {
        type: Boolean,
        default: false
      }
    },
    proofOfResidence: {
      url: String,
      publicId: String,
      uploadedAt: Date,
      verified: {
        type: Boolean,
        default: false
      }
    }
  },
  
  // Address Information
  address: {
    province: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    town: {
      type: String,
      trim: true
    },
    postCode: {
      type: String,
      trim: true
    },
    streetAddress: {
      type: String,
      trim: true
    }
  },
  
  // Address Proof
  addressProof: {
    documentUrl: String,
    documentType: {
      type: String,
      enum: [
        'utility_bill',
        'bank_statement',
        'government_letter',
        'tax_document',
        'lease_agreement',
        'drivers_license',
        'id_card'
      ]
    },
    verified: { type: Boolean, default: false },
    uploadedAt: Date,
    verifiedAt: Date,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  
  // Statistics
  stats: {
    joinDate: {
      type: Date,
      default: Date.now
    },
    lastActive: {
      type: Date,
      default: Date.now
    },
    postsCount: {
      type: Number,
      default: 0
    },
    followersCount: {
      type: Number,
      default: 0
    },
    followingCount: {
      type: Number,
      default: 0
    },
    tradesCompleted: {
      type: Number,
      default: 0
    },
    successRate: {
      type: Number,
      default: 0
    }
  },
  
  // Verification Status
  verificationStatus: {
    type: String,
    enum: ['unverified', 'pending', 'verified', 'rejected'],
    default: 'unverified'
  },
  
  // Privacy Settings
  privacy: {
    profileVisibility: {
      type: String,
      enum: ['public', 'private', 'followers_only'],
      default: 'public'
    },
    showTradingStats: {
      type: Boolean,
      default: true
    },
    showPortfolioValue: {
      type: Boolean,
      default: false
    },
    showOnlineStatus: {
      type: Boolean,
      default: true
    },
    allowMessages: {
      type: String,
      enum: ['everyone', 'followers_only', 'nobody'],
      default: 'everyone'
    },
    showDateOfBirth: {
      type: Boolean,
      default: false
    },
    showGender: {
      type: Boolean,
      default: false
    },
    showAddress: {
      type: Boolean,
      default: false
    },
    searchEngineIndexing: {
      type: Boolean,
      default: true
    }
  }

}, {
  timestamps: true
});

// Virtuals
userProfileSchema.virtual('fullName').get(function() {
  return `${this.firstName || ''} ${this.lastName || ''}`.trim() || null;
});

userProfileSchema.virtual('displayName').get(function() {
  return this.username || this.firstName || 'User';
});

userProfileSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

userProfileSchema.virtual('isFullyVerified').get(function() {
  const idVerified = this.documents.idCopy?.verified || false;
  const addressVerified = this.documents.bankStatement?.verified || 
                         this.documents.proofOfResidence?.verified || 
                         this.addressProof?.verified || false;
  return idVerified && addressVerified;
});

// Methods
userProfileSchema.methods.updateLastActive = function() {
  this.stats.lastActive = new Date();
  return this.save();
};

userProfileSchema.methods.incrementPostsCount = function() {
  this.stats.postsCount += 1;
  return this.save();
};

userProfileSchema.methods.addDocument = function(documentType, url, publicId) {
  const documentData = {
    url,
    publicId,
    uploadedAt: new Date(),
    verified: false
  };
  
  switch(documentType) {
    case 'idCopy':
      this.documents.idCopy = documentData;
      break;
    case 'bankStatement':
      this.documents.bankStatement = documentData;
      break;
    case 'proofOfResidence':
      this.documents.proofOfResidence = documentData;
      break;
    default:
      throw new Error('Invalid document type');
  }
  
  return this.save();
};

userProfileSchema.methods.verifyDocument = function(documentType) {
  const document = this.documents[documentType];
  if (document) {
    document.verified = true;
    this.markModified(`documents.${documentType}`);
  }
  
  this.updateVerificationStatus();
  return this.save();
};

userProfileSchema.methods.updateVerificationStatus = function() {
  const idVerified = this.documents.idCopy?.verified || false;
  const addressVerified = this.documents.bankStatement?.verified || 
                         this.documents.proofOfResidence?.verified || 
                         this.addressProof?.verified || false;
  
  if (idVerified && addressVerified) {
    this.verificationStatus = 'verified';
  } else if (idVerified || addressVerified) {
    this.verificationStatus = 'pending';
  } else {
    this.verificationStatus = 'unverified';
  }
};

// Add skill method
userProfileSchema.methods.addSkill = function(skillData) {
  this.skills.push({
    name: skillData.name,
    level: skillData.level || 'beginner',
    category: skillData.category || 'technical',
    addedAt: new Date()
  });
  return this.save();
};

// Remove skill method
userProfileSchema.methods.removeSkill = function(skillId) {
  this.skills = this.skills.filter(skill => skill._id.toString() !== skillId);
  return this.save();
};

// Update trading platform connection
userProfileSchema.methods.updateTradingPlatform = function(platform, data) {
  if (!['mt4', 'mt5', 'tradingview'].includes(platform)) {
    throw new Error('Invalid platform');
  }
  
  this.tradingPlatforms[platform] = {
    ...this.tradingPlatforms[platform],
    ...data,
    lastSync: new Date()
  };
  
  return this.save();
};

// Static methods
userProfileSchema.statics.findByInterest = function(interest) {
  return this.find({ interests: interest });
};

userProfileSchema.statics.findByLocation = function(province, city) {
  const query = {};
  if (province) query['address.province'] = province;
  if (city) query['address.city'] = city;
  
  return this.find(query);
};

userProfileSchema.statics.findByTradingExperience = function(experience) {
  return this.find({ tradingExperience: experience });
};

// REMOVE THESE INDEXES - THEY ARE CREATED AUTOMATICALLY BY MONGOOSE
// WHEN YOU USE `unique: true` OR `index: true` IN FIELD DEFINITIONS
// 
// userProfileSchema.index({ userId: 1 }); // REMOVE - auto created by unique: true
// userProfileSchema.index({ email: 1 }); // REMOVE - email doesn't exist in this schema
// userProfileSchema.index({ username: 1 }); // REMOVE - auto created by unique: true

// Keep only custom indexes that aren't defined in field definitions
userProfileSchema.index({ 'stats.lastActive': -1 });
userProfileSchema.index({ interests: 1 });
userProfileSchema.index({ codingExperience: 1 });
userProfileSchema.index({ verificationStatus: 1 });
userProfileSchema.index({ 'address.city': 1, 'address.province': 1 });
userProfileSchema.index({ 'tradingPlatforms.mt4.connected': 1 });
userProfileSchema.index({ 'tradingPlatforms.mt5.connected': 1 });
userProfileSchema.index({ 'tradingPlatforms.tradingview.connected': 1 });
userProfileSchema.index({ skills: 1 });

export default mongoose.model('UserProfile', userProfileSchema);