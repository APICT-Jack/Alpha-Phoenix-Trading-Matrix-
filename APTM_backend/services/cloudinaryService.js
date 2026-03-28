// services/cloudinaryService.js
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Create storage for gallery
const galleryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'trading-app/gallery',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'avi', 'pdf'],
    resource_type: 'auto',
    transformation: [{ quality: 'auto' }, { fetch_format: 'auto' }]
  }
});

// Create storage for avatars
const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'trading-app/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    resource_type: 'image',
    transformation: [{ width: 200, height: 200, crop: 'fill', quality: 'auto' }]
  }
});

// Create storage for banners
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
export const uploadGallery = multer({ storage: galleryStorage });
export const uploadAvatar = multer({ storage: avatarStorage });
export const uploadBanner = multer({ storage: bannerStorage });

// Helper functions
export const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
  }
};

export const getPublicIdFromUrl = (url) => {
  if (!url || !url.includes('cloudinary')) return null;
  const parts = url.split('/');
  const uploadIndex = parts.indexOf('upload');
  if (uploadIndex === -1) return null;
  const relevantParts = parts.slice(uploadIndex + 2);
  const publicIdWithExt = relevantParts.join('/');
  return publicIdWithExt.replace(/\.[^/.]+$/, '');
};

export default cloudinary;