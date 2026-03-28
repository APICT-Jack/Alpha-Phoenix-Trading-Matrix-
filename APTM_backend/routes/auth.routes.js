// routes/auth.routes.js
import express from 'express';
import User from '../models/User.js';
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

const router = express.Router();

// Public auth routes
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

// Change password route (POST version)
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

export default router;