// services/cloudinaryService.js
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

// Import CommonJS module correctly
import multerStorageCloudinary from 'multer-storage-cloudinary';
const { CloudinaryStorage } = multerStorageCloudinary;

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

// Multer instance
export const uploadGallery = multer({ storage: galleryStorage });

// Helper functions
export const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return null;
  try {
    return await cloudinary.uploader.destroy(publicId);
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

export default cloudinary;