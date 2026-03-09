// utils/mediaUtils.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Upload media files
export const uploadMedia = async (files, type = 'post') => {
  const uploadedMedia = [];
  
  for (const file of files) {
    try {
      const fileExtension = path.extname(file.originalname);
      const fileName = `${uuidv4()}${fileExtension}`;
      const folder = type === 'post' ? 'posts' : 'temp';
      const uploadDir = path.join(__dirname, '..', 'uploads', folder);
      
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

      // Generate thumbnail for videos
      let thumbnail = null;
      if (file.mimetype.startsWith('video/')) {
        // You would use ffmpeg here to generate thumbnail
        thumbnail = `/uploads/${folder}/thumbnails/${fileName}.jpg`;
      }

      uploadedMedia.push({
        url: `/uploads/${folder}/${fileName}`,
        type: file.mimetype.split('/')[0],
        thumbnail,
        size: file.size,
        mimeType: file.mimetype,
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
      const filePath = path.join(__dirname, '..', media.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Delete thumbnail if exists
      if (media.thumbnail) {
        const thumbnailPath = path.join(__dirname, '..', media.thumbnail);
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
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  return `${baseUrl}/uploads/${folder}/${filename}`;
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