// middleware/uploadEnhanced.js - NEW FILE
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure all upload directories exist
const ensureUploadDirs = () => {
  const dirs = [
    'uploads/chat/images',
    'uploads/chat/videos',
    'uploads/chat/files',
    'uploads/chat/voice',
    'uploads/chat/thumbnails',
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

ensureUploadDirs();

// Voice note storage
const voiceStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), 'uploads/chat/voice');
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `voice-${Date.now()}-${Math.random().toString(36).substring(7)}.webm`;
    cb(null, uniqueName);
  }
});

// Image storage for chat
const chatImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), 'uploads/chat/images');
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `chat-img-${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
    cb(null, uniqueName);
  }
});

// Video storage for chat
const chatVideoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), 'uploads/chat/videos');
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `chat-vid-${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
    cb(null, uniqueName);
  }
});

// File storage for documents
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), 'uploads/chat/files');
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `file-${Date.now()}-${Math.random().toString(36).substring(7)}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

// File filters
const voiceFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'audio/webm',
    'audio/mp4',
    'audio/mpeg',
    'audio/ogg',
    'audio/wav',
    'audio/x-m4a'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid audio format. Please use WebM, MP4, MP3, OGG, WAV, or M4A.'));
  }
};

const chatImageFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
    'image/webp', 'image/svg+xml', 'image/heic', 'image/heif'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid image format.'));
  }
};

const chatVideoFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
    'video/x-msvideo', 'video/x-matroska'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid video format.'));
  }
};

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
    'application/zip',
    'application/x-rar-compressed'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type.'));
  }
};

// Multer instances
export const uploadVoiceMiddleware = multer({
  storage: voiceStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: voiceFileFilter
}).single('voice');

export const uploadChatImageMiddleware = multer({
  storage: chatImageStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: chatImageFilter
}).array('images', 10);

export const uploadChatVideoMiddleware = multer({
  storage: chatVideoStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: chatVideoFilter
}).single('video');

export const uploadChatFileMiddleware = multer({
  storage: fileStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: fileFilter
}).array('files', 5);

// Combined media upload for multiple types
export const uploadChatMediaMiddleware = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      let dir = path.join(process.cwd(), 'uploads/chat/files');
      
      if (file.mimetype.startsWith('image/')) {
        dir = path.join(process.cwd(), 'uploads/chat/images');
      } else if (file.mimetype.startsWith('video/')) {
        dir = path.join(process.cwd(), 'uploads/chat/videos');
      } else if (file.mimetype.startsWith('audio/')) {
        dir = path.join(process.cwd(), 'uploads/chat/voice');
      }
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const uniqueName = `chat-${Date.now()}-${Math.random().toString(36).substring(7)}-${file.originalname}`;
      cb(null, uniqueName);
    }
  }),
  limits: { fileSize: 100 * 1024 * 1024, files: 10 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || 
        file.mimetype.startsWith('video/') || 
        file.mimetype.startsWith('audio/') ||
        file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'));
    }
  }
}).array('media', 10);

// Helper functions
export const generateFileUrl = (filename, folder = 'images') => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  return `${baseUrl}/uploads/chat/${folder}/${filename}`;
};

export const getFileType = (mimetype) => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  return 'file';
};