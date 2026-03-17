// controllers/userController.js - COMPLETE FIXED VERSION
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

// Get base URLs from environment
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://alpha-phoenix-trading-matrix.onrender.com';
const BACKEND_URL = process.env.BACKEND_URL || 'https://alpha-phoenix-trading-matrix-backend.onrender.com';
const API_URL = process.env.VITE_API_URL || `${BACKEND_URL}/api`;

// Initialize Google OAuth client
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || `${BACKEND_URL}/api/auth/google/callback`
);

// ✅ Google OAuth Initiation
export const googleAuth = async (req, res) => {
  try {
    console.log('🔐 Initiating Google OAuth...');
    console.log('🌐 Frontend URL:', FRONTEND_URL);
    console.log('🌐 Backend URL:', BACKEND_URL);
    
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${BACKEND_URL}/api/auth/google/callback`;
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${process.env.GOOGLE_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=profile%20email` +
      `&access_type=offline` +
      `&prompt=consent`;

    console.log('✅ Google OAuth URL generated, redirecting...');
    console.log('🔗 Redirect URI:', redirectUri);
    res.redirect(authUrl);
  } catch (error) {
    console.error('❌ Google OAuth initiation error:', error);
    res.status(500).json({
      success: false,
      message: 'Google authentication failed to initialize'
    });
  }
};

// ✅ COMPLETE Google OAuth Callback with fixed URLs
export const googleCallback = async (req, res) => {
  try {
    console.log('🔄 Processing Google OAuth callback...');
    console.log('🌐 Frontend URL for postMessage:', FRONTEND_URL);
    
    const { code, error: authError } = req.query;

    if (authError) {
      throw new Error(`Google OAuth error: ${authError}`);
    }

    if (!code) {
      throw new Error('No authorization code received');
    }

    console.log('📨 Received authorization code, exchanging for tokens...');

    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${BACKEND_URL}/api/auth/google/callback`;

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
        redirect_uri: redirectUri,
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
        // Update Google ID if not set
        if (!user.googleId) {
          user.googleId = googleId;
          await user.save({ session });
        }
        
        // Ensure user is active
        user.isActive = true;
        await user.save({ session });
      } else {
        console.log('👤 Creating new user from Google OAuth');
        isNewUser = true;
        
        // Generate username from email
        const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        let username = baseUsername;
        let usernameCounter = 1;

        // Ensure unique username
        while (await User.findOne({ username }).session(session)) {
          username = `${baseUsername}${usernameCounter}`;
          usernameCounter++;
        }

        // Create new user
        user = new User({
          name: name || email.split('@')[0],
          email,
          username,
          googleId,
          isActive: true, // Google users are automatically verified
          avatar: picture,
        });

        await user.save({ session });

        // Create all related documents
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

      // Update last active
      await UserProfile.findOneAndUpdate(
        { userId: user._id },
        { $set: { 'stats.lastActive': new Date() } },
        { session }
      );

      // Get complete user data for response
      const [userProfile, subscription, settings] = await Promise.all([
        UserProfile.findOne({ userId: user._id }).session(session),
        Subscription.findOne({ userId: user._id }).session(session),
        UserSettings.findOne({ userId: user._id }).session(session)
      ]);

      // Generate JWT token
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

      // Format avatar URL properly
      const avatarUrl = user.avatar 
        ? (user.avatar.startsWith('http') ? user.avatar : `${BACKEND_URL}${user.avatar}`)
        : picture || null;

      // Send success response to frontend via postMessage with CORRECT FRONTEND URL
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Google Authentication Successful</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    text-align: center;
                }
                .message {
                    padding: 20px;
                    border-radius: 10px;
                    background: rgba(255,255,255,0.1);
                }
            </style>
        </head>
        <body>
            <div class="message">
                <h2>✅ Authentication Successful!</h2>
                <p>You can close this window and return to the app.</p>
            </div>
            <script>
                (function() {
                    const message = {
                        success: true,
                        user: {
                            id: '${user._id}',
                            name: '${user.name.replace(/'/g, "\\'")}',
                            email: '${email}',
                            username: '${user.username}',
                            isActive: ${user.isActive},
                            avatar: '${avatarUrl}',
                            avatarInitial: '${user.name ? user.name.charAt(0).toUpperCase() : 'U'}',
                            displayName: '${user.username || user.name?.split(' ')[0] || email.split('@')[0]}',
                            profile: ${JSON.stringify(userProfile || {})},
                            subscription: ${JSON.stringify(subscription || { plan: 'free', status: 'active' })},
                            settings: ${JSON.stringify(settings || {})}
                        },
                        token: '${token}',
                        isNewUser: ${isNewUser}
                    };
                    
                    console.log('📨 Sending message to parent window:', message);
                    
                    // Try both localhost and Render URLs for development/production
                    const allowedOrigins = [
                        '${FRONTEND_URL}',
                        'http://localhost:3000',
                        'http://localhost:5000',
                        'https://alpha-phoenix-trading-matrix.onrender.com'
                    ];
                    
                    // Send to all possible origins
                    allowedOrigins.forEach(origin => {
                        try {
                            window.opener.postMessage(message, origin);
                        } catch (e) {
                            // Ignore errors for invalid origins
                        }
                    });
                    
                    // Also try the actual referrer
                    if (document.referrer) {
                        try {
                            const referrerOrigin = new URL(document.referrer).origin;
                            window.opener.postMessage(message, referrerOrigin);
                        } catch (e) {
                            // Ignore
                        }
                    }
                    
                    setTimeout(() => window.close(), 2000);
                })();
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
    
    // Send error message to frontend via postMessage
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Google Authentication Failed</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
                  margin: 0;
                  background: linear-gradient(135deg, #f56565 0%, #c53030 100%);
                  color: white;
                  text-align: center;
              }
              .message {
                  padding: 20px;
                  border-radius: 10px;
                  background: rgba(255,255,255,0.1);
              }
          </style>
      </head>
      <body>
          <div class="message">
              <h2>❌ Authentication Failed</h2>
              <p>${error.message}</p>
              <p>You can close this window and try again.</p>
          </div>
          <script>
              window.opener.postMessage({
                  success: false,
                  error: '${error.message.replace(/'/g, "\\'")}'
              }, '${FRONTEND_URL}');
              window.close();
          </script>
      </body>
      </html>
    `);
  }
};

