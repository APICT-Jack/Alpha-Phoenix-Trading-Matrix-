// middleware/upload.js - COMPREHENSIVE UPDATED VERSION
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure all upload directories exist
const ensureUploadDirs = () => {
  const dirs = [
    'uploads/avatars',
    'uploads/banners', 
    'uploads/documents',
    'uploads/address-proofs',
    'uploads/gallery',
    'uploads/temp'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    }
  });
};

// Call this when your app starts
ensureUploadDirs();

// ============================================
// STORAGE CONFIGURATIONS
// ============================================
// Add to existing upload.js - Post Media Storage
const postMediaStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/posts/';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `post-${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Post Media File Filter
const postMediaFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo',
    'application/pdf'
  ];
  
  const allowedExtensions = /jpeg|jpg|png|gif|webp|pdf|mp4|mpeg|mov|avi/;
  
  const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedMimeTypes.includes(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Error: Only images, videos, and PDFs are allowed!'));
  }
};

// Post Media Upload Middleware (multiple files)
export const uploadPostMediaMiddleware = multer({
  storage: postMediaStorage,
  limits: { 
    fileSize: 100 * 1024 * 1024, // 100MB
    files: 10
  },
  fileFilter: postMediaFileFilter
}).array('media', 10);

// Single post media upload
export const uploadSinglePostMediaMiddleware = multer({
  storage: postMediaStorage,
  limits: { 
    fileSize: 100 * 1024 * 1024,
    files: 1
  },
  fileFilter: postMediaFileFilter
}).single('media');
// 1. Avatar Storage
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/avatars/';
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `avatar-${req.user?.id || 'user'}-${Date.now()}${path.extname(file.originalname)}`;
    console.log('📁 Saving avatar as:', uniqueName);
    cb(null, uniqueName);
  }
});

// 2. Banner Storage
const bannerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/banners/';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `banner-${req.user?.id || 'user'}-${Date.now()}${path.extname(file.originalname)}`;
    console.log('📁 Saving banner as:', uniqueName);
    cb(null, uniqueName);
  }
});

// 3. Document Storage
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/documents/';
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `doc-${req.user?.id || 'user'}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// 4. Address Proof Storage
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
    console.log('📁 Saving address proof as:', uniqueName);
    cb(null, uniqueName);
  }
});

// 5. Gallery Storage
const galleryStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/gallery/';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `gallery-${req.user?.id || 'user'}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// 6. Bulk/Temp Storage
const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/temp/';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `temp-${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// ============================================
// FILE FILTERS
// ============================================

// 1. Image File Filter
const imageFileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  const allowedExtensions = /jpeg|jpg|png|gif|webp|svg/;
  
  const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedMimeTypes.includes(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Error: Only image files are allowed (JPEG, JPG, PNG, GIF, WebP, SVG)!'));
  }
};

// 2. Document File Filter
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
    cb(new Error('Error: Only PDF, Word, text, or image files are allowed!'));
  }
};

// 3. Address Proof File Filter (strict)
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
    cb(new Error('Error: Address proof must be PDF, JPG, PNG, or HEIC file!'));
  }
};

// 4. Gallery File Filter (images + videos)
const galleryFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo',
    'application/pdf'
  ];
  
  const allowedExtensions = /jpeg|jpg|png|gif|webp|pdf|mp4|mpeg|mov|avi/;
  
  const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedMimeTypes.includes(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Error: Gallery files must be images, videos, or PDFs!'));
  }
};

// 5. Video File Filter
const videoFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo',
    'video/webm', 'video/x-matroska'
  ];
  
  const allowedExtensions = /mp4|mpeg|mov|avi|webm|mkv/;
  
  const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedMimeTypes.includes(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Error: Only video files are allowed (MP4, MOV, AVI, WebM, MKV)!'));
  }
};

// 6. Audio File Filter
const audioFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4',
    'audio/x-m4a', 'audio/webm'
  ];
  
  const allowedExtensions = /mp3|wav|ogg|m4a|webm/;
  
  const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedMimeTypes.includes(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Error: Only audio files are allowed (MP3, WAV, OGG, M4A)!'));
  }
};

// ============================================
// MULTER MIDDLEWARE INSTANCES
// ============================================

// 1. Avatar Upload Middleware
export const uploadAvatarMiddleware = multer({
  storage: avatarStorage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  },
  fileFilter: imageFileFilter
}).single('avatar');

