// src/components/navigation/ConnectionPanel.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { userStatusService } from '../../services/userStatusService';
import styles from './ConnectionPanel.module.css';

// Import icons
import {
  FaUserFriends, FaSearch, FaCircle, FaRegCircle, 
  FaRegCommentDots, FaComments, FaUserPlus, FaUserCheck,
  FaUsers, FaHashtag, FaLock, FaGlobe, FaChevronLeft,
  FaChevronRight, FaChevronDown, FaChevronUp, FaTimes,
  FaUser, FaSignInAlt, FaSignOutAlt, FaInfoCircle,
  FaPlus, FaFilter, FaBell, FaCheckCircle, FaStar,
  FaGem, FaFire, FaClock, FaShieldAlt, FaCrown,
  FaUserMinus, FaSyncAlt, FaUserFriends as FaSuggestions,
  FaMapMarkerAlt, FaChartLine, FaHeart, FaExchangeAlt,
  FaTrophy, FaHandshake, FaChartBar, FaDollarSign
} from 'react-icons/fa';

// Helper functions
const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const isCloudinaryUrl = (url) => {
  return url && (url.includes('cloudinary') || url.includes('res.cloudinary.com'));
};

const formatAvatarUrl = (avatar) => {
  if (!avatar) return null;
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) return avatar;
  if (avatar.startsWith('data:')) return avatar;
  let cleanPath = avatar;
  if (avatar.includes('/')) cleanPath = avatar.split('/').pop();
  return `${API_URL}/uploads/avatars/${cleanPath}`;
};

const getOptimizedCloudinaryUrl = (url, size = 'small') => {
  if (!url || !isCloudinaryUrl(url)) return url;
  const dimensions = { 
    small: { width: 32, height: 32 }, 
    medium: { width: 48, height: 48 }, 
    large: { width: 64, height: 64 } 
  };
  const { width, height } = dimensions[size] || dimensions.small;
  return url.replace('/upload/', `/upload/w_${width},h_${height},c_fill,g_face,q_auto,f_auto/`);
};

const getAvatarInitial = (user) => {
  if (!user) return 'U';
  if (user.name) return user.name.charAt(0).toUpperCase();
  if (user.username) return user.username.charAt(0).toUpperCase();
  return 'U';
};

const hasValidAvatar = (avatar) => {
  return avatar && !avatar.startsWith('data:');
};

