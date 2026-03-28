// services/cloudinaryService.js
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import path from 'path';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Create storage for different file types
const createCloudinaryStorage = (folder, allowedFormats = null) => {
  const params = {
    folder: `trading-app/${folder}`,
    resource_type: 'auto',
    transformation: [
      { quality: 'auto' },
      { fetch_format: 'auto' }
    ]
  };
  
  if (allowedFormats) {
    params.allowed_formats = allowedFormats;
  }
  
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: params
  });
};

// Export configured storages
export const avatarStorage = createCloudinaryStorage('avatars', ['jpg', 'jpeg', 'png', 'gif', 'webp']);
export const bannerStorage = createCloudinaryStorage('banners', ['jpg', 'jpeg', 'png', 'gif', 'webp']);
export const galleryStorage = createCloudinaryStorage('gallery', ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'avi', 'pdf']);
export const documentStorage = createCloudinaryStorage('documents', ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png']);
export const postMediaStorage = createCloudinaryStorage('posts', ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'avi', 'pdf']);
export const addressProofStorage = createCloudinaryStorage('address-proofs', ['pdf', 'jpg', 'jpeg', 'png', 'heic', 'heif']);

// Create multer instances with Cloudinary storage
export const uploadAvatar = multer({ 
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed (JPEG, PNG, GIF, WebP)'));
    }
  }
});

export const uploadBanner = multer({ 
  storage: bannerStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed (JPEG, PNG, GIF, WebP)'));
    }
  }
});

export const uploadGallery = multer({ 
  storage: galleryStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB for videos
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo',
      'application/pdf'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only images, videos, and PDFs are allowed'));
    }
  }
});

export const uploadDocument = multer({ 
  storage: documentStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg', 'image/jpg', 'image/png'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, Word, text, or image files are allowed'));
    }
  }
});

export const uploadAddressProof = multer({ 
  storage: addressProofStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg', 'image/jpg', 'image/png',
      'image/heic', 'image/heif'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Address proof must be PDF, JPG, PNG, or HEIC file'));
    }
  }
});

export const uploadPostMedia = multer({ 
  storage: postMediaStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo',
      'application/pdf'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only images, videos, and PDFs are allowed'));
    }
  }
});

// Helper function to delete files from Cloudinary
export const deleteFromCloudinary = async (publicId, options = {}) => {
  try {
    if (!publicId) return null;
    
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: options.resource_type || 'auto',
      ...options
    });
    
    console.log(`🗑️ Deleted from Cloudinary: ${publicId}`, result);
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

// Helper to get public ID from Cloudinary URL
export const getPublicIdFromUrl = (url) => {
  if (!url || !url.includes('cloudinary')) return null;
  
  try {
    // Extract public ID from Cloudinary URL
    // Format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/filename.jpg
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;
    
    // Get everything after 'upload' and before the version (v1234567890)
    const relevantParts = parts.slice(uploadIndex + 2);
    const publicIdWithExt = relevantParts.join('/');
    
    // Remove version prefix if present
    const publicId = publicIdWithExt.replace(/^v\d+\//, '');
    
    // Remove file extension
    return publicId.replace(/\.[^/.]+$/, '');
  } catch (error) {
    console.error('Error extracting public ID from URL:', error);
    return null;
  }
};

// Helper to get resource type from URL or mimetype
export const getResourceType = (url, mimetype) => {
  if (mimetype) {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype === 'application/pdf') return 'raw';
  }
  
  if (url) {
    if (url.includes('/image/')) return 'image';
    if (url.includes('/video/')) return 'video';
    if (url.includes('/raw/')) return 'raw';
  }
  
  return 'auto';
};

// Helper to delete multiple files
export const deleteMultipleFromCloudinary = async (publicIds) => {
  const results = [];
  for (const publicId of publicIds) {
    if (publicId) {
      const result = await deleteFromCloudinary(publicId);
      results.push(result);
    }
  }
  return results;
};

// Helper to get optimized URL
export const getOptimizedUrl = (publicId, options = {}) => {
  return cloudinary.url(publicId, {
    secure: true,
    quality: 'auto',
    fetch_format: 'auto',
    ...options
  });
};

// Helper to get thumbnail URL
export const getThumbnailUrl = (publicId, width = 300, height = 300) => {
  return cloudinary.url(publicId, {
    secure: true,
    width: width,
    height: height,
    crop: 'fill',
    quality: 'auto',
    fetch_format: 'auto'
  });
};

export default cloudinary;