// controllers/tradingController.js - Complete Trading Connection Handler

import mongoose from 'mongoose';
import User from '../models/User.js';
import UserProfile from '../models/UserProfile.js';
import MetaTraderService from '../services/metaTraderService.js';
import TradingAnalyticsService from '../services/tradingAnalyticsService.js';

/**
 * Connect MetaTrader 4 account
 */
export const connectMT4 = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    const { accountId, password, broker, server } = req.body;
    const userId = req.user._id;
    
    // Validate inputs
    if (!accountId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Account ID and password are required'
      });
    }
    
    // Get user profile
    let profile = await UserProfile.findOne({ userId }).session(session);
    if (!profile) {
      profile = new UserProfile({ userId });
      await profile.save({ session });
    }
    
    // Check if already connected
    if (profile.tradingConnections.mt4.connected) {
      return res.status(400).json({
        success: false,
        message: 'MT4 account already connected'
      });
    }
    
    // Connect to MetaTrader
    const connectionResult = await MetaTraderService.connectAccount(userId, 'mt4', {
      login: accountId,
      password,
      server: server || broker
    });
    
    if (!connectionResult.success) {
      return res.status(400).json({
        success: false,
        message: connectionResult.error || 'Failed to connect to MT4'
      });
    }
    
    // Update profile with connection info
    profile.tradingConnections.mt4 = {
      connected: true,
      accountId,
      broker: broker || '',
      server: server || '',
      sessionKey: connectionResult.sessionKey,
      connectedAt: new Date(),
      lastSync: new Date()
    };
    
    // Calculate trading profile from fetched data
    const tradingProfile = TradingAnalyticsService.calculateTradingProfile(
      connectionResult.tradingHistory || [],
      connectionResult.accountData
    );
    
    // Update trading stats
    await profile.updateTradingStats(tradingProfile);
    
    // Update badge based on real performance
    await profile.updateBadge(tradingProfile.badge);
    
    // Update experience level
    await profile.updateExperienceLevel(tradingProfile.experienceLevel);
    
    await profile.save({ session });
    await session.commitTransaction();
    
    res.json({
      success: true,
      message: 'MT4 account connected successfully',
      data: {
        accountInfo: connectionResult.accountData,
        tradingStats: profile.tradingStats,
        badge: profile.badge,
        experienceLevel: profile.experienceLevel,
        firstSync: true
      }
    });
    
  } catch (error) {
    await session.abortTransaction();
    console.error('Error connecting MT4:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to connect MT4 account'
    });
  } finally {
    session.endSession();
  }
};

/**
 * Connect MetaTrader 5 account
 */
export const connectMT5 = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    const { accountId, password, broker, server } = req.body;
    const userId = req.user._id;
    
    if (!accountId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Account ID and password are required'
      });
    }
    
    let profile = await UserProfile.findOne({ userId }).session(session);
    if (!profile) {
      profile = new UserProfile({ userId });
      await profile.save({ session });
    }
    
    if (profile.tradingConnections.mt5.connected) {
      return res.status(400).json({
        success: false,
        message: 'MT5 account already connected'
      });
    }
    
    const connectionResult = await MetaTraderService.connectAccount(userId, 'mt5', {
      login: accountId,
      password,
      server: server || broker
    });
    
    if (!connectionResult.success) {
      return res.status(400).json({
        success: false,
        message: connectionResult.error || 'Failed to connect to MT5'
      });
    }
    
    profile.tradingConnections.mt5 = {
      connected: true,
      accountId,
      broker: broker || '',
      server: server || '',
      sessionKey: connectionResult.sessionKey,
      connectedAt: new Date(),
      lastSync: new Date()
    };
    
    const tradingProfile = TradingAnalyticsService.calculateTradingProfile(
      connectionResult.tradingHistory || [],
      connectionResult.accountData
    );
    
    await profile.updateTradingStats(tradingProfile);
    await profile.updateBadge(tradingProfile.badge);
    await profile.updateExperienceLevel(tradingProfile.experienceLevel);
    
    await profile.save({ session });
    await session.commitTransaction();
    
    res.json({
      success: true,
      message: 'MT5 account connected successfully',
      data: {
        accountInfo: connectionResult.accountData,
        tradingStats: profile.tradingStats,
        badge: profile.badge,
        experienceLevel: profile.experienceLevel,
        firstSync: true
      }
    });
    
  } catch (error) {
    await session.abortTransaction();
    console.error('Error connecting MT5:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to connect MT5 account'
    });
  } finally {
    session.endSession();
  }
};

/**
 * Disconnect trading account
 */
