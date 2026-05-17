// middleware/upload.js - COMPLETE WORKING VERSION

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import from cloudinary service
import { 
  uploadGallery, 
  uploadAvatar, 
  uploadBanner 
} from '../services/cloudinaryService.js';

// Ensure directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Local storage for documents (as fallback)
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/documents/';
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `doc-${req.user?.id || 'user'}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const addressProofStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/address-proofs/';
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `address-proof-${req.user?.id || 'user'}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filters
const imageFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only images allowed'));
};

const documentFilter = (req, file, cb) => {
  const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png'];
  allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Invalid document type'));
};

const addressProofFilter = (req, file, cb) => {
  const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Address proof must be PDF or image'));
};

// ============================================
// CLOUDINARY UPLOADS (with error handling)
// ============================================

// Helper to create middleware with fallback
const createCloudinaryMiddleware = (uploader, fieldName) => {
  return (req, res, next) => {
    if (!uploader) {
      console.error(`Uploader for ${fieldName} is not available`);
      return next(new Error(`Upload service not available for ${fieldName}`));
    }
    
    // Use the appropriate method based on whether it's array or single
    if (fieldName === 'galleryFiles') {
      uploader(req, res, (err) => {
        if (err) {
          console.error(`Cloudinary upload error for ${fieldName}:`, err);
          return next(err);
        }
        next();
      });
    } else {
      uploader(req, res, (err) => {
        if (err) {
          console.error(`Cloudinary upload error for ${fieldName}:`, err);
          return next(err);
        }
        next();
      });
    }
  };
};

// Create middleware instances
export const uploadGalleryMiddleware = (req, res, next) => {
  if (uploadGallery && typeof uploadGallery.array === 'function') {
    uploadGallery.array('galleryFiles', 10)(req, res, next);
  } else {
    console.error('uploadGallery is not properly configured');
    next(new Error('Gallery upload service unavailable'));
  }
};

export const uploadAvatarMiddleware = (req, res, next) => {
  if (uploadAvatar && typeof uploadAvatar.single === 'function') {
    uploadAvatar.single('avatar')(req, res, next);
  } else {
    console.error('uploadAvatar is not properly configured');
    next(new Error('Avatar upload service unavailable'));
  }
};

export const uploadBannerMiddleware = (req, res, next) => {
  if (uploadBanner && typeof uploadBanner.single === 'function') {
    uploadBanner.single('banner')(req, res, next);
  } else {
    console.error('uploadBanner is not properly configured');
    next(new Error('Banner upload service unavailable'));
  }
};

// ============================================
// LOCAL UPLOADS (for documents)
// ============================================
export const uploadDocumentMiddleware = multer({ 
  storage: documentStorage, 
  limits: { fileSize: 10 * 1024 * 1024 }, 
  fileFilter: documentFilter 
}).single('document');

export const uploadAddressProofMiddleware = multer({ 
  storage: addressProofStorage, 
  limits: { fileSize: 5 * 1024 * 1024 }, 
  fileFilter: addressProofFilter 
}).single('addressProof');

// ============================================
// SIMPLE SINGLE UPLOAD (fallback)
// ============================================
export const uploadSingle = (req, res, next) => {
  const localUpload = multer({ 
    dest: 'uploads/temp/',
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: imageFilter
  }).single('avatar');
  
  localUpload(req, res, next);
};

// ============================================
// ERROR HANDLER
// ============================================
export const handleUploadError = (err, req, res, next) => {
  if (err) {
    console.error('Upload error:', err);
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
};

// ============================================
// DEFAULT EXPORT
// ============================================
const uploadMiddleware = {
  single: (field) => {
    if (field === 'avatar') return uploadAvatarMiddleware;
    if (field === 'banner') return uploadBannerMiddleware;
    if (field === 'document') return uploadDocumentMiddleware;
    if (field === 'addressProof') return uploadAddressProofMiddleware;
    return uploadSingle;
  },
  array: (field, maxCount) => {
    if (field === 'galleryFiles') return uploadGalleryMiddleware;
    return (req, res, next) => {
      const localUpload = multer().array(field, maxCount);
      localUpload(req, res, next);
    };
  },
  uploadAvatar: uploadAvatarMiddleware,
  uploadBanner: uploadBannerMiddleware,
  uploadGallery: uploadGalleryMiddleware,
  uploadDocument: uploadDocumentMiddleware,
  uploadAddressProof: uploadAddressProofMiddleware
};

console.log('='.repeat(50));
console.log('📁 UPLOAD MIDDLEWARE INITIALIZED');
console.log('='.repeat(50));
console.log('uploadGallery from cloudinary:', !!uploadGallery);
console.log('uploadAvatar from cloudinary:', !!uploadAvatar);
console.log('uploadBanner from cloudinary:', !!uploadBanner);
console.log('uploadGalleryMiddleware exists:', !!uploadGalleryMiddleware);
console.log('uploadAvatarMiddleware exists:', !!uploadAvatarMiddleware);
console.log('uploadBannerMiddleware exists:', !!uploadBannerMiddleware);
console.log('uploadMiddleware.uploadGallery exists:', !!uploadMiddleware.uploadGallery);
console.log('='.repeat(50));

export default uploadMiddleware;