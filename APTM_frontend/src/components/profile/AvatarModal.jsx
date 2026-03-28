import React from 'react';
import styles from './UserProfileView.module.css';

// ============================================
// Helper functions with Cloudinary support
// ============================================

// API URL for local development
const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

// Check if URL is from Cloudinary
const isCloudinaryUrl = (url) => {
  return url && (url.includes('cloudinary') || url.includes('res.cloudinary.com'));
};

// Get optimized Cloudinary URL for modal view (high quality)
const getOptimizedCloudinaryUrl = (url) => {
  if (!url || !isCloudinaryUrl(url)) return url;
  
  // For modal view, use high quality, max width 1200px
  const transformations = [
    'w_1200',
    'c_limit',      // Don't crop, just limit dimensions
    'q_auto',       // Auto quality
    'f_auto'        // Auto format (WebP if supported)
  ];
  
  return url.replace('/upload/', `/upload/${transformations.join(',')}/`);
};

const AvatarModal = ({ isOpen, onClose, avatarUrl, avatarInitial }) => {
  if (!isOpen) return null;

  // Apply Cloudinary optimization if it's a Cloudinary URL
  let optimizedAvatarUrl = null;
  if (avatarUrl) {
    if (isCloudinaryUrl(avatarUrl)) {
      optimizedAvatarUrl = getOptimizedCloudinaryUrl(avatarUrl);
      console.log(`☁️ Using Cloudinary modal avatar: ${optimizedAvatarUrl}`);
    } else {
      optimizedAvatarUrl = avatarUrl;
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.modalCloseButton} onClick={onClose}>&times;</button>
        {optimizedAvatarUrl ? (
          <img 
            src={optimizedAvatarUrl} 
            alt="Full Profile" 
            className={styles.modalImage}
            loading="lazy"
            onError={(e) => {
              console.error('Failed to load avatar modal image');
              e.target.style.display = 'none';
              // Show fallback if image fails
              const fallback = e.target.parentElement?.querySelector('.modalFallback');
              if (fallback) fallback.style.display = 'flex';
            }}
          />
        ) : (
          <div className={styles.modalPlaceholder}>
            {avatarInitial || 'U'}
          </div>
        )}
        
        {/* Fallback div in case image fails */}
        {optimizedAvatarUrl && (
          <div className={styles.modalFallback} style={{ display: 'none' }}>
            {avatarInitial || 'U'}
          </div>
        )}
      </div>
    </div>
  );
};

export default AvatarModal;