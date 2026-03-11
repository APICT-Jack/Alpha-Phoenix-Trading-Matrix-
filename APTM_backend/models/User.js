// models/User.js - FIXED VERSION
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  googleId: {
    type: String,
    sparse: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true, // This automatically creates an index
    trim: true,
    index: true // REMOVE THIS LINE - it's redundant
  },
  email: {
    type: String,
    required: true,
    unique: true, // This automatically creates an index
    trim: true,
    lowercase: true,
    index: true // REMOVE THIS LINE - it's redundant
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId;
    }
  },
  isActive: {
    type: Boolean,
    default: false
  },
  otpCode: {
    type: String
  },
  otpExpiry: {
    type: Date
  },
  avatar: {
    type: String,
    default: null
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
UserSchema.virtual('avatarUrl').get(function() {
  if (!this.avatar) return null;
  
  if (this.avatar.startsWith('http')) {
    return this.avatar;
  }
  
  let avatarPath = this.avatar;
  
  if (!avatarPath.startsWith('/uploads/')) {
    if (avatarPath.startsWith('uploads/')) {
      avatarPath = '/' + avatarPath;
    } else {
      avatarPath = '/uploads/avatars/' + avatarPath;
    }
  }
  
  return `http://localhost:5000${avatarPath}`;
});

UserSchema.virtual('avatarInitial').get(function() {
  return this.name ? this.name.charAt(0).toUpperCase() : 'U';
});

UserSchema.virtual('displayName').get(function() {
  return this.username || this.name?.split(' ')[0] || this.email?.split('@')[0] || 'User';
});

// Methods
UserSchema.methods.updateAvatar = function(avatarPath) {
  this.avatar = avatarPath;
  return this.save();
};

UserSchema.methods.removeAvatar = function() {
  this.avatar = null;
  return this.save();
};

UserSchema.virtual('hasAvatar').get(function() {
  return !!this.avatar;
});

UserSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

UserSchema.methods.incrementLoginAttempts = function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + (2 * 60 * 60 * 1000) };
  }
  
  return this.updateOne(updates);
};

UserSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

UserSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// In User.js - verify the comparePassword method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    // If user registered with Google (no password)
    if (!this.password) return false;
    
    // Compare the candidate password with the stored hash
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
};

// Pre-save middleware
// In User.js - pre-save hook with logging
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    console.log('🔐 Password being hashed for user:', this.email);
    console.log('Original password length:', this.password ? this.password.length : 0);
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    
    console.log('Hashed password length:', hashedPassword.length);
    
    this.password = hashedPassword;
    next();
  } catch (error) {
    console.error('Error hashing password:', error);
    next(error);
  }
});

// Remove duplicate index declarations at the bottom
// REMOVE THESE LINES:
// UserSchema.index({ email: 1 });
// UserSchema.index({ username: 1 });
// UserSchema.index({ lastLogin: -1 });

// Only keep custom indexes that aren't already defined by `unique: true`
UserSchema.index({ lastLogin: -1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ createdAt: -1 });

// Transform for JSON output
UserSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.otpCode;
    delete ret.googleId;
    delete ret.loginAttempts;
    delete ret.lockUntil;
    return ret;
  }
});

export default mongoose.model('User', UserSchema);