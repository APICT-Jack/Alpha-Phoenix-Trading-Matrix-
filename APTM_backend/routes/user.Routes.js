// routes/user.Routes.js
import express from 'express';
import authMiddleware from '../middleware/auth.js';
import uploadMiddleware from '../middleware/upload.js';
import { 
  getProfile, 
  updateProfile, 
  // Remove uploadAvatar and deleteAvatar from here
  getAllUsers,
  getUserById,
  searchUsers
} from '../controllers/userController.js';

const router = express.Router();

router.use(authMiddleware);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Remove avatar routes - they're already in profile.routes.js
// router.post('/avatar', uploadMiddleware.uploadAvatar, uploadAvatar);
// router.delete('/avatar', deleteAvatar);

// User discovery routes
router.get('/all', getAllUsers);
router.get('/search', searchUsers);
router.get('/:userId', getUserById);

export default router;