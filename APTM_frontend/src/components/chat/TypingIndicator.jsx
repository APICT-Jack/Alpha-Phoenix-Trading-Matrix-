// src/components/chat/TypingIndicator.jsx
import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import styles from './TypingIndicator.module.css';

const TypingIndicator = ({ username = 'Someone' }) => {
  const { darkMode } = useTheme();

  return (
    <div className={`${styles.typingIndicator} ${darkMode ? styles.dark : styles.light}`}>
      <div className={styles.avatar}>
        <span className={styles.avatarInitial}>
          {username.charAt(0).toUpperCase()}
        </span>
      </div>
      <div className={styles.content}>
        <span className={styles.username}>{username}</span>
        <div className={styles.dots}>
          <span className={styles.dot}>.</span>
          <span className={styles.dot}>.</span>
          <span className={styles.dot}>.</span>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;