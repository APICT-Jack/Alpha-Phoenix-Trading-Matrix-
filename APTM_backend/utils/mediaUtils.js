// utils/mediaUtils.js - COMPLETE CLOUDINARY VERSION
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import cloudinary, { 
  deleteFromCloudinary, 
  getPublicIdFromUrl, 
  getResourceType 
} from '../services/cloudinaryService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get base URL dynamically
export const getBaseUrl = () => {
  return process.env.BASE_URL || 
         process.env.VITE_API_URL?.replace('/api', '') || 
         'http://localhost:5000';
};

// Ensure upload directories exist (for local development only)
export const ensureUploadDirs = () => {
  // Skip directory creation in production
  if (process.env.NODE_ENV === 'production') {
    console.log('ℹ️ Skipping local directory creation in production');
    return;
  }
  
  const dirs = [
    'uploads/avatars',
    'uploads/banners', 
    'uploads/documents',
    'uploads/address-proofs',
    'uploads/gallery',
    'uploads/posts',
    'uploads/posts/thumbnails',
    'uploads/temp'
  ];
  
  dirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    }
  });
};

// Upload media files to Cloudinary
export const uploadMedia = async (files, type = 'post') => {
  const uploadedMedia = [];
  
  for (const file of files) {
    try {
      console.log(`📎 Uploading file to Cloudinary: ${file.originalname}`);
      
      // Determine folder based on type
      const folder = type === 'post' ? 'posts' : 'temp';
      
      // Determine resource type
      let resourceType = 'auto';
      if (file.mimetype.startsWith('image/')) resourceType = 'image';
      else if (file.mimetype.startsWith('video/')) resourceType = 'video';
      else if (file.mimetype === 'application/pdf') resourceType = 'raw';
      
      // Upload to Cloudinary
      const result = await new Promise((resolve, reject) => {
        const uploadOptions = {
          folder: `trading-app/${folder}`,
          resource_type: resourceType,
          transformation: []
        };
        
        // Add image optimizations for images
        if (resourceType === 'image') {
          uploadOptions.transformation = [
            { quality: 'auto' },
            { fetch_format: 'auto' },
            { width: 1200, crop: 'limit' }
          ];
        } else if (resourceType === 'video') {
          uploadOptions.transformation = [
            { quality: 'auto' },
            { fetch_format: 'auto' }
          ];
        }
        
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        
        // Convert buffer to stream
        const bufferStream = require('stream').Readable.from(file.buffer);
        bufferStream.pipe(uploadStream);
      });

      // Determine media type
      let mediaType = 'document';
      if (file.mimetype.startsWith('image/')) mediaType = 'image';
      else if (file.mimetype.startsWith('video/')) mediaType = 'video';

      const mediaObject = {
        url: result.secure_url,
        type: mediaType,
        size: file.size,
        mimeType: file.mimetype,
        filename: result.public_id.split('/').pop(),
        originalName: file.originalname,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format
      };

      // Add thumbnail for videos
      if (mediaType === 'video') {
        mediaObject.thumbnail = result.secure_url.replace('/upload/', '/upload/video_thumbnail/');
      }

      // Add dimensions for images
      if (mediaType === 'image' && result.width && result.height) {
        mediaObject.dimensions = {
          width: result.width,
          height: result.height
        };
      }

      uploadedMedia.push(mediaObject);
      console.log(`✅ File uploaded to Cloudinary: ${result.public_id}`);
      
    } catch (error) {
      console.error('❌ Error uploading file to Cloudinary:', error);
      throw error;
    }
  }

  return uploadedMedia;
};

