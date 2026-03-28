// middleware/upload.js
import multer from 'multer';
import { uploadGallery, uploadAvatar, uploadBanner } from '../services/cloudinaryService.js';

// ============================================
// STORAGE CONFIGURATIONS FOR LOCAL FALLBACK
// ============================================
import path from 'path';
import fs from 'fs';

// Ensure upload directories exist (for local development)
const ensureUploadDirs = () => {
  const dirs = [
    'uploads/avatars',
    'uploads/banners', 
    'uploads/documents',
    'uploads/address-proofs',
    'uploads/gallery',
    'uploads/posts',
    'uploads/temp'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    }
  });
};

// Only create directories in development
if (process.env.NODE_ENV !== 'production') {
  ensureUploadDirs();
}

// Local storage for documents (if needed)
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/documents/';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
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
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `address-proof-${req.user?.id || 'user'}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filters
const imageFileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const allowedExtensions = /jpeg|jpg|png|gif|webp/;
  
  const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedMimeTypes.includes(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

const documentFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/jpg',
    'image/png'
  ];
  
  const allowedExtensions = /pdf|doc|docx|txt|jpeg|jpg|png/;
  
  const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedMimeTypes.includes(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only PDF, Word, text, or image files are allowed!'));
  }
};

const addressProofFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/heic',
    'image/heif'
  ];
  
  const allowedExtensions = /pdf|jpeg|jpg|png|heic|heif/;
  
  const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedMimeTypes.includes(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Address proof must be PDF, JPG, PNG, or HEIC file!'));
  }
};

// ============================================
// CLOUDINARY STORAGE (for images)
// ============================================

// Gallery upload - multiple files
export const uploadGalleryMiddleware = uploadGallery.array('galleryFiles', 10);

// Avatar upload - single file
export const uploadAvatarMiddleware = uploadAvatar.single('avatar');

// Banner upload - single file
export const uploadBannerMiddleware = uploadBanner.single('banner');

// ============================================
// LOCAL STORAGE (for documents and address proofs)
// ============================================

// Document upload - single file (local storage)
export const uploadDocumentMiddleware = multer({
  storage: documentStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: documentFileFilter
}).single('document');

// Address Proof upload - single file (local storage)
export const uploadAddressProofMiddleware = multer({
  storage: addressProofStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: addressProofFileFilter
}).single('addressProof');

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

// ============================================
// DEFAULT EXPORT
// ============================================

const uploadMiddleware = {
  single: uploadSingle,
  array: (field, maxCount) => {
    if (field === 'galleryFiles') return uploadGalleryMiddleware;
    if (field === 'avatar') return uploadAvatarMiddleware;
    if (field === 'banner') return uploadBannerMiddleware;
    if (field === 'document') return uploadDocumentMiddleware;
    if (field === 'addressProof') return uploadAddressProofMiddleware;
    return multer().array(field, maxCount);
  },
  uploadAvatar: uploadAvatarMiddleware,
  uploadBanner: uploadBannerMiddleware,
  uploadGallery: uploadGalleryMiddleware,
  uploadDocument: uploadDocumentMiddleware,
  uploadAddressProof: uploadAddressProofMiddleware
};

export default uploadMiddleware;