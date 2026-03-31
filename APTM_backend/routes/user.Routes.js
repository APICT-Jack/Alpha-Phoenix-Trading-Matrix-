// routes/user.Routes.js - Add new routes
import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { 
  getAllUsers,
  getUserById,
  searchUsers,
  getSuggestedFriends,
  getUserFollowers,
  getUserFollowing,
  advancedSearchUsers
} from '../controllers/userController.js';

const router = express.Router();

// All routes here require authentication
router.use(authMiddleware);

// User discovery routes
router.get('/all', getAllUsers);
router.get('/search', searchUsers);
router.get('/suggestions', getSuggestedFriends);
router.get('/advanced-search', advancedSearchUsers);
router.get('/followers/:userId', getUserFollowers);
router.get('/following/:userId', getUserFollowing);
router.get('/:userId', getUserById);

export default router;