// components/Chat/ChatList.jsx - FIXED
import React, { useMemo, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { getAvatarColor, getAvatarInitial } from '../../utils/avatarUtils';
import styles from './ChatList.module.css';

// Import icons
import {
  FaCheckDouble,
  FaCheck,
  FaClock
} from 'react-icons/fa';

const ChatList = ({ conversations, activeChat, onSelectChat, onlineUsers, unreadCounts }) => {
  const { darkMode } = useTheme();

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'sending':
        return <FaClock className={styles.statusIcon} />;
      case 'sent':
        return <FaCheck className={styles.statusIcon} />;
      case 'delivered':
        return <FaCheckDouble className={styles.statusIcon} />;
      case 'read':
        return <FaCheckDouble className={`${styles.statusIcon} ${styles.read}`} />;
      default:
        return null;
    }
  };

  // Deduplicate conversations by userId
  const uniqueConversations = useMemo(() => {
    const seen = new Set();
    return conversations.filter(conv => {
      if (seen.has(conv.userId)) {
        console.log('⚠️ Duplicate conversation filtered:', conv.userId);
        return false;
      }
      seen.add(conv.userId);
      return true;
    });
  }, [conversations]);

  if (uniqueConversations.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No conversations yet</p>
        <p className={styles.emptySubtext}>Start a new chat to begin messaging</p>
      </div>
    );
  }

  return (
    <div className={styles.chatList}>
      {uniqueConversations.map(conv => {
        const isOnline = onlineUsers[conv.userId] || false;
        const unreadCount = unreadCounts[conv.id] || 0;
        
        // Use useState inside component - moved to ChatListItem
        return (
          <ChatListItem
            key={conv.id}
            conv={conv}
            isOnline={isOnline}
            unreadCount={unreadCount}
            isActive={activeChat?.id === conv.id}
            onSelectChat={onSelectChat}
            darkMode={darkMode}
            formatTime={formatTime}
            getStatusIcon={getStatusIcon}
          />
        );
      })}
    </div>
  );
};

// Separate component for each list item to handle useState properly
const ChatListItem = ({ conv, isOnline, unreadCount, isActive, onSelectChat, darkMode, formatTime, getStatusIcon }) => {
  const [imgError, setImgError] = useState(false);
  
  return (
    <div
      className={`${styles.chatItem} ${isActive ? styles.active : ''} ${darkMode ? styles.dark : styles.light}`}
      onClick={() => onSelectChat(conv)}
    >
      <div className={styles.avatar}>
        {conv.userAvatar && !imgError ? (
          <img 
            src={conv.userAvatar} 
            alt={conv.userName}
            onError={() => setImgError(true)}
          />
        ) : (
          <div 
            className={styles.avatarPlaceholder}
            style={{ backgroundColor: getAvatarColor(conv.userId) }}
          >
            {getAvatarInitial({ name: conv.userName })}
          </div>
        )}
        <span className={`${styles.onlineDot} ${isOnline ? styles.online : ''}`} />
      </div>

      <div className={styles.chatInfo}>
        <div className={styles.chatHeader}>
          <h4>{conv.userName}</h4>
          <span className={styles.time}>{formatTime(conv.lastMessageTime)}</span>
        </div>

        <div className={styles.chatPreview}>
          {conv.isTyping ? (
            <span className={styles.typingIndicator}>
              {conv.typingUser} is typing...
            </span>
          ) : (
            <>
              <p className={styles.lastMessage}>
                {conv.lastMessage || 'No messages yet'}
              </p>
              {conv.lastMessageStatus && getStatusIcon(conv.lastMessageStatus)}
            </>
          )}
        </div>
      </div>

      {unreadCount > 0 && (
        <span className={styles.unreadBadge}>{unreadCount}</span>
      )}
    </div>
  );
};

export default ChatList;