// ✅ Enhanced Register user + OTP
export const RegisterUser = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists' 
      });
    }

    // Create new user
    const user = new User({
      name,
      username,
      email,
      password,
      isActive: false
    });

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10);

    user.otpCode = otp;
    user.otpExpiry = otpExpiry;

    await user.save();

    // Log OTP for development/testing (will show in Render logs)
    console.log('=================================');
    console.log('🔐 OTP CODE FOR TESTING');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 OTP: ${otp}`);
    console.log(`⏰ Expires: ${otpExpiry}`);
    console.log('=================================');

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

// ✅ Login user function
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Check if user is active (verified)
    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Please verify your email first' 
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
      return res.status(401).json({ 
        success: false, 
        message: `Account locked. Try again in ${lockTimeRemaining} minutes` 
      });
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      // Increment login attempts
      await user.incrementLoginAttempts();
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();
    await user.updateLastLogin();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Format avatar URL
    const avatarUrl = user.avatar 
      ? (user.avatar.startsWith('http') ? user.avatar : `${BACKEND_URL}${user.avatar}`)
      : null;

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: avatarUrl,
        avatarInitial: user.name ? user.name.charAt(0).toUpperCase() : 'U',
        isActive: user.isActive
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

// ✅ Check authentication function
export const checkAuth = async (req, res) => {
  try {
    const [profile, subscription, settings] = await Promise.all([
      UserProfile.findOne({ userId: req.user._id }),
      Subscription.findOne({ userId: req.user._id }),
      UserSettings.findOne({ userId: req.user._id })
    ]);

    // Format avatar URL
    const avatarUrl = req.user.avatar 
      ? (req.user.avatar.startsWith('http') ? req.user.avatar : `${BACKEND_URL}${req.user.avatar}`)
      : null;

    res.status(200).json({
      authenticated: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        username: req.user.username,
        isActive: req.user.isActive,
        avatar: avatarUrl,
        avatarInitial: req.user.name ? req.user.name.charAt(0).toUpperCase() : 'U',
        displayName: req.user.username || req.user.name?.split(' ')[0] || req.user.email?.split('@')[0] || 'User',
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
    
    if (user.otpCode !== otpCode) {
      console.log('❌ OTP mismatch - Expected:', user.otpCode, 'Received:', otpCode);
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
    
    // Activate user and update profile
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      user.isActive = true;
      user.otpCode = null;
      user.otpExpiry = null;
      await user.save({ session });

      // Update user profile lastActive
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
    
    // Generate new OTP
    const newOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.otpCode = newOtpCode;
    user.otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
    
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
    // Update last active before logout
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

// ✅ Update user password
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
    
    // Check if user has a password (Google users might not)
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

    // Hash new password
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

// ✅ Delete user account
export const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required to delete account"
      });
    }

    // Verify password (skip for Google users without password)
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
      // Delete all user data
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

    // Format avatar URL
    const avatarUrl = user.avatar 
      ? (user.avatar.startsWith('http') ? user.avatar : `${BACKEND_URL}${user.avatar}`)
      : null;

    const responseData = {
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        isActive: user.isActive,
        avatar: avatarUrl,
        avatarInitial: user.name ? user.name.charAt(0).toUpperCase() : 'U',
        displayName: user.username || user.name?.split(' ')[0] || user.email?.split('@')[0] || 'User',
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

    // Create the avatar path
    const avatarPath = `/uploads/avatars/${req.file.filename}`;
    console.log('💾 Saving avatar path:', avatarPath);

    // Use direct update
    await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarPath },
      { new: true }
    );

    console.log('✅ Avatar saved to user');

    // Fetch fresh data
    const updatedUser = await User.findById(req.user._id).select('-password -otpCode');
    const profile = await UserProfile.findOne({ userId: req.user._id });

    // Format avatar URL
    const avatarUrl = `${BACKEND_URL}${avatarPath}`;

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully',
      avatar: avatarUrl,
      avatarInitial: updatedUser.name ? updatedUser.name.charAt(0).toUpperCase() : 'U',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        username: updatedUser.username,
        avatar: avatarUrl,
        avatarInitial: updatedUser.name ? updatedUser.name.charAt(0).toUpperCase() : 'U',
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

// ✅ Get all users (for community discovery)
export const getAllUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { search, limit = 50, page = 1 } = req.query;

    // Build search query
    let searchQuery = { 
      _id: { $ne: currentUserId } // Exclude current user
    };

    if (search) {
      searchQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Get users with pagination
    const users = await User.find(searchQuery)
      .select('name email username avatar isActive createdAt lastLogin')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ createdAt: -1 })
      .lean();

    // Get user profiles for additional data
    const userIds = users.map(user => user._id);
    const userProfiles = await UserProfile.find({ 
      userId: { $in: userIds } 
    })
    .select('userId tradingExperience interests stats')
    .lean();

    // Create profile map for easy lookup
    const profileMap = {};
    userProfiles.forEach(profile => {
      profileMap[profile.userId.toString()] = profile;
    });

    // Check follow status for each user
    const followStatuses = await Follow.find({
      follower: currentUserId,
      following: { $in: userIds }
    }).lean();

    const followMap = {};
    followStatuses.forEach(follow => {
      followMap[follow.following.toString()] = true;
    });

    // Combine user data with profile data
    const usersWithDetails = users.map(user => {
      const profile = profileMap[user._id.toString()];
      
      // Format avatar URL
      const avatarUrl = user.avatar 
        ? (user.avatar.startsWith('http') ? user.avatar : `${BACKEND_URL}${user.avatar}`)
        : null;
      
      return {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        avatar: avatarUrl,
        avatarInitial: user.name ? user.name.charAt(0).toUpperCase() : 'U',
        isActive: user.isActive,
        online: user.lastLogin && (Date.now() - new Date(user.lastLogin).getTime() < 5 * 60 * 1000),
        tradingExperience: profile?.tradingExperience || 'beginner',
        interests: profile?.interests || [],
        followersCount: profile?.stats?.followersCount || 0,
        joinDate: user.createdAt,
        isFollowing: followMap[user._id.toString()] || false
      };
    });

    // Get total count for pagination
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

    // Format avatar URL
    const avatarUrl = user.avatar 
      ? (user.avatar.startsWith('http') ? user.avatar : `${BACKEND_URL}${user.avatar}`)
      : null;

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      avatar: avatarUrl,
      avatarInitial: user.name ? user.name.charAt(0).toUpperCase() : 'U',
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
      _id: { $ne: req.user._id } // Exclude current user
    })
    .select('name username email avatar isActive')
    .limit(parseInt(limit))
    .lean();

    const usersWithProfiles = await Promise.all(
      users.map(async (user) => {
        const profile = await UserProfile.findOne({ userId: user._id })
          .select('tradingExperience stats')
          .lean();

        // Check follow status
        const isFollowing = await Follow.findOne({
          follower: req.user._id,
          following: user._id
        });

        // Format avatar URL
        const avatarUrl = user.avatar 
          ? (user.avatar.startsWith('http') ? user.avatar : `${BACKEND_URL}${user.avatar}`)
          : null;

        return {
          id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          avatar: avatarUrl,
          avatarInitial: user.name ? user.name.charAt(0).toUpperCase() : 'U',
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