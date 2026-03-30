// routes/user.Routes.js
import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { 
  getAllUsers,
  getUserById,
  searchUsers
} from '../controllers/userController.js';

const router = express.Router();

// All routes here require authentication
router.use(authMiddleware);

// User discovery routes only
router.get('/all', getAllUsers);
router.get('/search', searchUsers);
router.get('/:userId', getUserById);

export default router;