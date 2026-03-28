// controllers/userController.js - COMPLETE SINGLE FILE
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import UserProfile from '../models/UserProfile.js';
import UserSettings from '../models/UserSettings.js';
import UserNotificationPreferences from '../models/UserNotificationPreferences.js';
import Follow from '../models/Follow.js';

// Initialize Google OAuth client
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || ((process.env.VITE_API_URL ? process.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000') + '/api/auth/google/callback')
);

// ✅ Google OAuth Initiation
export const googleAuth = async (req, res) => {
  try {
    console.log('🔐 Initiating Google OAuth...');
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${process.env.GOOGLE_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(process.env.GOOGLE_REDIRECT_URI || ((process.env.VITE_API_URL ? process.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000') + '/api/auth/google/callback'))}` +
      `&response_type=code` +
      `&scope=profile%20email` +
      `&access_type=offline` +
      `&prompt=consent`;

    console.log('✅ Google OAuth URL generated, redirecting...');
    res.redirect(authUrl);
  } catch (error) {
    console.error('❌ Google OAuth initiation error:', error);
    res.status(500).json({
      success: false,
      message: 'Google authentication failed to initialize'
    });
  }
};

// ✅ Google OAuth Callback
export const googleCallback = async (req, res) => {
  try {
    console.log('🔄 Processing Google OAuth callback...');
    const { code, error: authError } = req.query;

    if (authError) {
      throw new Error(`Google OAuth error: ${authError}`);
    }

    if (!code) {
      throw new Error('No authorization code received');
    }

    console.log('📨 Received authorization code, exchanging for tokens...');

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || (
          (process.env.VITE_API_URL ? process.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000') + '/api/auth/google/callback'
        ),
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      console.error('❌ Token exchange failed:', tokenData);
      throw new Error(tokenData.error_description || 'Failed to exchange code for tokens');
    }

    const { access_token } = tokenData;

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const userInfo = await userInfoResponse.json();
    
    if (!userInfoResponse.ok) {
      console.error('❌ User info fetch failed:', userInfo);
      throw new Error(userInfo.error || 'Failed to fetch user info');
    }

    const { id: googleId, email, name, picture, given_name, family_name } = userInfo;

    console.log('👤 Google user data received:', { googleId, email, name });

    if (!email) {
      throw new Error('No email received from Google');
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Check if user already exists
      let user = await User.findOne({ 
        $or: [
          { email },
          { googleId }
        ]
      }).session(session);

      let isNewUser = false;

      if (user) {
        console.log('✅ Existing user found, updating Google ID if needed');
        if (!user.googleId) {
          user.googleId = googleId;
          await user.save({ session });
        }
        user.isActive = true;
        await user.save({ session });
      } else {
        console.log('👤 Creating new user from Google OAuth');
        isNewUser = true;
        
        const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        let username = baseUsername;
        let usernameCounter = 1;

        while (await User.findOne({ username }).session(session)) {
          username = `${baseUsername}${usernameCounter}`;
          usernameCounter++;
        }

        user = new User({
          name: name || email.split('@')[0],
          email,
          username,
          googleId,
          isActive: true,
          avatar: picture,
          avatarInitial: (given_name?.[0] || name?.[0] || 'U').toUpperCase()
        });

        await user.save({ session });

        await Promise.all([
          UserProfile.create([{
            userId: user._id,
            firstName: given_name || name?.split(' ')[0] || '',
            lastName: family_name || name?.split(' ').slice(1).join(' ') || '',
            username: username,
            timezone: 'UTC',
            stats: {
              joinDate: new Date(),
              lastActive: new Date()
            }
          }], { session }),
          
          Subscription.create([{
            userId: user._id,
            plan: 'free',
            status: 'active'
          }], { session }),
          
          UserSettings.create([{
            userId: user._id
          }], { session }),
          
          UserNotificationPreferences.create([{
            userId: user._id
          }], { session })
        ]);
      }

      await UserProfile.findOneAndUpdate(
        { userId: user._id },
        { $set: { 'stats.lastActive': new Date() } },
        { session }
      );

      const [userProfile, subscription, settings] = await Promise.all([
        UserProfile.findOne({ userId: user._id }).session(session),
        Subscription.findOne({ userId: user._id }).session(session),
        UserSettings.findOne({ userId: user._id }).session(session)
      ]);

      const token = jwt.sign(
        { 
          userId: user._id,
          email: user.email 
        },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '24h' }
      );

      await session.commitTransaction();
      console.log(`🎉 Google OAuth ${isNewUser ? 'sign-up' : 'sign-in'} successful for:`, email);

      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Google Authentication Successful</title>
        </head>
        <body>
            <script>
                const message = {
                    success: true,
                    user: {
                        id: '${user._id}',
                        name: '${user.name.replace(/'/g, "\\'")}',
                        email: '${email}',
                        username: '${user.username}',
                        isActive: ${user.isActive},
                        avatar: '${user.avatarUrl || picture || ''}',
                        avatarInitial: '${user.avatarInitial}',
                        displayName: '${user.displayName}',
                        profile: ${JSON.stringify(userProfile || {})},
                        subscription: ${JSON.stringify(subscription || { plan: 'free', status: 'active' })},
                        settings: ${JSON.stringify(settings || {})}
                    },
                    token: '${token}',
                    isNewUser: ${isNewUser}
                };
                window.opener.postMessage(message, 'http://localhost:3000');
                window.close();
            </script>
        </body>
        </html>
      `);

    } catch (transactionError) {
      await session.abortTransaction();
      throw transactionError;
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error('❌ Google OAuth callback error:', error);
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Google Authentication Failed</title>
      </head>
      <body>
          <script>
              window.opener.postMessage({
                  success: false,
                  error: '${error.message.replace(/'/g, "\\'")}'
              }, 'http://localhost:3000');
              window.close();
          </script>
      </body>
      </html>
    `);
  }
};

// ✅ Register user
export const RegisterUser = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists' 
      });
    }

    const user = new User({
      name,
      username,
      email,
      password,
      isActive: false
    });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10);

    user.otpCode = otp;
    user.otpExpiry = otpExpiry;

    await user.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please verify OTP.',
      userId: user._id,
      email: user.email
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration' 
    });
  }
};