// 2. Banner Upload Middleware
export const uploadBannerMiddleware = multer({
  storage: bannerStorage,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1
  },
  fileFilter: imageFileFilter
}).single('banner');

// 3. Document Upload Middleware
export const uploadDocumentMiddleware = multer({
  storage: documentStorage,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1
  },
  fileFilter: documentFileFilter
}).single('document');

// 4. Address Proof Upload Middleware
export const uploadAddressProofMiddleware = multer({
  storage: addressProofStorage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  },
  fileFilter: addressProofFileFilter
}).single('addressProof');

// 5. Gallery Upload Middleware
export const uploadGalleryMiddleware = multer({
  storage: galleryStorage,
  limits: { 
    fileSize: 50 * 1024 * 1024, // 50MB for videos
    files: 10 // Allow multiple files
  },
  fileFilter: galleryFileFilter
}).array('galleryFiles', 10); // Accept up to 10 files

// 6. Multiple Images Upload Middleware
export const uploadMultipleImagesMiddleware = multer({
  storage: tempStorage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB per image
    files: 20 // Allow up to 20 images
  },
  fileFilter: imageFileFilter
}).array('images', 20);

// 7. Video Upload Middleware
export const uploadVideoMiddleware = multer({
  storage: tempStorage,
  limits: { 
    fileSize: 100 * 1024 * 1024, // 100MB
    files: 1
  },
  fileFilter: videoFileFilter
}).single('video');

// 8. Audio Upload Middleware
export const uploadAudioMiddleware = multer({
  storage: tempStorage,
  limits: { 
    fileSize: 20 * 1024 * 1024, // 20MB
    files: 1
  },
  fileFilter: audioFileFilter
}).single('audio');

// 9. Generic File Upload Middleware
export const uploadGenericMiddleware = multer({
  storage: tempStorage,
  limits: { 
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 5
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
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

// 10. Profile Media Upload (Avatar + Banner together)
export const uploadProfileMediaMiddleware = multer({
  storage: tempStorage,
  limits: { 
    fileSize: 15 * 1024 * 1024, // 15MB total
    files: 2 // Avatar + Banner
  },
  fileFilter: imageFileFilter
}).fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'banner', maxCount: 1 }
]);

// ============================================
// HELPER FUNCTIONS
// ============================================

// Clean up temporary files
export const cleanupTempFiles = (filePaths) => {
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

// Generate file URL
export const generateFileUrl = (filename, fileType = 'avatar') => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  
  const typeToFolder = {
    avatar: 'avatars',
    banner: 'banners',
    document: 'documents',
    addressProof: 'address-proofs',
    gallery: 'gallery',
    temp: 'temp'
  };
  
  const folder = typeToFolder[fileType] || 'temp';
  return `${baseUrl}/uploads/${folder}/${filename}`;
};

// Check if file exists
export const fileExists = (filePath) => {
  return fs.existsSync(filePath);
};

// Delete file
export const deleteFile = (filePath) => {
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

// Move file from temp to permanent location
export const moveFile = (sourcePath, destFolder, newFilename) => {
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
  storage: avatarStorage,
  limits: { 
    fileSize: 5 * 1024 * 1024,
    files: 1
  },
  fileFilter: imageFileFilter
});

export default upload;

// ============================================
// USAGE EXAMPLES (for reference)
// ============================================

/*
// 1. Avatar Upload
router.post('/avatar', authMiddleware, uploadAvatarMiddleware, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  res.json({ 
    success: true, 
    message: 'Avatar uploaded',
    filename: req.file.filename,
    url: generateFileUrl(req.file.filename, 'avatar')
  });
});

// 2. Banner Upload
router.post('/banner', authMiddleware, uploadBannerMiddleware, (req, res) => {
  // Handle banner upload
});

// 3. Address Proof Upload
router.post('/address-proof', authMiddleware, uploadAddressProofMiddleware, (req, res) => {
  // Handle address proof upload
});

// 4. Multiple Images Upload
router.post('/gallery', authMiddleware, uploadMultipleImagesMiddleware, (req, res) => {
  // Handle multiple images
  const files = req.files;
  const fileUrls = files.map(file => generateFileUrl(file.filename, 'gallery'));
  
  res.json({
    success: true,
    message: `${files.length} files uploaded`,
    files: fileUrls
  });
});

// 5. With Error Handling
router.post('/upload', 
  authMiddleware,
  uploadAvatarMiddleware,
  handleUploadError,
  (req, res) => {
    // Your upload logic here
  }
);
*/