// Delete media files from Cloudinary
export const deleteMedia = async (mediaArray) => {
  for (const media of mediaArray) {
    try {
      let publicId;
      let resourceType = 'image';
      
      if (typeof media === 'string') {
        // If it's a URL, extract public ID
        publicId = getPublicIdFromUrl(media);
        resourceType = getResourceType(media, null);
      } else if (media.publicId) {
        publicId = media.publicId;
        resourceType = getResourceType(media.url, media.mimeType);
      } else if (media.url) {
        publicId = getPublicIdFromUrl(media.url);
        resourceType = getResourceType(media.url, media.mimeType);
      }
      
      if (publicId) {
        await deleteFromCloudinary(publicId, { resource_type: resourceType });
        console.log(`🗑️ Deleted from Cloudinary: ${publicId}`);
      }
      
      // Also check for local files for backward compatibility
      if (process.env.NODE_ENV !== 'production') {
        let filePath;
        if (typeof media === 'string') {
          filePath = path.join(process.cwd(), media);
        } else if (media.url && !media.url.startsWith('http')) {
          filePath = path.join(process.cwd(), media.url);
        }
        
        if (filePath && fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Deleted local file: ${filePath}`);
        }

        // Delete thumbnail if exists locally
        if (media.thumbnail && !media.thumbnail.startsWith('http')) {
          const thumbnailPath = path.join(process.cwd(), media.thumbnail);
          if (fs.existsSync(thumbnailPath)) {
            fs.unlinkSync(thumbnailPath);
          }
        }
      }
    } catch (error) {
      console.error('Error deleting media:', error);
    }
  }
};

// Generate file URL (handles both Cloudinary and local)
export const generateFileUrl = (filename, folder = 'posts') => {
  if (!filename) return null;
  
  const baseUrl = getBaseUrl();
  
  // If it's already a full URL (Cloudinary or absolute), return as is
  if (filename.startsWith('http')) {
    return filename;
  }
  
  // If it's a data URL, return as is
  if (filename.startsWith('data:')) {
    return filename;
  }
  
  // For local files (development only)
  if (process.env.NODE_ENV !== 'production') {
    // Extract just the filename if it contains path
    let cleanFilename = filename;
    if (filename.includes('/')) {
      cleanFilename = filename.split('/').pop();
    }
    
    return `${baseUrl}/uploads/${folder}/${cleanFilename}`;
  }
  
  // In production, if we have a filename but it's not a URL, something is wrong
  console.warn(`⚠️ File URL generation warning: ${filename} is not a full URL in production`);
  return null;
};

// Validate media file
export const validateMediaFile = (file) => {
  const maxSize = 100 * 1024 * 1024; // 100MB
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo',
    'application/pdf'
  ];

  if (file.size > maxSize) {
    throw new Error('File too large. Maximum size is 100MB');
  }

  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error('File type not allowed. Allowed: images, videos, PDFs');
  }

  return true;
};

// Single file upload helper to Cloudinary
export const uploadSingleFile = async (file, folder = 'uploads') => {
  if (!file) return null;
  
  validateMediaFile(file);
  
  try {
    // Determine resource type
    let resourceType = 'auto';
    if (file.mimetype.startsWith('image/')) resourceType = 'image';
    else if (file.mimetype.startsWith('video/')) resourceType = 'video';
    else if (file.mimetype === 'application/pdf') resourceType = 'raw';
    
    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadOptions = {
        folder: `trading-app/${folder}`,
        resource_type: resourceType,
        transformation: []
      };
      
      if (resourceType === 'image') {
        uploadOptions.transformation = [
          { quality: 'auto' },
          { fetch_format: 'auto' },
          { width: 1200, crop: 'limit' }
        ];
      }
      
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      
      const bufferStream = require('stream').Readable.from(file.buffer);
      bufferStream.pipe(uploadStream);
    });

    return {
      filename: result.public_id.split('/').pop(),
      url: result.secure_url,
      type: result.resource_type,
      size: result.bytes,
      mimeType: file.mimetype,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

// Multiple files upload helper to Cloudinary
export const uploadMultipleFiles = async (files, folder = 'uploads') => {
  const uploadedFiles = [];
  
  for (const file of files) {
    try {
      const uploaded = await uploadSingleFile(file, folder);
      uploadedFiles.push(uploaded);
    } catch (error) {
      console.error(`Error uploading file ${file.originalname}:`, error);
      throw error;
    }
  }
  
  return uploadedFiles;
};

// Get optimized URL for images
export const getOptimizedImageUrl = (publicId, options = {}) => {
  if (!publicId) return null;
  
  return cloudinary.url(publicId, {
    secure: true,
    quality: 'auto',
    fetch_format: 'auto',
    ...options
  });
};

// Get thumbnail URL
export const getThumbnailUrl = (publicId, width = 300, height = 300) => {
  if (!publicId) return null;
  
  return cloudinary.url(publicId, {
    secure: true,
    width: width,
    height: height,
    crop: 'fill',
    quality: 'auto',
    fetch_format: 'auto'
  });
};

// Get video thumbnail URL from Cloudinary
export const getVideoThumbnailUrl = (publicId, time = '0') => {
  if (!publicId) return null;
  
  return cloudinary.url(publicId, {
    secure: true,
    resource_type: 'video',
    transformation: [
      { start_offset: time },
      { width: 640, crop: 'limit' }
    ],
    format: 'jpg'
  });
};

// Check if a file exists (for local development)
export const fileExists = (filePath) => {
  if (process.env.NODE_ENV === 'production') return false;
  return fs.existsSync(filePath);
};

// Delete local file (for development)
export const deleteLocalFile = (filePath) => {
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

// Get file info from URL
export const getFileInfoFromUrl = async (url) => {
  if (!url || !url.includes('cloudinary')) return null;
  
  try {
    const publicId = getPublicIdFromUrl(url);
    if (!publicId) return null;
    
    const result = await cloudinary.api.resource(publicId, {
      resource_type: 'auto'
    });
    
    return {
      publicId: result.public_id,
      url: result.secure_url,
      type: result.resource_type,
      format: result.format,
      width: result.width,
      height: result.height,
      size: result.bytes,
      createdAt: result.created_at
    };
  } catch (error) {
    console.error('Error getting file info:', error);
    return null;
  }
};

// Move file between Cloudinary folders
export const moveFile = async (publicId, newFolder, options = {}) => {
  if (!publicId) return null;
  
  try {
    // Get the filename from the public ID
    const parts = publicId.split('/');
    const filename = parts.pop();
    
    // Create new public ID with new folder
    const newPublicId = `${newFolder}/${filename}`;
    
    // Re-upload the file to the new location
    const result = await cloudinary.uploader.rename(publicId, newPublicId, {
      resource_type: options.resource_type || 'auto',
      overwrite: true
    });
    
    console.log(`✅ Moved file from ${publicId} to ${newPublicId}`);
    return result;
  } catch (error) {
    console.error('Error moving file:', error);
    throw error;
  }
};

// Get all files in a Cloudinary folder
export const getFilesInFolder = async (folder, options = {}) => {
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: `trading-app/${folder}`,
      resource_type: options.resource_type || 'auto',
      max_results: options.max_results || 100
    });
    
    return result.resources.map(resource => ({
      publicId: resource.public_id,
      url: resource.secure_url,
      type: resource.resource_type,
      format: resource.format,
      width: resource.width,
      height: resource.height,
      size: resource.bytes,
      createdAt: resource.created_at
    }));
  } catch (error) {
    console.error('Error getting files in folder:', error);
    return [];
  }
};

// Export default for backward compatibility
export default {
  getBaseUrl,
  ensureUploadDirs,
  uploadMedia,
  deleteMedia,
  generateFileUrl,
  validateMediaFile,
  uploadSingleFile,
  uploadMultipleFiles,
  getOptimizedImageUrl,
  getThumbnailUrl,
  getVideoThumbnailUrl,
  fileExists,
  deleteLocalFile,
  getFileInfoFromUrl,
  moveFile,
  getFilesInFolder
};