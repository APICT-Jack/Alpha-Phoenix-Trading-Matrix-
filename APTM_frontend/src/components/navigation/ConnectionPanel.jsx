// ConnectionPanel.jsx - Upgraded with Fullscreen Center Modal + macOS/iOS Vibe
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { userStatusService } from '../../services/userStatusService';
import styles from './ConnectionPanel.module.css';

// Import icons
import {
  FaUserFriends, FaSearch, FaCircle, FaRegCircle,
  FaRegCommentDots, FaComments, FaUserPlus, FaUserCheck,
  FaUsers, FaHashtag, FaLock, FaChevronLeft,
  FaChevronRight, FaChevronDown, FaChevronUp, FaTimes,
  FaUser, FaSignInAlt, FaSignOutAlt, FaInfoCircle,
  FaPlus, FaFilter, FaStar, FaClock, FaFire,
  FaMapMarkerAlt, FaChartLine, FaHeart, FaSyncAlt,
  FaGlobe, FaRegTimesCircle, FaMicrophone
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
  const dimensions = { small: { width: 48, height: 48 }, medium: { width: 64, height: 64 } };
  const { width, height } = dimensions[size] || dimensions.small;
  return url.replace('/upload/', `/upload/w_${width},h_${height},c_fill,g_face,q_auto,f_auto/`);
};

const getAvatarInitial = (user) => {
  if (!user) return 'U';
  if (user.name) return user.name.charAt(0).toUpperCase();
  if (user.username) return user.username.charAt(0).toUpperCase();
  return 'U';
};

