// controllers/userProfileController.js - SIMPLIFIED VERSION

import mongoose from 'mongoose';
import User from '../models/User.js';
import UserProfile from '../models/UserProfile.js';
import UserSettings from '../models/UserSettings.js';
import Subscription from '../models/Subscription.js';
import Follow from '../models/Follow.js';
import { deleteFromCloudinary, getPublicIdFromUrl } from '../services/cloudinaryService.js';

const getBaseUrl = () => {
  return process.env.VITE_API_URL?.replace('/api', '') || 
         process.env.API_URL?.replace('/api', '') || 
         'http://localhost:5000';
};

// ============================================
// PUBLIC PROFILE
// ============================================
export const getPublicProfile = async (req, res) => {
  try {
    const { username } = req.params;
    
    const user = await User.findOne({
      $or: [
        { username: username },
        { _id: username.match(/^[0-9a-fA-F]{24}$/) ? username : null }
      ]
    }).select('-password -otpCode -loginAttempts -lockUntil');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let profile = await UserProfile.findOne({ userId: user._id });
    
    if (!profile) {
      profile = await UserProfile.create({
        userId: user._id,
        firstName: user.name?.split(' ')[0] || '',
        lastName: user.name?.split(' ').slice(1).join(' ') || '',
        username: user.username
      });
    }

    // Check privacy
    if (profile.privacy?.profileVisibility === 'private') {
      return res.json({
        success: true,
        profile: {
          id: user._id,
          name: user.name,
          username: user.username,
          avatar: user.avatarUrl,
          isPrivate: true
        }
      });
    }

    const followersCount = await Follow.countDocuments({ following: user._id });
    const followingCount = await Follow.countDocuments({ follower: user._id });

    let postsCount = 0;
    try {
      const Post = (await import('../models/Post.js')).default;
      postsCount = await Post.countDocuments({ userId: user._id });
    } catch (error) {
      postsCount = 0;
    }

    const BASE_URL = getBaseUrl();
    
    let bannerUrl = profile.bannerImage;
    if (bannerUrl && !bannerUrl.startsWith('http')) {
      bannerUrl = `${BASE_URL}${bannerUrl}`;
    }

    const profileData = {
      id: user._id,
      name: user.name,
      username: user.username,
      avatar: user.avatarUrl,
      avatarInitial: user.avatarInitial,
      bio: profile.bio || '',
      location: profile.country || '',
      bannerImage: bannerUrl,
      socialLinks: profile.socialLinks || {},
      followers: followersCount,
      following: followingCount,
      postsCount: postsCount,
      badge: profile.badge,
      experienceLevel: profile.experienceLevel,
      joinDate: profile.stats?.joinDate || user.createdAt
    };

    return res.json({ success: true, profile: profileData });

  } catch (error) {
    console.error('Error in getPublicProfile:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============================================
// GET COMPLETE PROFILE (AUTH REQUIRED)
// ============================================
export const getCompleteProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -otpCode -loginAttempts -lockUntil');
      
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let profile = await UserProfile.findOne({ userId: user._id });
    
    if (!profile) {
      profile = new UserProfile({ userId: user._id });
      await profile.save();
    }

    let settings = await UserSettings.findOne({ userId: user._id });
    if (!settings) {
      settings = await UserSettings.create({ userId: user._id });
    }

    const subscription = await Subscription.findOne({ userId: user._id });
    const followersCount = await Follow.countDocuments({ following: user._id });
    const followingCount = await Follow.countDocuments({ follower: user._id });

    let postsCount = 0;
    try {
      const Post = (await import('../models/Post.js')).default;
      postsCount = await Post.countDocuments({ userId: user._id });
    } catch (error) {
      postsCount = 0;
    }

    const BASE_URL = getBaseUrl();
    
    let bannerUrl = profile.bannerImage;
    if (bannerUrl && !bannerUrl.startsWith('http')) {
      bannerUrl = `${BASE_URL}${bannerUrl}`;
    }

    const userData = {
      id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      avatar: user.avatarUrl,
      avatarInitial: user.avatarInitial,
      createdAt: user.createdAt,
      
      // Profile fields
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      bio: profile.bio || '',
      phone: profile.phone || '',
      country: profile.country || '',
      bannerImage: bannerUrl,
      socialLinks: profile.socialLinks || {},
      
      // Trading connections
      tradingConnections: profile.tradingConnections,
      
      // Stats
      followers: followersCount,
      following: followingCount,
      postsCount: postsCount,
      
      // Trading stats (real data)
      tradingStats: profile.tradingStats,
      badge: profile.badge,
      experienceLevel: profile.experienceLevel,
      
      // Settings
      settings: settings,
      subscription: subscription || { plan: 'free', status: 'active' },
      
      // Privacy
      privacy: profile.privacy
    };

    return res.json({ success: true, user: userData });

  } catch (error) {
    console.error('Error in getCompleteProfile:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============================================
// UPDATE PROFILE (Simplified)
// ============================================
export const updateCompleteProfile = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    const {
      firstName, lastName, username, bio, phone, country,
      socialLinks, privacy
    } = req.body;

    // Update username if changed
    if (username) {
      const existingUser = await User.findOne({ 
        username, 
        _id: { $ne: req.user._id } 
      }).session(session);
      
      if (existingUser) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: "Username already taken"
        });
      }
      
      await User.findByIdAndUpdate(req.user._id, { username }, { session });
    }

    // Update name if provided
    if (firstName || lastName) {
      const name = `${firstName || ''} ${lastName || ''}`.trim();
      await User.findByIdAndUpdate(req.user._id, { name }, { session });
    }

    // Update profile
    const profileUpdate = {};
    if (firstName !== undefined) profileUpdate.firstName = firstName;
    if (lastName !== undefined) profileUpdate.lastName = lastName;
    if (username !== undefined) profileUpdate.username = username;
    if (bio !== undefined) profileUpdate.bio = bio;
    if (phone !== undefined) profileUpdate.phone = phone;
    if (country !== undefined) profileUpdate.country = country;
    if (socialLinks !== undefined) profileUpdate.socialLinks = socialLinks;
    if (privacy !== undefined) profileUpdate.privacy = privacy;

    const updatedProfile = await UserProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: profileUpdate },
      { new: true, upsert: true, session }
    );

    await session.commitTransaction();

    const updatedUser = await User.findById(req.user._id)
      .select('-password -otpCode');

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          username: updatedUser.username,
          avatar: updatedUser.avatarUrl,
          avatarInitial: updatedUser.avatarInitial
        },
        profile: updatedProfile
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error("Error in updateCompleteProfile:", error);
    res.status(500).json({
      success: false,
      message: "Server Error: " + error.message
    });
  } finally {
    session.endSession();
  }
};