// ✅ Login user
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Please verify your email first' 
      });
    }

    if (user.isLocked) {
      const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
      return res.status(401).json({ 
        success: false, 
        message: `Account locked. Try again in ${lockTimeRemaining} minutes` 
      });
    }

    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      await user.incrementLoginAttempts();
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    await user.resetLoginAttempts();
    await user.updateLastLogin();

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login' 
    });
  }
};

// ✅ Check authentication
export const checkAuth = async (req, res) => {
  try {
    const [profile, subscription, settings] = await Promise.all([
      UserProfile.findOne({ userId: req.user._id }),
      Subscription.findOne({ userId: req.user._id }),
      UserSettings.findOne({ userId: req.user._id })
    ]);

    res.status(200).json({
      authenticated: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        username: req.user.username,
        isActive: req.user.isActive,
        avatar: req.user.avatarUrl,
        avatarInitial: req.user.avatarInitial,
        displayName: req.user.displayName,
        profile: profile || {},
        subscription: subscription || { plan: 'free', status: 'active' },
        settings: settings || {}
      }
    });
  } catch (error) {
    console.error("Error in checkAuth:", error);
    res.status(500).json({ 
      success: false,
      authenticated: false, 
      message: "Authentication check failed: " + error.message 
    });
  }
};

// ✅ OTP Verification
export const verifyOTP = async (req, res) => {
  const { email, otpCode } = req.body;
  
  console.log('🔢 OTP VERIFICATION ==========');
  console.log('Email:', email);
  console.log('OTP provided:', otpCode);
  
  if (!email || !otpCode) {
    return res.status(400).json({ 
      success: false, 
      message: "Please provide email and OTP" 
    });
  }
  
  try {
    const user = await User.findOne({ email });
    console.log('👤 User found:', user ? 'YES' : 'NO');
    
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: "User not found" 
      });
    }
    
    console.log('🔓 User isActive:', user.isActive);
    console.log('🔑 Stored OTP:', user.otpCode);
    
    if (user.isActive) {
      return res.status(400).json({ 
        success: false, 
        message: "User already verified" 
      });
    }
    
    if (user.otpCode !== otpCode) {
      console.log('❌ OTP mismatch');
      return res.status(400).json({ 
        success: false, 
        message: "Invalid OTP code" 
      });
    }
    
    if (user.otpExpiry < Date.now()) {
      console.log('❌ OTP expired');
      return res.status(400).json({ 
        success: false, 
        message: "OTP code has expired" 
      });
    }
    
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      user.isActive = true;
      user.otpCode = null;
      user.otpExpiry = null;
      await user.save({ session });

      await UserProfile.findOneAndUpdate(
        { userId: user._id },
        { 
          $set: { 
            'stats.lastActive': new Date(),
            'stats.joinDate': new Date() 
          } 
        },
        { session }
      );

      await session.commitTransaction();
      console.log('✅ OTP verified successfully');
      
      res.status(200).json({ 
        success: true, 
        message: "OTP verified successfully. Your account is now active." 
      });
    } catch (transactionError) {
      await session.abortTransaction();
      throw transactionError;
    } finally {
      session.endSession();
    }
    
  } catch (error) {
    console.error("❌ Error in verifyOTP:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server Error during verification: " + error.message 
    });
  }
};