const ConnectionPanel = ({ 
  initialTab = 'followers', 
  onClose, 
  onTabChange,
  embedded = false 
}) => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { darkMode } = useTheme();

  // Panel states
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [chatRooms, setChatRooms] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [followingStatus, setFollowingStatus] = useState({});
  
  // Data states
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    location: '',
    tradingExperience: '',
    interests: [],
    minFollowers: '',
    maxFollowers: '',
    sortBy: 'relevance'
  });
  
  // Pagination states
  const [pagination, setPagination] = useState({
    followers: { page: 1, total: 0, limit: 20 },
    following: { page: 1, total: 0, limit: 20 },
    suggestions: { page: 1, total: 0, limit: 20 },
    search: { page: 1, total: 0, limit: 20 }
  });
  
  // UI states
  const [expandedRooms, setExpandedRooms] = useState({});
  const [roomMembers, setRoomMembers] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [avatarErrors, setAvatarErrors] = useState({});
  
  const searchInputRef = useRef(null);
  const panelRef = useRef(null);
  const notificationsRef = useRef(null);

  // Available filter options
  const tradingExperienceOptions = ['beginner', 'intermediate', 'advanced', 'expert'];
  const interestOptions = ['Forex', 'Stocks', 'Crypto', 'Commodities', 'Indices', 'Options', 'Futures', 'Technical Analysis', 'Fundamental Analysis', 'Day Trading', 'Swing Trading', 'Long-term Investing'];
  const sortOptions = [
    { value: 'relevance', label: 'Most Relevant', icon: FaStar },
    { value: 'followers', label: 'Most Followers', icon: FaUsers },
    { value: 'newest', label: 'Newest', icon: FaClock },
    { value: 'active', label: 'Most Active', icon: FaFire }
  ];

  // Update parent when tab changes
  useEffect(() => {
    if (onTabChange) {
      onTabChange(activeMainTab);
    }
  }, [activeMainTab, onTabChange]);

  // Set initial tab
  useEffect(() => {
    setActiveMainTab(initialTab);
  }, [initialTab]);

  // Dispatch panel state change
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('panelStateChange', { 
      detail: { collapsed: isCollapsed }
    }));
  }, [isCollapsed]);

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

  // ============ USER STATUS SERVICE SETUP ============
  useEffect(() => {
    if (!currentUser) {
      console.log('❌ No current user, skipping user status service');
      return;
    }
    
    console.log('🔌 ConnectionPanel initializing user status service');

    userStatusService.init(currentUser, {
      onConnect: () => {
        console.log('✅ ConnectionPanel: User status service connected');
        
        setTimeout(() => {
          userStatusService.getOnlineUsers();
        }, 500);
      },
      onDisconnect: () => {
        console.log('❌ ConnectionPanel: User status service disconnected');
      },
      onOnlineUsers: (users) => {
        console.log('📊 ConnectionPanel: Online users received');
        setOnlineUsers(users);
      },
      onUserOnline: (data) => {
        console.log('🟢 ConnectionPanel: User online:', data);
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
      },
      onUserOffline: (data) => {
        console.log('🔴 ConnectionPanel: User offline:', data);
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
      },
      onUserStatusResponse: (data) => {
        console.log('📡 ConnectionPanel: User status response:', data);
        setOnlineUsers(prev => ({
          ...prev,
          [data.userId]: { online: data.isOnline, userData: data.userData }
        }));
      }
    });

    return () => {
      console.log('🧹 ConnectionPanel cleaning up user status service');
      userStatusService.offUserOnline();
      userStatusService.offUserOffline();
      userStatusService.offUsersOnline();
      userStatusService.offUserStatusResponse();
    };
  }, [currentUser]);

  // Fetch followers
  const fetchFollowers = useCallback(async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/api/users/followers/${currentUser.id}?page=${pagination.followers.page}&limit=${pagination.followers.limit}&sortBy=latest`,
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );
      if (response.ok) {
        const data = await response.json();
        setFollowers(data.followers);
        setPagination(prev => ({
          ...prev,
          followers: { ...prev.followers, total: data.pagination.total }
        }));
      }
    } catch (error) {
      console.error('Error fetching followers:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser, pagination.followers.page, pagination.followers.limit]);

  // Fetch following
  const fetchFollowing = useCallback(async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/api/users/following/${currentUser.id}?page=${pagination.following.page}&limit=${pagination.following.limit}&sortBy=latest`,
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );
      if (response.ok) {
        const data = await response.json();
        setFollowing(data.following);
        setPagination(prev => ({
          ...prev,
          following: { ...prev.following, total: data.pagination.total }
        }));
      }
    } catch (error) {
      console.error('Error fetching following:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser, pagination.following.page, pagination.following.limit]);

  // Fetch suggestions
  const fetchSuggestions = useCallback(async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/api/users/suggestions?page=${pagination.suggestions.page}&limit=${pagination.suggestions.limit}`,
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.users);
        setPagination(prev => ({
          ...prev,
          suggestions: { ...prev.suggestions, total: data.pagination.total }
        }));
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser, pagination.suggestions.page, pagination.suggestions.limit]);

  // Advanced search
  const performAdvancedSearch = useCallback(async () => {
    if (!searchQuery && !filters.location && !filters.tradingExperience && !filters.interests.length) return;
    
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.search.page,
        limit: pagination.search.limit,
        sortBy: filters.sortBy
      });
      if (searchQuery) params.append('q', searchQuery);
      if (filters.location) params.append('location', filters.location);
      if (filters.tradingExperience) params.append('tradingExperience', filters.tradingExperience);
      if (filters.interests.length) params.append('interests', filters.interests.join(','));
      if (filters.minFollowers) params.append('minFollowers', filters.minFollowers);
      if (filters.maxFollowers) params.append('maxFollowers', filters.maxFollowers);
      
      const response = await fetch(
        `${API_URL}/api/users/advanced-search?${params.toString()}`,
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users);
        setPagination(prev => ({
          ...prev,
          search: { ...prev.search, total: data.pagination.total }
        }));
        
        // Update following status for search results
        const statusMap = {};
        data.users.forEach(user => {
          statusMap[user.id] = user.isFollowing || false;
        });
        setFollowingStatus(prev => ({ ...prev, ...statusMap }));
      }
    } catch (error) {
      console.error('Error performing search:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters, pagination.search.page, pagination.search.limit]);

  // Fetch chat rooms
  useEffect(() => {
    const fetchChatRooms = async () => {
      try {
        const chatResponse = await fetch(`${API_URL}/api/chat/rooms`, {
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
                const membersResponse = await fetch(`${API_URL}/api/chat/rooms/${room.id}/members`, {
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

  // Initial data load
  useEffect(() => {
    if (activeMainTab === 'followers') fetchFollowers();
    else if (activeMainTab === 'following') fetchFollowing();
    else if (activeMainTab === 'suggestions') fetchSuggestions();
  }, [activeMainTab, fetchFollowers, fetchFollowing, fetchSuggestions]);

  // Search when query or filters change
  useEffect(() => {
    if (activeMainTab === 'search' && (searchQuery || filters.location || filters.tradingExperience || filters.interests.length)) {
      performAdvancedSearch();
    }
  }, [activeMainTab, searchQuery, filters, pagination.search.page, performAdvancedSearch]);

  // Handle follow/unfollow
  const handleFollowUser = async (userId, e) => {
    e.stopPropagation();
    try {
      const isCurrentlyFollowing = followingStatus[userId];
      const action = isCurrentlyFollowing ? 'unfollow' : 'follow';
      
      const response = await fetch(`${API_URL}/api/friends/${action}/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setFollowingStatus(prev => ({ ...prev, [userId]: !isCurrentlyFollowing }));
        
        // Update local data
        if (activeMainTab === 'followers') {
          setFollowers(prev => prev.map(f => 
            f.id === userId ? { ...f, isFollowing: !isCurrentlyFollowing } : f
          ));
        } else if (activeMainTab === 'following') {
          setFollowing(prev => prev.filter(f => f.id !== userId));
        } else if (activeMainTab === 'suggestions') {
          setSuggestions(prev => prev.filter(s => s.id !== userId));
        } else if (activeMainTab === 'search') {
          setSearchResults(prev => prev.map(u => 
            u.id === userId ? { ...u, isFollowing: !isCurrentlyFollowing } : u
          ));
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
      
      const response = await fetch(`${API_URL}/api/chat/rooms/${roomId}/${action}`, {
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

        if (userStatusService.isConnected()) {
          userStatusService.getSocket().emit('room-joined-left', {
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
      console.error(`Error ${room?.isMember ? 'leaving' : 'joining'} room:`, error);
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
      const response = await fetch(`${API_URL}/api/chat/rooms/${roomId}/members`, {
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
    console.log('💬 Starting chat with user:', userId);
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

  // Handle avatar error
  const handleAvatarError = (userId) => {
    setAvatarErrors(prev => ({ ...prev, [userId]: true }));
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    // Reset search pagination when filters change
    setPagination(prev => ({ ...prev, search: { ...prev.search, page: 1 } }));
  };

  // Handle interest toggle
  const toggleInterest = (interest) => {
    setFilters(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  // Handle pagination
  const handleLoadMore = (tab) => {
    setPagination(prev => ({
      ...prev,
      [tab]: { ...prev[tab], page: prev[tab].page + 1 }
    }));
  };

  // Add recent activity
  const addRecentActivity = (activity) => {
    setRecentActivity(prev => [activity, ...prev].slice(0, 10));
  };

  // Manual refresh function
  const refreshOnlineStatus = () => {
    console.log('🔄 Manually refreshing online status');
    setIsRefreshing(true);
    
    if (userStatusService.isConnected()) {
      userStatusService.getOnlineUsers();
    }
    
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  // Format user for display
  const formatUserForDisplay = (user) => {
    let rawAvatar = user.avatar;
    if (rawAvatar && typeof rawAvatar === 'object') rawAvatar = rawAvatar.url || rawAvatar.avatarUrl || null;
    const userId = user.id || user._id;
    const isOnline = onlineUsers[userId]?.online || false;
    const hasError = avatarErrors[userId];
    
    let formattedAvatar = null;
    if (rawAvatar && !hasError) {
      formattedAvatar = formatAvatarUrl(rawAvatar);
      if (isCloudinaryUrl(formattedAvatar)) formattedAvatar = getOptimizedCloudinaryUrl(formattedAvatar, 'small');
    }
    
    return {
      id: userId,
      name: user.name || user.displayName || 'Unknown User',
      username: user.username || `user${userId}`,
      email: user.email,
      avatar: formattedAvatar,
      avatarInitial: getAvatarInitial(user),
      hasAvatar: hasValidAvatar(rawAvatar) && !hasError,
      online: isOnline,
      followersCount: user.followersCount || 0,
      isFollowing: followingStatus[userId] || user.isFollowing || false,
      tradingExperience: user.tradingExperience || 'beginner',
      country: user.country,
      interests: user.interests || [],
      bio: user.bio,
      followsBack: user.followsBack,
      matchScore: user.matchScore,
      commonInterests: user.commonInterests || []
    };
  };

  // Render user card
  const renderUserCard = (user, showMutualInfo = false) => {
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
              onError={() => handleAvatarError(formattedUser.id)}
              loading="lazy"
            />
          ) : (
            <span className={styles.avatarInitial}>{formattedUser.avatarInitial}</span>
          )}
          <div className={`${styles.onlineIndicator} ${formattedUser.online ? styles.online : styles.offline}`}>
            {formattedUser.online ? <FaCircle /> : <FaRegCircle />}
          </div>
        </div>
        
        <div className={styles.userInfo}>
          <div className={styles.userName}>
            <strong>{formattedUser.name}</strong>
            {formattedUser.followsBack && (
              <FaHandshake className={styles.mutualIcon} title="Follows you back" />
            )}
          </div>
          <span className={styles.userUsername}>@{formattedUser.username}</span>
          {formattedUser.country && (
            <div className={styles.userLocation}>
              <FaMapMarkerAlt /> {formattedUser.country}
            </div>
          )}
          {formattedUser.tradingExperience && (
            <div className={`${styles.userLevel} ${formattedUser.tradingExperience}`}>
              <FaChartLine /> {formattedUser.tradingExperience}
            </div>
          )}
          {formattedUser.interests && formattedUser.interests.length > 0 && (
            <div className={styles.userInterests}>
              {formattedUser.interests.slice(0, 3).map(interest => (
                <span key={interest} className={styles.interestTag}>{interest}</span>
              ))}
              {formattedUser.interests.length > 3 && (
                <span className={styles.moreInterest}>+{formattedUser.interests.length - 3}</span>
              )}
            </div>
          )}
          {showMutualInfo && formattedUser.commonInterests && formattedUser.commonInterests.length > 0 && (
            <div className={styles.commonInterests}>
              <FaHeart /> {formattedUser.commonInterests.length} common {formattedUser.commonInterests.length === 1 ? 'interest' : 'interests'}
            </div>
          )}
          <div className={styles.userStats}>
            <span className={styles.userStat}>
              <FaUsers /> {formattedUser.followersCount} followers
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
            <span className={styles.youBadge}><FaUser /> You</span>
          )}
        </div>
      </div>
    );
  };

  // Render chat rooms
  const renderChatRooms = () => {
    return (
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
          {chatRooms.map((room) => (
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
                                <img 
                                  src={isCloudinaryUrl(member.avatar) ? getOptimizedCloudinaryUrl(member.avatar, 'small') : formatAvatarUrl(member.avatar)} 
                                  alt={member.name}
                                  loading="lazy"
                                />
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
          
          {chatRooms.length === 0 && (
            <div className={styles.emptyState}>
              <FaComments size={32} />
              <p>No chat rooms available</p>
              <button 
                className={styles.createFirstRoom}
                onClick={handleCreateRoom}
              >
                Create your first room
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render content based on active tab
  const renderContent = () => {
    if (activeMainTab === 'rooms') {
      return renderChatRooms();
    }
    
    const currentData = {
      followers,
      following,
      suggestions,
      search: searchResults
    }[activeMainTab];
    
    const currentPagination = pagination[activeMainTab];
    const hasMore = currentPagination.page * currentPagination.limit < currentPagination.total;
    
    return (
      <>
        <div className={styles.contentHeader}>
          <h4>
            {activeMainTab === 'followers' && <>👥 Followers ({pagination.followers.total})</>}
            {activeMainTab === 'following' && <>🤝 Following ({pagination.following.total})</>}
            {activeMainTab === 'suggestions' && <>💡 Suggestions ({pagination.suggestions.total})</>}
            {activeMainTab === 'search' && <>🔍 Search Results ({pagination.search.total})</>}
          </h4>
          {activeMainTab === 'suggestions' && (
            <button onClick={fetchSuggestions} className={styles.refreshButton}>
              <FaSyncAlt /> Refresh
            </button>
          )}
        </div>
        
        <div className={styles.usersList}>
          {loading && currentData.length === 0 ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <span>Loading users...</span>
            </div>
          ) : currentData.length > 0 ? (
            <>
              {currentData.map(user => renderUserCard(user, activeMainTab === 'suggestions'))}
              {hasMore && (
                <button 
                  className={styles.loadMoreButton}
                  onClick={() => handleLoadMore(activeMainTab)}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              )}
            </>
          ) : (
            <div className={styles.emptyState}>
              {activeMainTab === 'followers' && (
                <>
                  <FaUserFriends size={48} />
                  <p>No followers yet</p>
                  <span>Share your profile to get more followers</span>
                </>
              )}
              {activeMainTab === 'following' && (
                <>
                  <FaUserPlus size={48} />
                  <p>Not following anyone yet</p>
                  <button onClick={() => setActiveMainTab('suggestions')}>
                    Find People to Follow
                  </button>
                </>
              )}
              {activeMainTab === 'suggestions' && (
                <>
                  <FaStar size={48} />
                  <p>No suggestions available</p>
                  <span>Complete your profile to get better suggestions</span>
                </>
              )}
              {activeMainTab === 'search' && searchQuery && (
                <>
                  <FaSearch size={48} />
                  <p>No users found matching "{searchQuery}"</p>
                  <span>Try different keywords or adjust your filters</span>
                </>
              )}
              {activeMainTab === 'search' && !searchQuery && (
                <>
                  <FaSearch size={48} />
                  <p>Search for users</p>
                  <span>Enter a name, username, or location to find people</span>
                </>
              )}
            </div>
          )}
        </div>
      </>
    );
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
            onClick={() => setIsCollapsed(false)}
            title="Expand panel"
          >
            <FaChevronRight />
          </button>
        </div>
        
        <div className={styles.collapsedIcons}>
          {['followers', 'following', 'suggestions', 'search', 'rooms'].map(tab => (
            <button 
              key={tab}
              className={`${styles.collapsedIcon} ${activeMainTab === tab ? styles.active : ''}`}
              onClick={() => { setActiveMainTab(tab); setIsCollapsed(false); }}
              title={tab.charAt(0).toUpperCase() + tab.slice(1)}
            >
              {tab === 'followers' && <FaUsers />}
              {tab === 'following' && <FaUserFriends />}
              {tab === 'suggestions' && <FaStar />}
              {tab === 'search' && <FaSearch />}
              {tab === 'rooms' && <FaComments />}
            </button>
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside 
      className={`${styles.navigationPanel} ${embedded ? styles.embedded : ''} ${isMobileOpen ? styles.mobileOpen : ''} ${darkMode ? styles.dark : styles.light}`}
      ref={panelRef}
    >
      {/* Close button for overlay mode */}
      {onClose && (
        <div className={styles.closeButtonContainer}>
          <button className={styles.closeButton} onClick={onClose} title="Close panel">
            <FaTimes />
          </button>
        </div>
      )}

      {/* Panel Header */}
      <div className={styles.navigationHeader}>
        <div className={styles.headerTitle}>
          <FaUserFriends className={styles.headerIcon} />
          <h3>Connect</h3>
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
            className={styles.collapseButton}
            onClick={handleToggleCollapse}
            title="Collapse panel"
          >
            <FaChevronLeft />
          </button>
        </div>
      </div>

      {/* Main Tabs */}
      <div className={styles.mainTabs}>
        <button
          className={`${styles.mainTab} ${activeMainTab === 'followers' ? styles.active : ''}`}
          onClick={() => setActiveMainTab('followers')}
        >
          <FaUsers /> Followers
        </button>
        <button
          className={`${styles.mainTab} ${activeMainTab === 'following' ? styles.active : ''}`}
          onClick={() => setActiveMainTab('following')}
        >
          <FaUserFriends /> Following
        </button>
        <button
          className={`${styles.mainTab} ${activeMainTab === 'suggestions' ? styles.active : ''}`}
          onClick={() => setActiveMainTab('suggestions')}
        >
          <FaStar /> Suggestions
        </button>
        <button
          className={`${styles.mainTab} ${activeMainTab === 'search' ? styles.active : ''}`}
          onClick={() => setActiveMainTab('search')}
        >
          <FaSearch /> Search
        </button>
        <button
          className={`${styles.mainTab} ${activeMainTab === 'rooms' ? styles.active : ''}`}
          onClick={() => setActiveMainTab('rooms')}
        >
          <FaComments /> Rooms
        </button>
      </div>

      {/* Search and Filters (only for search tab) */}
      {activeMainTab === 'search' && (
        <div className={styles.searchSection}>
          <div className={styles.searchContainer}>
            <FaSearch className={styles.searchIcon} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by name, username, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button className={styles.clearSearch} onClick={handleClearSearch}>
                <FaTimes />
              </button>
            )}
          </div>
          
          <button 
            className={`${styles.filterButton} ${showFilters ? styles.active : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter /> Advanced Filters
          </button>
          
          {showFilters && (
            <div className={styles.filterPanel}>
              {/* Location Filter */}
              <div className={styles.filterGroup}>
                <label><FaMapMarkerAlt /> Location</label>
                <input
                  type="text"
                  placeholder="Country or city..."
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className={styles.filterInput}
                />
              </div>
              
              {/* Trading Experience Filter */}
              <div className={styles.filterGroup}>
                <label><FaChartLine /> Trading Experience</label>
                <select
                  value={filters.tradingExperience}
                  onChange={(e) => handleFilterChange('tradingExperience', e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="">All Levels</option>
                  {tradingExperienceOptions.map(exp => (
                    <option key={exp} value={exp}>{exp.charAt(0).toUpperCase() + exp.slice(1)}</option>
                  ))}
                </select>
              </div>
              
              {/* Interests Filter */}
              <div className={styles.filterGroup}>
                <label><FaHeart /> Interests</label>
                <div className={styles.interestsGrid}>
                  {interestOptions.map(interest => (
                    <button
                      key={interest}
                      className={`${styles.interestOption} ${filters.interests.includes(interest) ? styles.active : ''}`}
                      onClick={() => toggleInterest(interest)}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Followers Count Filter */}
              <div className={styles.filterGroup}>
                <label><FaUsers /> Followers Count</label>
                <div className={styles.rangeInputs}>
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minFollowers}
                    onChange={(e) => handleFilterChange('minFollowers', e.target.value)}
                    className={styles.rangeInput}
                  />
                  <span>-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxFollowers}
                    onChange={(e) => handleFilterChange('maxFollowers', e.target.value)}
                    className={styles.rangeInput}
                  />
                </div>
              </div>
              
              {/* Sort By */}
              <div className={styles.filterGroup}>
                <label>Sort By</label>
                <div className={styles.sortOptions}>
                  {sortOptions.map(option => (
                    <button
                      key={option.value}
                      className={`${styles.sortOption} ${filters.sortBy === option.value ? styles.active : ''}`}
                      onClick={() => handleFilterChange('sortBy', option.value)}
                    >
                      <option.icon /> {option.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Reset Filters */}
              <button 
                className={styles.resetFiltersButton}
                onClick={() => {
                  setFilters({
                    location: '',
                    tradingExperience: '',
                    interests: [],
                    minFollowers: '',
                    maxFollowers: '',
                    sortBy: 'relevance'
                  });
                  setSearchQuery('');
                }}
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Content */}
      <div className={styles.contentArea}>
        {renderContent()}
      </div>

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