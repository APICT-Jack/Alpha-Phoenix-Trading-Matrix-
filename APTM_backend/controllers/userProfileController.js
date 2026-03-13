// controllers/userProfileController.js - COMPLETE FIXED VERSION

import mongoose from 'mongoose';
import User from '../models/User.js';
import UserProfile from '../models/UserProfile.js';
import UserSettings from '../models/UserSettings.js';
import Subscription from '../models/Subscription.js';
import Follow from '../models/Follow.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// HELPER FUNCTION FOR URLS - ADD THIS AT THE TOP
// ============================================
const getBaseUrl = () => {
  return process.env.VITE_API_URL?.replace('/api', '') || 
         process.env.API_URL?.replace('/api', '') || 
         'http://localhost:5000';
};

// ============================================
// PUBLIC PROFILE (NO AUTH REQUIRED) - FIXED WITH POSTS COUNT
// ============================================
export const getPublicProfile = async (req, res) => {
  try {
    const { username } = req.params;
    console.log('📡 Fetching public profile for username:', username);

    // Find user by username or id
    const user = await User.findOne({
      $or: [
        { username: username },
        { _id: username.match(/^[0-9a-fA-F]{24}$/) ? username : null }
      ]
    }).select('-password -otpCode -loginAttempts -lockUntil');

    if (!user) {
      console.log('❌ User not found with username/ID:', username);
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    console.log('✅ Found user:', { id: user._id, name: user.name, username: user.username });

    // Get user profile
    let profile = await UserProfile.findOne({ userId: user._id });
    
    // Create profile if doesn't exist
    if (!profile) {
      console.log('Creating new profile for user:', user._id);
      profile = await UserProfile.create({
        userId: user._id,
        firstName: user.name?.split(' ')[0] || '',
        lastName: user.name?.split(' ').slice(1).join(' ') || '',
        username: user.username,
        stats: {
          joinDate: user.createdAt,
          lastActive: user.lastLogin || new Date()
        }
      });
    }

    // Get followers count
    const followersCount = await Follow.countDocuments({ following: user._id });
    
    // Get following count
    const followingCount = await Follow.countDocuments({ follower: user._id });

    // ========== FIXED: Get actual posts count from Post model ==========
    let postsCount = 0;
    try {
      // Import Post model dynamically to avoid circular dependencies
      const Post = (await import('../models/Post.js')).default;
      postsCount = await Post.countDocuments({ userId: user._id });
      console.log(`📊 Found ${postsCount} posts for user ${user._id}`);
    } catch (error) {
      console.log('Could not get posts count:', error.message);
      // If Post model doesn't exist yet, default to 0
      postsCount = 0;
    }

    // Check privacy settings
    if (profile.privacy?.profileVisibility === 'private') {
      // Only return minimal info for private profiles
      return res.status(200).json({
        success: true,
        profile: {
          id: user._id,
          name: user.name,
          username: user.username,
          avatar: user.avatarUrl,
          avatarInitial: user.avatarInitial,
          isPrivate: true,
          message: "This profile is private"
        }
      });
    }

    const BASE_URL = getBaseUrl();

    // Format banner URL properly
    let bannerUrl = null;
    if (profile.bannerImage) {
      // If it's already a full URL, use it
      if (profile.bannerImage.startsWith('http')) {
        bannerUrl = profile.bannerImage;
      } 
      // If it's a path starting with /uploads
      else if (profile.bannerImage.startsWith('/uploads/')) {
        bannerUrl = `${BASE_URL}${profile.bannerImage}`;
      }
      // If it's just a filename
      else {
        bannerUrl = `${BASE_URL}/uploads/banners/${profile.bannerImage}`;
      }
    }

    // Format social links - ensure they're properly extracted
    const socialLinks = profile.socialLinks || {};

    console.log('🖼️ Banner for public profile:', {
      rawBanner: profile.bannerImage,
      formattedBanner: bannerUrl,
      hasBanner: !!bannerUrl
    });

    console.log('🔗 Social links for public profile:', socialLinks);

    // Format the response with CORRECT postsCount
    const profileData = {
      id: user._id,
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      avatar: user.avatarUrl,
      avatarInitial: user.avatarInitial,
      
      // Profile data
      bio: profile.bio || '',
      country: profile.country || '',
      location: profile.country || 'Not specified',
      tradingExperience: profile.tradingExperience || 'beginner',
      joinDate: profile.stats?.joinDate || user.createdAt,
      
      // Banner - FIXED
      bannerImage: bannerUrl,
      banner: bannerUrl,
      hasBanner: !!bannerUrl,
      
      // Social Links - FIXED
      socialLinks: socialLinks,
      
      // Stats with correct counts
      followers: followersCount,
      following: followingCount,
      postsCount: postsCount, // Now this is the actual count!
      
      stats: {
        followers: followersCount,
        following: followingCount,
        posts: postsCount, // Now this is the actual count!
        tradesCompleted: profile.stats?.tradesCompleted || 0,
        successRate: profile.stats?.successRate || 0,
        lastActive: profile.stats?.lastActive || user.lastLogin || new Date()
      },
      
      profile: {
        ...profile.toObject(),
        followers: followersCount,
        following: followingCount,
        postsCount: postsCount // Now this is the actual count!
      }
    };

    console.log('✅ Sending public profile with postsCount:', postsCount);

    return res.json({
      success: true,
      profile: profileData,
      user: profileData
    });

  } catch (error) {
    console.error('❌ Error in getPublicProfile:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// ============================================
// GET COMPLETE PROFILE (AUTH REQUIRED) - FIXED WITH POSTS COUNT
// ============================================
// ============================================
// GET COMPLETE PROFILE (AUTH REQUIRED) - WITH DETAILED DEBUG LOGGING
// ============================================
export const getCompleteProfile = async (req, res) => {
  try {
    console.log('='.repeat(50));
    console.log('📡 FETCHING COMPLETE PROFILE');
    console.log('='.repeat(50));
    console.log('👤 User ID from request:', req.user?._id);
    console.log('👤 Full req.user object:', JSON.stringify(req.user, null, 2));

    // Step 1: Get user
    console.log('\n📌 STEP 1: Finding user...');
    const user = await User.findById(req.user._id)
      .select('-password -otpCode -loginAttempts -lockUntil');
      
    if (!user) {
      console.log('❌ User not found with ID:', req.user._id);
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    console.log('✅ User found:', { 
      id: user._id, 
      name: user.name, 
      username: user.username,
      email: user.email,
      avatar: user.avatarUrl 
    });

    // Step 2: Get or create profile
    console.log('\n📌 STEP 2: Getting/creating profile...');
    let profile = await UserProfile.findOne({ userId: user._id });
    console.log('📋 Profile found?', profile ? 'YES' : 'NO');
    
    if (!profile) {
      console.log('📝 Creating new profile for user:', user._id);
      profile = new UserProfile({ 
        userId: user._id,
        firstName: user.name?.split(' ')[0] || '',
        lastName: user.name?.split(' ').slice(1).join(' ') || '',
        username: user.username
      });
      await profile.save();
      console.log('✅ Profile created with ID:', profile._id);
    } else {
      console.log('✅ Existing profile found:', profile._id);
    }

    // Step 3: Get settings
    console.log('\n📌 STEP 3: Getting settings...');
    let settings = await UserSettings.findOne({ userId: user._id });
    console.log('⚙️ Settings found?', settings ? 'YES' : 'NO');
    
    if (!settings) {
      console.log('📝 Creating new settings for user:', user._id);
      settings = await UserSettings.create({ userId: user._id });
      console.log('✅ Settings created');
    }

    // Step 4: Get subscription
    console.log('\n📌 STEP 4: Getting subscription...');
    const subscription = await Subscription.findOne({ userId: user._id });
    console.log('💳 Subscription found?', subscription ? 'YES' : 'NO');

    // Step 5: Get followers count
    console.log('\n📌 STEP 5: Getting followers count...');
    const followersCount = await Follow.countDocuments({ following: user._id });
    console.log('👥 Followers count:', followersCount);

    // Step 6: Get following count
    console.log('\n📌 STEP 6: Getting following count...');
    const followingCount = await Follow.countDocuments({ follower: user._id });
    console.log('👥 Following count:', followingCount);

    // Step 7: Get posts count
    console.log('\n📌 STEP 7: Getting posts count...');
    let postsCount = 0;
    try {
      console.log('📦 Dynamically importing Post model...');
      const Post = (await import('../models/Post.js')).default;
      console.log('✅ Post model imported successfully');
      
      postsCount = await Post.countDocuments({ userId: user._id });
      console.log(`📊 Posts count: ${postsCount}`);
    } catch (error) {
      console.log('❌ Could not get posts count:', error.message);
      console.log('❌ Error stack:', error.stack);
      postsCount = 0;
    }

    // Step 8: Get base URL
    console.log('\n📌 STEP 8: Getting base URL...');
    const BASE_URL = getBaseUrl();
    console.log('🔗 Base URL:', BASE_URL);

    // Step 9: Format banner URL
    console.log('\n📌 STEP 9: Formatting banner URL...');
    let bannerUrl = null;
    if (profile.bannerImage) {
      console.log('🖼️ Raw banner image:', profile.bannerImage);
      try {
        if (profile.bannerImage.startsWith('http')) {
          bannerUrl = profile.bannerImage;
        } else if (profile.bannerImage.startsWith('/uploads/')) {
          bannerUrl = `${BASE_URL}${profile.bannerImage}`;
        } else {
          bannerUrl = `${BASE_URL}/uploads/banners/${profile.bannerImage}`;
        }
        console.log('✅ Formatted banner URL:', bannerUrl);
      } catch (bannerError) {
        console.log('❌ Error formatting banner:', bannerError.message);
        bannerUrl = null;
      }
    } else {
      console.log('ℹ️ No banner image found');
    }

    // Step 10: Format social links
    console.log('\n📌 STEP 10: Formatting social links...');
    const socialLinks = profile.socialLinks || {};
    console.log('🔗 Social links found:', Object.keys(socialLinks).length);

    // Step 11: Build response object
    console.log('\n📌 STEP 11: Building response object...');
    const userData = {
      id: user._id,
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      avatar: user.avatarUrl,
      avatarInitial: user.avatarInitial,
      createdAt: user.createdAt,
      
      // Profile data
      bio: profile.bio || '',
      country: profile.country || '',
      location: profile.country || 'Not specified',
      tradingExperience: profile.tradingExperience || 'beginner',
      joinDate: profile.stats?.joinDate || user.createdAt,
      
      // Banner
      bannerImage: bannerUrl,
      banner: bannerUrl,
      hasBanner: !!bannerUrl,
      
      // Social Links
      socialLinks: socialLinks,
      
      // Stats
      followers: followersCount,
      following: followingCount,
      postsCount: postsCount,
      
      stats: {
        posts: postsCount,
        chatRooms: profile.stats?.chatRooms || 0,
        charts: profile.stats?.charts || 0,
        news: profile.stats?.news || 0,
        followers: followersCount,
        following: followingCount,
        tradesCompleted: profile.stats?.tradesCompleted || 0,
        successRate: profile.stats?.successRate || 0,
        lastActive: profile.stats?.lastActive || new Date()
      },
      
      profile: {
        ...profile.toObject(),
        followers: followersCount,
        following: followingCount,
        postsCount: postsCount
      },
      
      settings: settings,
      subscription: subscription || { plan: 'free', status: 'active' }
    };

    console.log('\n✅ Complete profile built successfully');
    console.log('📊 Final data:', {
      userId: userData.id,
      name: userData.name,
      postsCount: userData.postsCount,
      followers: userData.followers,
      hasBanner: userData.hasBanner,
      socialLinksCount: Object.keys(userData.socialLinks).length
    });

    return res.json({
      success: true,
      user: userData,
      profile: userData
    });

  } catch (error) {
    console.error('\n❌❌❌ ERROR IN getCompleteProfile ❌❌❌');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// ============================================
// UPLOAD BANNER - FIXED
// ============================================
export const uploadBanner = async (req, res) => {
  try {
    console.log('📤 Upload banner request received');
    console.log('📁 File details:', req.file);
    console.log('👤 User ID:', req.user._id);

    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    // Find or create user profile
    let profile = await UserProfile.findOne({ userId: req.user._id });
    
    if (!profile) {
      profile = new UserProfile({ userId: req.user._id });
    }

    // Delete old banner if exists
    if (profile.bannerImage) {
      let oldFilename = profile.bannerImage;
      if (oldFilename.includes('/')) {
        oldFilename = oldFilename.split('/').pop();
      }
      const oldBannerPath = path.join(process.cwd(), 'uploads', 'banners', oldFilename);
      if (fs.existsSync(oldBannerPath)) {
        fs.unlinkSync(oldBannerPath);
        console.log('🗑️ Deleted old banner:', oldFilename);
      }
    }

    // Update banner with just the filename
    const bannerFilename = req.file.filename;
    profile.bannerImage = bannerFilename;
    await profile.save();

    const BASE_URL = getBaseUrl();

    // Generate full banner URL
    const bannerUrl = `${BASE_URL}/uploads/banners/${bannerFilename}`;

    console.log('✅ Banner uploaded successfully:', {
      filename: bannerFilename,
      url: bannerUrl
    });

    // Get updated user data
    const user = await User.findById(req.user._id).select('-password -otpCode');
    
    return res.json({
      success: true,
      message: 'Banner uploaded successfully',
      bannerImage: bannerFilename,
      bannerUrl: bannerUrl,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        avatar: user.avatarUrl,
        banner: bannerUrl,
        hasBanner: true
      }
    });

  } catch (error) {
    console.error('❌ Error uploading banner:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + error.message,
      error: error.message 
    });
  }
};

// ============================================
// REMOVE BANNER
// ============================================
export const removeBanner = async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({ 
        success: false, 
        message: 'Profile not found' 
      });
    }

    // Delete banner file if exists
    if (profile.bannerImage) {
      let filename = profile.bannerImage;
      if (filename.includes('/')) {
        filename = filename.split('/').pop();
      }
      const bannerPath = path.join(process.cwd(), 'uploads', 'banners', filename);
      if (fs.existsSync(bannerPath)) {
        fs.unlinkSync(bannerPath);
        console.log('🗑️ Deleted banner:', filename);
      }
      profile.bannerImage = null;
      await profile.save();
    }

    return res.json({
      success: true,
      message: 'Banner removed successfully'
    });

  } catch (error) {
    console.error('❌ Error removing banner:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + error.message 
    });
  }
};

// ============================================
// TEST BANNER UPLOAD
// ============================================
export const testBannerUpload = async (req, res) => {
  try {
    console.log('🧪 Test banner upload received');
    console.log('File:', req.file);
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    const BASE_URL = getBaseUrl();
    const bannerUrl = `${BASE_URL}/uploads/banners/${req.file.filename}`;

    return res.json({
      success: true,
      message: 'Test upload successful',
      file: req.file,
      url: bannerUrl
    });

  } catch (error) {
    console.error('❌ Test upload error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + error.message 
    });
  }
};

