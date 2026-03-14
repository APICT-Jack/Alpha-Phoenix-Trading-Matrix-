import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get base URL dynamically
export const getBaseUrl = () => {
  return process.env.BASE_URL || 
         process.env.VITE_API_URL?.replace('/api', '') || 
         'http://localhost:5000';
};

// Ensure upload directories exist
export const ensureUploadDirs = () => {
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

// Upload media files (for post media)
export const uploadMedia = async (files, type = 'post') => {
  const uploadedMedia = [];
  
  for (const file of files) {
    try {
      const fileExtension = path.extname(file.originalname);
      const fileName = `${uuidv4()}${fileExtension}`;
      const folder = type === 'post' ? 'posts' : 'temp';
      const uploadDir = path.join(process.cwd(), 'uploads', folder);
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, fileName);
      
      // Process image files
      if (file.mimetype.startsWith('image/')) {
        await sharp(file.buffer)
          .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toFile(filePath);
      } else {
        // Move other files as-is
        fs.writeFileSync(filePath, file.buffer);
      }

      // Generate thumbnail for videos (placeholder - you'd need ffmpeg for actual thumbnails)
      let thumbnail = null;
      if (file.mimetype.startsWith('video/')) {
        // For now, just use a placeholder or skip
        thumbnail = `/uploads/${folder}/thumbnails/${fileName}.jpg`;
        // Note: You'll need to implement actual thumbnail generation with ffmpeg
      }

      uploadedMedia.push({
        url: `/uploads/${folder}/${fileName}`,
        type: file.mimetype.split('/')[0],
        thumbnail,
        size: file.size,
        mimeType: file.mimetype,
        filename: fileName,
        originalName: file.originalname,
        dimensions: file.mimetype.startsWith('image/') ? {
          width: 1200,
          height: 1200
        } : null
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  return uploadedMedia;
};

// Delete media files
export const deleteMedia = async (mediaArray) => {
  for (const media of mediaArray) {
    try {
      // Handle if media is a string URL or object
      let filePath;
      if (typeof media === 'string') {
        filePath = path.join(process.cwd(), media);
      } else if (media.url) {
        filePath = path.join(process.cwd(), media.url);
      } else {
        continue;
      }
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Deleted file: ${filePath}`);
      }

      // Delete thumbnail if exists
      if (media.thumbnail) {
        const thumbnailPath = path.join(process.cwd(), media.thumbnail);
        if (fs.existsSync(thumbnailPath)) {
          fs.unlinkSync(thumbnailPath);
        }
      }
    } catch (error) {
      console.error('Error deleting media:', error);
    }
  }
};

// Generate file URL
export const generateFileUrl = (filename, folder = 'posts') => {
  if (!filename) return null;
  
  const baseUrl = getBaseUrl();
  
  // If it's already a full URL, return as is
  if (filename.startsWith('http')) {
    return filename;
  }
  
  // If it's a data URL, return as is
  if (filename.startsWith('data:')) {
    return filename;
  }
  
  // Extract just the filename if it contains path
  let cleanFilename = filename;
  if (filename.includes('/')) {
    cleanFilename = filename.split('/').pop();
  }
  
  return `${baseUrl}/uploads/${folder}/${cleanFilename}`;
};

// Validate media file
export const validateMediaFile = (file) => {
  const maxSize = 100 * 1024 * 1024; // 100MB
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/mpeg', 'video/quicktime',
    'application/pdf'
  ];

  if (file.size > maxSize) {
    throw new Error('File too large. Maximum size is 100MB');
  }

  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error('File type not allowed');
  }

  return true;
};

// Single file upload helper
export const uploadSingleFile = async (file, folder = 'uploads') => {
  if (!file) return null;
  
  validateMediaFile(file);
  
  const fileExtension = path.extname(file.originalname);
  const fileName = `${uuidv4()}${fileExtension}`;
  const uploadDir = path.join(process.cwd(), 'uploads', folder);
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filePath = path.join(uploadDir, fileName);
  
  // Process image files
  if (file.mimetype.startsWith('image/')) {
    await sharp(file.buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toFile(filePath);
  } else {
    fs.writeFileSync(filePath, file.buffer);
  }

  return {
    filename: fileName,
    url: `/uploads/${folder}/${fileName}`,
    type: file.mimetype.split('/')[0],
    size: file.size,
    mimeType: file.mimetype
  };
};