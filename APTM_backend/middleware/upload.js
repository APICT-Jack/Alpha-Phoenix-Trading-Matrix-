// middleware/upload.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { uploadGallery, uploadAvatar, uploadBanner } from '../services/cloudinaryService.js';

// Ensure directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Local storage for documents
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
// CLOUDINARY UPLOADS
// ============================================
export const uploadGalleryMiddleware = uploadGallery.array('galleryFiles', 10);
export const uploadAvatarMiddleware = uploadAvatar.single('avatar');
export const uploadBannerMiddleware = uploadBanner.single('banner');

// ============================================
// LOCAL UPLOADS
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
// SIMPLE SINGLE UPLOAD FOR AVATAR (for user.Routes.js)
// ============================================
export const uploadSingle = uploadAvatar.single('avatar');

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
    return multer().array(field, maxCount);
  },
  uploadAvatar: uploadAvatarMiddleware,
  uploadBanner: uploadBannerMiddleware,
  uploadGallery: uploadGalleryMiddleware,
  uploadDocument: uploadDocumentMiddleware,
  uploadAddressProof: uploadAddressProofMiddleware
};

export default uploadMiddleware;