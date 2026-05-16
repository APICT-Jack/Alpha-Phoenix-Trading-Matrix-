// routes/profile.routes.js - UPDATED WITH TRADING ROUTES

import express from 'express';
import {
  getProfile,
  getCompleteProfile,
  updateCompleteProfile,
  uploadAvatar,
  deleteAvatar,
  uploadBanner,
  removeBanner,
  getUserSettings,
  updateUserSettings,
  getSubscription,
  getPublicProfile
} from '../controllers/userProfileController.js';

import {
  connectMT4,
  connectMT5,
  disconnectTradingAccount,
  syncTradingData,
  getTradingAnalytics,
  getPublicTradingBadge,
  getTierRequirements
} from '../controllers/tradingController.js';

import authMiddleware from '../middleware/auth.js';
import uploadMiddleware from '../middleware/upload.js';

const router = express.Router();

// ============================================
// PROFILE ROUTES
// ============================================
router.get("/me", authMiddleware, getProfile);
router.get("/complete", authMiddleware, getCompleteProfile);
router.put("/complete", authMiddleware, updateCompleteProfile);

// Avatar routes
router.post("/avatar", authMiddleware, uploadMiddleware.uploadAvatar, uploadAvatar);
router.delete("/avatar", authMiddleware, deleteAvatar);

// Banner routes
router.post("/banner", authMiddleware, uploadMiddleware.uploadBanner, uploadBanner);
router.delete("/banner", authMiddleware, removeBanner);

// Settings
router.get('/settings', authMiddleware, getUserSettings);
router.put('/settings', authMiddleware, updateUserSettings);
router.get('/subscription', authMiddleware, getSubscription);

// ============================================
// TRADING CONNECTION ROUTES
// ============================================
router.post('/connect/mt4', authMiddleware, connectMT4);
router.post('/connect/mt5', authMiddleware, connectMT5);
router.delete('/disconnect/:platform', authMiddleware, disconnectTradingAccount);
router.post('/sync', authMiddleware, syncTradingData);
router.get('/analytics', authMiddleware, getTradingAnalytics);
router.get('/analytics/:userId', authMiddleware, getTradingAnalytics);
router.get('/tiers', authMiddleware, getTierRequirements);

// ============================================
// PUBLIC ROUTES
// ============================================
router.get('/public/:username', getPublicProfile);
router.get('/public/badge/:userId', getPublicTradingBadge);

export default router;