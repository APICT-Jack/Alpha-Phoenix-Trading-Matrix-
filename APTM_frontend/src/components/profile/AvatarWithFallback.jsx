import React, { useState } from 'react';
import styles from './UserProfileView.module.css';

// ============================================
// UPDATED: Helper functions with Cloudinary support
// ============================================

// API URL for local development
const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

// Check if URL is from Cloudinary
const isCloudinaryUrl = (url) => {
  return url && (url.includes('cloudinary') || url.includes('res.cloudinary.com'));
};

// Format avatar URL with Cloudinary support
const formatAvatarUrl = (avatar) => {
  if (!avatar) return null;
  
  // If it's already a full URL (Cloudinary or other CDN), return as is
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar;
  }
  
  // If it's a data URL, return as is
  if (avatar.startsWith('data:')) {
    return avatar;
  }
  
  // For local development paths
  let cleanPath = avatar;
  if (avatar.includes('/')) {
    cleanPath = avatar.split('/').pop();
  }
  
  return `${API_URL}/uploads/avatars/${cleanPath}`;
};

// Get optimized Cloudinary URL for avatars
const getOptimizedCloudinaryUrl = (url, size = 'small') => {
  if (!url || !isCloudinaryUrl(url)) return url;
  
  // Size mapping for avatars
  const dimensions = {
    small: { width: 32, height: 32 },
    medium: { width: 48, height: 48 },
    large: { width: 96, height: 96 }
  };
  
  const { width, height } = dimensions[size] || dimensions.medium;
  
  // Add transformations for Cloudinary
  const transformations = [
    `w_${width}`,
    `h_${height}`,
    'c_fill',      // Crop to fill
    'g_face',      // Focus on face
    'q_auto',      // Auto quality
    'f_auto'       // Auto format (WebP if supported)
  ];
  
  return url.replace('/upload/', `/upload/${transformations.join(',')}/`);
};

// Get avatar initial
const getAvatarInitial = (user) => {
  if (!user) return 'U';
  
  // Check if user has name
  if (user.name) {
    return user.name.charAt(0).toUpperCase();
  }
  
  // Check if user has firstName and lastName
  if (user.firstName) {
    return user.firstName.charAt(0).toUpperCase();
  }
  
  // Check if user has username
  if (user.username) {
    return user.username.charAt(0).toUpperCase();
  }
  
  // Check if user has displayName
  if (user.displayName) {
    return user.displayName.charAt(0).toUpperCase();
  }
  
  // Check if user has email
  if (user.email) {
    return user.email.charAt(0).toUpperCase();
  }
  
  return 'U';
};

const AvatarWithFallback = ({ user, className, onClick, size = 'small' }) => {
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const handleImageError = () => {
    console.log('🖼️ Avatar image failed to load, using fallback');
    setImageError(true);
  };

  // Get the raw avatar URL
  let rawAvatarUrl = user?.avatar ? formatAvatarUrl(user.avatar) : null;
  
  // Apply Cloudinary optimization if it's a Cloudinary URL
  let avatarUrl = null;
  if (rawAvatarUrl && isCloudinaryUrl(rawAvatarUrl)) {
    avatarUrl = getOptimizedCloudinaryUrl(rawAvatarUrl, size);
  } else {
    avatarUrl = rawAvatarUrl;
  }
  
  const initial = getAvatarInitial(user);
  const hasAvatar = !!avatarUrl && !imageError;

  // Size mapping for CSS classes
  const sizeClass = size === 'small' ? styles.avatarSmall : 
                    size === 'medium' ? styles.avatarMedium : 
                    styles.avatarLarge;

  // Log for debugging
  if (avatarUrl && isCloudinaryUrl(avatarUrl)) {
    console.log(`☁️ Using Cloudinary avatar: ${avatarUrl}`);
  }

  return (
    <div 
      className={`${className} ${sizeClass}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {hasAvatar ? (
        <img 
          src={avatarUrl} 
          alt="Profile" 
          onError={handleImageError}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className={styles.avatarPlaceholder}>
          {initial}
        </div>
      )}
    </div>
  );
};

export default AvatarWithFallback;