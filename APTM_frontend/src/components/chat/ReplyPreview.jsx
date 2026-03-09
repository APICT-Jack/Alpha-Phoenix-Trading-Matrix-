// components/Chat/ReplyPreview.jsx - NEW COMPONENT
import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import styles from './ReplyPreview.module.css';

const ReplyPreview = ({ replyTo, onCancel, sender }) => {
  const { darkMode } = useTheme();

  if (!replyTo) return null;

  const getPreviewText = () => {
    if (!replyTo) return '';
    
    if (replyTo.type === 'image') return '🖼️ Photo';
    if (replyTo.type === 'video') return '🎥 Video';
    if (replyTo.type === 'audio') return '🎵 Audio';
    if (replyTo.type === 'voice') return '🎤 Voice message';
    if (replyTo.media?.length > 0) return `📎 ${replyTo.media.length} attachment(s)`;
    return replyTo.text || 'Message';
  };

  return (
    <div className={`${styles.replyPreview} ${darkMode ? styles.dark : styles.light}`}>
      <div className={styles.replyBar}></div>
      <div className={styles.replyContent}>
        <div className={styles.replyHeader}>
          <span className={styles.replyIcon}>↩️</span>
          <span className={styles.replyTo}>Replying to {sender || 'message'}</span>
        </div>
        <div className={styles.replyText}>
          {getPreviewText()}
        </div>
      </div>
      <button className={styles.cancelButton} onClick={onCancel}>
        ×
      </button>
    </div>
  );
};

export default ReplyPreview;