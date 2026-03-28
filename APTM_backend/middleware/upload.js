// middleware/upload.js
import multer from 'multer';
import { uploadGallery, uploadAvatar, uploadBanner } from '../services/cloudinaryService.js';

// Gallery upload - multiple files
export const uploadGalleryMiddleware = uploadGallery.array('galleryFiles', 10);

// Avatar upload - single file
export const uploadAvatarMiddleware = uploadAvatar.single('avatar');

// Banner upload - single file
export const uploadBannerMiddleware = uploadBanner.single('banner');

// Generic upload handler (for posts, etc.)
export const uploadGenericMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
}).array('media', 10);

export const handleUploadError = (err, req, res, next) => {
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload failed'
    });
  }
  next();
};