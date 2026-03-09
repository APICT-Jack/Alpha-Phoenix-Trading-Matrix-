// routes/posts.routes.js - Updated with proper multer configuration
import express from 'express';
import multer from 'multer';
import {
  createPost,
  getUserPosts,
  getFeed,
  getPostById,
  deletePost,
  likePost,
  commentOnPost,
  replyToComment,
  likeComment,
  likeReply,
  repostPost,
  updatePost,
  togglePinPost,
  getTrendingHashtags,
  searchByHashtag,
  getScheduledPosts,
  uploadPostMedia,
  reportPost,
  voteOnPoll,      
  getPollResults   
} from '../controllers/postController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// All routes require authentication
router.use(authMiddleware);

// Feed route
router.get('/feed', getFeed);

// Trending hashtags
router.get('/hashtags/trending', getTrendingHashtags);
router.get('/hashtags/:hashtag', searchByHashtag);

// Scheduled posts
router.get('/scheduled', getScheduledPosts);

// Media upload
router.post('/upload', upload.array('media', 10), uploadPostMedia);

// ===== IMPORTANT: Create post route MUST use multer to parse FormData =====
router.post('/', upload.array('media', 10), createPost);
// Poll routes

router.post('/polls/:pollId/vote', voteOnPoll);
router.get('/polls/:pollId/results', getPollResults);
// Other routes
router.get('/:postId', getPostById);
router.put('/:postId', updatePost);
router.delete('/:postId', deletePost);
router.post('/:postId/pin', togglePinPost);
router.post('/:postId/like', likePost);
router.post('/:postId/repost', repostPost);
router.post('/:postId/comments', commentOnPost);
router.post('/:postId/comments/:commentId/like', likeComment);
router.post('/:postId/comments/:commentId/replies', replyToComment);
router.post('/:postId/comments/:commentId/replies/:replyId/like', likeReply);
router.post('/:postId/report', reportPost);
router.get('/user/:userId', getUserPosts);

export default router;