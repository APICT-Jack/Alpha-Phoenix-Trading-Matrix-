// routes/profile.routes.js
import express from 'express';
import path from 'path';
import {
  getProfile, updateProfile, uploadAvatar, uploadDocument, getUserSettings,
  updateUserSettings, getSubscription, getPublicProfile, getCompleteProfile,
  updateCompleteProfile, deleteAvatar, uploadBanner, removeBanner, uploadAddressProof,
  connectTradingPlatform, disconnectTradingPlatform, getTradingAccounts, testBannerUpload
} from '../controllers/userProfileController.js';
import authMiddleware from '../middleware/auth.js';
import uploadMiddleware from '../middleware/upload.js';

const router = express.Router();

// Profile routes
router.get("/me", authMiddleware, getProfile);
router.get("/complete", authMiddleware, getCompleteProfile);
router.put("/update", authMiddleware, updateProfile);
router.put("/complete", authMiddleware, updateCompleteProfile);

// Avatar routes
router.post("/avatar", authMiddleware, uploadMiddleware.uploadAvatarMiddleware, uploadAvatar);
router.delete("/avatar", authMiddleware, deleteAvatar);

// Banner routes
router.post("/banner", authMiddleware, uploadMiddleware.uploadBannerMiddleware, uploadBanner);
router.delete("/banner", authMiddleware, removeBanner);

// Document routes
router.post("/documents", authMiddleware, uploadMiddleware.uploadDocumentMiddleware, uploadDocument);
router.post("/address-proof", authMiddleware, uploadMiddleware.uploadAddressProofMiddleware, uploadAddressProof);

// Settings
router.get('/settings', authMiddleware, getUserSettings);
router.put('/settings', authMiddleware, updateUserSettings);
router.get('/subscription', authMiddleware, getSubscription);

// Trading platforms
router.post('/connect/platform', authMiddleware, connectTradingPlatform);
router.delete('/disconnect/:accountId', authMiddleware, disconnectTradingPlatform);
router.get('/trading/accounts', authMiddleware, getTradingAccounts);

// Public
router.get('/public/:username', getPublicProfile);

// Test
router.post("/test-banner-upload", authMiddleware, uploadMiddleware.uploadBannerMiddleware, testBannerUpload);

export default router;