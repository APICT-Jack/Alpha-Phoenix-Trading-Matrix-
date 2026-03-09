// ShareModal.jsx
// Modal for sharing posts via link or social platforms
// Forward ref for click outside handling

import React, { forwardRef } from 'react';
import { 
  FaTimes, 
  FaCopy, 
  FaTwitter, 
  FaFacebook, 
  FaWhatsapp, 
  FaTelegram, 
  FaEnvelope,
  FaShareAlt
} from 'react-icons/fa';
import styles from '../../styles/post.module.css';

const ShareModal = forwardRef(({
  shareUrl,
  copySuccess,
  onClose,
  onCopyLink,
  onShare,
  postUser,
  postData
}, ref) => {
  return (
    <div className={styles.shareModalOverlay}>
      <div className={styles.shareModal} ref={ref}>
        <div className={styles.shareModalHeader}>
          <h3>Share Post</h3>
          <button 
            className={styles.closeModalBtn}
            onClick={onClose}
          >
            <FaTimes />
          </button>
        </div>
        
        <div className={styles.shareModalBody}>
          <div className={styles.shareLinkContainer}>
            <input 
              type="text" 
              value={shareUrl} 
              readOnly 
              className={styles.shareLinkInput}
            />
            <button 
              className={styles.copyLinkBtn}
              onClick={onCopyLink}
            >
              {copySuccess || <FaCopy />}
            </button>
          </div>

          <div className={styles.shareDivider}>
            <span>Share to</span>
          </div>

          <div className={styles.sharePlatforms}>
            <button 
              className={`${styles.sharePlatform} ${styles.twitter}`}
              onClick={() => onShare('twitter')}
            >
              <FaTwitter /> Twitter
            </button>
            <button 
              className={`${styles.sharePlatform} ${styles.facebook}`}
              onClick={() => onShare('facebook')}
            >
              <FaFacebook /> Facebook
            </button>
            <button 
              className={`${styles.sharePlatform} ${styles.whatsapp}`}
              onClick={() => onShare('whatsapp')}
            >
              <FaWhatsapp /> WhatsApp
            </button>
            <button 
              className={`${styles.sharePlatform} ${styles.telegram}`}
              onClick={() => onShare('telegram')}
            >
              <FaTelegram /> Telegram
            </button>
            <button 
              className={`${styles.sharePlatform} ${styles.email}`}
              onClick={() => onShare('email')}
            >
              <FaEnvelope /> Email
            </button>
          </div>

          {navigator.share && (
            <>
              <div className={styles.shareDivider}>or</div>
              <button 
                className={styles.nativeShareBtn}
                onClick={() => onShare('native')}
              >
                <FaShareAlt /> Share via...
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

ShareModal.displayName = 'ShareModal';
export default ShareModal;