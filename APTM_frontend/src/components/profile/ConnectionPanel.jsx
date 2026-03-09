// ConnectionPanel.jsx - COMPLETE WORKING VERSION
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { socketService } from '../../services/socketService';
import styles from './ConnectionPanel.module.css';
import { formatAvatarUrl, getAvatarInitial, hasValidAvatar } from '../../utils/avatarUtils';

// Import React Icons
import {
  FaUserFriends, FaSearch, FaCircle, FaRegCircle, 
  FaRegCommentDots, FaComments, FaUserPlus, FaUserCheck,
  FaUsers, FaHashtag, FaLock, FaGlobe, FaChevronLeft,
  FaChevronRight, FaChevronDown, FaChevronUp, FaTimes,
  FaUser, FaSignInAlt, FaSignOutAlt, FaInfoCircle,
  FaPlus, FaFilter, FaBell, FaCheckCircle, FaStar,
  FaGem, FaFire, FaClock, FaShieldAlt, FaCrown,
  FaUserMinus, FaSyncAlt
} from 'react-icons/fa';

const ConnectionPanel = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { darkMode } = useTheme();

  // Navigation panel states
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [followingStatus, setFollowingStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [chatRooms, setChatRooms] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [roomFilters, setRoomFilters] = useState({
    type: 'all',
    category: 'all',
    sortBy: 'activity'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [expandedRooms, setExpandedRooms] = useState({});
  const [roomMembers, setRoomMembers] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const searchInputRef = useRef(null);
  const panelRef = useRef(null);
  const notificationsRef = useRef(null);

  // Dispatch panel state change
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('panelStateChange', { 
      detail: { collapsed: isCollapsed }
    }));
  }, [isCollapsed]);

  // Socket event handlers with detailed logging
  const handleOnlineUsers = useCallback((users) => {
    console.log('📊 Online users received:', users);
    setOnlineUsers(users);
  }, []);

  const handleUserOnline = useCallback((data) => {
    console.log('🟢 User online event:', data);
    setOnlineUsers(prev => {
      const newState = { 
        ...prev, 
        [data.userId]: { online: true, userData: data.userData } 
      };
      return newState;
    });

    addRecentActivity({
      type: 'user-online',
      userId: data.userId,
      userName: data.userData?.name,
      timestamp: new Date().toISOString()
    });
  }, []);

  const handleUserOffline = useCallback((data) => {
    console.log('🔴 User offline event:', data);
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
    console.log('📊 User status response:', data);
    if (data.userId) {
      setOnlineUsers(prev => ({
        ...prev,
        [data.userId]: { online: data.isOnline, userData: data.userData }
      }));
    }
  }, []);

  // Initialize socket connection
  useEffect(() => {
    if (!currentUser) {
      console.log('❌ No current user, skipping socket connection');
      return;
    }
    
    console.log('🔌 Initializing socket connection for user:', currentUser.id);
    
    // Connect to socket
    socketService.connect(currentUser.id, localStorage.getItem('token'));
    
    // Join user's personal room
    socketService.joinUser(currentUser.id);

    // Set up event listeners
    socketService.on('users:online', handleOnlineUsers);
    socketService.on('user:online', handleUserOnline);
    socketService.on('user:offline', handleUserOffline);
    socketService.on('user:status:response', handleUserStatusResponse);

    // Listen for connect event
    const handleConnect = () => {
      console.log('✅ Socket connected successfully');
      socketService.getSocket()?.emit('get-online-users');
      socketService.getUserStatus(currentUser.id);
    };
    
    socketService.on('connect', handleConnect);

    // Listen for room updates
    socketService.on('room-updated', (room) => {
      setChatRooms(prev => 
        prev.map(r => r.id === room.id ? { ...r, ...room } : r)
      );
    });

    socketService.on('room-created', (room) => {
      setChatRooms(prev => [room, ...prev]);
      addRecentActivity({
        type: 'room-created',
        roomId: room.id,
        roomName: room.title,
        timestamp: new Date().toISOString()
      });
    });

    socketService.on('room-deleted', (roomId) => {
      setChatRooms(prev => prev.filter(r => r.id !== roomId));
    });

    socketService.on('room-member-joined', ({ roomId, user }) => {
      setRoomMembers(prev => ({
        ...prev,
        [roomId]: [...(prev[roomId] || []), user]
      }));
      
      setChatRooms(prev => 
        prev.map(room => 
          room.id === roomId 
            ? { ...room, memberCount: (room.memberCount || 0) + 1 }
            : room
        )
      );

      addRecentActivity({
        type: 'member-joined',
        roomId,
        userName: user.name,
        timestamp: new Date().toISOString()
      });
    });

    socketService.on('room-member-left', ({ roomId, userId }) => {
      setRoomMembers(prev => ({
        ...prev,
        [roomId]: (prev[roomId] || []).filter(member => member.id !== userId)
      }));
      
      setChatRooms(prev => 
        prev.map(room => 
          room.id === roomId 
            ? { ...room, memberCount: Math.max(0, (room.memberCount || 1) - 1) }
            : room
        )
      );
    });

    socketService.on('user-typing', ({ roomId, userId, username }) => {
      setTypingUsers(prev => ({
        ...prev,
        [roomId]: { userId, username }
      }));
      
      setTimeout(() => {
        setTypingUsers(prev => {
          const newState = { ...prev };
          if (newState[roomId]?.userId === userId) {
            delete newState[roomId];
          }
          return newState;
        });
      }, 2000);
    });

    socketService.on('unread-count', (counts) => {
      setUnreadCounts(counts);
    });

    socketService.on('recent-activity', (activity) => {
      addRecentActivity(activity);
    });

    socketService.on('notification', (notification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 20));
      
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.body,
          icon: notification.icon
        });
      }
    });

    // Check if already connected
    if (socketService.isConnected()) {
      console.log('✅ Socket already connected');
      socketService.getSocket()?.emit('get-online-users');
    }

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      console.log('🔌 Cleaning up socket listeners');
      socketService.off('users:online');
      socketService.off('user:online');
      socketService.off('user:offline');
      socketService.off('user:status:response');
      socketService.off('connect');
      socketService.off('room-updated');
      socketService.off('room-created');
      socketService.off('room-deleted');
      socketService.off('room-member-joined');
      socketService.off('room-member-left');
      socketService.off('user-typing');
      socketService.off('unread-count');
      socketService.off('recent-activity');
      socketService.off('notification');
    };
  }, [currentUser, handleOnlineUsers, handleUserOnline, handleUserOffline, handleUserStatusResponse]);

  // Handle click outside for mobile panel
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target) && isMobileOpen) {
        setIsMobileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target) && showNotifications) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileOpen, showNotifications]);

  // Add recent activity
  const addRecentActivity = (activity) => {
    setRecentActivity(prev => [activity, ...prev].slice(0, 10));
  };

  // Fetch all users from database
  useEffect(() => {
    const fetchUsersData = async () => {
      try {
        setLoading(true);
        
        const usersResponse = await fetch('http://localhost:5000/api/users/all', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          if (usersData.success) {
            const fetchedUsers = usersData.users || [];
            console.log('📥 Fetched users:', fetchedUsers.length);
            
            // Add online status from socket
            const usersWithOnline = fetchedUsers.map(user => {
              const userId = user.id || user._id;
              const isOnline = onlineUsers[userId]?.online || false;
              return {
                ...user,
                online: isOnline
              };
            });
            
            setUsers(usersWithOnline);
            
            // Initialize following status
            const statusMap = {};
            usersWithOnline.forEach(user => {
              statusMap[user.id || user._id] = user.isFollowing || false;
            });
            setFollowingStatus(statusMap);
            
            // Request status for each user
            if (socketService.isConnected()) {
              setTimeout(() => {
                usersWithOnline.forEach(user => {
                  socketService.getUserStatus(user.id || user._id);
                });
              }, 500);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsersData();
  }, [currentUser]);

  // Update online status when onlineUsers changes
  useEffect(() => {
    setUsers(prevUsers => {
      const updatedUsers = prevUsers.map(user => {
        const userId = user.id || user._id;
        const isOnline = onlineUsers[userId]?.online || false;
        return {
          ...user,
          online: isOnline
        };
      });
      return updatedUsers;
    });
  }, [onlineUsers]);

  // Fetch chat rooms
  useEffect(() => {
    const fetchChatRooms = async () => {
      try {
        const chatResponse = await fetch('http://localhost:5000/api/chat/rooms', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        if (chatResponse.ok) {
          const chatData = await chatResponse.json();
          const rooms = chatData.rooms || [];
          
          const roomsWithDetails = await Promise.all(
            rooms.map(async (room) => {
              try {
                const membersResponse = await fetch(`http://localhost:5000/api/chat/rooms/${room.id}/members`, {
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                  },
                });
                
                if (membersResponse.ok) {
                  const membersData = await membersResponse.json();
                  return {
                    ...room,
                    memberCount: membersData.count || room.memberCount || 0,
                    onlineCount: membersData.onlineCount || 0,
                    members: membersData.members || []
                  };
                }
              } catch (error) {
                console.error(`Error fetching members for room ${room.id}:`, error);
              }
              return room;
            })
          );
          
          setChatRooms(roomsWithDetails);
        }
      } catch (error) {
        console.error('Error fetching chat rooms:', error);
        // Mock data
        const mockRooms = [
          { 
            id: 'forex-1', 
            title: '💱 Forex Trading Hub', 
            description: 'Discuss forex strategies, currency pairs, and market analysis',
            memberCount: 124, 
            onlineCount: 18,
            type: 'public',
            category: 'forex',
            isActive: true,
            isMember: false,
            isFeatured: true,
            isPremium: false,
            lastMessage: 'EUR/USD showing bullish pattern on 4H chart',
            lastActivity: new Date().toISOString(),
            createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
            tags: ['forex', 'eurusd', 'technical-analysis'],
            language: 'en'
          },
          { 
            id: 'crypto-1', 
            title: '🪙 Crypto Discussion', 
            description: 'All things crypto - BTC, ETH, altcoins, DeFi, and NFTs',
            memberCount: 289, 
            onlineCount: 42,
            type: 'public',
            category: 'crypto',
            isActive: true,
            isMember: false,
            isFeatured: true,
            isPremium: false,
            lastMessage: 'Bitcoin breaking resistance at $50k',
            lastActivity: new Date().toISOString(),
            createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
            tags: ['bitcoin', 'ethereum', 'defi'],
            language: 'en'
          },
          { 
            id: 'stocks-1', 
            title: '📈 Stock Market Analysis', 
            description: 'US and international stocks, earnings analysis, and investment strategies',
            memberCount: 145, 
            onlineCount: 23,
            type: 'public',
            category: 'stocks',
            isActive: true,
            isMember: false,
            isFeatured: false,
            isPremium: false,
            lastMessage: 'Tech earnings this week - watch out for AAPL',
            lastActivity: new Date().toISOString(),
            createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
            tags: ['stocks', 'investing', 'earnings'],
            language: 'en'
          }
        ];
        setChatRooms(mockRooms);
      }
    };

    fetchChatRooms();
  }, []);

  // Manual refresh function
  const refreshOnlineStatus = () => {
    console.log('🔄 Manually refreshing online status');
    setIsRefreshing(true);
    
    if (socketService.isConnected()) {
      socketService.getSocket()?.emit('get-online-users');
      
      users.forEach(user => {
        socketService.getUserStatus(user.id || user._id);
      });
    }
    
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  // Memoized filtered users
  const filteredUsersMemo = useMemo(() => {
    let filtered = users;

    if (searchQuery.trim() !== '' && activeTab === 'users') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(query) ||
        user.username?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.tradingExperience?.toLowerCase().includes(query)
      );
    }

    filtered.sort((a, b) => {
      if (a.online && !b.online) return -1;
      if (!a.online && b.online) return 1;
      return (a.name || '').localeCompare(b.name || '');
    });

    return filtered;
  }, [users, searchQuery, activeTab]);

  // Memoized filtered rooms
  const filteredRoomsMemo = useMemo(() => {
    let filtered = chatRooms;

    if (activeTab !== 'rooms') return filtered;

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(room =>
        room.title?.toLowerCase().includes(query) ||
        room.description?.toLowerCase().includes(query) ||
        room.category?.toLowerCase().includes(query) ||
        room.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (roomFilters.type !== 'all') {
      filtered = filtered.filter(room => room.type === roomFilters.type);
    }

    if (roomFilters.category !== 'all') {
      filtered = filtered.filter(room => room.category === roomFilters.category);
    }

    filtered.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;

      switch (roomFilters.sortBy) {
        case 'activity':
          return (b.onlineCount || 0) - (a.onlineCount || 0);
        case 'members':
          return (b.memberCount || 0) - (a.memberCount || 0);
        case 'newest':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [chatRooms, searchQuery, roomFilters, activeTab]);

  // Handle follow/unfollow user
  const handleFollowUser = async (userId, e) => {
    e.stopPropagation();
    
    try {
      const isCurrentlyFollowing = followingStatus[userId];
      const action = isCurrentlyFollowing ? 'unfollow' : 'follow';
      
      const response = await fetch(`http://localhost:5000/api/friends/${action}/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setFollowingStatus(prev => ({
          ...prev,
          [userId]: !isCurrentlyFollowing
        }));
        
        if (socketService.isConnected()) {
          socketService.getSocket().emit('user-followed', {
            followerId: currentUser.id,
            followingId: userId,
            action
          });
        }

        addRecentActivity({
          type: action,
          userId,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
    }
  };

  // Handle join/leave chat room
  const handleJoinRoom = async (roomId, e) => {
    e.stopPropagation();
    
    try {
      const room = chatRooms.find(r => r.id === roomId);
      const isMember = room?.isMember || false;
      const action = isMember ? 'leave' : 'join';
      
      const response = await fetch(`http://localhost:5000/api/chat/rooms/${roomId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        setChatRooms(prev =>
          prev.map(r =>
            r.id === roomId
              ? { 
                  ...r, 
                  isMember: !isMember,
                  memberCount: isMember ? r.memberCount - 1 : r.memberCount + 1
                }
              : r
          )
        );

        if (socketService.isConnected()) {
          socketService.getSocket().emit('room-joined-left', {
            roomId,
            userId: currentUser.id,
            action
          });
        }

        addRecentActivity({
          type: `room-${action}`,
          roomId,
          roomName: room.title,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error(`Error ${room.isMember ? 'leaving' : 'joining'} room:`, error);
    }
  };

  // Toggle room expansion
  const toggleRoomExpand = (roomId, e) => {
    e.stopPropagation();
    setExpandedRooms(prev => ({
      ...prev,
      [roomId]: !prev[roomId]
    }));

    if (!expandedRooms[roomId] && !roomMembers[roomId]) {
      fetchRoomMembers(roomId);
    }
  };

  // Fetch room members
  const fetchRoomMembers = async (roomId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/chat/rooms/${roomId}/members`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRoomMembers(prev => ({
          ...prev,
          [roomId]: data.members || []
        }));
      }
    } catch (error) {
      console.error('Error fetching room members:', error);
    }
  };

  // Handle user click
  const handleUserClick = (userId) => {
    navigate(`/profile/${userId}`);
    if (isMobileOpen) setIsMobileOpen(false);
  };

  // Handle chat room click
  const handleChatRoomClick = (roomId) => {
    navigate(`/chat/room/${roomId}`);
    if (isMobileOpen) setIsMobileOpen(false);
  };

  // Handle message user
  const handleMessageUser = (userId, e) => {
    e.stopPropagation();
    navigate(`/chat/${userId}`);
    if (isMobileOpen) setIsMobileOpen(false);
  };

  // Handle create room
  const handleCreateRoom = () => {
    navigate('/chat/create-room');
    if (isMobileOpen) setIsMobileOpen(false);
  };

  // Handle toggle collapse
  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  // Format user data for display
  const formatUserForDisplay = (user) => {
    let avatarData = user.avatar;
    
    if (avatarData && typeof avatarData === 'object') {
      avatarData = avatarData.url || avatarData.avatarUrl || null;
    }
    
    const userId = user.id || user._id;
    const isOnline = user.online || onlineUsers[userId]?.online || false;
    
    return {
      id: userId,
      name: user.name || user.displayName || 'Unknown User',
      username: user.username || `user${userId}`,
      email: user.email,
      avatar: formatAvatarUrl(avatarData),
      avatarInitial: getAvatarInitial(user),
      hasAvatar: hasValidAvatar(avatarData),
      online: isOnline,
      followersCount: user.followersCount || user.profile?.followersCount || 0,
      isFollowing: followingStatus[userId] || false,
      tradingExperience: user.tradingExperience || user.profile?.tradingExperience || 'beginner',
      lastActive: user.lastActive || user.profile?.lastActive,
      isVerified: user.isVerified || false,
      isPremium: user.isPremium || false
    };
  };

  // Get online count
  const onlineCount = useMemo(() => {
    return users.filter(u => u.online).length;
  }, [users]);

  // Get total unread count
  const totalUnread = useMemo(() => {
    return Object.values(unreadCounts).reduce((a, b) => a + b, 0);
  }, [unreadCounts]);

  // Get room categories for filter
  const roomCategories = useMemo(() => {
    const categories = new Set(chatRooms.map(room => room.category).filter(Boolean));
    return ['all', ...Array.from(categories)];
  }, [chatRooms]);

  // Get room types for filter
  const roomTypes = [
    { value: 'all', label: 'All Rooms', icon: FaGlobe },
    { value: 'public', label: 'Public', icon: FaGlobe },
    { value: 'private', label: 'Private', icon: FaLock }
  ];

  // Sort options
  const sortOptions = [
    { value: 'activity', label: 'Most Active', icon: FaFire },
    { value: 'members', label: 'Most Members', icon: FaUsers },
    { value: 'newest', label: 'Newest', icon: FaClock }
  ];

  // Handle notification click
  const handleNotificationClick = (notification) => {
    setShowNotifications(false);
    if (notification.roomId) {
      navigate(`/chat/room/${notification.roomId}`);
    } else if (notification.userId) {
      navigate(`/profile/${notification.userId}`);
    }
  };

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  // Collapsed view
  if (isCollapsed) {
    return (
      <aside 
        className={`${styles.navigationPanel} ${styles.collapsed} ${darkMode ? styles.dark : styles.light}`}
        ref={panelRef}
      >
        <div className={styles.collapsedHeader}>
          <button 
            className={styles.expandButton}
            onClick={handleToggleCollapse}
            title="Expand panel"
          >
            <FaChevronRight />
          </button>
        </div>
        
        <div className={styles.collapsedIcons}>
          <button 
            className={`${styles.collapsedIcon} ${activeTab === 'users' ? styles.active : ''}`}
            onClick={() => {
              setActiveTab('users');
              setIsCollapsed(false);
            }}
            title="Users"
          >
            <FaUsers />
            {onlineCount > 0 && (
              <span className={styles.onlineBadge}>{onlineCount}</span>
            )}
          </button>
          
          <button 
            className={`${styles.collapsedIcon} ${activeTab === 'rooms' ? styles.active : ''}`}
            onClick={() => {
              setActiveTab('rooms');
              setIsCollapsed(false);
            }}
            title="Chat Rooms"
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
        </div>

        {showNotifications && (
          <div className={styles.notificationsDropdown} ref={notificationsRef}>
            <div className={styles.notificationsHeader}>
              <h4>Notifications</h4>
              <button onClick={clearNotifications}>Clear all</button>
            </div>
            <div className={styles.notificationsList}>
              {notifications.length > 0 ? (
                notifications.map((notif, index) => (
                  <div 
                    key={index} 
                    className={styles.notificationItem}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className={styles.notificationIcon}>
                      {notif.type === 'message' && <FaRegCommentDots />}
                      {notif.type === 'follow' && <FaUserPlus />}
                      {notif.type === 'room' && <FaComments />}
                    </div>
                    <div className={styles.notificationContent}>
                      <strong>{notif.title}</strong>
                      <p>{notif.body}</p>
                      <span>{new Date(notif.timestamp).toLocaleTimeString()}</span>
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
      className={`${styles.navigationPanel} ${isMobileOpen ? styles.mobileOpen : ''} ${darkMode ? styles.dark : styles.light}`}
      ref={panelRef}
    >
      {/* Panel Header with Collapse Button */}
      <div className={styles.navigationHeader}>
        <div className={styles.headerTitle}>
          <FaUserFriends className={styles.headerIcon} />
          <h3>
            {activeTab === 'users' ? 'Community' : 'Chat Rooms'}
          </h3>
          {activeTab === 'users' && onlineCount > 0 && (
            <span className={styles.headerBadge}>{onlineCount} online</span>
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
            title="Collapse panel"
          >
            <FaChevronLeft />
          </button>
        </div>

        {showNotifications && (
          <div className={styles.notificationsDropdown} ref={notificationsRef}>
            <div className={styles.notificationsHeader}>
              <h4>Notifications</h4>
              <button onClick={clearNotifications}>Clear all</button>
            </div>
            <div className={styles.notificationsList}>
              {notifications.length > 0 ? (
                notifications.map((notif, index) => (
                  <div 
                    key={index} 
                    className={styles.notificationItem}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className={styles.notificationIcon}>
                      {notif.type === 'message' && <FaRegCommentDots />}
                      {notif.type === 'follow' && <FaUserPlus />}
                      {notif.type === 'room' && <FaComments />}
                    </div>
                    <div className={styles.notificationContent}>
                      <strong>{notif.title}</strong>
                      <p>{notif.body}</p>
                      <span>{new Date(notif.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.noNotifications}>No notifications</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabNavigation}>
        <button
          className={`${styles.tabButton} ${activeTab === 'users' ? styles.active : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <FaUsers />
          <span>Users</span>
          {onlineCount > 0 && (
            <span className={styles.tabBadge}>{onlineCount}</span>
          )}
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'rooms' ? styles.active : ''}`}
          onClick={() => setActiveTab('rooms')}
        >
          <FaComments />
          <span>Rooms</span>
          {totalUnread > 0 && (
            <span className={styles.tabBadge}>{totalUnread}</span>
          )}
        </button>
      </div>

      {/* Search Bar */}
      <div className={styles.searchContainer}>
        <FaSearch className={styles.searchIcon} />
        <input
          ref={searchInputRef}
          type="text"
          placeholder={activeTab === 'users' ? "Search users..." : "Search rooms..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
        {searchQuery && (
          <button 
            className={styles.clearSearch}
            onClick={handleClearSearch}
          >
            <FaTimes />
          </button>
        )}
      </div>

      {/* Filter Bar (for rooms) */}
      {activeTab === 'rooms' && (
        <div className={styles.filterBar}>
          <button 
            className={`${styles.filterButton} ${showFilters ? styles.active : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter /> Filters
          </button>
          
          {showFilters && (
            <div className={styles.filterPanel}>
              <div className={styles.filterGroup}>
                <label>Room Type</label>
                <div className={styles.filterOptions}>
                  {roomTypes.map(type => (
                    <button
                      key={type.value}
                      className={`${styles.filterOption} ${roomFilters.type === type.value ? styles.active : ''}`}
                      onClick={() => setRoomFilters(prev => ({ ...prev, type: type.value }))}
                    >
                      <type.icon />
                      <span>{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className={styles.filterGroup}>
                <label>Category</label>
                <select 
                  value={roomFilters.category}
                  onChange={(e) => setRoomFilters(prev => ({ ...prev, category: e.target.value }))}
                  className={styles.filterSelect}
                >
                  {roomCategories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label>Sort By</label>
                <div className={styles.sortOptions}>
                  {sortOptions.map(option => (
                    <button
                      key={option.value}
                      className={`${styles.sortOption} ${roomFilters.sortBy === option.value ? styles.active : ''}`}
                      onClick={() => setRoomFilters(prev => ({ ...prev, sortBy: option.value }))}
                    >
                      <option.icon />
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content Section */}
      {activeTab === 'users' ? (
        <div className={styles.usersSection}>
          <div className={styles.sectionHeader}>
            <span>Community Members</span>
            <span className={styles.onlineStats}>
              <FaCircle className={styles.onlineDot} /> {onlineCount} online
            </span>
          </div>
          
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <span>Loading users...</span>
            </div>
          ) : (
            <div className={styles.usersList}>
              {filteredUsersMemo.map((user) => {
                const formattedUser = formatUserForDisplay(user);
                const isCurrentUser = currentUser?.id === formattedUser.id;
                
                return (
                  <div
                    key={formattedUser.id}
                    className={`${styles.userItem} ${formattedUser.online ? styles.online : ''} ${hoveredItem === formattedUser.id ? styles.hovered : ''}`}
                    onClick={() => handleUserClick(formattedUser.id)}
                    onMouseEnter={() => setHoveredItem(formattedUser.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <div className={styles.userAvatar}>
                      {formattedUser.hasAvatar ? (
                        <img 
                          src={formattedUser.avatar} 
                          alt={formattedUser.name}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const parent = e.target.parentNode;
                            if (parent) {
                              const initialElement = parent.querySelector(`.${styles.avatarInitial}`);
                              if (initialElement) {
                                initialElement.style.display = 'flex';
                              }
                            }
                          }}
                        />
                      ) : (
                        <span className={styles.avatarInitial}>
                          {formattedUser.avatarInitial}
                        </span>
                      )}
                      <div className={`${styles.onlineIndicator} ${formattedUser.online ? styles.online : styles.offline}`}>
                        {formattedUser.online ? <FaCircle /> : <FaRegCircle />}
                      </div>
                      {formattedUser.isVerified && (
                        <FaCheckCircle className={styles.verifiedBadge} />
                      )}
                      {formattedUser.isPremium && (
                        <FaCrown className={styles.premiumBadge} />
                      )}
                    </div>
                    
                    <div className={styles.userInfo}>
                      <div className={styles.userName}>
                        <strong>{formattedUser.name}</strong>
                        {formattedUser.isVerified && <FaCheckCircle className={styles.verifiedIcon} />}
                      </div>
                      <span className={styles.userUsername}>@{formattedUser.username}</span>
                      <div className={styles.userStats}>
                        <span className={styles.userStat}>
                          {formattedUser.followersCount} followers
                        </span>
                        <span className={`${styles.userLevel} ${formattedUser.tradingExperience}`}>
                          {formattedUser.tradingExperience}
                        </span>
                      </div>
                    </div>
                    
                    <div className={styles.userActions}>
                      {!isCurrentUser && (
                        <>
                          <button 
                            className={`${styles.actionButton} ${styles.followButton} ${formattedUser.isFollowing ? styles.following : ''}`}
                            onClick={(e) => handleFollowUser(formattedUser.id, e)}
                            title={formattedUser.isFollowing ? 'Unfollow' : 'Follow'}
                          >
                            {formattedUser.isFollowing ? <FaUserCheck /> : <FaUserPlus />}
                          </button>
                          <button 
                            className={`${styles.actionButton} ${styles.messageButton}`}
                            onClick={(e) => handleMessageUser(formattedUser.id, e)}
                            title="Start Chat"
                          >
                            <FaRegCommentDots />
                          </button>
                        </>
                      )}
                      {isCurrentUser && (
                        <span className={styles.youBadge}>
                          <FaUser /> You
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {filteredUsersMemo.length === 0 && !loading && (
                <div className={styles.emptyState}>
                  <FaSearch size={32} />
                  <p>No users found matching "{searchQuery}"</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className={styles.chatRoomsSection}>
          <div className={styles.sectionHeader}>
            <span>Available Rooms</span>
            <button 
              className={styles.createRoomButton}
              onClick={handleCreateRoom}
              title="Create new room"
            >
              <FaPlus /> Create Room
            </button>
          </div>
          
          <div className={styles.chatRoomsList}>
            {filteredRoomsMemo.map((room) => (
              <div key={room.id} className={styles.roomContainer}>
                <div
                  className={`${styles.chatRoomItem} ${room.isActive ? styles.active : ''} ${room.isMember ? styles.member : ''} ${hoveredItem === room.id ? styles.hovered : ''}`}
                  onClick={() => handleChatRoomClick(room.id)}
                  onMouseEnter={() => setHoveredItem(room.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <div className={styles.roomIcon}>
                    {room.type === 'private' ? <FaLock /> : <FaHashtag />}
                    {room.isFeatured && <FaStar className={styles.featuredIcon} />}
                    {room.isPremium && <FaGem className={styles.premiumIcon} />}
                  </div>
                  
                  <div className={styles.roomInfo}>
                    <div className={styles.roomTitle}>
                      <strong>{room.title}</strong>
                      {room.type === 'private' && (
                        <span className={styles.privateBadge}>Private</span>
                      )}
                      {room.isPremium && (
                        <span className={styles.premiumBadge}>Premium</span>
                      )}
                    </div>
                    <span className={styles.roomMeta}>
                      <FaUsers /> {room.memberCount} members
                      {room.onlineCount > 0 && (
                        <span className={styles.onlineCount}>
                          <FaCircle /> {room.onlineCount} online
                        </span>
                      )}
                    </span>
                    {room.lastMessage && (
                      <span className={styles.lastMessage}>
                        💬 {room.lastMessage.substring(0, 40)}...
                      </span>
                    )}
                  </div>
                  
                  <div className={styles.roomActions}>
                    {typingUsers[room.id] && (
                      <span className={styles.typingIndicator} title={`${typingUsers[room.id].username} is typing...`}>
                        typing...
                      </span>
                    )}
                    
                    {unreadCounts[room.id] > 0 && (
                      <span className={styles.unreadCount}>{unreadCounts[room.id]}</span>
                    )}
                    
                    <button 
                      className={`${styles.expandButton} ${expandedRooms[room.id] ? styles.expanded : ''}`}
                      onClick={(e) => toggleRoomExpand(room.id, e)}
                    >
                      {expandedRooms[room.id] ? <FaChevronUp /> : <FaChevronDown />}
                    </button>
                    
                    <button 
                      className={`${styles.joinButton} ${room.isMember ? styles.member : ''}`}
                      onClick={(e) => handleJoinRoom(room.id, e)}
                      title={room.isMember ? 'Leave room' : 'Join room'}
                    >
                      {room.isMember ? <FaSignOutAlt /> : <FaSignInAlt />}
                    </button>
                  </div>
                </div>
                
                {expandedRooms[room.id] && (
                  <div className={styles.roomDetails}>
                    <p className={styles.roomDescription}>{room.description}</p>
                    
                    {room.tags && room.tags.length > 0 && (
                      <div className={styles.roomTags}>
                        {room.tags.map(tag => (
                          <span key={tag} className={styles.tag}>#{tag}</span>
                        ))}
                      </div>
                    )}
                    
                    <div className={styles.roomMembers}>
                      <h4>
                        <FaUsers /> Members ({room.memberCount})
                        {room.onlineCount > 0 && (
                          <span className={styles.onlineMemberCount}>
                            {room.onlineCount} online
                          </span>
                        )}
                      </h4>
                      <div className={styles.membersList}>
                        {(roomMembers[room.id] || room.members || []).slice(0, 6).map(member => {
                          const memberId = member.id || member._id;
                          const isOnline = onlineUsers[memberId]?.online || false;
                          
                          return (
                            <div 
                              key={memberId} 
                              className={styles.memberItem}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUserClick(memberId);
                              }}
                            >
                              <div className={styles.memberAvatar}>
                                {member.avatar ? (
                                  <img src={member.avatar} alt={member.name} />
                                ) : (
                                  <span>{member.name?.charAt(0) || '?'}</span>
                                )}
                                <span className={`${styles.memberOnline} ${isOnline ? styles.online : ''}`} />
                              </div>
                              <span className={styles.memberName}>{member.name}</span>
                              {member.isAdmin && <FaShieldAlt className={styles.adminBadge} />}
                            </div>
                          );
                        })}
                        {room.memberCount > 6 && (
                          <div className={styles.moreMembers}>
                            +{room.memberCount - 6} more
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className={styles.roomStats}>
                      <div className={styles.stat}>
                        <span>Created</span>
                        <span>{new Date(room.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className={styles.stat}>
                        <span>Activity</span>
                        <span>{room.messageCount || 0} messages</span>
                      </div>
                      <div className={styles.stat}>
                        <span>Language</span>
                        <span>{room.language || 'English'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {filteredRoomsMemo.length === 0 && !loading && (
              <div className={styles.emptyState}>
                {searchQuery ? (
                  <>
                    <FaSearch size={32} />
                    <p>No rooms match "{searchQuery}"</p>
                  </>
                ) : (
                  <>
                    <FaComments size={32} />
                    <p>No chat rooms available</p>
                    <button 
                      className={styles.createFirstRoom}
                      onClick={handleCreateRoom}
                    >
                      Create your first room
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Activity Footer */}
      {recentActivity.length > 0 && (
        <div className={styles.recentActivity}>
          <div className={styles.activityHeader}>
            <FaInfoCircle />
            <span>Recent Activity</span>
            <FaFire className={styles.activityIcon} />
          </div>
          <div className={styles.activityList}>
            {recentActivity.map((activity, index) => (
              <div key={index} className={styles.activityItem}>
                {activity.type === 'follow' && <FaUserPlus className={styles.activityTypeIcon} />}
                {activity.type === 'unfollow' && <FaUserMinus className={styles.activityTypeIcon} />}
                {activity.type === 'room-join' && <FaSignInAlt className={styles.activityTypeIcon} />}
                {activity.type === 'room-leave' && <FaSignOutAlt className={styles.activityTypeIcon} />}
                {activity.type === 'room-created' && <FaPlus className={styles.activityTypeIcon} />}
                {activity.type === 'user-online' && <FaCircle className={styles.onlineIcon} />}
                {activity.type === 'user-offline' && <FaRegCircle className={styles.offlineIcon} />}
                {activity.type === 'member-joined' && <FaUserPlus className={styles.activityTypeIcon} />}
                
                <span className={styles.activityText}>
                  {activity.type === 'follow' && `You followed a user`}
                  {activity.type === 'unfollow' && `You unfollowed a user`}
                  {activity.type === 'room-join' && `You joined ${activity.roomName}`}
                  {activity.type === 'room-leave' && `You left ${activity.roomName}`}
                  {activity.type === 'room-created' && `You created ${activity.roomName}`}
                  {activity.type === 'user-online' && `${activity.userName || 'A user'} came online`}
                  {activity.type === 'user-offline' && `${activity.userName || 'A user'} went offline`}
                  {activity.type === 'member-joined' && `${activity.userName} joined ${activity.roomName}`}
                </span>
                <span className={styles.activityTime}>
                  {new Date(activity.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Toggle Button */}
      <button 
        className={styles.mobileToggle}
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <FaChevronLeft /> : <FaChevronRight />}
      </button>
    </aside>
  );
};

export default ConnectionPanel;