// ============================================
// UPLOAD AVATAR - FIXED
// ============================================
export const uploadAvatar = async (req, res) => {
  try {
    console.log('📤 Upload avatar request received');
    console.log('📁 File details:', req.file);

    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Delete old avatar if exists
    if (user.avatar && !user.avatar.startsWith('http')) {
      const oldFilename = user.avatar.split('/').pop();
      const oldAvatarPath = path.join(process.cwd(), 'uploads', 'avatars', oldFilename);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
        console.log('🗑️ Deleted old avatar:', oldFilename);
      }
    }

    // Save new avatar
    const avatarPath = `/uploads/avatars/${req.file.filename}`;
    user.avatar = avatarPath;
    await user.save();

    const BASE_URL = getBaseUrl();
    const avatarUrl = `${BASE_URL}${avatarPath}`;

    console.log('✅ Avatar uploaded successfully:', {
      filename: req.file.filename,
      url: avatarUrl
    });

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully',
      avatar: avatarUrl,
      avatarInitial: user.avatarInitial,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        avatar: avatarUrl
      }
    });
  } catch (error) {
    console.error('❌ Error in uploadAvatar:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error: ' + error.message 
    });
  }
};

// ============================================
// DELETE AVATAR
// ============================================
export const deleteAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Remove avatar file if exists
    if (user.avatar && !user.avatar.startsWith('http')) {
      const filename = user.avatar.split('/').pop();
      const filePath = path.join(process.cwd(), 'uploads', 'avatars', filename);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('🗑️ Deleted avatar:', filename);
      }
    }

    // Remove avatar from user
    user.avatar = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Avatar removed successfully"
    });
  } catch (error) {
    console.error("Error in deleteAvatar:", error);
    res.status(500).json({
      success: false,
      message: "Server Error: " + error.message
    });
  }
};