// ✅ Resend OTP
export const resendOTP = async (req, res) => {
  const { email } = req.body;
  
  console.log('🔄 RESEND OTP ==========');
  console.log('Email:', email);
  
  if (!email) {
    return res.status(400).json({ 
      success: false, 
      message: "Please provide email" 
    });
  }
  
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: "User not found" 
      });
    }
    
    if (user.isActive) {
      return res.status(400).json({ 
        success: false, 
        message: "User already verified" 
      });
    }
    
    const newOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.otpCode = newOtpCode;
    user.otpExpiry = Date.now() + 10 * 60 * 1000;
    
    await user.save();
    
    console.log(`📧 New OTP for ${email}: ${newOtpCode}`);
    
    res.status(200).json({ 
      success: true, 
      message: "New OTP sent successfully. Please check your email." 
    });
  } catch (error) {
    console.error("❌ Error in resendOTP:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server Error: " + error.message 
    });
  }
};

// ✅ Logout user
export const logoutUser = async (req, res) => {
  try {
    await UserProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: { 'stats.lastActive': new Date() } }
    );

    res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    console.error("Error in logoutUser:", error);
    res.status(500).json({ 
      success: false, 
      message: "Logout failed: " + error.message 
    });
  }
};

// ✅ Update password
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required"
      });
    }

    const user = await User.findById(req.user._id);
    
    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: "Password change not available for Google accounts"
      });
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect"
      });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully"
    });
  } catch (error) {
    console.error("Error in updatePassword:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server Error updating password: " + error.message 
    });
  }
};

// ✅ Delete account
export const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required to delete account"
      });
    }

    const user = await User.findById(req.user._id);
    
    if (user.password) {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: "Invalid password"
        });
      }
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await Promise.all([
        User.findByIdAndDelete(req.user._id, { session }),
        UserProfile.findOneAndDelete({ userId: req.user._id }, { session }),
        Subscription.findOneAndDelete({ userId: req.user._id }, { session }),
        UserSettings.findOneAndDelete({ userId: req.user._id }, { session }),
        UserNotificationPreferences.findOneAndDelete({ userId: req.user._id }, { session })
      ]);

      await session.commitTransaction();

      res.status(200).json({
        success: true,
        message: "Account deleted successfully"
      });
    } catch (transactionError) {
      await session.abortTransaction();
      throw transactionError;
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error("Error in deleteAccount:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server Error deleting account: " + error.message 
    });
  }
};

// ✅ Get user profile
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
      message: "Server Error fetching profile" 
    });
  }
};

