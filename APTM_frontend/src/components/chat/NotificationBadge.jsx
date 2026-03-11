// components/NotificationBadge.jsx
import React from 'react';
import styles from './NotificationBadge.module.css';

const NotificationBadge = ({ count, max = 99, className = '' }) => {
  if (!count || count === 0) return null;
  
  const displayCount = count > max ? `${max}+` : count;
  
  return (
    <span className={`${styles.badge} ${className}`}>
      {displayCount}
    </span>
  );
};

export default NotificationBadge;