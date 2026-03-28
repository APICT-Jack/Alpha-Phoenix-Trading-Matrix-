// routes/auth.routes.js
import express from 'express';
import User from '../models/User.js'; // Add this import
import { 
  RegisterUser, 
  verifyOTP,
  resendOTP,
  loginUser,
  logoutUser,
  checkAuth,
  googleAuth,
  googleCallback,
  updatePassword,
  deleteAccount
} from '../controllers/userController.js';
import authMiddleware from '../middleware/auth.js';
import uploadMiddleware from '../middleware/upload.js';

const router = express.Router();

// Auth routes
router.post("/signup", RegisterUser);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/login", loginUser);
router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);

// Protected routes
router.get("/check", authMiddleware, checkAuth);
router.post("/logout", authMiddleware, logoutUser);
router.put("/password", authMiddleware, updatePassword);
router.delete("/account", authMiddleware, deleteAccount);

// Change password route
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user._id);
    
    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect"
      });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: "Password updated successfully"
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: "Server Error changing password"
    });
  }
});

// Avatar upload route (optional - if you want avatar uploads)
router.post('/upload-avatar', authMiddleware, uploadMiddleware.uploadAvatar, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    const user = await User.findById(req.user._id);
    user.avatar = req.file.path;
    await user.save();
    
    res.json({ 
      success: true, 
      message: 'Avatar uploaded successfully',
      url: req.file.path
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
});

// Banner upload route (optional)
router.post('/upload-banner', authMiddleware, uploadMiddleware.uploadBanner, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    const user = await User.findById(req.user._id);
    user.banner = req.file.path;
    await user.save();
    
    res.json({ 
      success: true, 
      message: 'Banner uploaded successfully',
      url: req.file.path
    });
  } catch (error) {
    console.error('Banner upload error:', error);
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
});

export default router;