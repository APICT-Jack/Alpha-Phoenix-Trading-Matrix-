// routes/gallery.routes.js
import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { uploadGalleryMiddleware } from '../middleware/upload.js';
import { 
  getGallery,
  uploadToGallery,
  createGalleryFolder,
  deleteGalleryFolder,
  deleteGalleryItem,
  updateGalleryItem
} from '../controllers/galleryController.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Gallery routes
router.get('/:userId', getGallery);
router.post('/upload', uploadGalleryMiddleware, uploadToGallery);
router.post('/folders', createGalleryFolder);
router.delete('/folders/:folderId', deleteGalleryFolder);
router.delete('/items/:itemId', deleteGalleryItem);
router.put('/items/:itemId', updateGalleryItem);

export default router;