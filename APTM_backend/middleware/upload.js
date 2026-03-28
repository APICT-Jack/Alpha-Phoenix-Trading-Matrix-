// middleware/upload.js - COMPLETE CLOUDINARY VERSION
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { 
  uploadAvatar, 
  uploadBanner, 
  uploadGallery, 
  uploadDocument, 
  uploadAddressProof, 
  uploadPostMedia 
} from '../services/cloudinaryService.js';

// ============================================
// BACKWARD COMPATIBILITY - Ensure local directories exist (for development)
// ============================================
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

// Only call in development or as fallback
if (process.env.NODE_ENV !== 'production') {
  ensureUploadDirs();
}

// ============================================
// MULTER MIDDLEWARE INSTANCES - USING CLOUDINARY
// ============================================

// 1. Avatar Upload Middleware
export const uploadAvatarMiddleware = uploadAvatar.single('avatar');

// 2. Banner Upload Middleware
export const uploadBannerMiddleware = uploadBanner.single('banner');

// 3. Document Upload Middleware
export const uploadDocumentMiddleware = uploadDocument.single('document');

// 4. Address Proof Upload Middleware
export const uploadAddressProofMiddleware = uploadAddressProof.single('addressProof');

// 5. Gallery Upload Middleware (multiple files)
export const uploadGalleryMiddleware = uploadGallery.array('galleryFiles', 10);

// 6. Post Media Upload Middleware (multiple files)
export const uploadPostMediaMiddleware = uploadPostMedia.array('media', 10);

// 7. Single Post Media Upload Middleware
export const uploadSinglePostMediaMiddleware = uploadPostMedia.single('media');

// 8. Multiple Images Upload Middleware
export const uploadMultipleImagesMiddleware = uploadGallery.array('images', 20);

// 9. Video Upload Middleware
export const uploadVideoMiddleware = uploadPostMedia.single('video');

// 10. Audio Upload Middleware
export const uploadAudioMiddleware = uploadPostMedia.single('audio');

// 11. Generic File Upload Middleware
export const uploadGenericMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 5
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv',
      'application/zip', 'application/x-rar-compressed'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Error: File type not allowed!'));
    }
  }
}).array('files', 5);

// 12. Profile Media Upload (Avatar + Banner together)
export const uploadProfileMediaMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 15 * 1024 * 1024, // 15MB total
    files: 2
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
}).fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'banner', maxCount: 1 }
]);

// ============================================
// HELPER FUNCTIONS
// ============================================

// Clean up temporary files (for local development)
export const cleanupTempFiles = (filePaths) => {
  if (process.env.NODE_ENV === 'production') return; // Skip in production
    
  filePaths.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`🧹 Cleaned up temp file: ${filePath}`);
      } catch (error) {
        console.error(`❌ Error cleaning up file ${filePath}:`, error);
      }
    }
  });
};

// Get file MIME type
export const getFileType = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'spreadsheet';
  if (mimeType.includes('text/') || mimeType.includes('csv')) return 'text';
  if (mimeType.includes('zip') || mimeType.includes('rar')) return 'archive';
  return 'other';
};

// Validate file size
export const validateFileSize = (fileSize, maxSizeMB) => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return fileSize <= maxSizeBytes;
};

// Generate file URL (handles both Cloudinary and local)
export const generateFileUrl = (fileOrUrl, fileType = 'avatar') => {
  if (!fileOrUrl) return null;
  
  // If it's already a full URL (Cloudinary or absolute)
  if (typeof fileOrUrl === 'string' && fileOrUrl.startsWith('http')) {
    return fileOrUrl;
  }
  
  // If it's a Cloudinary file object
  if (fileOrUrl.path && fileOrUrl.path.startsWith('http')) {
    return fileOrUrl.path;
  }
  
  // Handle local files (for development/backward compatibility)
  const baseUrl = process.env.BASE_URL || process.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
  
  const typeToFolder = {
    avatar: 'avatars',
    banner: 'banners',
    document: 'documents',
    addressProof: 'address-proofs',
    gallery: 'gallery',
    post: 'posts',
    temp: 'temp'
  };
  
  const folder = typeToFolder[fileType] || 'temp';
  let filename = fileOrUrl;
  
  // Extract filename if it contains path
  if (typeof fileOrUrl === 'string' && fileOrUrl.includes('/')) {
    filename = fileOrUrl.split('/').pop();
  }
  
  return `${baseUrl}/uploads/${folder}/${filename}`;
};

// Check if file exists (for local development)
export const fileExists = (filePath) => {
  if (process.env.NODE_ENV === 'production') return false;
  return fs.existsSync(filePath);
};

// Delete file (for local development)
export const deleteFile = (filePath) => {
  if (process.env.NODE_ENV === 'production') return false;
  
  try {
    if (fileExists(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error deleting file ${filePath}:`, error);
    return false;
  }
};

// Move file from temp to permanent location (for local development)
export const moveFile = (sourcePath, destFolder, newFilename) => {
  if (process.env.NODE_ENV === 'production') return null;
  
  try {
    const destDir = `uploads/${destFolder}`;
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    const destPath = path.join(destDir, newFilename);
    fs.renameSync(sourcePath, destPath);
    return destPath;
  } catch (error) {
    console.error(`Error moving file from ${sourcePath} to ${destFolder}:`, error);
    return null;
  }
};

// ============================================
// ERROR HANDLING MIDDLEWARE
// ============================================

export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    let message = 'File upload error';
    
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File too large. Please check the maximum file size.';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files uploaded.';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field.';
        break;
      case 'LIMIT_PART_COUNT':
        message = 'Too many parts in the request.';
        break;
      case 'LIMIT_FIELD_KEY':
        message = 'Field name too long.';
        break;
      case 'LIMIT_FIELD_VALUE':
        message = 'Field value too long.';
        break;
      case 'LIMIT_FIELD_COUNT':
        message = 'Too many fields.';
        break;
      default:
        message = `Upload error: ${err.message}`;
    }
    
    return res.status(400).json({
      success: false,
      message,
      error: err.code
    });
  } else if (err) {
    // Other errors (file type, etc.)
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload failed',
      error: 'UPLOAD_ERROR'
    });
  }
  
  next();
};

// ============================================
// DEFAULT EXPORT (for backward compatibility)
// ============================================

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 5 * 1024 * 1024,
    files: 1
  }
});

export default upload;