// ============================================
// UPLOAD AVATAR (Cloudinary)
// ============================================
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Delete old avatar from Cloudinary if exists
    if (user.avatarUrl && user.avatarUrl.includes('cloudinary')) {
      const publicId = getPublicIdFromUrl(user.avatarUrl);
      if (publicId) {
        await deleteFromCloudinary(publicId, { resource_type: 'image' });
      }
    }

    user.avatarUrl = req.file.path;
    await user.save();

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      avatar: user.avatarUrl,
      avatarInitial: user.avatarInitial
    });
  } catch (error) {
    console.error('Error in uploadAvatar:', error);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// ============================================
// DELETE AVATAR
// ============================================
export const deleteAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.avatarUrl && user.avatarUrl.includes('cloudinary')) {
      const publicId = getPublicIdFromUrl(user.avatarUrl);
      if (publicId) {
        await deleteFromCloudinary(publicId, { resource_type: 'image' });
      }
    }

    user.avatarUrl = null;
    await user.save();

    res.json({ success: true, message: "Avatar removed successfully" });
  } catch (error) {
    console.error("Error in deleteAvatar:", error);
    res.status(500).json({ success: false, message: "Server Error: " + error.message });
  }
};

// ============================================
// UPLOAD BANNER
// ============================================
export const uploadBanner = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    let profile = await UserProfile.findOne({ userId: req.user._id });
    
    if (!profile) {
      profile = new UserProfile({ userId: req.user._id });
    }

    // Delete old banner from Cloudinary if exists
    if (profile.bannerImage && profile.bannerImage.includes('cloudinary')) {
      const publicId = getPublicIdFromUrl(profile.bannerImage);
      if (publicId) {
        await deleteFromCloudinary(publicId, { resource_type: 'image' });
      }
    }

    profile.bannerImage = req.file.path;
    await profile.save();

    const user = await User.findById(req.user._id).select('-password -otpCode');
    
    res.json({
      success: true,
      message: 'Banner uploaded successfully',
      bannerImage: req.file.path,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        avatar: user.avatarUrl,
        banner: req.file.path
      }
    });
  } catch (error) {
    console.error('Error uploading banner:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// ============================================
// REMOVE BANNER
// ============================================
export const removeBanner = async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    if (profile.bannerImage && profile.bannerImage.includes('cloudinary')) {
      const publicId = getPublicIdFromUrl(profile.bannerImage);
      if (publicId) {
        await deleteFromCloudinary(publicId, { resource_type: 'image' });
      }
    }
    
    profile.bannerImage = null;
    await profile.save();

    res.json({ success: true, message: 'Banner removed successfully' });
  } catch (error) {
    console.error('Error removing banner:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// ============================================
// GET BASIC PROFILE
// ============================================
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -otpCode');
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const [profile, subscription, settings] = await Promise.all([
      UserProfile.findOne({ userId: req.user._id }),
      Subscription.findOne({ userId: req.user._id }),
      UserSettings.findOne({ userId: req.user._id })
    ]);

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        isActive: user.isActive,
        avatar: user.avatarUrl,
        avatarInitial: user.avatarInitial,
        profile: profile || {},
        subscription: subscription || { plan: 'free', status: 'active' },
        settings: settings || {}
      }
    });
  } catch (error) {
    console.error("Error in getProfile:", error);
    res.status(500).json({ success: false, message: "Server Error: " + error.message });
  }
};

