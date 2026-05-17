// services/cloudinaryService.js - COMPLETE WORKING VERSION

import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import pkg from 'multer-storage-cloudinary';
const { CloudinaryStorage } = pkg;

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

// CREATE MULTER INSTANCES
const uploadGalleryInstance = multer({ storage: galleryStorage });
const uploadPostInstance = multer({ storage: postStorage });
const uploadAvatarInstance = multer({ storage: avatarStorage });
const uploadBannerInstance = multer({ storage: bannerStorage });

// EXPORT as named exports (THIS IS CRITICAL)
export const uploadGallery = uploadGalleryInstance;
export const uploadPost = uploadPostInstance;
export const uploadAvatar = uploadAvatarInstance;
export const uploadBanner = uploadBannerInstance;

// Also export array versions
export const uploadGalleryArray = uploadGalleryInstance.array('galleryFiles', 10);
export const uploadPostArray = uploadPostInstance.array('images', 5);
export const uploadAvatarSingle = uploadAvatarInstance.single('avatar');
export const uploadBannerSingle = uploadBannerInstance.single('banner');

// Helper functions
export const deleteFromCloudinary = async (publicId, options = {}) => {
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

export const getPublicIdFromUrl = (url) => {
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

export const getResourceType = (url, mimetype) => {
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
console.log('Exports - uploadAvatar:', !!uploadAvatar);
console.log('Exports - uploadBanner:', !!uploadBanner);
console.log('Exports - uploadGallery:', !!uploadGallery);
console.log('='.repeat(50));

export default cloudinary;