// ============================================
// GET BASIC PROFILE
// ============================================
export const getProfile = async (req, res) => {
  try {
    console.log('🔍 Fetching profile for user:', req.user._id);
    
    const user = await User.findById(req.user._id).select('-password -otpCode');
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    const [profile, subscription, settings] = await Promise.all([
      UserProfile.findOne({ userId: req.user._id }),
      Subscription.findOne({ userId: req.user._id }),
      UserSettings.findOne({ userId: req.user._id })
    ]);

    const responseData = {
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        isActive: user.isActive,
        avatar: user.avatarUrl,
        avatarInitial: user.avatarInitial,
        displayName: user.displayName,
        profile: profile || {},
        subscription: subscription || { plan: 'free', status: 'active' },
        settings: settings || {}
      }
    };
    
    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error in getProfile:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server Error: " + error.message 
    });
  }
};

// ============================================
// UPDATE COMPLETE PROFILE
// ============================================
export const updateCompleteProfile = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    const {
      firstName, lastName, username, bio, phone, country, timezone,
      tradingExperience, preferredMarkets, riskAppetite,
      interests, codingExperience, gender, idNumber, dateOfBirth,
      address, socialLinks, privacy,
      notifications, trading, security, data
    } = req.body;

    // Update User basic info
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
      
      await User.findByIdAndUpdate(
        req.user._id, 
        { username }, 
        { session }
      );
    }

    // Update name if first/last name provided
    if (firstName || lastName) {
      const name = `${firstName || ''} ${lastName || ''}`.trim();
      await User.findByIdAndUpdate(
        req.user._id,
        { name },
        { session }
      );
    }

    // Update UserProfile
    const profileUpdate = {};
    const profileFields = [
      'firstName', 'lastName', 'username', 'bio', 'phone', 'country', 'timezone',
      'tradingExperience', 'preferredMarkets', 'riskAppetite', 'interests',
      'codingExperience', 'gender', 'idNumber', 'dateOfBirth', 'address',
      'socialLinks', 'privacy'
    ];

    profileFields.forEach(field => {
      if (req.body[field] !== undefined) {
        profileUpdate[field] = req.body[field];
      }
    });

    const updatedProfile = await UserProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: profileUpdate },
      { new: true, upsert: true, session }
    );

    // Update UserSettings
    const settingsUpdate = {};
    const settingsFields = ['notifications', 'trading', 'security', 'data'];
    
    settingsFields.forEach(field => {
      if (req.body[field] !== undefined) {
        settingsUpdate[field] = req.body[field];
      }
    });

    const updatedSettings = await UserSettings.findOneAndUpdate(
      { userId: req.user._id },
      { $set: settingsUpdate },
      { new: true, upsert: true, session }
    );

    await session.commitTransaction();

    // Fetch updated user data
    const updatedUser = await User.findById(req.user._id)
      .select('-password -otpCode');

    res.status(200).json({
      success: true,
      message: "Profile and settings updated successfully",
      data: {
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          username: updatedUser.username,
          avatar: updatedUser.avatarUrl,
          avatarInitial: updatedUser.avatarInitial,
          displayName: updatedUser.displayName
        },
        profile: updatedProfile,
        settings: updatedSettings
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
// UPDATE PROFILE (LEGACY)
// ============================================
export const updateProfile = async (req, res) => {
  try {
    const {
      name, username, bio, phone, country, timezone,
      tradingExperience, preferredMarkets, riskAppetite,
      interests, codingExperience, gender, idNumber, dateOfBirth,
      address, socialLinks, privacy
    } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Update user basic info
      if (name || username) {
        const updateData = {};
        if (name) updateData.name = name;
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
          updateData.username = username;
        }
        await User.findByIdAndUpdate(req.user._id, updateData, { session });
      }

      // Build profile update object
      const profileUpdate = {};
      
      if (name) {
        const nameParts = name.split(' ');
        profileUpdate.firstName = nameParts[0] || '';
        profileUpdate.lastName = nameParts.slice(1).join(' ') || '';
      }
      if (username) profileUpdate.username = username;
      if (bio !== undefined) profileUpdate.bio = bio;
      if (phone !== undefined) profileUpdate.phone = phone;
      if (country !== undefined) profileUpdate.country = country;
      if (timezone !== undefined) profileUpdate.timezone = timezone;
      if (tradingExperience !== undefined) profileUpdate.tradingExperience = tradingExperience;
      if (preferredMarkets !== undefined) profileUpdate.preferredMarkets = preferredMarkets;
      if (riskAppetite !== undefined) profileUpdate.riskAppetite = riskAppetite;
      if (interests !== undefined) profileUpdate.interests = interests;
      if (codingExperience !== undefined) profileUpdate.codingExperience = codingExperience;
      if (gender !== undefined) profileUpdate.gender = gender;
      if (idNumber !== undefined) profileUpdate.idNumber = idNumber;
      if (dateOfBirth !== undefined) profileUpdate.dateOfBirth = dateOfBirth;
      if (address !== undefined) profileUpdate.address = address;
      if (socialLinks !== undefined) profileUpdate.socialLinks = socialLinks;
      if (privacy !== undefined) profileUpdate.privacy = privacy;

      const updatedProfile = await UserProfile.findOneAndUpdate(
        { userId: req.user._id },
        { $set: profileUpdate },
        { new: true, upsert: true, session }
      );

      await session.commitTransaction();

      // Fetch updated user data
      const updatedUser = await User.findById(req.user._id).select('-password -otpCode');

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          username: updatedUser.username,
          avatar: updatedUser.avatarUrl,
          avatarInitial: updatedUser.avatarInitial,
          displayName: updatedUser.displayName,
          profile: updatedProfile
        }
      });

    } catch (transactionError) {
      await session.abortTransaction();
      throw transactionError;
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error("Error in updateProfile:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server Error: " + error.message 
    });
  }
};

