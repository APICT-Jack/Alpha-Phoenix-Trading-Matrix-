// controllers/galleryController.js
import Gallery from '../models/Gallery.js';
import { deleteFromCloudinary, getPublicIdFromUrl } from '../services/cloudinaryService.js';

// Get gallery
export const getGallery = async (req, res) => {
  try {
    const { userId } = req.params;
    const targetUserId = userId || req.user._id;

    let gallery = await Gallery.findOne({ userId: targetUserId });

    if (!gallery) {
      gallery = new Gallery({ 
        userId: targetUserId, 
        folders: [
          { name: 'All Photos', description: 'All uploaded photos', items: [] },
          { name: 'Trading Charts', description: 'Trading charts and analysis', items: [] },
          { name: 'Documents', description: 'Certificates and documents', items: [] }
        ]
      });
      await gallery.save();
    }

    res.status(200).json({ success: true, gallery });
  } catch (error) {
    console.error('Error fetching gallery:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Upload to gallery
export const uploadToGallery = async (req, res) => {
  try {
    const { folderId, description } = req.body;
    const userId = req.user._id;

    console.log('📤 Uploading files:', req.files?.length);
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    let gallery = await Gallery.findOne({ userId });
    if (!gallery) {
      gallery = new Gallery({ userId, folders: [{ name: 'All Photos', items: [] }] });
    }

    let targetFolder;
    if (folderId) {
      targetFolder = gallery.folders.id(folderId);
    }
    if (!targetFolder) {
      targetFolder = gallery.folders[0];
    }

    const uploadedItems = [];
    for (const file of req.files) {
      const item = {
        filename: file.originalname,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url: file.path, // Cloudinary URL
        publicId: file.public_id,
        description: description || '',
        uploadedAt: new Date()
      };
      targetFolder.items.push(item);
      uploadedItems.push(item);
      console.log(`✅ Uploaded: ${file.originalname} -> ${file.path}`);
    }

    await gallery.save();
    res.status(200).json({ success: true, items: uploadedItems });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete gallery item
export const deleteGalleryItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user._id;

    const gallery = await Gallery.findOne({ userId });
    if (!gallery) return res.status(404).json({ success: false, message: 'Gallery not found' });

    let deleted = false;
    let publicId = null;

    for (const folder of gallery.folders) {
      const index = folder.items.findIndex(item => item._id.toString() === itemId);
      if (index !== -1) {
        publicId = folder.items[index].publicId;
        folder.items.splice(index, 1);
        deleted = true;
        break;
      }
    }

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    if (publicId) {
      await deleteFromCloudinary(publicId);
      console.log('🗑️ Deleted from Cloudinary:', publicId);
    }

    await gallery.save();
    res.status(200).json({ success: true, message: 'Item deleted' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete folder
export const deleteGalleryFolder = async (req, res) => {
  try {
    const { folderId } = req.params;
    const userId = req.user._id;

    const gallery = await Gallery.findOne({ userId });
    if (!gallery) return res.status(404).json({ success: false, message: 'Gallery not found' });

    const folder = gallery.folders.id(folderId);
    if (!folder) return res.status(404).json({ success: false, message: 'Folder not found' });

    // Delete all items in folder from Cloudinary
    for (const item of folder.items) {
      if (item.publicId) {
        await deleteFromCloudinary(item.publicId);
      }
    }

    gallery.folders.pull(folderId);
    await gallery.save();
    res.status(200).json({ success: true, message: 'Folder deleted' });
  } catch (error) {
    console.error('Delete folder error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create folder
export const createGalleryFolder = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user._id;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Folder name required' });
    }

    let gallery = await Gallery.findOne({ userId });
    if (!gallery) {
      gallery = new Gallery({ userId, folders: [] });
    }

    gallery.folders.push({ name: name.trim(), items: [] });
    await gallery.save();
    res.status(201).json({ success: true, message: 'Folder created' });
  } catch (error) {
    console.error('Create folder error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};