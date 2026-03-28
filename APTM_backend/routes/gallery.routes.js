// routes/gallery.routes.js
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import uploadMiddleware from '../middleware/upload.js';
import { 
  getGallery, uploadToGallery, createGalleryFolder,
  deleteGalleryFolder, deleteGalleryItem, updateGalleryItem
} from '../controllers/galleryController.js';

const router = express.Router();

router.use(authenticateToken);
router.get('/:userId', getGallery);
router.post('/upload', uploadMiddleware.uploadGalleryMiddleware, uploadToGallery);
router.post('/folders', createGalleryFolder);
router.delete('/folders/:folderId', deleteGalleryFolder);
router.delete('/items/:itemId', deleteGalleryItem);
router.put('/items/:itemId', updateGalleryItem);

export default router;