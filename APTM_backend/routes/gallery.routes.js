// routes/gallery.routes.js
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import uploadMiddleware from '../middleware/upload.js';
import { 
  getGallery, uploadToGallery, createGalleryFolder,
  deleteGalleryFolder, deleteGalleryItem, updateGalleryItem
} from '../controllers/galleryController.js';

const router = express.Router();
// Add this test endpoint first
router.post('/test-upload', (req, res, next) => {
  console.log('🔍 Test route hit');
  console.log('Headers:', req.headers);
  console.log('Content-Type:', req.headers['content-type']);
  next();
}, uploadMiddleware.uploadGallery, (req, res) => {
  console.log('✅ Test upload middleware executed');
  console.log('Files:', req.files?.length);
  res.json({
    success: true,
    message: 'Upload middleware working',
    files: req.files?.map(f => ({
      originalname: f.originalname,
      size: f.size,
      path: f.path,
      public_id: f.public_id
    }))
  });
});
router.use(authenticateToken);
router.get('/:userId', getGallery);
router.post('/upload', uploadMiddleware.uploadGallery, uploadToGallery);
router.post('/folders', createGalleryFolder);
router.delete('/folders/:folderId', deleteGalleryFolder);
router.delete('/items/:itemId', deleteGalleryItem);
router.put('/items/:itemId', updateGalleryItem);

export default router;