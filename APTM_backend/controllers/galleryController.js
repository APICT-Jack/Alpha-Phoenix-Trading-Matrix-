// controllers/galleryController.js
import Gallery from '../models/Gallery.js';
import UserProfile from '../models/UserProfile.js';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

// Get user gallery
export const getGallery = async (req, res) => {
  try {
    const { userId } = req.params;
    const targetUserId = userId || req.user._id;

    console.log('🖼️ Fetching gallery for user:', targetUserId);

    let gallery = await Gallery.findOne({ userId: targetUserId });

    if (!gallery) {
      // Create default gallery if it doesn't exist
      gallery = new Gallery({ 
        userId: targetUserId, 
        folders: [
          {
            name: 'Profile Pictures',
            description: 'Your profile pictures',
            items: []
          },
          {
            name: 'Trading Charts',
            description: 'Your trading charts and analysis',
            items: []
          },
          {
            name: 'Certificates',
            description: 'Your trading certificates and achievements',
            items: []
          }
        ]
      });
      await gallery.save();
    }

    res.status(200).json({
      success: true,
      gallery
    });
  } catch (error) {
    console.error('❌ Error fetching gallery:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching gallery: ' + error.message
    });
  }
};

// Upload to gallery
// Upload to gallery
export const uploadToGallery = async (req, res) => {
  try {
    const { folderId, description, tags } = req.body;
    const userId = req.user._id;

    console.log('📤 Uploading to gallery for user:', userId);
    console.log('📁 Files received:', req.files); // Note: req.files (plural), not req.file
    console.log('📦 Request body:', req.body);

    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    // Find or create gallery
    let gallery = await Gallery.findOne({ userId });

    if (!gallery) {
      gallery = new Gallery({ 
        userId, 
        folders: [
          {
            name: 'Default',
            description: 'Default gallery folder',
            items: []
          }
        ]
      });
    }

    // Find target folder
    let targetFolder;
    if (folderId) {
      targetFolder = gallery.folders.id(folderId);
      if (!targetFolder) {
        return res.status(404).json({
          success: false,
          message: 'Folder not found'
        });
      }
    } else {
      // Use first folder or create default
      if (gallery.folders.length === 0) {
        gallery.folders.push({
          name: 'Default',
          description: 'Default gallery folder',
          items: []
        });
      }
      targetFolder = gallery.folders[0];
    }

    // Process each uploaded file
    const uploadedItems = [];
    
    for (const file of req.files) {
      const galleryItem = {
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url: `/uploads/gallery/${file.filename}`,
        description: description || '',
        tags: tags ? (Array.isArray(tags) ? tags : tags.split(',')) : [],
        uploadedAt: new Date()
      };

      targetFolder.items.push(galleryItem);
      uploadedItems.push(galleryItem);
      
      console.log(`✅ Processed file: ${file.originalname} (${file.filename})`);
    }

    await gallery.save();

    console.log(`✅ ${uploadedItems.length} file(s) uploaded successfully to gallery`);

    res.status(200).json({
      success: true,
      message: `${uploadedItems.length} file(s) uploaded successfully`,
      items: uploadedItems,
      folder: targetFolder
    });
    
  } catch (error) {
    console.error('❌ Error uploading to gallery:', error);
    
    // Clean up uploaded files if there was an error
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const filePath = path.join(process.cwd(), 'uploads', 'gallery', file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`🧹 Cleaned up file: ${file.filename}`);
        }
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error uploading files: ' + error.message
    });
  }
};

// Create gallery folder
export const createGalleryFolder = async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user._id;

    console.log('📁 Creating gallery folder:', name);

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Folder name is required'
      });
    }

    let gallery = await Gallery.findOne({ userId });

    if (!gallery) {
      gallery = new Gallery({ userId, folders: [] });
    }

    // Check if folder name already exists
    const existingFolder = gallery.folders.find(folder => 
      folder.name.toLowerCase() === name.toLowerCase().trim()
    );

    if (existingFolder) {
      return res.status(400).json({
        success: false,
        message: 'Folder with this name already exists'
      });
    }

    const newFolder = {
      name: name.trim(),
      description: description || '',
      items: [],
      createdAt: new Date()
    };

    gallery.folders.push(newFolder);
    await gallery.save();

    console.log('✅ Gallery folder created successfully');

    res.status(201).json({
      success: true,
      message: 'Folder created successfully',
      folder: newFolder
    });
  } catch (error) {
    console.error('❌ Error creating folder:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating folder: ' + error.message
    });
  }
};

// Delete gallery folder
export const deleteGalleryFolder = async (req, res) => {
  try {
    const { folderId } = req.params;
    const userId = req.user._id;

    console.log('🗑️ Deleting gallery folder:', folderId);

    const gallery = await Gallery.findOne({ userId });

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: 'Gallery not found'
      });
    }

    const folderIndex = gallery.folders.findIndex(folder => 
      folder._id.toString() === folderId
    );

    if (folderIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found'
      });
    }

    // Remove the folder
    gallery.folders.splice(folderIndex, 1);
    await gallery.save();

    console.log('✅ Gallery folder deleted successfully');

    res.status(200).json({
      success: true,
      message: 'Folder deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting folder:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting folder: ' + error.message
    });
  }
};

// Delete gallery item
export const deleteGalleryItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user._id;

    console.log('🗑️ Deleting gallery item:', itemId);

    const gallery = await Gallery.findOne({ userId });

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: 'Gallery not found'
      });
    }

    let itemDeleted = false;
    let filePathToDelete = null;
    
    // Find and remove the item from all folders
    for (let folder of gallery.folders) {
      const itemIndex = folder.items.findIndex(item => 
        item._id.toString() === itemId
      );
      
      if (itemIndex > -1) {
        // Store the file path for deletion
        filePathToDelete = folder.items[itemIndex].url;
        folder.items.splice(itemIndex, 1);
        itemDeleted = true;
        break;
      }
    }

    if (!itemDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    await gallery.save();

    // Delete the actual file from server
    if (filePathToDelete && filePathToDelete.startsWith('/uploads/gallery/')) {
      const filename = filePathToDelete.split('/').pop();
      const fullPath = path.join(process.cwd(), 'uploads', 'gallery', filename);
      
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log('🗑️ Deleted file from server:', fullPath);
      }
    }

    console.log('✅ Gallery item deleted successfully');

    res.status(200).json({
      success: true,
      message: 'Item deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting item:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting item: ' + error.message
    });
  }
};

// Update gallery item
export const updateGalleryItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { description, tags } = req.body;
    const userId = req.user._id;

    const gallery = await Gallery.findOne({ userId });

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: 'Gallery not found'
      });
    }

    let itemUpdated = false;
    
    for (let folder of gallery.folders) {
      const item = folder.items.id(itemId);
      if (item) {
        if (description !== undefined) item.description = description;
        if (tags !== undefined) item.tags = Array.isArray(tags) ? tags : tags.split(',');
        itemUpdated = true;
        break;
      }
    }

    if (!itemUpdated) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    await gallery.save();

    res.status(200).json({
      success: true,
      message: 'Item updated successfully'
    });
  } catch (error) {
    console.error('Error updating gallery item:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating item: ' + error.message
    });
  }
};