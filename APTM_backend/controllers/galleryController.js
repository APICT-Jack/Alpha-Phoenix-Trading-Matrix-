// controllers/galleryController.js - COMPLETE VERSION
import Gallery from '../models/Gallery.js';
// controllers/postController.js - At the top
import { deleteFromCloudinary, getPublicIdFromUrl, getResourceType } from '../services/cloudinaryService.js';

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
            name: 'All Photos',
            description: 'All uploaded photos',
            items: []
          },
          {
            name: 'Trading Charts',
            description: 'Your trading charts and analysis',
            items: []
          },
          {
            name: 'Documents',
            description: 'Certificates and documents',
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
// controllers/galleryController.js - Updated uploadToGallery with better error handling
export const uploadToGallery = async (req, res) => {
  try {
    console.log('='.repeat(50));
    console.log('📤 UPLOAD TO GALLERY - START');
    console.log('='.repeat(50));
    
    // Log request details
    console.log('🔍 Request details:');
    console.log('  - req.files:', req.files ? `${req.files.length} files` : 'NO FILES');
    console.log('  - req.body:', req.body);
    console.log('  - req.user:', req.user?._id);
    console.log('  - req.headers.content-type:', req.headers['content-type']);
    
    // Check if files exist
    if (!req.files || req.files.length === 0) {
      console.log('❌ No files in request');
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }
    
    // Log each file
    console.log('📎 Files received:');
    req.files.forEach((file, i) => {
      console.log(`  File ${i + 1}:`, {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        hasPath: !!file.path,
        hasPublicId: !!file.public_id,
        path: file.path,
        public_id: file.public_id
      });
    });
    
    const { folderId, description, tags } = req.body;
    const userId = req.user._id;
    
    console.log('🔍 Looking up gallery for user:', userId);
    
    let gallery = await Gallery.findOne({ userId });
    
    if (!gallery) {
      console.log('📁 No gallery found, creating new gallery...');
      gallery = new Gallery({ 
        userId, 
        folders: [
          {
            name: 'All Photos',
            description: 'Default gallery folder',
            items: []
          }
        ]
      });
    }
    
    // Find target folder
    let targetFolder;
    if (folderId) {
      console.log('🔍 Finding folder by ID:', folderId);
      targetFolder = gallery.folders.id(folderId);
      if (!targetFolder) {
        console.log('❌ Folder not found with ID:', folderId);
        return res.status(404).json({
          success: false,
          message: 'Folder not found'
        });
      }
    } else {
      console.log('📁 Using default folder');
      if (gallery.folders.length === 0) {
        gallery.folders.push({
          name: 'All Photos',
          description: 'Default gallery folder',
          items: []
        });
      }
      targetFolder = gallery.folders[0];
    }
    
    console.log('✅ Target folder:', {
      id: targetFolder._id,
      name: targetFolder.name,
      currentItems: targetFolder.items.length
    });
    
    const uploadedItems = [];
    
    for (const file of req.files) {
      console.log(`📎 Processing file: ${file.originalname}`);
      console.log(`   Cloudinary URL: ${file.path}`);
      console.log(`   Public ID: ${file.public_id}`);
      
      const galleryItem = {
        filename: file.filename || (file.public_id ? file.public_id.split('/').pop() : null),
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url: file.path,
        publicId: file.public_id,
        description: description || '',
        tags: tags ? (Array.isArray(tags) ? tags : tags.split(',')) : [],
        uploadedAt: new Date()
      };
      
      console.log(`   Created gallery item:`, {
        filename: galleryItem.filename,
        url: galleryItem.url,
        description: galleryItem.description
      });
      
      targetFolder.items.push(galleryItem);
      uploadedItems.push(galleryItem);
    }
    
    console.log(`💾 Saving gallery with ${uploadedItems.length} new items...`);
    await gallery.save();
    console.log(`✅ ${uploadedItems.length} file(s) uploaded successfully`);
    
    res.status(200).json({
      success: true,
      message: `${uploadedItems.length} file(s) uploaded successfully`,
      items: uploadedItems,
      folder: targetFolder
    });
    
  } catch (error) {
    console.error('❌❌❌ ERROR IN UPLOAD TO GALLERY ❌❌❌');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Clean up uploaded files from Cloudinary if there was an error
    if (req.files && req.files.length > 0) {
      console.log('🧹 Cleaning up uploaded files from Cloudinary...');
      for (const file of req.files) {
        if (file.public_id) {
          try {
            await deleteFromCloudinary(file.public_id);
            console.log(`🧹 Cleaned up Cloudinary file: ${file.public_id}`);
          } catch (cleanupError) {
            console.error(`❌ Error cleaning up file ${file.public_id}:`, cleanupError);
          }
        }
      }
    }
    
    // Send detailed error response
    res.status(500).json({
      success: false,
      message: 'Error uploading files: ' + error.message,
      error: process.env.NODE_ENV === 'development' ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
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

    // Delete all items in the folder from Cloudinary
    const folder = gallery.folders[folderIndex];
    if (folder.items && folder.items.length > 0) {
      for (const item of folder.items) {
        if (item.publicId) {
          try {
            await deleteFromCloudinary(item.publicId);
            console.log(`🗑️ Deleted from Cloudinary: ${item.publicId}`);
          } catch (error) {
            console.error(`Error deleting ${item.publicId}:`, error);
          }
        }
      }
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
    let publicIdToDelete = null;
    
    for (let folder of gallery.folders) {
      const itemIndex = folder.items.findIndex(item => 
        item._id.toString() === itemId
      );
      
      if (itemIndex > -1) {
        publicIdToDelete = folder.items[itemIndex].publicId;
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

    // Delete from Cloudinary if it has a publicId
    if (publicIdToDelete) {
      try {
        await deleteFromCloudinary(publicIdToDelete);
        console.log('🗑️ Deleted from Cloudinary:', publicIdToDelete);
      } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
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

    console.log('✏️ Updating gallery item:', itemId);

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