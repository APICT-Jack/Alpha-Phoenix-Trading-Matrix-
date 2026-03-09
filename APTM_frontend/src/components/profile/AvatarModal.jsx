import React from 'react';
import styles from './UserProfileView.module.css';

const AvatarModal = ({ isOpen, onClose, avatarUrl, avatarInitial }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.modalCloseButton} onClick={onClose}>&times;</button>
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt="Full Profile" 
            className={styles.modalImage} 
          />
        ) : (
          <div className={styles.modalPlaceholder}>
            {avatarInitial}
          </div>
        )}
      </div>
    </div>
  );
};

export default AvatarModal;