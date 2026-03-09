import React, { useState } from 'react';
import { formatAvatarUrl, getAvatarInitial } from '../../utils/avatarUtils';
import styles from './UserProfileView.module.css';

const AvatarWithFallback = ({ user, className, onClick, size = 'small' }) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    console.log('🖼️ Avatar image failed to load, using fallback');
    setImageError(true);
  };

  const avatarUrl = user?.avatar ? formatAvatarUrl(user.avatar) : null;
  const initial = getAvatarInitial(user);
  const hasAvatar = !!avatarUrl && !imageError;

  // Size mapping
  const sizeClass = size === 'small' ? styles.avatarSmall : 
                    size === 'medium' ? styles.avatarMedium : 
                    styles.avatarLarge;

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