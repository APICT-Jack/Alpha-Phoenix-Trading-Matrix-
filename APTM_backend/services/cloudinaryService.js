// services/cloudinaryService.js - CommonJS version

const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage configurations
const galleryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'trading-app/gallery',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'avi', 'pdf'],
    resource_type: 'auto',
    transformation: [{ quality: 'auto' }, { fetch_format: 'auto' }]
  }
});

const postStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'trading-app/posts',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'avi', 'pdf'],
    resource_type: 'auto',
    transformation: [{ quality: 'auto' }, { fetch_format: 'auto' }]
  }
});

const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'trading-app/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    resource_type: 'image',
    transformation: [{ width: 200, height: 200, crop: 'fill', quality: 'auto' }]
  }
});

const bannerStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'trading-app/banners',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    resource_type: 'image',
    transformation: [{ width: 1500, height: 500, crop: 'fill', quality: 'auto' }]
  }
});

// Multer instances
const uploadGallery = multer({ storage: galleryStorage });
const uploadPost = multer({ storage: postStorage });
const uploadAvatar = multer({ storage: avatarStorage });
const uploadBanner = multer({ storage: bannerStorage });

// Helper functions
const deleteFromCloudinary = async (publicId, options = {}) => {
  if (!publicId) return null;
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: options.resource_type || 'auto',
      ...options
    });
    console.log(`🗑️ Deleted from Cloudinary: ${publicId}`);
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return null;
  }
};

const getPublicIdFromUrl = (url) => {
  if (!url || !url.includes('cloudinary')) return null;
  try {
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;
    const relevantParts = parts.slice(uploadIndex + 2);
    const publicIdWithExt = relevantParts.join('/');
    return publicIdWithExt.replace(/\.[^/.]+$/, '');
  } catch (error) {
    console.error('Error getting public ID from URL:', error);
    return null;
  }
};

const getResourceType = (url, mimetype) => {
  if (mimetype) {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype === 'application/pdf') return 'raw';
  }
  if (url) {
    if (url.includes('.jpg') || url.includes('.png') || url.includes('.jpeg')) return 'image';
    if (url.includes('.mp4') || url.includes('.mov')) return 'video';
    if (url.includes('.pdf')) return 'raw';
  }
  return 'auto';
};

console.log('='.repeat(50));
console.log('🔧 CLOUDINARY SERVICE INITIALIZED');
console.log('='.repeat(50));
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME ? '✅ Set' : '❌ Missing');
console.log('API Key:', process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Missing');
console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Missing');
console.log('='.repeat(50));

module.exports = {
  cloudinary,
  uploadGallery,
  uploadPost,
  uploadAvatar,
  uploadBanner,
  deleteFromCloudinary,
  getPublicIdFromUrl,
  getResourceType,
};