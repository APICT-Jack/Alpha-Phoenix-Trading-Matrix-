import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import UserProfile from '../models/UserProfile.js';
import UserSettings from '../models/UserSettings.js';
import Subscription from '../models/Subscription.js';

// Named export for authenticateToken
export const authenticateToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'No token provided',
        authenticated: false 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    // Use Mongoose - find user by ID and populate virtuals
    const user = await User.findById(decoded.userId)
      .select('-password -otpCode -otpExpiry');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found',
        authenticated: false 
      });
    }

    // Check if user is active (since you have OTP verification)
    if (!user.isActive) {
      return res.status(401).json({ 
        success: false,
        error: 'Account not verified. Please verify your email.',
        authenticated: false 
      });
    }

    // Optional: Fetch additional user data for complete context
    // This can be useful for routes that need full user data
    if (req.originalUrl.includes('/api/profile') || req.originalUrl.includes('/api/settings')) {
      try {
        const [userProfile, userSettings, subscription] = await Promise.all([
          UserProfile.findOne({ userId: user._id }),
          UserSettings.findOne({ userId: user._id }),
          Subscription.findOne({ userId: user._id })
        ]);

        // Attach additional data to user object
        user._doc.profile = userProfile || {};
        user._doc.settings = userSettings || {};
        user._doc.subscription = subscription || { plan: 'free', status: 'active' };
      } catch (dbError) {
        console.warn('Could not fetch additional user data:', dbError.message);
        // Continue without additional data - it's optional
      }
    }

    // Update last active timestamp (optional - for activity tracking)
    try {
      await UserProfile.findOneAndUpdate(
        { userId: user._id },
        { $set: { 'stats.lastActive': new Date() } },
        { upsert: true }
      );
    } catch (activityError) {
      console.warn('Could not update last active timestamp:', activityError.message);
    }

    // Attach the full user object to req.user with virtuals
    req.user = user;
    
    console.log(`🔐 Authenticated user: ${user.email} (${user._id})`);
    next();
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    let errorMessage = 'Authentication failed';
    let statusCode = 500;

    if (error.name === 'JsonWebTokenError') {
      errorMessage = 'Invalid token';
      statusCode = 401;
    } else if (error.name === 'TokenExpiredError') {
      errorMessage = 'Token expired';
      statusCode = 401;
    }

    return res.status(statusCode).json({ 
      success: false,
      error: errorMessage,
      authenticated: false,
      ...(error.name === 'TokenExpiredError' && { tokenExpired: true })
    });
  }
};

// Optional: Add other auth-related exports if needed
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const user = await User.findById(decoded.userId).select('-password -otpCode -otpExpiry');
    
    req.user = user || null;
    next();
    
  } catch (error) {
    req.user = null;
    next();
  }
};

// Default export for backward compatibility
export default authenticateToken;