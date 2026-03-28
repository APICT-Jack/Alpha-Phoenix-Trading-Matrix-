// middleware/upload.js
import multer from 'multer';
import { uploadGallery } from '../services/cloudinaryService.js';

// Gallery upload - multiple files
export const uploadGalleryMiddleware = uploadGallery.array('galleryFiles', 10);

// Generic upload handler for errors
export const handleUploadError = (err, req, res, next) => {
  if (err) {
    console.error('Upload error:', err);
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload failed'
    });
  }
  next();
};