export const disconnectTradingAccount = async (req, res) => {
  try {
    const { platform } = req.params;
    const userId = req.user._id;
    
    if (!['mt4', 'mt5'].includes(platform)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid platform. Must be mt4 or mt5'
      });
    }
    
    const profile = await UserProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }
    
    const connection = profile.tradingConnections[platform];
    if (!connection || !connection.connected) {
      return res.status(400).json({
        success: false,
        message: `${platform.toUpperCase()} account is not connected`
      });
    }
    
    // Disconnect from MT service
    if (connection.sessionKey) {
      await MetaTraderService.disconnectAccount(connection.sessionKey);
    }
    
    // Reset connection
    profile.tradingConnections[platform] = {
      connected: false,
      accountId: null,
      broker: null,
      server: null,
      sessionKey: null,
      connectedAt: null,
      lastSync: null
    };
    
    // If no other connections, reset badge to novice
    if (!profile.tradingConnections.mt4.connected && !profile.tradingConnections.mt5.connected) {
      const emptyProfile = TradingAnalyticsService.getEmptyProfile();
      await profile.updateBadge(emptyProfile.badge);
      await profile.updateExperienceLevel(emptyProfile.experienceLevel);
      await profile.updateTradingStats(emptyProfile);
    }
    
    await profile.save();
    
    res.json({
      success: true,
      message: `${platform.toUpperCase()} account disconnected successfully`
    });
    
  } catch (error) {
    console.error('Error disconnecting account:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to disconnect account'
    });
  }
};

/**
 * Sync trading data
 */
export const syncTradingData = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const profile = await UserProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }
    
    const connectedPlatforms = profile.getConnectedPlatforms();
    if (connectedPlatforms.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No trading accounts connected'
      });
    }
    
    let allTrades = [];
    let allAccountInfo = null;
    
    // Sync each connected platform
    for (const platform of connectedPlatforms) {
      const connection = profile.tradingConnections[platform];
      if (!connection.sessionKey) continue;
      
      const syncResult = await MetaTraderService.syncUserTradingData(
        userId,
        platform,
        connection.sessionKey
      );
      
      if (syncResult.success) {
        if (syncResult.newTrades) {
          allTrades.push(...syncResult.newTrades);
        }
        if (syncResult.accountInfo) {
          allAccountInfo = syncResult.accountInfo;
        }
        
        // Update last sync time
        profile.tradingConnections[platform].lastSync = new Date();
      }
    }
    
    // Get full trading history (not just new trades)
    let completeHistory = [];
    for (const platform of connectedPlatforms) {
      const connection = profile.tradingConnections[platform];
      if (connection.sessionKey) {
        const history = await MetaTraderService.getTradingHistory(connection.sessionKey, {
          from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
        });
        if (history.success) {
          completeHistory.push(...history.trades);
        }
      }
    }
    
    // Recalculate trading profile
    const tradingProfile = TradingAnalyticsService.calculateTradingProfile(
      completeHistory,
      allAccountInfo
    );
    
    // Update profile
    await profile.updateTradingStats(tradingProfile);
    await profile.updateBadge(tradingProfile.badge);
    await profile.updateExperienceLevel(tradingProfile.experienceLevel);
    
    await profile.save();
    
    res.json({
      success: true,
      message: 'Trading data synced successfully',
      data: {
        tradingStats: profile.tradingStats,
        badge: profile.badge,
        experienceLevel: profile.experienceLevel,
        newTradesCount: allTrades.length,
        syncTime: new Date()
      }
    });
    
  } catch (error) {
    console.error('Error syncing trading data:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to sync trading data'
    });
  }
};

/**
 * Get trading analytics
 */
export const getTradingAnalytics = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    const isOwnProfile = userId === req.user._id.toString();
    
    const profile = await UserProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }
    
    // Check privacy
    if (!isOwnProfile && !profile.privacy.showTradingStats) {
      return res.json({
        success: true,
        data: {
          isPrivate: true,
          message: 'User has chosen to keep trading stats private'
        }
      });
    }
    
    // Get detailed analytics if user has connections
    let detailedAnalytics = null;
    if (profile.hasTradingConnection()) {
      let allTrades = [];
      for (const platform of ['mt4', 'mt5']) {
        const connection = profile.tradingConnections[platform];
        if (connection.connected && connection.sessionKey) {
          const history = await MetaTraderService.getTradingHistory(connection.sessionKey, {
            from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
          });
          if (history.success) {
            allTrades.push(...history.trades);
          }
        }
      }
      
      detailedAnalytics = TradingAnalyticsService.calculateTradingProfile(allTrades);
    }
    
    res.json({
      success: true,
      data: {
        tradingStats: profile.tradingStats,
        badge: profile.badge,
        experienceLevel: profile.experienceLevel,
        hasConnections: profile.hasTradingConnection(),
        connectedPlatforms: profile.getConnectedPlatforms(),
        detailedAnalytics: isOwnProfile ? detailedAnalytics : null,
        lastUpdated: profile.tradingStats.lastUpdated
      }
    });
    
  } catch (error) {
    console.error('Error getting trading analytics:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get trading analytics'
    });
  }
};

/**
 * Get public trading badge (for non-owners)
 */
export const getPublicTradingBadge = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const profile = await UserProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }
    
    // Check privacy
    if (!profile.privacy.showTradingStats) {
      return res.json({
        success: true,
        data: {
          isPrivate: true,
          badge: null
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        badge: profile.badge,
        experienceLevel: profile.experienceLevel,
        totalTrades: profile.tradingStats.totalTrades,
        winRate: profile.tradingStats.winRate
      }
    });
    
  } catch (error) {
    console.error('Error getting public badge:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get badge'
    });
  }
};

/**
 * Get tier requirements
 */
export const getTierRequirements = async (req, res) => {
  try {
    const requirements = TradingAnalyticsService.getTierRequirements();
    
    res.json({
      success: true,
      data: requirements
    });
    
  } catch (error) {
    console.error('Error getting tier requirements:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get tier requirements'
    });
  }
};