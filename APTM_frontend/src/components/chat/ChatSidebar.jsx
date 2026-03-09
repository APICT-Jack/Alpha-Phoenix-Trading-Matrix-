import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { socketService } from '../../services/socketService';
import { formatAvatarUrl, getAvatarInitial, hasValidAvatar } from '../../utils/avatarUtils';
import styles from './ChatSidebar.module.css';

// Import icons
import {
  FaComments,
  FaSearch,
  FaCircle,
  FaRegCircle,
  FaUserPlus,
  FaUserCheck,
  FaUsers,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaUser,
  FaPlus,
  FaBell,
  FaCheckCircle,
  FaCrown,
  FaFire,
  FaClock,
  FaReply,
  FaEllipsisH,
  FaSyncAlt
} from 'react-icons/fa';

const ChatSidebar = ({ conversations, activeChat, onSelectChat, onStartChat, currentUser }) => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [typingStatus, setTypingStatus] = useState({});
  const [hoveredItem, setHoveredItem] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [localConversations, setLocalConversations] = useState([]);
  
  const modalSearchRef = useRef(null);
  const panelRef = useRef(null);
  const notificationsRef = useRef(null);
  const processedMessageIds = useRef(new Set());
  const processedReadIds = useRef(new Set());

  // Update local conversations when props change
  useEffect(() => {
    // Initialize unread counts from conversations
    const initialUnreadCounts = {};
    conversations.forEach(conv => {
      if (conv.unreadCount > 0) {
        initialUnreadCounts[conv.id] = conv.unreadCount;
      }
    });
    setUnreadCounts(initialUnreadCounts);
    setLocalConversations(conversations);
  }, [conversations]);

  // Socket event handlers
  const handleOnlineUsers = useCallback((users) => {
    console.log('📊 Chat sidebar - Online users received:', users);
    setOnlineUsers(users);
  }, []);

  const handleUserOnline = useCallback((data) => {
    console.log('🟢 Chat sidebar - User online:', data);
    setOnlineUsers(prev => ({ 
      ...prev, 
      [data.userId]: { online: true, userData: data.userData } 
    }));

    addRecentActivity({
      type: 'user-online',
      userId: data.userId,
      userName: data.userData?.name,
      timestamp: new Date().toISOString()
    });
  }, []);

  const handleUserOffline = useCallback((data) => {
    console.log('🔴 Chat sidebar - User offline:', data);
    setOnlineUsers(prev => {
      const newState = { ...prev };
      delete newState[data.userId];
      return newState;
    });

    addRecentActivity({
      type: 'user-offline',
      userId: data.userId,
      timestamp: new Date().toISOString()
    });
  }, []);

  const handleUserStatusResponse = useCallback((data) => {
    console.log('📊 Chat sidebar - User status response:', data);
    if (data.userId) {
      setOnlineUsers(prev => ({
        ...prev,
        [data.userId]: { online: data.isOnline, userData: data.userData }
      }));
    }
  }, []);

  const handleTypingStart = useCallback(({ conversationId, userId, username }) => {
    setTypingStatus(prev => ({
      ...prev,
      [conversationId]: { userId, username }
    }));
  }, []);

  const handleTypingStop = useCallback(({ conversationId, userId }) => {
    setTypingStatus(prev => {
      const newState = { ...prev };
      if (newState[conversationId]?.userId === userId) {
        delete newState[conversationId];
      }
      return newState;
    });
  }, []);

  const handleNewMessage = useCallback((message) => {
    console.log('📨 New message received in sidebar:', message);
    
    // Prevent processing duplicate messages
    const messageId = message._id || message.id;
    if (processedMessageIds.current.has(messageId)) {
      console.log('⏭️ Duplicate message ignored:', messageId);
      return;
    }
    
    // Mark as processed
    if (messageId) {
      processedMessageIds.current.add(messageId);
      // Clear after 5 seconds to prevent memory leak
      setTimeout(() => {
        processedMessageIds.current.delete(messageId);
      }, 5000);
    }
    
    // Check if message is from current user
    const isFromCurrentUser = message.senderId === currentUser?.id || 
                              message.sender?._id === currentUser?.id;
    
    // Update local conversations with new message
    setLocalConversations(prev => {
      return prev.map(conv => {
        if (conv.id === message.conversationId) {
          // Only increment unread count if message is not from current user 
          // AND conversation is not currently active
          const shouldIncrement = !isFromCurrentUser && activeChat?.id !== message.conversationId;
          
          const newUnreadCount = shouldIncrement ? (conv.unreadCount || 0) + 1 : conv.unreadCount || 0;
          
          console.log(`📨 Updating conversation ${conv.id}:`, {
            isFromCurrentUser,
            shouldIncrement,
            oldUnreadCount: conv.unreadCount,
            newUnreadCount,
            activeChatId: activeChat?.id
          });
          
          return {
            ...conv,
            lastMessage: message.text || conv.lastMessage,
            lastMessageTime: message.createdAt || new Date().toISOString(),
            unreadCount: newUnreadCount
          };
        }
        return conv;
      });
    });
    
    // Only update unread count state if message is not from current user
    if (message.conversationId && !isFromCurrentUser) {
      // Don't increment if this conversation is currently active
      if (activeChat?.id === message.conversationId) {
        console.log('📨 Message in active chat, not incrementing unread count');
        return;
      }
      
      setUnreadCounts(prev => {
        const currentCount = prev[message.conversationId] || 0;
        const newCount = currentCount + 1;
        console.log(`📨 Unread count for ${message.conversationId}: ${currentCount} -> ${newCount}`);
        return {
          ...prev,
          [message.conversationId]: newCount
        };
      });

      // Add notification (with duplicate prevention)
      setNotifications(prev => {
        // Check if similar notification already exists
        const exists = prev.some(n => 
          n.conversationId === message.conversationId && 
          Math.abs(new Date(n.timestamp) - new Date(message.createdAt)) < 1000
        );
        
        if (exists) return prev;
        
        const newNotification = {
          id: Date.now() + Math.random(),
          type: 'message',
          title: 'New Message',
          body: `${message.sender?.name || 'Someone'}: ${message.text?.substring(0, 30)}...`,
          conversationId: message.conversationId,
          userId: message.senderId,
          timestamp: message.createdAt || new Date().toISOString()
        };
        return [newNotification, ...prev].slice(0, 20);
      });
    }
  }, [currentUser, activeChat]);

  const handleMessagesRead = useCallback(({ conversationId, readerId, count }) => {
    console.log(`📖 Messages read in conversation ${conversationId} by ${readerId}`);
    
    // Prevent duplicate processing
    const readKey = `${conversationId}-${readerId}-${Date.now()}`;
    if (processedReadIds.current.has(readKey)) {
      console.log('⏭️ Duplicate read event ignored');
      return;
    }
    processedReadIds.current.add(readKey);
    setTimeout(() => processedReadIds.current.delete(readKey), 2000);
    
    // If current user read the messages OR someone else read messages in this conversation
    // Update unread counts regardless of who read them
    setUnreadCounts(prev => {
      console.log(`📖 Clearing unread count for ${conversationId}`);
      const newState = { ...prev };
      delete newState[conversationId];
      return newState;
    });

    // Update local conversations
    setLocalConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
      )
    );

    // Remove notifications for this conversation
    setNotifications(prev => 
      prev.filter(n => n.conversationId !== conversationId)
    );
  }, []);

  // Add recent activity
  const addRecentActivity = (activity) => {
    setRecentActivity(prev => [activity, ...prev].slice(0, 10));
  };

  // Refresh online status
  const refreshOnlineStatus = () => {
    setIsRefreshing(true);
    if (socketService.isConnected()) {
      socketService.getSocket()?.emit('get-online-users');
      
      // Request status for each user in conversations
      localConversations.forEach(conv => {
        socketService.getUserStatus(conv.userId);
      });
      
      // Request status for users in new chat modal
      users.forEach(user => {
        socketService.getUserStatus(user.id);
      });
    }
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Initialize socket connection
  useEffect(() => {
    if (!currentUser) return;

    console.log('🔌 Chat sidebar - Initializing socket connection');

    if (!socketService.isConnected()) {
      socketService.connect(currentUser.id, localStorage.getItem('token'));
    }

    socketService.joinUser(currentUser.id);

    // Set up event listeners
    socketService.on('users:online', handleOnlineUsers);
    socketService.on('user:online', handleUserOnline);
    socketService.on('user:offline', handleUserOffline);
    socketService.on('user:status:response', handleUserStatusResponse);
    socketService.on('typing:start', handleTypingStart);
    socketService.on('typing:stop', handleTypingStop);
    socketService.on('message:receive', handleNewMessage);
    socketService.on('messages:read', handleMessagesRead);

    // Request online users
    if (socketService.isConnected()) {
      socketService.getSocket()?.emit('get-online-users');
      
      // Request status for current user
      socketService.getUserStatus(currentUser.id);
    }

    return () => {
      socketService.off('users:online', handleOnlineUsers);
      socketService.off('user:online', handleUserOnline);
      socketService.off('user:offline', handleUserOffline);
      socketService.off('user:status:response', handleUserStatusResponse);
      socketService.off('typing:start', handleTypingStart);
      socketService.off('typing:stop', handleTypingStop);
      socketService.off('message:receive', handleNewMessage);
      socketService.off('messages:read', handleMessagesRead);
      
      // Clear processed IDs
      processedMessageIds.current.clear();
      processedReadIds.current.clear();
    };
  }, [currentUser, handleOnlineUsers, handleUserOnline, handleUserOffline, 
      handleUserStatusResponse, handleTypingStart, handleTypingStop, 
      handleNewMessage, handleMessagesRead]);

  // Update online status for conversations when onlineUsers changes
  useEffect(() => {
    // Request status for each user in conversations to ensure accuracy
    localConversations.forEach(conv => {
      if (socketService.isConnected()) {
        socketService.getUserStatus(conv.userId);
      }
    });
  }, [localConversations]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target) && showNotifications) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  // Fetch users for new chat
  useEffect(() => {
    const fetchUsers = async () => {
      if (!showNewChat) return;
      
      setLoadingUsers(true);
      try {
        const response = await fetch('http://localhost:5000/api/users/all', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            const usersWithStatus = (result.users || [])
              .filter(user => (user.id || user._id) !== currentUser?.id)
              .map(user => {
                const userId = user.id || user._id;
                return {
                  ...user,
                  id: userId,
                  isOnline: onlineUsers[userId]?.online || false,
                  avatar: formatAvatarUrl(user.avatar),
                  lastActive: user.lastActive || user.profile?.lastActive
                };
              });
            setUsers(usersWithStatus);
            
            // Request status for each user
            if (socketService.isConnected()) {
              usersWithStatus.forEach(user => {
                socketService.getUserStatus(user.id);
              });
            }
          }
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [showNewChat, currentUser, onlineUsers]);

  // Focus modal search input
  useEffect(() => {
    if (showNewChat && modalSearchRef.current) {
      setTimeout(() => {
        modalSearchRef.current.focus();
      }, 100);
    }
  }, [showNewChat]);

  // Format time function
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '';
      
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / (60 * 1000));
      const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
      const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
      
      if (diffDays === 0) {
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m`;
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
      }
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'short' });
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  // Filter users for new chat
  const filteredUsers = useMemo(() => {
    return users
      .filter(user => 
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        if (a.isOnline && !b.isOnline) return -1;
        if (!a.isOnline && b.isOnline) return 1;
        return (a.name || '').localeCompare(b.name || '');
      });
  }, [users, searchQuery]);

  // Filter and enhance conversations
  const enhancedConversations = useMemo(() => {
    return localConversations
      .map(conv => {
        const isOnline = onlineUsers[conv.userId]?.online || false;
        // Use unreadCount from state first, then from conversation
        const unreadCount = unreadCounts[conv.id] !== undefined ? unreadCounts[conv.id] : (conv.unreadCount || 0);
        
        return {
          ...conv,
          isOnline,
          isTyping: typingStatus[conv.id] || null,
          userAvatar: formatAvatarUrl(conv.userAvatar),
          unreadCount,
          lastMessageTime: conv.lastMessageTime || conv.updatedAt || new Date().toISOString()
        };
      })
      .filter(conv =>
        conv.userName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        // Sort by typing first
        if (a.isTyping && !b.isTyping) return -1;
        if (!a.isTyping && b.isTyping) return 1;
        
        // Then by unread
        if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
        if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
        
        // Finally by last message time
        return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
      });
  }, [localConversations, onlineUsers, typingStatus, unreadCounts, searchQuery]);

  // Handle user selection
  const handleUserSelect = (user) => {
    onStartChat(user);
    setShowNewChat(false);
    setSearchQuery('');
  };

  // Handle conversation click
  const handleConversationClick = (conversation) => {
    console.log(`💬 Clicked conversation ${conversation.id}, unread count: ${conversation.unreadCount}`);
    
    // Clear unread count locally
    if (conversation.unreadCount > 0) {
      setUnreadCounts(prev => {
        const newState = { ...prev };
        delete newState[conversation.id];
        console.log(`💬 Cleared unread count for ${conversation.id}`);
        return newState;
      });

      // Update local conversations
      setLocalConversations(prev => 
        prev.map(conv => 
          conv.id === conversation.id ? { ...conv, unreadCount: 0 } : conv
        )
      );

      // Also emit socket event to mark messages as read
      if (socketService.isConnected()) {
        socketService.markMessagesAsRead(conversation.id, conversation.userId);
        
        // Emit additional event for real-time update
        socketService.getSocket()?.emit('messages:read', {
          conversationId: conversation.id,
          readerId: currentUser?.id,
          count: conversation.unreadCount,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Call the parent's onSelectChat
    onSelectChat(conversation);
  };

  // Handle toggle collapse
  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Clear notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    setShowNotifications(false);
    if (notification.conversationId) {
      const conversation = localConversations.find(c => c.id === notification.conversationId);
      if (conversation) {
        handleConversationClick(conversation);
      }
    }
  };

  // Handle profile navigation
  const handleProfileClick = (userId, e) => {
    e.stopPropagation();
    navigate(`/profile/${userId}`);
  };

  // Total unread count
  const totalUnread = useMemo(() => {
    return Object.values(unreadCounts).reduce((a, b) => a + b, 0);
  }, [unreadCounts]);

  // Online count
  const onlineCount = useMemo(() => {
    return Object.values(onlineUsers).filter(u => u.online).length;
  }, [onlineUsers]);

  // Collapsed view
  if (isCollapsed) {
    return (
      <aside 
        className={`${styles.sidebar} ${styles.collapsed} ${darkMode ? styles.dark : styles.light}`}
        ref={panelRef}
      >
        <div className={styles.collapsedHeader}>
          <button 
            className={styles.expandButton}
            onClick={handleToggleCollapse}
            title="Expand sidebar"
          >
            <FaChevronRight />
          </button>
        </div>
        
        <div className={styles.collapsedIcons}>
          <button 
            className={`${styles.collapsedIcon} ${activeChat ? styles.active : ''}`}
            onClick={() => setIsCollapsed(false)}
            title="Chats"
          >
            <FaComments />
            {totalUnread > 0 && (
              <span className={styles.unreadBadge}>{totalUnread}</span>
            )}
          </button>

          <button 
            className={styles.collapsedIcon}
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notifications"
          >
            <FaBell />
            {notifications.length > 0 && (
              <span className={styles.notificationBadge}>{notifications.length}</span>
            )}
          </button>

          <button 
            className={styles.collapsedIcon}
            onClick={() => setShowNewChat(true)}
            title="New Chat"
          >
            <FaPlus />
          </button>
        </div>

        {/* Notifications dropdown */}
        {showNotifications && (
          <div className={styles.notificationsDropdown} ref={notificationsRef}>
            <div className={styles.notificationsHeader}>
              <h4>Notifications</h4>
              <button onClick={clearNotifications}>Clear all</button>
            </div>
            <div className={styles.notificationsList}>
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={styles.notificationItem}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className={styles.notificationIcon}>
                      {notif.type === 'message' && <FaComments />}
                    </div>
                    <div className={styles.notificationContent}>
                      <strong>{notif.title}</strong>
                      <p>{notif.body}</p>
                      <span>{formatTime(notif.timestamp)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.noNotifications}>No notifications</div>
              )}
            </div>
          </div>
        )}
      </aside>
    );
  }

  return (
    <aside 
      className={`${styles.sidebar} ${darkMode ? styles.dark : styles.light}`}
      ref={panelRef}
    >
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerTitle}>
            <FaComments className={styles.headerIcon} />
            <h3>Messages</h3>
            {totalUnread > 0 && (
              <span className={styles.headerBadge}>{totalUnread} new</span>
            )}
          </div>
          <div className={styles.headerActions}>
            <button 
              className={`${styles.refreshButton} ${isRefreshing ? styles.refreshing : ''}`}
              onClick={refreshOnlineStatus}
              title="Refresh online status"
              disabled={isRefreshing}
            >
              <FaSyncAlt />
            </button>
            <button 
              className={styles.notificationButton}
              onClick={() => setShowNotifications(!showNotifications)}
              title="Notifications"
            >
              <FaBell />
              {notifications.length > 0 && (
                <span className={styles.notificationBadge}>{notifications.length}</span>
              )}
            </button>
            <button 
              className={styles.collapseButton}
              onClick={handleToggleCollapse}
              title="Collapse sidebar"
            >
              <FaChevronLeft />
            </button>
          </div>
        </div>

        {/* Notifications dropdown */}
        {showNotifications && (
          <div className={styles.notificationsDropdown} ref={notificationsRef}>
            <div className={styles.notificationsHeader}>
              <h4>Notifications</h4>
              <button onClick={clearNotifications}>Clear all</button>
            </div>
            <div className={styles.notificationsList}>
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={styles.notificationItem}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className={styles.notificationIcon}>
                      {notif.type === 'message' && <FaComments />}
                    </div>
                    <div className={styles.notificationContent}>
                      <strong>{notif.title}</strong>
                      <p>{notif.body}</p>
                      <span>{formatTime(notif.timestamp)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.noNotifications}>No notifications</div>
              )}
            </div>
          </div>
        )}
        
        {/* Search Bar */}
        <div className={styles.searchContainer}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          {searchQuery && (
            <button 
              className={styles.clearSearch}
              onClick={() => setSearchQuery('')}
            >
              <FaTimes />
            </button>
          )}
        </div>
      </div>

      {/* New Chat Button */}
      <div className={styles.newChatSection}>
        <button 
          className={styles.newChatButton}
          onClick={() => setShowNewChat(true)}
        >
          <FaPlus className={styles.newChatIcon} />
          <span>Start New Chat</span>
        </button>
      </div>

      {/* Conversations List */}
      <div className={styles.conversationsSection}>
        <div className={styles.sectionHeader}>
          <span>Recent Chats</span>
          <span className={styles.onlineStats}>
            <FaCircle className={styles.onlineDot} /> 
            {onlineCount} online
          </span>
        </div>

        <div className={styles.conversationsList}>
          {enhancedConversations.length > 0 ? (
            enhancedConversations.map(conversation => (
              <div
                key={conversation.id}
                className={`${styles.conversationItem} ${
                  activeChat?.id === conversation.id ? styles.active : ''
                } ${conversation.unreadCount > 0 ? styles.unread : ''} ${
                  hoveredItem === conversation.id ? styles.hovered : ''
                }`}
                onClick={() => handleConversationClick(conversation)}
                onMouseEnter={() => setHoveredItem(conversation.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div 
                  className={styles.avatar}
                  onClick={(e) => handleProfileClick(conversation.userId, e)}
                  title={`View ${conversation.userName}'s profile`}
                >
                  {hasValidAvatar(conversation.userAvatar) ? (
                    <img 
                      src={conversation.userAvatar} 
                      alt={conversation.userName}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const parent = e.target.parentNode;
                        if (parent) {
                          const initialSpan = document.createElement('span');
                          initialSpan.className = styles.avatarInitial;
                          initialSpan.textContent = getAvatarInitial({ name: conversation.userName });
                          parent.appendChild(initialSpan);
                        }
                      }}
                    />
                  ) : (
                    <span className={styles.avatarInitial}>
                      {getAvatarInitial({ name: conversation.userName })}
                    </span>
                  )}
                  <div className={`${styles.onlineIndicator} ${conversation.isOnline ? styles.online : ''}`}>
                    {conversation.isOnline ? <FaCircle /> : <FaRegCircle />}
                  </div>
                </div>
                
                <div className={styles.conversationInfo}>
                  <div className={styles.conversationHeader}>
                    <strong 
                      onClick={(e) => handleProfileClick(conversation.userId, e)}
                      style={{ cursor: 'pointer' }}
                      title={`View ${conversation.userName}'s profile`}
                    >
                      {conversation.userName}
                    </strong>
                    <span className={styles.time}>
                      {formatTime(conversation.lastMessageTime)}
                    </span>
                  </div>
                  
                  <div className={styles.conversationPreview}>
                    {conversation.isTyping ? (
                      <p className={`${styles.lastMessage} ${styles.typingIndicator}`}>
                        <span className={styles.typingDots}>
                          <span>.</span><span>.</span><span>.</span>
                        </span>
                        <span>typing...</span>
                      </p>
                    ) : (
                      <p className={styles.lastMessage}>
                        {conversation.lastMessage || 'Start a conversation...'}
                      </p>
                    )}
                    
                    {conversation.unreadCount > 0 && (
                      <span className={styles.unreadBadge}>
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Actions (shown on hover) */}
                {hoveredItem === conversation.id && (
                  <div className={styles.quickActions}>
                    <button 
                      className={styles.quickAction}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConversationClick(conversation);
                      }}
                      title="Open chat"
                    >
                      <FaComments />
                    </button>
                    <button 
                      className={styles.quickAction}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProfileClick(conversation.userId, e);
                      }}
                      title="View profile"
                    >
                      <FaUser />
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              <FaComments className={styles.emptyIcon} />
              <p>No conversations yet</p>
              <button 
                className={styles.startChatButton}
                onClick={() => setShowNewChat(true)}
              >
                <FaPlus /> Start a Chat
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div className={styles.recentActivity}>
          <div className={styles.activityHeader}>
            <FaFire className={styles.activityFire} />
            <span>Recent Activity</span>
            <FaClock className={styles.activityClock} />
          </div>
          <div className={styles.activityList}>
            {recentActivity.map((activity, index) => (
              <div key={index} className={styles.activityItem}>
                {activity.type === 'user-online' && <FaCircle className={styles.onlineIcon} />}
                {activity.type === 'user-offline' && <FaRegCircle className={styles.offlineIcon} />}
                <span className={styles.activityText}>
                  {activity.type === 'user-online' && `${activity.userName || 'Someone'} came online`}
                  {activity.type === 'user-offline' && `${activity.userName || 'Someone'} went offline`}
                </span>
                <span className={styles.activityTime}>
                  {formatTime(activity.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Chat Modal */}
      {showNewChat && (
        <div className={styles.modalOverlay} onClick={() => setShowNewChat(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>New Conversation</h3>
              <button 
                className={styles.closeButton}
                onClick={() => {
                  setShowNewChat(false);
                  setSearchQuery('');
                }}
              >
                <FaTimes />
              </button>
            </div>
            
            <div className={styles.modalSearch}>
              <FaSearch className={styles.modalSearchIcon} />
              <input
                ref={modalSearchRef}
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.modalSearchInput}
              />
            </div>
            
            <div className={styles.userList}>
              {loadingUsers ? (
                <div className={styles.loadingState}>
                  <div className={styles.spinner}></div>
                  <span>Loading users...</span>
                </div>
              ) : (
                filteredUsers.map(user => (
                  <div
                    key={user.id}
                    className={`${styles.userItem} ${user.isOnline ? styles.online : ''} ${
                      hoveredItem === user.id ? styles.hovered : ''
                    }`}
                    onClick={() => handleUserSelect(user)}
                    onMouseEnter={() => setHoveredItem(user.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <div 
                      className={styles.userAvatar}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProfileClick(user.id, e);
                      }}
                      title={`View ${user.name}'s profile`}
                    >
                      {hasValidAvatar(user.avatar) ? (
                        <img 
                          src={user.avatar} 
                          alt={user.name}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const parent = e.target.parentNode;
                            if (parent) {
                              const initialSpan = document.createElement('span');
                              initialSpan.className = styles.avatarInitial;
                              initialSpan.textContent = getAvatarInitial(user);
                              parent.appendChild(initialSpan);
                            }
                          }}
                        />
                      ) : (
                        <span className={styles.avatarInitial}>{getAvatarInitial(user)}</span>
                      )}
                      <div className={`${styles.onlineDot} ${user.isOnline ? styles.online : ''}`}></div>
                      {user.isVerified && <FaCheckCircle className={styles.verifiedBadge} />}
                      {user.isPremium && <FaCrown className={styles.premiumBadge} />}
                    </div>
                    
                    <div className={styles.userInfo}>
                      <div className={styles.userName}>
                        <strong>{user.name}</strong>
                        {user.isVerified && <FaCheckCircle className={styles.verifiedIcon} />}
                      </div>
                      <span className={styles.userUsername}>@{user.username}</span>
                      {user.isOnline && (
                        <span className={styles.userStatus}>● Online now</span>
                      )}
                    </div>

                    <button 
                      className={styles.startChatBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUserSelect(user);
                      }}
                      title="Start chat"
                    >
                      <FaComments />
                    </button>
                  </div>
                ))
              )}
              
              {!loadingUsers && filteredUsers.length === 0 && searchQuery && (
                <div className={styles.noResults}>
                  <FaSearch />
                  <p>No users found matching "{searchQuery}"</p>
                </div>
              )}
              
              {!loadingUsers && filteredUsers.length === 0 && !searchQuery && (
                <div className={styles.noResults}>
                  <FaUsers />
                  <p>No other users available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default ChatSidebar;