import express from 'express';
import { 
  getAllUsers,
  getUserById,
  searchUsers,
  uploadAvatar,
  getProfile
} from '../controllers/userController.js';
import authMiddleware from '../middleware/auth.js';
import uploadMiddleware from '../middleware/upload.js';

const router = express.Router();

// All user routes require authentication
router.get('/all', authMiddleware, getAllUsers);
router.get('/search', authMiddleware, searchUsers);
router.get('/:userId', authMiddleware, getUserById);
router.get('/me', authMiddleware, getProfile);
router.post('/avatar', authMiddleware, uploadMiddleware.single('avatar'), uploadAvatar);

export default router;