const ConnectionPanel = ({ 
  isOpen = false,           // Controls modal visibility
  onClose,                  // Close handler
  initialTab = 'followers',
  embedded = false          // If true, renders as inline sidebar (no modal)
}) => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { darkMode } = useTheme();

  // Modal animation state
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  
  // Panel states
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
  const [recentActivity, setRecentActivity] = useState([]);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [avatarErrors, setAvatarErrors] = useState({});
  
  const searchInputRef = useRef(null);
  const panelRef = useRef(null);

  // Modal enter/exit animation handling
  useEffect(() => {
    if (!embedded && isOpen) {
      setShouldRender(true);
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else if (!embedded && !isOpen && shouldRender) {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen, embedded, shouldRender]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!embedded && isOpen) {
      const handleEsc = (e) => {
        if (e.key === 'Escape' && onClose) {
          onClose();
        }
      };
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleEsc);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, embedded, onClose]);

  // ============ FETCH FOLLOWERS ============
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
        setFollowers(data.followers || []);
        setPagination(prev => ({
          ...prev,
          followers: { ...prev.followers, total: data.pagination?.total || 0 }
        }));
        
        // Update following status for followers
        const statusMap = {};
        (data.followers || []).forEach(user => {
          statusMap[user.id] = user.isFollowing || false;
        });
        setFollowingStatus(prev => ({ ...prev, ...statusMap }));
      }
    } catch (error) {
      console.error('Error fetching followers:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser, pagination.followers.page, pagination.followers.limit]);

  // ============ FETCH FOLLOWING ============
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
        setFollowing(data.following || []);
        setPagination(prev => ({
          ...prev,
          following: { ...prev.following, total: data.pagination?.total || 0 }
        }));
        
        // Update following status (they are all followed)
        const statusMap = {};
        (data.following || []).forEach(user => {
          statusMap[user.id] = true;
        });
        setFollowingStatus(prev => ({ ...prev, ...statusMap }));
      }
    } catch (error) {
      console.error('Error fetching following:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser, pagination.following.page, pagination.following.limit]);

  // ============ FETCH SUGGESTIONS ============
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
        setSuggestions(data.users || []);
        setPagination(prev => ({
          ...prev,
          suggestions: { ...prev.suggestions, total: data.pagination?.total || 0 }
        }));
        
        // Update following status for suggestions
        const statusMap = {};
        (data.users || []).forEach(user => {
          statusMap[user.id] = user.isFollowing || false;
        });
        setFollowingStatus(prev => ({ ...prev, ...statusMap }));
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser, pagination.suggestions.page, pagination.suggestions.limit]);

  // ============ ADVANCED SEARCH ============
  const performAdvancedSearch = useCallback(async () => {
    if (!searchQuery && !filters.location && !filters.tradingExperience && !filters.interests.length) {
      setSearchResults([]);
      return;
    }
    
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
      
      const response = await fetch(
        `${API_URL}/api/users/advanced-search?${params.toString()}`,
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users || []);
        setPagination(prev => ({
          ...prev,
          search: { ...prev.search, total: data.pagination?.total || 0 }
        }));
        
        // Update following status for search results
        const statusMap = {};
        (data.users || []).forEach(user => {
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

  // User status service setup
  useEffect(() => {
    if (!currentUser) return;
    
    userStatusService.init(currentUser, {
      onConnect: () => {
        setTimeout(() => userStatusService.getOnlineUsers(), 500);
      },
      onOnlineUsers: (users) => setOnlineUsers(users),
      onUserOnline: (data) => {
        setOnlineUsers(prev => ({ ...prev, [data.userId]: { online: true, userData: data.userData } }));
        addRecentActivity({ type: 'user-online', userId: data.userId, userName: data.userData?.name, timestamp: new Date().toISOString() });
      },
      onUserOffline: (data) => {
        setOnlineUsers(prev => {
          const newState = { ...prev };
          delete newState[data.userId];
          return newState;
        });
        addRecentActivity({ type: 'user-offline', userId: data.userId, timestamp: new Date().toISOString() });
      }
    });

    return () => {
      userStatusService.offUserOnline?.();
      userStatusService.offUserOffline?.();
    };
  }, [currentUser]);

  // Fetch chat rooms
  useEffect(() => {
    const fetchChatRooms = async () => {
      try {
        const response = await fetch(`${API_URL}/api/chat/rooms`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
          const data = await response.json();
          setChatRooms(data.rooms || []);
        } else {
          // Mock data for demo
          setChatRooms([
            { id: '1', title: '💬 Trading Lounge', description: 'General trading discussions', memberCount: 156, onlineCount: 23, type: 'public', isMember: false, tags: ['trading', 'stocks'] },
            { id: '2', title: '📈 Forex Daily', description: 'Forex market analysis', memberCount: 89, onlineCount: 12, type: 'public', isMember: true, tags: ['forex', 'currencies'] },
            { id: '3', title: '🪙 Crypto Hub', description: 'Bitcoin, Ethereum & altcoins', memberCount: 342, onlineCount: 67, type: 'public', isMember: false, tags: ['crypto', 'blockchain'] }
          ]);
        }
      } catch (error) {
        console.error('Error fetching rooms:', error);
      }
    };
    fetchChatRooms();
  }, []);

  // Initial data load based on active tab
  useEffect(() => {
    if (activeMainTab === 'followers') {
      fetchFollowers();
    } else if (activeMainTab === 'following') {
      fetchFollowing();
    } else if (activeMainTab === 'suggestions') {
      fetchSuggestions();
    }
  }, [activeMainTab, fetchFollowers, fetchFollowing, fetchSuggestions]);

  // Search when query or filters change
  useEffect(() => {
    if (activeMainTab === 'search') {
      const debounceTimer = setTimeout(() => {
        performAdvancedSearch();
      }, 500);
      return () => clearTimeout(debounceTimer);
    }
  }, [activeMainTab, searchQuery, filters, pagination.search.page, performAdvancedSearch]);

  // Handle load more
  const handleLoadMore = () => {
    setPagination(prev => ({
      ...prev,
      [activeMainTab]: { ...prev[activeMainTab], page: prev[activeMainTab].page + 1 }
    }));
  };

  // Handle follow/unfollow
  const handleFollowUser = async (userId, e) => {
    e.stopPropagation();
    try {
      const isCurrentlyFollowing = followingStatus[userId];
      const response = await fetch(`${API_URL}/api/friends/${isCurrentlyFollowing ? 'unfollow' : 'follow'}/${userId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        setFollowingStatus(prev => ({ ...prev, [userId]: !isCurrentlyFollowing }));
        
        // Update local data based on current tab
        if (activeMainTab === 'followers') {
          setFollowers(prev => prev.map(f => 
            f.id === userId ? { ...f, isFollowing: !isCurrentlyFollowing } : f
          ));
        } else if (activeMainTab === 'following') {
          if (isCurrentlyFollowing) {
            setFollowing(prev => prev.filter(f => f.id !== userId));
          }
        } else if (activeMainTab === 'suggestions') {
          setSuggestions(prev => prev.map(s => 
            s.id === userId ? { ...s, isFollowing: !isCurrentlyFollowing } : s
          ));
        } else if (activeMainTab === 'search') {
          setSearchResults(prev => prev.map(u => 
            u.id === userId ? { ...u, isFollowing: !isCurrentlyFollowing } : u
          ));
        }
        
        addRecentActivity({ 
          type: isCurrentlyFollowing ? 'unfollow' : 'follow', 
          userId, 
          timestamp: new Date().toISOString() 
        });
      }
    } catch (error) {
      console.error('Error updating follow:', error);
    }
  };

  // Handle join/leave room
  const handleJoinRoom = async (roomId, e) => {
    e.stopPropagation();
    const room = chatRooms.find(r => r.id === roomId);
    const isMember = room?.isMember;
    try {
      const response = await fetch(`${API_URL}/api/chat/rooms/${roomId}/${isMember ? 'leave' : 'join'}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        setChatRooms(prev => prev.map(r => r.id === roomId ? { ...r, isMember: !isMember, memberCount: isMember ? r.memberCount - 1 : r.memberCount + 1 } : r));
        addRecentActivity({ type: `room-${isMember ? 'leave' : 'join'}`, roomId, roomName: room?.title, timestamp: new Date().toISOString() });
      }
    } catch (error) {
      console.error('Error joining room:', error);
    }
  };

  const handleUserClick = (userId) => {
    navigate(`/profile/${userId}`);
    if (!embedded && onClose) onClose();
  };

  const handleChatRoomClick = (roomId) => {
    navigate(`/chat/room/${roomId}`);
    if (!embedded && onClose) onClose();
  };

  const handleMessageUser = (userId, e) => {
    e.stopPropagation();
    navigate(`/chat/${userId}`);
    if (!embedded && onClose) onClose();
  };

  const handleCreateRoom = () => {
    navigate('/chat/create-room');
    if (!embedded && onClose) onClose();
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  const handleAvatarError = (userId) => {
    setAvatarErrors(prev => ({ ...prev, [userId]: true }));
  };

  const addRecentActivity = (activity) => {
    setRecentActivity(prev => [activity, ...prev].slice(0, 8));
  };

  const refreshOnlineStatus = () => {
    setIsRefreshing(true);
    if (userStatusService.isConnected?.()) userStatusService.getOnlineUsers();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Format user for display
  const formatUserForDisplay = (user) => {
    const userId = user.id || user._id;
    const isOnline = onlineUsers[userId]?.online || false;
    let formattedAvatar = user.avatar && !avatarErrors[userId] ? formatAvatarUrl(user.avatar) : null;
    if (formattedAvatar && isCloudinaryUrl(formattedAvatar)) formattedAvatar = getOptimizedCloudinaryUrl(formattedAvatar, 'small');
    
    return {
      id: userId,
      name: user.name || user.displayName || 'Trader',
      username: user.username || `user${userId}`,
      avatar: formattedAvatar,
      avatarInitial: getAvatarInitial(user),
      hasAvatar: !!formattedAvatar && !avatarErrors[userId],
      online: isOnline,
      followersCount: user.followersCount || 0,
      isFollowing: followingStatus[userId] || user.isFollowing || false,
      tradingExperience: user.tradingExperience || 'beginner',
      country: user.country,
      interests: user.interests || []
    };
  };

  // Get current data based on active tab
  const getCurrentData = () => {
    switch(activeMainTab) {
      case 'followers': return followers;
      case 'following': return following;
      case 'suggestions': return suggestions;
      case 'search': return searchResults;
      default: return [];
    }
  };

  const getCurrentTotal = () => {
    return pagination[activeMainTab]?.total || 0;
  };

  const hasMoreData = () => {
    const currentPage = pagination[activeMainTab]?.page || 1;
    const limit = pagination[activeMainTab]?.limit || 20;
    const total = pagination[activeMainTab]?.total || 0;
    return currentPage * limit < total;
  };

  // Render user card
  const renderUserCard = (user) => {
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
            <img src={formattedUser.avatar} alt={formattedUser.name} onError={() => handleAvatarError(formattedUser.id)} loading="lazy" />
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
          </div>
          <span className={styles.userUsername}>@{formattedUser.username}</span>
          {formattedUser.country && (
            <div className={styles.userLocation}><FaMapMarkerAlt /> {formattedUser.country}</div>
          )}
          {formattedUser.tradingExperience && (
            <div className={`${styles.userLevel} ${formattedUser.tradingExperience}`}>
              <FaChartLine /> {formattedUser.tradingExperience}
            </div>
          )}
          <div className={styles.userStats}>
            <span className={styles.userStat}><FaUsers /> {formattedUser.followersCount} followers</span>
          </div>
        </div>
        <div className={styles.userActions}>
          {!isCurrentUser && (
            <>
              <button className={`${styles.actionButton} ${formattedUser.isFollowing ? styles.following : ''}`} onClick={(e) => handleFollowUser(formattedUser.id, e)}>
                {formattedUser.isFollowing ? <FaUserCheck /> : <FaUserPlus />}
              </button>
              <button className={styles.actionButton} onClick={(e) => handleMessageUser(formattedUser.id, e)}>
                <FaRegCommentDots />
              </button>
            </>
          )}
          {isCurrentUser && <span className={styles.youBadge}><FaUser /> You</span>}
        </div>
      </div>
    );
  };

  // Render content based on active tab
  const renderContent = () => {
    if (activeMainTab === 'rooms') {
      return (
        <div className={styles.chatRoomsSection}>
          <div className={styles.sectionHeader}>
            <span>🎙️ Active Rooms</span>
            <button className={styles.createRoomButton} onClick={handleCreateRoom}><FaPlus /> New Room</button>
          </div>
          <div className={styles.chatRoomsList}>
            {chatRooms.map(room => (
              <div key={room.id} className={styles.roomContainer}>
                <div className={`${styles.chatRoomItem} ${room.isMember ? styles.member : ''}`} onClick={() => handleChatRoomClick(room.id)}>
                  <div className={styles.roomIcon}>{room.type === 'private' ? <FaLock /> : <FaHashtag />}</div>
                  <div className={styles.roomInfo}>
                    <div className={styles.roomTitle}><strong>{room.title}</strong></div>
                    <span className={styles.roomMeta}><FaUsers /> {room.memberCount} members • {room.onlineCount || 0} online</span>
                  </div>
                  <div className={styles.roomActions}>
                    <button className={`${styles.joinButton} ${room.isMember ? styles.member : ''}`} onClick={(e) => handleJoinRoom(room.id, e)}>
                      {room.isMember ? <FaSignOutAlt /> : <FaSignInAlt />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    const currentData = getCurrentData();
    const currentTotal = getCurrentTotal();
    const isLoading = loading && currentData.length === 0;
    const hasMore = hasMoreData();
    
    return (
      <>
        <div className={styles.contentHeader}>
          <h4>
            {activeMainTab === 'followers' && `👥 Followers (${currentTotal})`}
            {activeMainTab === 'following' && `🤝 Following (${currentTotal})`}
            {activeMainTab === 'suggestions' && `✨ Suggestions (${currentTotal})`}
            {activeMainTab === 'search' && `🔍 Search Results (${currentTotal})`}
          </h4>
          {activeMainTab === 'suggestions' && (
            <button onClick={fetchSuggestions} className={styles.refreshButton}>
              <FaSyncAlt />
            </button>
          )}
        </div>
        <div className={styles.usersList}>
          {isLoading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <span>Loading...</span>
            </div>
          ) : currentData.length > 0 ? (
            <>
              {currentData.map(user => renderUserCard(user))}
              {hasMore && (
                <button 
                  className={styles.loadMoreButton}
                  onClick={handleLoadMore}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              )}
            </>
          ) : (
            <div className={styles.emptyState}>
              <FaUserFriends size={48} />
              <p>No users found</p>
              <span>Explore and connect with traders</span>
            </div>
          )}
        </div>
      </>
    );
  };

  // Main panel JSX (shared between modal and embedded)
  const panelContent = (
    <div className={`${styles.navigationPanel} ${darkMode ? styles.dark : styles.light} ${embedded ? styles.embedded : ''}`} ref={panelRef}>
      {/* Header with macOS-style close for modal */}
      <div className={styles.navigationHeader}>
        <div className={styles.headerTitle}>
          <h3>Connect</h3>
          <span className={styles.headerBadge}>Live</span>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.refreshButton} onClick={refreshOnlineStatus} disabled={isRefreshing}>
            <FaSyncAlt className={isRefreshing ? styles.spinning : ''} />
          </button>
          {!embedded && (
            <button className={styles.closeModalButton} onClick={onClose} title="Close (ESC)">
              <FaTimes />
            </button>
          )}
        </div>
      </div>

      {/* iOS-style segmented tabs */}
      <div className={styles.mainTabs}>
        {['followers', 'following', 'suggestions', 'search', 'rooms'].map(tab => (
          <button 
            key={tab} 
            className={`${styles.mainTab} ${activeMainTab === tab ? styles.active : ''}`} 
            onClick={() => {
              setActiveMainTab(tab);
              // Reset pagination when switching tabs
              setPagination(prev => ({
                ...prev,
                [tab]: { ...prev[tab], page: 1 }
              }));
            }}
          >
            {tab === 'followers' && <FaUsers />}
            {tab === 'following' && <FaUserFriends />}
            {tab === 'suggestions' && <FaStar />}
            {tab === 'search' && <FaSearch />}
            {tab === 'rooms' && <FaComments />}
            <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
          </button>
        ))}
      </div>

      {/* Search bar (for search tab) */}
      {activeMainTab === 'search' && (
        <div className={styles.searchSection}>
          <div className={styles.searchContainer}>
            <FaSearch className={styles.searchIcon} />
            <input 
              ref={searchInputRef} 
              type="text" 
              placeholder="Search by name, username..." 
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
            <FaFilter /> Filters
          </button>
          {showFilters && (
            <div className={styles.filterPanel}>
              <div className={styles.filterGroup}>
                <label><FaMapMarkerAlt /> Location</label>
                <input 
                  type="text" 
                  placeholder="City or country" 
                  value={filters.location} 
                  onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))} 
                  className={styles.filterInput} 
                />
              </div>
              <div className={styles.filterGroup}>
                <label><FaChartLine /> Experience</label>
                <select 
                  value={filters.tradingExperience} 
                  onChange={(e) => setFilters(prev => ({ ...prev, tradingExperience: e.target.value }))} 
                  className={styles.filterSelect}
                >
                  <option value="">All</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <button 
                className={styles.resetFiltersButton} 
                onClick={() => setFilters({ location: '', tradingExperience: '', interests: [], sortBy: 'relevance' })}
              >
                Reset
              </button>
            </div>
          )}
        </div>
      )}

      {/* Dynamic content area */}
      <div className={styles.contentArea}>{renderContent()}</div>

      {/* Recent activity (iOS-style status) */}
      {recentActivity.length > 0 && (
        <div className={styles.recentActivity}>
          <div className={styles.activityHeader}>
            <FaInfoCircle />
            <span>Recent Activity</span>
            <FaFire className={styles.activityIcon} />
          </div>
          <div className={styles.activityList}>
            {recentActivity.slice(0, 3).map((act, idx) => (
              <div key={idx} className={styles.activityItem}>
                {act.type === 'follow' && <FaUserPlus />}
                {act.type === 'room-join' && <FaSignInAlt />}
                {act.type === 'user-online' && <FaCircle className={styles.onlineIcon} />}
                <span className={styles.activityText}>
                  {act.type === 'follow' ? 'Followed a trader' : 
                   act.type === 'unfollow' ? 'Unfollowed a trader' :
                   act.type === 'room-join' ? `Joined ${act.roomName || 'a room'}` : 
                   `${act.userName || 'Someone'} came online`}
                </span>
                <span className={styles.activityTime}>
                  {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // If embedded mode, return directly
  if (embedded) return panelContent;

  // Modal mode with fullscreen center + scale animation
  if (!shouldRender) return null;

  return (
    <div className={`${styles.modalBackdrop} ${isVisible ? styles.open : ''}`} onClick={onClose}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        {panelContent}
      </div>
    </div>
  );
};

export default ConnectionPanel;