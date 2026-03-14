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
router.get('/test-upload/:type/:filename', (req, res) => {
  const { type, filename } = req.params;
  const filePath = path.join(process.cwd(), 'uploads', type, filename);
  
  console.log('🔍 Testing file access:', filePath);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ 
      success: false, 
      message: 'File not found',
      path: filePath 
    });
  }
});
export default router;