// ============================================
// UPLOAD DOCUMENT
// ============================================
export const uploadDocument = async (req, res) => {
  try {
    const { documentType } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    if (!['idCopy', 'bankStatement', 'proofOfResidence'].includes(documentType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid document type' 
      });
    }

    const documentData = {
      url: `/uploads/documents/${req.file.filename}`,
      publicId: req.file.filename,
      uploadedAt: new Date(),
      verified: false
    };

    const updateField = `documents.${documentType}`;
    
    const updatedProfile = await UserProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: { [updateField]: documentData } },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Document uploaded successfully',
      documentType,
      document: updatedProfile.documents[documentType]
    });
  } catch (error) {
    console.error('Error in uploadDocument:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error: ' + error.message 
    });
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

    res.status(200).json({
      success: true,
      settings
    });
  } catch (error) {
    console.error("Error in getUserSettings:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server Error: " + error.message 
    });
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

    res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      settings
    });
  } catch (error) {
    console.error("Error in updateUserSettings:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server Error: " + error.message 
    });
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
        customIndicators: false,
        privateChats: false,
        expertAccess: false,
        liveSessions: false,
        premiumCourses: false,
        oneOnOneCoaching: false,
        tradingTools: false,
        maxPortfolios: 1,
        maxWatchlists: 3,
        apiCallsPerMinute: 60,
        signalAlertsPerDay: 10
      }
    };

    res.status(200).json({
      success: true,
      subscription: subscription || defaultSubscription
    });
  } catch (error) {
    console.error("Error in getSubscription:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server Error: " + error.message 
    });
  }
};