// ✅ Upload avatar
export const uploadAvatar = async (req, res) => {
  try {
    console.log('📤 Upload avatar request received');
    console.log('📁 File details:', req.file);
    console.log('👤 User ID:', req.user._id);

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

    const avatarPath = `/uploads/avatars/${req.file.filename}`;
    console.log('💾 Saving avatar path:', avatarPath);

    await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarPath },
      { new: true }
    );

    console.log('✅ Avatar saved to user');

    const updatedUser = await User.findById(req.user._id).select('-password -otpCode');
    const profile = await UserProfile.findOne({ userId: req.user._id });

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully',
      avatar: updatedUser.avatarUrl,
      avatarInitial: updatedUser.avatarInitial,
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        username: updatedUser.username,
        avatar: updatedUser.avatarUrl,
        avatarInitial: updatedUser.avatarInitial,
        profile: profile || {}
      }
    });
  } catch (error) {
    console.error('❌ Error in uploadAvatar:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error uploading avatar: ' + error.message 
    });
  }
};

// ✅ Get all users
export const getAllUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { search, limit = 50, page = 1 } = req.query;

    let searchQuery = { 
      _id: { $ne: currentUserId }
    };

    if (search) {
      searchQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(searchQuery)
      .select('name email username avatar isActive createdAt lastLogin')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ createdAt: -1 })
      .lean();

    const userIds = users.map(user => user._id);
    const userProfiles = await UserProfile.find({ 
      userId: { $in: userIds } 
    })
    .select('userId tradingExperience interests stats')
    .lean();

    const profileMap = {};
    userProfiles.forEach(profile => {
      profileMap[profile.userId.toString()] = profile;
    });

    const followStatuses = await Follow.find({
      follower: currentUserId,
      following: { $in: userIds }
    }).lean();

    const followMap = {};
    followStatuses.forEach(follow => {
      followMap[follow.following.toString()] = true;
    });

    const usersWithDetails = users.map(user => {
      const profile = profileMap[user._id.toString()];
      
      return {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        isActive: user.isActive,
        online: user.lastLogin && (Date.now() - new Date(user.lastLogin).getTime() < 5 * 60 * 1000),
        tradingExperience: profile?.tradingExperience || 'beginner',
        interests: profile?.interests || [],
        followersCount: profile?.stats?.followersCount || 0,
        joinDate: user.createdAt,
        isFollowing: followMap[user._id.toString()] || false
      };
    });

    const totalUsers = await User.countDocuments(searchQuery);

    res.status(200).json({
      success: true,
      users: usersWithDetails,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalUsers,
        pages: Math.ceil(totalUsers / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users: ' + error.message
    });
  }
};

// ✅ Get user by ID
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const user = await User.findById(userId)
      .select('name email username avatar isActive createdAt lastLogin');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const profile = await UserProfile.findOne({ userId })
      .select('tradingExperience interests bio country stats socialLinks');

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
      isActive: user.isActive,
      online: user.lastLogin && (Date.now() - new Date(user.lastLogin).getTime() < 5 * 60 * 1000),
      tradingExperience: profile?.tradingExperience || 'beginner',
      interests: profile?.interests || [],
      bio: profile?.bio,
      country: profile?.country,
      followersCount: profile?.stats?.followersCount || 0,
      joinDate: user.createdAt
    };

    res.status(200).json({
      success: true,
      user: userData
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user: ' + error.message
    });
  }
};

// ✅ Search users
export const searchUsers = async (req, res) => {
  try {
    const { q: searchTerm, limit = 20 } = req.query;

    if (!searchTerm || searchTerm.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search term must be at least 2 characters long'
      });
    }

    const users = await User.find({
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { username: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } }
      ],
      _id: { $ne: req.user._id }
    })
    .select('name username email avatar isActive')
    .limit(parseInt(limit))
    .lean();

    const usersWithProfiles = await Promise.all(
      users.map(async (user) => {
        const profile = await UserProfile.findOne({ userId: user._id })
          .select('tradingExperience stats')
          .lean();

        const isFollowing = await Follow.findOne({
          follower: req.user._id,
          following: user._id
        });

        return {
          id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          tradingExperience: profile?.tradingExperience || 'beginner',
          followersCount: profile?.stats?.followersCount || 0,
          isFollowing: !!isFollowing
        };
      })
    );

    res.status(200).json({
      success: true,
      users: usersWithProfiles,
      searchTerm,
      count: usersWithProfiles.length
    });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching users: ' + error.message
    });
  }
};