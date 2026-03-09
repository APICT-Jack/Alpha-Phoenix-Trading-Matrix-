import express from 'express';
import {
  getGallery,
  uploadToGallery,
  createGalleryFolder,
  deleteGalleryFolder,
  deleteGalleryItem,
  updateGalleryItem
} from '../controllers/galleryController.js';
import authMiddleware from '../middleware/auth.js';
import { uploadGalleryMiddleware } from '../middleware/upload.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/:userId', getGallery);
router.post('/upload', uploadGalleryMiddleware, uploadToGallery);
router.post('/folders', createGalleryFolder);
router.delete('/folders/:folderId', deleteGalleryFolder);
router.delete('/items/:itemId', deleteGalleryItem);
router.put('/items/:itemId', updateGalleryItem);

export default router;