// ============================================
// UPLOAD ADDRESS PROOF
// ============================================
export const uploadAddressProof = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    const { documentType } = req.body;
    const allowedTypes = ['utility_bill', 'bank_statement', 'government_letter', 
                         'tax_document', 'lease_agreement', 'drivers_license', 'id_card'];
    
    if (!allowedTypes.includes(documentType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid document type' 
      });
    }

    const documentPath = `/uploads/address-proofs/${req.file.filename}`;
    const profile = await UserProfile.findOne({ userId: req.user._id });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found"
      });
    }

    // Update address proof
    profile.addressProof = {
      documentUrl: documentPath,
      documentType,
      verified: false,
      uploadedAt: new Date()
    };

    await profile.save();

    res.status(200).json({
      success: true,
      message: 'Address proof uploaded successfully',
      documentUrl: documentPath,
      documentType,
      uploadedAt: profile.addressProof.uploadedAt
    });
  } catch (error) {
    console.error('Error uploading address proof:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error: ' + error.message 
    });
  }
};

// ============================================
// CONNECT TRADING PLATFORM
// ============================================
export const connectTradingPlatform = async (req, res) => {
  try {
    const { platform, accountId, broker, server, username } = req.body;
    
    if (!['mt4', 'mt5', 'tradingview'].includes(platform)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid platform'
      });
    }

    const profile = await UserProfile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found"
      });
    }

    // Update platform connection
    if (platform === 'mt4' || platform === 'mt5') {
      profile.tradingPlatforms[platform] = {
        connected: true,
        accountId,
        broker,
        server,
        lastSync: new Date()
      };
    } else if (platform === 'tradingview') {
      profile.tradingPlatforms.tradingview = {
        connected: true,
        username,
        lastSync: new Date()
      };
    }

    await profile.save();

    res.status(200).json({
      success: true,
      message: `${platform.toUpperCase()} account connected successfully`,
      platform,
      profile: profile.tradingPlatforms
    });
  } catch (error) {
    console.error('Error connecting trading platform:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error: ' + error.message 
    });
  }
};

// ============================================
// DISCONNECT TRADING PLATFORM
// ============================================
export const disconnectTradingPlatform = async (req, res) => {
  try {
    const { platform } = req.params;
    
    if (!['mt4', 'mt5', 'tradingview'].includes(platform)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid platform'
      });
    }

    const profile = await UserProfile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found"
      });
    }

    // Update platform connection
    if (profile.tradingPlatforms[platform]) {
      profile.tradingPlatforms[platform].connected = false;
      await profile.save();
    }

    res.status(200).json({
      success: true,
      message: 'Account disconnected successfully'
    });
  } catch (error) {
    console.error('Error disconnecting trading platform:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error: ' + error.message 
    });
  }
};

// ============================================
// GET TRADING ACCOUNTS
// ============================================
export const getTradingAccounts = async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ userId: req.user._id });
    
    if (!profile) {
      return res.status(200).json({
        success: true,
        accounts: []
      });
    }

    const accounts = Object.entries(profile.tradingPlatforms || {})
      .filter(([_, data]) => data.connected)
      .map(([platform, data]) => ({
        platform,
        ...data
      }));

    res.status(200).json({
      success: true,
      accounts
    });
  } catch (error) {
    console.error('Error getting trading accounts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error: ' + error.message 
    });
  }
};