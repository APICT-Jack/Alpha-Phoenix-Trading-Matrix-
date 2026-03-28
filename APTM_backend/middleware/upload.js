// middleware/upload.js
import multer from 'multer';
import { uploadGallery, uploadAvatar, uploadBanner } from '../services/cloudinaryService.js';

// Gallery upload - multiple files
export const uploadGalleryMiddleware = uploadGallery.array('galleryFiles', 10);

// Avatar upload - single file
export const uploadAvatarMiddleware = uploadAvatar.single('avatar');

// Banner upload - single file
export const uploadBannerMiddleware = uploadBanner.single('banner');

// Generic single file upload (for avatar, etc.)
export const uploadSingle = uploadAvatar.single('avatar');

// Generic multiple file upload
export const uploadMultiple = uploadGallery.array('files', 10);

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

// Default export for backward compatibility
const uploadMiddleware = {
  single: uploadSingle,
  array: (field, maxCount) => {
    if (field === 'galleryFiles') return uploadGalleryMiddleware;
    if (field === 'avatar') return uploadAvatarMiddleware;
    if (field === 'banner') return uploadBannerMiddleware;
    return multer().array(field, maxCount);
  },
  uploadAvatar: uploadAvatarMiddleware,
  uploadBanner: uploadBannerMiddleware,
  uploadGallery: uploadGalleryMiddleware
};

export default uploadMiddleware;