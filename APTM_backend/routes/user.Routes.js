// routes/user.Routes.js
import express from 'express';
import authMiddleware from '../middleware/auth.js';
import uploadMiddleware from '../middleware/upload.js';
import { 
  getProfile, 
  updateProfile, 
  uploadAvatar,
  getAllUsers,
  getUserById,
  searchUsers
} from '../controllers/userController.js';
import { deleteAvatar } from '../controllers/userProfileController.js';  // Add this line

const router = express.Router();

// Protected routes (require authentication)
router.use(authMiddleware);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Avatar routes
router.post('/avatar', uploadMiddleware.uploadAvatar, uploadAvatar);
router.delete('/avatar', deleteAvatar);  // Now works

// User discovery routes
router.get('/all', getAllUsers);
router.get('/search', searchUsers);
router.get('/:userId', getUserById);

export default router;