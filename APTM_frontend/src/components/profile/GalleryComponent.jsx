// GalleryComponent.jsx - Simplified Working Version
import React, { useState, useRef, useEffect } from 'react';
import styles from './UserProfileView.module.css';
import { 
  FaPlus, FaFolderPlus, FaTrash, FaImages, FaTimes, 
  FaChevronLeft, FaChevronRight, FaHeart, FaRegHeart, FaComment 
} from 'react-icons/fa';

// Get API URL - FIXED
const getApiUrl = () => {
  if (import.meta.env.PROD) {
    return window.location.origin;
  }
  return import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
};

const API_URL = getApiUrl();

// Format media URL - handles both Cloudinary and local
const formatMediaUrl = (url) => {
  if (!url) return null;
  
  // Already a full URL (Cloudinary)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Data URL
  if (url.startsWith('data:')) {
    return url;
  }
  
  // Local path
  if (url.startsWith('/uploads/')) {
    return `${API_URL}${url}`;
  }
  
  // Just a filename
  return `${API_URL}/uploads/gallery/${url}`;
};

const GalleryComponent = ({ 
  gallery, 
  isOwnProfile, 
  onUpload, 
  onCreateFolder, 
  onDeleteItem, 
  onDeleteFolder 
}) => {
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadError, setUploadError] = useState(null);
  
  // Viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [currentFolderItems, setCurrentFolderItems] = useState([]);
  const [imageErrors, setImageErrors] = useState({});
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!showUploadModal && fileInputRef.current) {
      fileInputRef.current.value = '';
      setSelectedFiles([]);
      setUploadDescription('');
      setUploadError(null);
    }
  }, [showUploadModal]);

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'application/pdf'];
      return validTypes.includes(file.type);
    });

    if (validFiles.length !== files.length) {
      alert('Some files were skipped. Please upload images, videos, or PDFs only.');
    }
    setSelectedFiles(validFiles);
    setUploadError(null);
  };

  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    setUploading(true);
    setUploadError(null);
    
    try {
      await onUpload(selectedFiles, selectedFolder, uploadDescription);
      setShowUploadModal(false);
      setUploadDescription('');
      setSelectedFiles([]);
      alert(`${selectedFiles.length} file(s) uploaded successfully!`);
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError(error.message || 'Upload failed');
      alert('Upload failed: ' + (error.message || 'Please try again'));
    } finally {
      setUploading(false);
    }
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setShowCreateFolderModal(false);
      setNewFolderName('');
    }
  };

  const openViewer = (folderId, itemIndex) => {
    const folder = gallery.folders.find(f => f._id === folderId);
    if (folder && folder.items.length > 0) {
      setCurrentFolderItems(folder.items);
      setCurrentItemIndex(itemIndex);
      setViewerOpen(true);
      document.body.style.overflow = 'hidden';
    }
  };

  const closeViewer = () => {
    setViewerOpen(false);
    setCurrentItemIndex(0);
    setCurrentFolderItems([]);
    document.body.style.overflow = 'unset';
  };

  const navigatePrevious = () => {
    setCurrentItemIndex(prev => prev > 0 ? prev - 1 : currentFolderItems.length - 1);
  };

  const navigateNext = () => {
    setCurrentItemIndex(prev => prev < currentFolderItems.length - 1 ? prev + 1 : 0);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!viewerOpen) return;
      if (e.key === 'ArrowLeft') navigatePrevious();
      if (e.key === 'ArrowRight') navigateNext();
      if (e.key === 'Escape') closeViewer();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewerOpen]);

  const handleImageError = (itemId) => {
    setImageErrors(prev => ({ ...prev, [itemId]: true }));
  };

  const currentFolder = selectedFolder 
    ? gallery.folders.find(f => f._id === selectedFolder)
    : gallery.folders[0];

  return (
    <div className={styles.galleryTab}>
      <div className={styles.galleryHeader}>
        <div className={styles.galleryActions}>
          {isOwnProfile && (
            <>
              <button className={styles.galleryButton} onClick={() => setShowUploadModal(true)} disabled={uploading}>
                <FaPlus /> Upload
              </button>
              <button className={styles.galleryButton} onClick={() => setShowCreateFolderModal(true)}>
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
                  if (window.confirm('Delete this folder and all its contents?')) {
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
            <div key={item._id || index} className={styles.galleryItem} onClick={() => openViewer(currentFolder._id, index)}>
              {item.mimetype?.startsWith('video/') ? (
                <video src={mediaUrl} className={styles.galleryImage} muted />
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
              
              <div className={styles.galleryItemOverlay}>
                <p>{item.description || 'No description'}</p>
                {isOwnProfile && (
                  <button 
                    className={styles.deleteGalleryItem}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Delete this item?')) {
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
              <button className={styles.galleryButton} onClick={() => setShowUploadModal(true)}>
                Upload your first item
              </button>
            )}
          </div>
        )}
      </div>

      {/* Image Viewer Modal */}
      {viewerOpen && currentFolderItems[currentItemIndex] && (
        <div className={styles.viewerOverlay} onClick={closeViewer}>
          <div className={styles.viewerContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.viewerClose} onClick={closeViewer}><FaTimes /></button>
            
            {currentFolderItems.length > 1 && (
              <>
                <button className={`${styles.viewerNav} ${styles.viewerNavLeft}`} onClick={navigatePrevious}><FaChevronLeft /></button>
                <button className={`${styles.viewerNav} ${styles.viewerNavRight}`} onClick={navigateNext}><FaChevronRight /></button>
              </>
            )}
            
            <div className={styles.viewerImageContainer}>
              {currentFolderItems[currentItemIndex].mimetype?.startsWith('video/') ? (
                <video src={formatMediaUrl(currentFolderItems[currentItemIndex].url)} controls autoPlay className={styles.viewerImage} />
              ) : (
                <img src={formatMediaUrl(currentFolderItems[currentItemIndex].url)} alt="Gallery item" className={styles.viewerImage} />
              )}
              
              <div className={styles.viewerInfo}>
                <div className={styles.viewerDescription}>
                  <p>{currentFolderItems[currentItemIndex].description || 'No description'}</p>
                  <span className={styles.viewerCounter}>{currentItemIndex + 1} / {currentFolderItems.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className={styles.modalOverlay} onClick={() => setShowUploadModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3>Upload to Gallery</h3>
            
            {uploadError && (
              <div className={styles.errorMessage} style={{ color: 'red', marginBottom: '10px' }}>
                {uploadError}
              </div>
            )}
            
            <input
              type="text"
              placeholder="Description (optional)"
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              className={styles.modalInput}
              disabled={uploading}
            />
            
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className={styles.hiddenFileInput}
              multiple
              accept="image/*,video/*,application/pdf"
              disabled={uploading}
              style={{ display: 'block', margin: '10px 0' }}
            />
            
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
            
            {gallery.folders.length > 1 && (
              <div className={styles.folderSelect}>
                <label>Select folder:</label>
                <select value={selectedFolder || ''} onChange={(e) => setSelectedFolder(e.target.value)} disabled={uploading}>
                  {gallery.folders.map(folder => (
                    <option key={folder._id} value={folder._id}>{folder.name}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div className={styles.modalActions}>
              <button onClick={() => setShowUploadModal(false)} disabled={uploading}>Cancel</button>
              <button onClick={handleFileUpload} disabled={selectedFiles.length === 0 || uploading}>
                {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} file(s)`}
              </button>
            </div>
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