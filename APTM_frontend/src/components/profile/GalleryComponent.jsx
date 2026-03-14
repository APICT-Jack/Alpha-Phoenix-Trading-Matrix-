import React, { useState, useRef, useEffect } from 'react';
import styles from './UserProfileView.module.css';
import { 
  FaPlus, 
  FaFolderPlus, 
  FaTrash, 
  FaImages, 
  FaTimes, 
  FaChevronLeft, 
  FaChevronRight, 
  FaHeart, 
  FaRegHeart, 
  FaComment 
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

// Helper function to format image/video URLs
const formatMediaUrl = (url) => {
  if (!url) return null;
  
  // If it's already a full URL, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // If it's a data URL, return as is
  if (url.startsWith('data:')) {
    return url;
  }
  
  // If it's a path starting with /uploads, clean it up
  if (url.startsWith('/uploads/')) {
    // Remove duplicate /uploads if present
    if (url.startsWith('/uploads//uploads/')) {
      url = url.replace('/uploads//uploads/', '/uploads/');
    }
    return `${API_URL}${url}`;
  }
  
  // If it's a path starting with uploads (no leading slash)
  if (url.startsWith('uploads/')) {
    return `${API_URL}/${url}`;
  }
  
  // If it's just a filename, assume it's in the gallery folder
  if (url.includes('gallery-') || url.includes('.jpg') || url.includes('.png') || url.includes('.jpeg') || url.includes('.gif') || url.includes('.webp') || url.includes('.mp4')) {
    return `${API_URL}/uploads/gallery/${url}`;
  }
  
  // Default case - just append to API_URL
  return `${API_URL}${url.startsWith('/') ? url : `/${url}`}`;
};

const GalleryComponent = ({ 
  gallery, 
  isOwnProfile, 
  onUpload, 
  onCreateFolder, 
  onDeleteItem, 
  onDeleteFolder, 
  onReactToItem 
}) => {
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  
  // Add file input ref
  const fileInputRef = useRef(null);
  
  // Viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [currentFolderItems, setCurrentFolderItems] = useState([]);
  const [reactionLoading, setReactionLoading] = useState(false);
  const [reactionError, setReactionError] = useState(null);
  
  // Track image load errors
  const [imageErrors, setImageErrors] = useState({});

  // Reset file input when modal closes
  useEffect(() => {
    if (!showUploadModal && fileInputRef.current) {
      fileInputRef.current.value = '';
      setSelectedFiles([]);
      setUploadDescription('');
    }
  }, [showUploadModal]);

  // Handle file selection
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    
    // Filter files by type
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'application/pdf'];
      return validTypes.includes(file.type);
    });

    if (validFiles.length !== files.length) {
      alert('Some files were skipped due to invalid format. Please upload images, videos, or PDFs only.');
    }
    
    setSelectedFiles(validFiles);
  };

  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    setUploading(true);
    
    try {
      // Log the files to verify they're actual File objects
      console.log('Selected files:', selectedFiles.map(f => ({
        name: f.name,
        type: f.type,
        size: f.size,
        isFile: f instanceof File
      })));
      
      // Pass all files at once to the parent's upload function
      await onUpload(selectedFiles, selectedFolder, uploadDescription);
      
      // Reset state on success
      setShowUploadModal(false);
      setUploadDescription('');
      setSelectedFiles([]);
      
      alert(`${selectedFiles.length} file(s) uploaded successfully!`);
      
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // Trigger file input click
  const handleUploadButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setShowCreateFolderModal(false);
      setNewFolderName('');
    }
  };

  // Image viewer functions
  const openViewer = (folderId, itemIndex) => {
    const folder = gallery.folders.find(f => f._id === folderId);
    if (folder && folder.items.length > 0) {
      setCurrentFolderItems(folder.items);
      setCurrentItemIndex(itemIndex);
      setViewerOpen(true);
      // Prevent body scrolling when viewer is open
      document.body.style.overflow = 'hidden';
    }
  };

  const closeViewer = () => {
    setViewerOpen(false);
    setCurrentItemIndex(0);
    setCurrentFolderItems([]);
    // Restore body scrolling
    document.body.style.overflow = 'unset';
  };

  const navigatePrevious = () => {
    if (currentItemIndex > 0) {
      setCurrentItemIndex(currentItemIndex - 1);
    } else {
      setCurrentItemIndex(currentFolderItems.length - 1);
    }
  };

  const navigateNext = () => {
    if (currentItemIndex < currentFolderItems.length - 1) {
      setCurrentItemIndex(currentItemIndex + 1);
    } else {
      setCurrentItemIndex(0);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!viewerOpen) return;
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigatePrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateNext();
      } else if (e.key === 'Escape') {
        closeViewer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [viewerOpen, currentItemIndex, currentFolderItems]);

  // Handle reaction
  const handleReaction = async (itemId, reactionType) => {
    if (reactionLoading) return;
    
    setReactionLoading(true);
    setReactionError(null);
    
    try {
      await onReactToItem(itemId, reactionType);
      
      // Update local state to reflect reaction
      const updatedItems = currentFolderItems.map(item => {
        if (item._id === itemId) {
          const userReaction = item.userReaction === reactionType ? null : reactionType;
          const updatedReactions = [...(item.reactions || [])];
          
          if (userReaction) {
            // Add reaction
            updatedReactions.push({ type: reactionType, userId: 'current-user' });
          } else {
            // Remove reaction
            const index = updatedReactions.findIndex(r => r.type === reactionType);
            if (index !== -1) updatedReactions.splice(index, 1);
          }
          
          return {
            ...item,
            userReaction,
            reactions: updatedReactions
          };
        }
        return item;
      });
      
      setCurrentFolderItems(updatedItems);
      
    } catch (error) {
      console.error('Failed to react:', error);
      setReactionError(error.message);
    } finally {
      setReactionLoading(false);
    }
  };

  // Handle image error
  const handleImageError = (itemId) => {
    console.log('Image failed to load for item:', itemId);
    setImageErrors(prev => ({ ...prev, [itemId]: true }));
  };

  const currentFolder = selectedFolder 
    ? gallery.folders.find(f => f._id === selectedFolder)
    : gallery.folders[0];

  const currentItem = currentFolderItems[currentItemIndex] || null;

  return (
    <div className={styles.galleryTab}>
      <div className={styles.galleryHeader}>
        <div className={styles.galleryActions}>
          {isOwnProfile && (
            <>
              <button 
                className={styles.galleryButton}
                onClick={() => setShowUploadModal(true)}
                disabled={uploading}
              >
                <FaPlus /> Upload
              </button>
              <button 
                className={styles.galleryButton}
                onClick={() => setShowCreateFolderModal(true)}
              >
                <FaFolderPlus /> New Folder
              </button>
            </>
          )}
        </div>
      </div>

      <div className={styles.galleryCategories}>
        {gallery.folders.map(folder => (
          <button
            key={folder._id}
            className={`${styles.galleryCategory} ${selectedFolder === folder._id ? styles.active : ''}`}
            onClick={() => setSelectedFolder(folder._id)}
          >
            {folder.name} ({folder.items.length})
            {isOwnProfile && (
              <span 
                className={styles.deleteFolder}
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Are you sure you want to delete this folder?')) {
                    onDeleteFolder(folder._id);
                  }
                }}
              >
                <FaTrash />
              </span>
            )}
          </button>
        ))}
      </div>
      
      <div className={styles.galleryGrid}>
        {currentFolder?.items.map((item, index) => {
          const mediaUrl = formatMediaUrl(item.url);
          const hasError = imageErrors[item._id];
          
          return (
            <div 
              key={item._id || index} 
              className={styles.galleryItem}
              onClick={() => openViewer(currentFolder._id, index)}
            >
              {item.type?.startsWith('video/') ? (
                <video 
                  src={mediaUrl} 
                  className={styles.galleryImage}
                  muted
                  onMouseOver={e => e.currentTarget.play()}
                  onMouseOut={e => e.currentTarget.pause()}
                  onError={() => handleImageError(item._id)}
                />
              ) : (
                <img 
                  src={mediaUrl} 
                  alt={item.description || 'Gallery item'}
                  className={styles.galleryImage}
                  loading="lazy"
                  onError={() => handleImageError(item._id)}
                  style={{ display: hasError ? 'none' : 'block' }}
                />
              )}
              
              {hasError && (
                <div className={styles.imageErrorPlaceholder}>
                  <FaImages size={24} />
                  <span>Failed to load</span>
                </div>
              )}
              
              {/* Reaction preview */}
              {item.reactions && item.reactions.length > 0 && (
                <div className={styles.reactionPreview}>
                  <FaHeart className={styles.reactionPreviewIcon} />
                  <span>{item.reactions.length}</span>
                </div>
              )}
              
              <div className={styles.galleryItemOverlay}>
                <p>{item.description || 'No description'}</p>
                {isOwnProfile && (
                  <button 
                    className={styles.deleteGalleryItem}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Are you sure you want to delete this item?')) {
                        onDeleteItem(item._id);
                      }
                    }}
                  >
                    <FaTrash />
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {(!currentFolder || currentFolder.items.length === 0) && (
          <div className={styles.emptyGallery}>
            <FaImages size={48} />
            <p>No items in this folder</p>
            {isOwnProfile && (
              <button 
                className={styles.galleryButton}
                onClick={() => setShowUploadModal(true)}
              >
                Upload your first item
              </button>
            )}
          </div>
        )}
      </div>

      {/* Image Viewer Modal */}
      {viewerOpen && currentItem && (
        <div className={styles.viewerOverlay} onClick={closeViewer}>
          <div className={styles.viewerContent} onClick={(e) => e.stopPropagation()}>
            
            {/* Close button */}
            <button className={styles.viewerClose} onClick={closeViewer}>
              <FaTimes />
            </button>
            
            {/* Navigation buttons */}
            {currentFolderItems.length > 1 && (
              <>
                <button 
                  className={`${styles.viewerNav} ${styles.viewerNavLeft}`} 
                  onClick={navigatePrevious}
                >
                  <FaChevronLeft />
                </button>
                
                <button 
                  className={`${styles.viewerNav} ${styles.viewerNavRight}`} 
                  onClick={navigateNext}
                >
                  <FaChevronRight />
                </button>
              </>
            )}
            
            {/* Image container */}
            <div className={styles.viewerImageContainer}>
              {currentItem.type?.startsWith('video/') ? (
                <video 
                  src={formatMediaUrl(currentItem.url)} 
                  controls
                  autoPlay
                  className={styles.viewerImage}
                  onError={() => handleImageError(currentItem._id)}
                />
              ) : (
                <img 
                  src={formatMediaUrl(currentItem.url)} 
                  alt={currentItem.description || 'Gallery item'}
                  className={styles.viewerImage}
                  onError={() => handleImageError(currentItem._id)}
                />
              )}
              
              {/* Image info and reactions */}
              <div className={styles.viewerInfo}>
                <div className={styles.viewerDescription}>
                  <p>{currentItem.description || 'No description'}</p>
                  <span className={styles.viewerCounter}>
                    {currentItemIndex + 1} / {currentFolderItems.length}
                  </span>
                </div>
                
                <div className={styles.viewerReactions}>
                  {/* Like button */}
                  <button 
                    className={`${styles.reactionButton} ${currentItem.userReaction === 'like' ? styles.reactionActive : ''}`}
                    onClick={() => handleReaction(currentItem._id, 'like')}
                    disabled={reactionLoading}
                  >
                    {currentItem.userReaction === 'like' ? <FaHeart /> : <FaRegHeart />}
                    <span>{currentItem.reactions?.filter(r => r?.type === 'like').length || 0}</span>
                  </button>
                  
                  {/* Comments button */}
                  <button 
                    className={styles.reactionButton}
                    onClick={() => {
                      // You can implement comments functionality here
                      console.log('Open comments for item:', currentItem._id);
                    }}
                  >
                    <FaComment />
                    <span>{currentItem.comments?.length || 0}</span>
                  </button>
                </div>

                {reactionError && (
                  <div className={styles.reactionError}>
                    {reactionError}
                  </div>
                )}
              </div>
            </div>
            
            {/* Thumbnail strip */}
            {currentFolderItems.length > 1 && (
              <div className={styles.viewerThumbnails}>
                {currentFolderItems.map((item, idx) => (
                  <div 
                    key={item._id || idx}
                    className={`${styles.thumbnailItem} ${idx === currentItemIndex ? styles.thumbnailActive : ''}`}
                    onClick={() => setCurrentItemIndex(idx)}
                  >
                    {item.type?.startsWith('video/') ? (
                      <video 
                        src={formatMediaUrl(item.url)} 
                        className={styles.thumbnailImage}
                        muted
                      />
                    ) : (
                      <img 
                        src={formatMediaUrl(item.url)} 
                        alt={item.description || 'Thumbnail'}
                        className={styles.thumbnailImage}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className={styles.modalOverlay} onClick={() => setShowUploadModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3>Upload to Gallery</h3>
            
            <input
              type="text"
              placeholder="Description (optional)"
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              className={styles.modalInput}
              disabled={uploading}
            />
            
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className={styles.hiddenFileInput}
              multiple
              accept="image/*,video/*,application/pdf"
              disabled={uploading}
            />
            
            {/* Custom file select button */}
            <button 
              type="button"
              onClick={handleUploadButtonClick}
              className={styles.fileSelectButton}
              disabled={uploading}
            >
              <FaImages /> Select Files
            </button>
            
            {selectedFiles.length > 0 && (
              <div className={styles.selectedFiles}>
                <p><strong>Selected files ({selectedFiles.length}):</strong></p>
                <ul>
                  {selectedFiles.map((file, index) => (
                    <li key={index}>
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Folder selection (if multiple folders exist) */}
            {gallery.folders.length > 1 && (
              <div className={styles.folderSelect}>
                <label>Select folder:</label>
                <select 
                  value={selectedFolder || ''} 
                  onChange={(e) => setSelectedFolder(e.target.value)}
                  disabled={uploading}
                >
                  {gallery.folders.map(folder => (
                    <option key={folder._id} value={folder._id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className={styles.modalActions}>
              <button 
                onClick={() => setShowUploadModal(false)}
                disabled={uploading}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              <button 
                onClick={handleFileUpload}
                disabled={selectedFiles.length === 0 || uploading}
                className={styles.uploadButton}
              >
                {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} file(s)`}
              </button>
            </div>

            {uploading && (
              <div className={styles.uploadProgress}>
                Uploading... Please wait
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Folder Modal */}
      {showCreateFolderModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCreateFolderModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3>Create New Folder</h3>
            <input
              type="text"
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className={styles.modalInput}
              autoFocus
            />
            <div className={styles.modalActions}>
              <button onClick={() => setShowCreateFolderModal(false)}>Cancel</button>
              <button onClick={handleCreateFolder}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryComponent;