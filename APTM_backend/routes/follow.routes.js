import express from 'express';
import {
  followUser,
  unfollowUser,
  checkFollowStatus,
  getFollowers,
  getFollowing
} from '../controllers/followController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.post('/follow/:userId', authMiddleware, followUser);
router.post('/unfollow/:userId', authMiddleware, unfollowUser);
router.get('/status/:userId', authMiddleware, checkFollowStatus);
router.get('/followers/:userId', authMiddleware, getFollowers);
router.get('/following/:userId', authMiddleware, getFollowing);

export default router;