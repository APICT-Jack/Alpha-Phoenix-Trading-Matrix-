// controllers/userProfileController.js - COMPLETE CLOUDINARY VERSION

import mongoose from 'mongoose';
import User from '../models/User.js';
import UserProfile from '../models/UserProfile.js';
import UserSettings from '../models/UserSettings.js';
import Subscription from '../models/Subscription.js';
import Follow from '../models/Follow.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { deleteFromCloudinary, getPublicIdFromUrl, getResourceType } from '../services/cloudinaryService.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// HELPER FUNCTION FOR URLS
// ============================================
const getBaseUrl = () => {
  return process.env.VITE_API_URL?.replace('/api', '') || 
         process.env.API_URL?.replace('/api', '') || 
         'http://localhost:5000';
};

// ============================================
// PUBLIC PROFILE (NO AUTH REQUIRED)
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

    // Get actual posts count from Post model
    let postsCount = 0;
    try {
      const Post = (await import('../models/Post.js')).default;
      postsCount = await Post.countDocuments({ userId: user._id });
      console.log(`📊 Found ${postsCount} posts for user ${user._id}`);
    } catch (error) {
      console.log('Could not get posts count:', error.message);
      postsCount = 0;
    }

    // Check privacy settings
    if (profile.privacy?.profileVisibility === 'private') {
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

    // Format banner URL properly (handles both Cloudinary and local)
    let bannerUrl = null;
    if (profile.bannerImage) {
      if (profile.bannerImage.startsWith('http')) {
        bannerUrl = profile.bannerImage;
      } else if (profile.bannerImage.startsWith('/uploads/')) {
        bannerUrl = `${BASE_URL}${profile.bannerImage}`;
      } else {
        bannerUrl = `${BASE_URL}/uploads/banners/${profile.bannerImage}`;
      }
    }

    const socialLinks = profile.socialLinks || {};

    const profileData = {
      id: user._id,
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      avatar: user.avatarUrl,
      avatarInitial: user.avatarInitial,
      
      bio: profile.bio || '',
      country: profile.country || '',
      location: profile.country || 'Not specified',
      tradingExperience: profile.tradingExperience || 'beginner',
      joinDate: profile.stats?.joinDate || user.createdAt,
      
      bannerImage: bannerUrl,
      banner: bannerUrl,
      hasBanner: !!bannerUrl,
      
      socialLinks: socialLinks,
      
      followers: followersCount,
      following: followingCount,
      postsCount: postsCount,
      
      stats: {
        followers: followersCount,
        following: followingCount,
        posts: postsCount,
        tradesCompleted: profile.stats?.tradesCompleted || 0,
        successRate: profile.stats?.successRate || 0,
        lastActive: profile.stats?.lastActive || user.lastLogin || new Date()
      },
      
      profile: {
        ...profile.toObject(),
        followers: followersCount,
        following: followingCount,
        postsCount: postsCount
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
// GET COMPLETE PROFILE (AUTH REQUIRED)
// ============================================
export const getCompleteProfile = async (req, res) => {
  try {
    console.log('='.repeat(50));
    console.log('📡 FETCHING COMPLETE PROFILE');
    console.log('='.repeat(50));

    const user = await User.findById(req.user._id)
      .select('-password -otpCode -loginAttempts -lockUntil');
      
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    let profile = await UserProfile.findOne({ userId: user._id });
    
    if (!profile) {
      profile = new UserProfile({ 
        userId: user._id,
        firstName: user.name?.split(' ')[0] || '',
        lastName: user.name?.split(' ').slice(1).join(' ') || '',
        username: user.username
      });
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

    let bannerUrl = null;
    if (profile.bannerImage) {
      if (profile.bannerImage.startsWith('http')) {
        bannerUrl = profile.bannerImage;
      } else if (profile.bannerImage.startsWith('/uploads/')) {
        bannerUrl = `${BASE_URL}${profile.bannerImage}`;
      } else {
        bannerUrl = `${BASE_URL}/uploads/banners/${profile.bannerImage}`;
      }
    }

    const socialLinks = profile.socialLinks || {};

    const userData = {
      id: user._id,
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      avatar: user.avatarUrl,
      avatarInitial: user.avatarInitial,
      createdAt: user.createdAt,
      
      bio: profile.bio || '',
      country: profile.country || '',
      location: profile.country || 'Not specified',
      tradingExperience: profile.tradingExperience || 'beginner',
      joinDate: profile.stats?.joinDate || user.createdAt,
      
      bannerImage: bannerUrl,
      banner: bannerUrl,
      hasBanner: !!bannerUrl,
      
      socialLinks: socialLinks,
      
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

    return res.json({
      success: true,
      user: userData,
      profile: userData
    });

  } catch (error) {
    console.error('❌ Error in getCompleteProfile:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message
    });
  }
};

// ============================================
// UPLOAD AVATAR - CLOUDINARY VERSION
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

    // Delete old avatar from Cloudinary if exists
    if (user.avatar && user.avatar.includes('cloudinary')) {
      const publicId = getPublicIdFromUrl(user.avatar);
      if (publicId) {
        await deleteFromCloudinary(publicId, { resource_type: 'image' });
        console.log('🗑️ Deleted old avatar from Cloudinary:', publicId);
      }
    }
    // Handle local files for backward compatibility
    else if (user.avatar && !user.avatar.startsWith('http')) {
      const oldFilename = user.avatar.split('/').pop();
      const oldAvatarPath = path.join(process.cwd(), 'uploads', 'avatars', oldFilename);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
        console.log('🗑️ Deleted old local avatar:', oldFilename);
      }
    }

    // Save new avatar URL from Cloudinary
    const avatarUrl = req.file.path;
    user.avatar = avatarUrl;
    user.avatarUrl = avatarUrl;
    await user.save();

    console.log('✅ Avatar uploaded successfully to Cloudinary:', {
      url: avatarUrl,
      publicId: req.file.public_id
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
// DELETE AVATAR - CLOUDINARY VERSION
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

    // Delete avatar from Cloudinary if exists
    if (user.avatar && user.avatar.includes('cloudinary')) {
      const publicId = getPublicIdFromUrl(user.avatar);
      if (publicId) {
        await deleteFromCloudinary(publicId, { resource_type: 'image' });
        console.log('🗑️ Deleted avatar from Cloudinary:', publicId);
      }
    }
    // Handle local files for backward compatibility
    else if (user.avatar && !user.avatar.startsWith('http')) {
      const filename = user.avatar.split('/').pop();
      const filePath = path.join(process.cwd(), 'uploads', 'avatars', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('🗑️ Deleted local avatar:', filename);
      }
    }

    user.avatar = null;
    user.avatarUrl = null;
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
// UPLOAD BANNER - CLOUDINARY VERSION
// ============================================
export const uploadBanner = async (req, res) => {
  try {
    console.log('📤 Upload banner request received');
    console.log('📁 File details:', req.file);

    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
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
        console.log('🗑️ Deleted old banner from Cloudinary:', publicId);
      }
    }
    // Handle local files for backward compatibility
    else if (profile.bannerImage && !profile.bannerImage.startsWith('http')) {
      let oldFilename = profile.bannerImage;
      if (oldFilename.includes('/')) {
        oldFilename = oldFilename.split('/').pop();
      }
      const oldBannerPath = path.join(process.cwd(), 'uploads', 'banners', oldFilename);
      if (fs.existsSync(oldBannerPath)) {
        fs.unlinkSync(oldBannerPath);
        console.log('🗑️ Deleted old local banner:', oldFilename);
      }
    }

    // Update banner with Cloudinary URL
    const bannerUrl = req.file.path;
    profile.bannerImage = bannerUrl;
    await profile.save();

    console.log('✅ Banner uploaded successfully to Cloudinary:', {
      url: bannerUrl,
      publicId: req.file.public_id
    });

    const user = await User.findById(req.user._id).select('-password -otpCode');
    
    return res.json({
      success: true,
      message: 'Banner uploaded successfully',
      bannerImage: bannerUrl,
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
      message: 'Server error: ' + error.message 
    });
  }
};

// ============================================
// REMOVE BANNER - CLOUDINARY VERSION
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

    // Delete banner from Cloudinary if exists
    if (profile.bannerImage && profile.bannerImage.includes('cloudinary')) {
      const publicId = getPublicIdFromUrl(profile.bannerImage);
      if (publicId) {
        await deleteFromCloudinary(publicId, { resource_type: 'image' });
        console.log('🗑️ Deleted banner from Cloudinary:', publicId);
      }
    }
    // Handle local files for backward compatibility
    else if (profile.bannerImage && !profile.bannerImage.startsWith('http')) {
      let filename = profile.bannerImage;
      if (filename.includes('/')) {
        filename = filename.split('/').pop();
      }
      const bannerPath = path.join(process.cwd(), 'uploads', 'banners', filename);
      if (fs.existsSync(bannerPath)) {
        fs.unlinkSync(bannerPath);
        console.log('🗑️ Deleted local banner:', filename);
      }
    }
    
    profile.bannerImage = null;
    await profile.save();

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
// UPLOAD ADDRESS PROOF - CLOUDINARY VERSION
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

    const profile = await UserProfile.findOne({ userId: req.user._id });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found"
      });
    }

    // Delete old address proof from Cloudinary if exists
    if (profile.addressProof?.documentUrl && profile.addressProof.documentUrl.includes('cloudinary')) {
      const publicId = getPublicIdFromUrl(profile.addressProof.documentUrl);
      if (publicId) {
        const resourceType = getResourceType(profile.addressProof.documentUrl, null);
        await deleteFromCloudinary(publicId, { resource_type: resourceType });
        console.log('🗑️ Deleted old address proof from Cloudinary:', publicId);
      }
    }

    // Update address proof with Cloudinary URL
    profile.addressProof = {
      documentUrl: req.file.path,
      documentType,
      verified: false,
      uploadedAt: new Date(),
      publicId: req.file.public_id
    };

    await profile.save();

    res.status(200).json({
      success: true,
      message: 'Address proof uploaded successfully',
      documentUrl: req.file.path,
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
// UPLOAD DOCUMENT - CLOUDINARY VERSION
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

    const profile = await UserProfile.findOne({ userId: req.user._id });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found"
      });
    }

    // Delete old document from Cloudinary if exists
    const oldDocument = profile.documents?.[documentType];
    if (oldDocument?.url && oldDocument.url.includes('cloudinary')) {
      const publicId = getPublicIdFromUrl(oldDocument.url);
      if (publicId) {
        const resourceType = getResourceType(oldDocument.url, null);
        await deleteFromCloudinary(publicId, { resource_type: resourceType });
        console.log('🗑️ Deleted old document from Cloudinary:', publicId);
      }
    }

    const documentData = {
      url: req.file.path,
      publicId: req.file.public_id,
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
// TEST BANNER UPLOAD (for testing)
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

    return res.json({
      success: true,
      message: 'Test upload successful',
      file: {
        filename: req.file.filename,
        path: req.file.path,
        public_id: req.file.public_id,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      },
      url: req.file.path
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

    if (firstName || lastName) {
      const name = `${firstName || ''} ${lastName || ''}`.trim();
      await User.findByIdAndUpdate(
        req.user._id,
        { name },
        { session }
      );
    }

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