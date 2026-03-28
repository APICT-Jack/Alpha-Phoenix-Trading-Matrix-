// routes/profile.routes.js - CLEAN VERSION
import express from 'express';
import path from 'path';
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  uploadDocument,
  getUserSettings,
  updateUserSettings,
  getSubscription,
  getPublicProfile,
  getCompleteProfile,
  updateCompleteProfile,
  deleteAvatar,
  uploadBanner,
  removeBanner,
  uploadAddressProof,
  connectTradingPlatform,
  disconnectTradingPlatform,
  getTradingAccounts,
  testBannerUpload
} from '../controllers/userProfileController.js';
import authMiddleware from '../middleware/auth.js';
import uploadMiddleware from '../middleware/upload.js';

const router = express.Router();

// ============================================
// PROFILE ROUTES (require authentication)
// ============================================

// Get profile data
router.get("/me", authMiddleware, getProfile);
router.get("/complete", authMiddleware, getCompleteProfile);

// Update profile data
router.put("/update", authMiddleware, updateProfile);
router.put("/complete", authMiddleware, updateCompleteProfile);

// ============================================
// AVATAR ROUTES
// ============================================
router.post("/avatar", authMiddleware, uploadMiddleware.uploadAvatar, uploadAvatar);
router.delete("/avatar", authMiddleware, deleteAvatar);

// ============================================
// BANNER ROUTES
// ============================================
router.post("/banner", authMiddleware, uploadMiddleware.uploadBanner, uploadBanner);
router.delete("/banner", authMiddleware, removeBanner);

// ============================================
// DOCUMENT ROUTES
// ============================================
router.post("/documents", authMiddleware, uploadMiddleware.uploadDocument, uploadDocument);
router.post("/address-proof", authMiddleware, uploadMiddleware.uploadAddressProof, uploadAddressProof);

// ============================================
// SETTINGS ROUTES
// ============================================
router.get('/settings', authMiddleware, getUserSettings);
router.put('/settings', authMiddleware, updateUserSettings);

// ============================================
// SUBSCRIPTION ROUTES
// ============================================
router.get('/subscription', authMiddleware, getSubscription);

// ============================================
// TRADING PLATFORM ROUTES
// ============================================
router.post('/connect/platform', authMiddleware, connectTradingPlatform);
router.delete('/disconnect/:accountId', authMiddleware, disconnectTradingPlatform);
router.get('/trading/accounts', authMiddleware, getTradingAccounts);

// ============================================
// PUBLIC PROFILE (no authentication required)
// ============================================
router.get('/public/:username', getPublicProfile);

// ============================================
// TEST ROUTES (for debugging)
// ============================================
router.post("/test-banner-upload", authMiddleware, uploadMiddleware.uploadBanner, testBannerUpload);

// File serving test routes
router.get("/test-avatar/:filename", (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(process.cwd(), 'uploads', 'avatars', filename);
  
  console.log('🔍 Testing avatar file:', filename);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('❌ Error serving file:', err);
      res.status(404).json({ 
        success: false, 
        message: 'File not found',
        filename,
        path: filePath 
      });
    }
  });
});

router.get("/test-banner/:filename", (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(process.cwd(), 'uploads', 'banners', filename);
  
  console.log('🔍 Testing banner file:', filename);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('❌ Error serving banner file:', err);
      res.status(404).json({ 
        success: false, 
        message: 'Banner file not found',
        filename,
        path: filePath 
      });
    }
  });
});

router.get("/test-address-proof/:filename", (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(process.cwd(), 'uploads', 'address-proofs', filename);
  
  console.log('🔍 Testing address proof file:', filename);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('❌ Error serving address proof file:', err);
      res.status(404).json({ 
        success: false, 
        message: 'Address proof file not found',
        filename,
        path: filePath 
      });
    }
  });
});

export default router;