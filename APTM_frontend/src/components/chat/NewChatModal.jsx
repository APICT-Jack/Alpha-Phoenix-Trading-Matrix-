import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { chatService } from '../../services/chatService';
import { getAvatarColor, getAvatarInitial } from '../../utils/avatarUtils';
import styles from './NewChatModal.module.css';

// Import icons
import {
  FaTimes,
  FaSearch,
  FaUserPlus,
  FaCheckCircle,
  FaCircle,
  FaRegCircle
} from 'react-icons/fa';

const NewChatModal = ({ isOpen, onClose, onSelectUser, currentUser }) => {
  const { darkMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [imageErrors, setImageErrors] = useState({});

  // Load users when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const loadUsers = async () => {
      try {
        setLoading(true);
        // Pass empty query to get all users
        const data = await chatService.searchUsers('');
        
        // Filter out current user
        const filtered = data.filter(u => u.id !== currentUser?.id);
        
        // Get online status
        const online = {};
        filtered.forEach(user => {
          online[user.id] = chatService.isUserOnline(user.id);
        });
        
        // Sort: followed users first, then online, then alphabetically
        filtered.sort((a, b) => {
          if (a.isFollowing && !b.isFollowing) return -1;
          if (!a.isFollowing && b.isFollowing) return 1;
          if (online[a.id] && !online[b.id]) return -1;
          if (!online[a.id] && online[b.id]) return 1;
          return (a.name || '').localeCompare(b.name || '');
        });
        
        setUsers(filtered);
        setOnlineUsers(online);
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();

    // Listen for online status changes
    const handleUserOnline = ({ userId }) => {
      setOnlineUsers(prev => ({ ...prev, [userId]: true }));
    };

    const handleUserOffline = ({ userId }) => {
      setOnlineUsers(prev => ({ ...prev, [userId]: false }));
    };

    chatService.onUserOnline(handleUserOnline);
    chatService.onUserOffline(handleUserOffline);

    return () => {
      chatService.offUserOnline(handleUserOnline);
      chatService.offUserOffline(handleUserOffline);
    };
  }, [isOpen, currentUser?.id]);

  // Search users
  useEffect(() => {
    const search = async () => {
      if (!searchQuery.trim()) return;
      
      try {
        const data = await chatService.searchUsers(searchQuery);
        const filtered = data.filter(u => u.id !== currentUser?.id);
        
        // Update online status
        const online = { ...onlineUsers };
        filtered.forEach(user => {
          online[user.id] = chatService.isUserOnline(user.id);
        });
        
        setUsers(filtered);
        setOnlineUsers(online);
      } catch (error) {
        console.error('Error searching users:', error);
      }
    };

    const timeout = setTimeout(search, 500);
    return () => clearTimeout(timeout);
  }, [searchQuery, currentUser?.id]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modalContent} ${darkMode ? styles.dark : styles.light}`} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>New Chat</h3>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className={styles.searchContainer}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>

        <div className={styles.usersList}>
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Loading users...</p>
            </div>
          ) : users.length > 0 ? (
            users.map(user => (
              <div
                key={user.id}
                className={styles.userItem}
                onClick={() => onSelectUser(user)}
              >
                <div className={styles.userAvatar}>
                  {user.avatar && !imageErrors[user.id] ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name}
                      onError={() => setImageErrors(prev => ({ ...prev, [user.id]: true }))}
                    />
                  ) : (
                    <div 
                      className={styles.avatarPlaceholder}
                      style={{ backgroundColor: getAvatarColor(user.id) }}
                    >
                      {getAvatarInitial(user)}
                    </div>
                  )}
                  <span className={`${styles.onlineDot} ${onlineUsers[user.id] ? styles.online : ''}`} />
                  {user.isFollowing && (
                    <FaCheckCircle className={styles.followingBadge} />
                  )}
                </div>
                
                <div className={styles.userInfo}>
                  <div className={styles.userNameRow}>
                    <h4>{user.name}</h4>
                    {user.isFollowing && (
                      <span className={styles.followingTag}>Following</span>
                    )}
                  </div>
                  <span className={styles.userUsername}>@{user.username}</span>
                </div>

                <button className={styles.selectButton}>
                  <FaUserPlus />
                </button>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              <p>No users found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;