// ============================================
// GET USER SETTINGS
// ============================================
export const getUserSettings = async (req, res) => {
  try {
    let settings = await UserSettings.findOne({ userId: req.user._id });
    
    if (!settings) {
      settings = await UserSettings.create({ userId: req.user._id });
    }

    res.json({ success: true, settings });
  } catch (error) {
    console.error("Error in getUserSettings:", error);
    res.status(500).json({ success: false, message: "Server Error: " + error.message });
  }
};

// ============================================
// UPDATE USER SETTINGS
// ============================================
export const updateUserSettings = async (req, res) => {
  try {
    const { notifications, trading, security, privacy, data } = req.body;

    const settings = await UserSettings.findOneAndUpdate(
      { userId: req.user._id },
      { 
        $set: {
          ...(notifications && { notifications }),
          ...(trading && { trading }),
          ...(security && { security }),
          ...(privacy && { privacy }),
          ...(data && { data })
        }
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: "Settings updated successfully",
      settings
    });
  } catch (error) {
    console.error("Error in updateUserSettings:", error);
    res.status(500).json({ success: false, message: "Server Error: " + error.message });
  }
};

// ============================================
// GET SUBSCRIPTION
// ============================================
export const getSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ userId: req.user._id });
    
    const defaultSubscription = {
      plan: 'free',
      status: 'active',
      features: {
        advancedCharts: false,
        realTimeSignals: false,
        automatedTrading: false,
        maxPortfolios: 1,
        maxWatchlists: 3
      }
    };

    res.json({ success: true, subscription: subscription || defaultSubscription });
  } catch (error) {
    console.error("Error in getSubscription:", error);
    res.status(500).json({ success: false, message: "Server Error: " + error.message });
  }
};