// src/components/navigation/ConnectionPanel.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useConnectionPanel } from '../../context/ConnectionPanelContext';
import { userStatusService } from '../../services/userStatusService';
import './ConnectionPanel.css'; // Independent CSS file

// Import icons
import {
  FaUserFriends, FaSearch, FaCircle, FaRegCircle,
  FaRegCommentDots, FaComments, FaUserPlus, FaUserCheck,
  FaUsers, FaHashtag, FaLock, FaChevronLeft,
  FaChevronRight, FaChevronDown, FaChevronUp, FaTimes,
  FaUser, FaSignInAlt, FaSignOutAlt, FaInfoCircle,
  FaPlus, FaFilter, FaStar, FaClock, FaFire,
  FaMapMarkerAlt, FaChartLine, FaHeart, FaSyncAlt,
  FaGlobe
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
  isOpen = false,
  onClose,
  initialTab = 'followers',
  embedded = false
}) => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { darkMode } = useTheme();

  // Modal animation state
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
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
  
  // UI states
  const [expandedRooms, setExpandedRooms] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [avatarErrors, setAvatarErrors] = useState({});
  
  const searchInputRef = useRef(null);
  const panelRef = useRef(null);

  // Update active tab when initialTab prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveMainTab(initialTab);
    }
  }, [initialTab]);

  // Modal enter/exit animation handling
  useEffect(() => {
    if (!embedded && isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      // Small delay to trigger enter animation
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else if (!embedded && !isOpen && shouldRender) {
      setIsVisible(false);
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, 300);
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

  // User status service setup
  useEffect(() => {
    if (!currentUser) return;
    
    if (userStatusService.init) {
      userStatusService.init(currentUser, {
        onConnect: () => {
          setTimeout(() => userStatusService.getOnlineUsers?.(), 500);
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
    }

    return () => {
      if (userStatusService.offUserOnline) userStatusService.offUserOnline();
      if (userStatusService.offUserOffline) userStatusService.offUserOffline();
    };
  }, [currentUser]);

  // Fetch followers
  const fetchFollowers = useCallback(async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/users/followers/${currentUser.id}?limit=50`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFollowers(data.followers || []);
      }
    } catch (error) {
      console.error('Error fetching followers:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Fetch following
  const fetchFollowing = useCallback(async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/users/following/${currentUser.id}?limit=50`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFollowing(data.following || []);
        
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
  }, [currentUser]);

  // Fetch suggestions
  const fetchSuggestions = useCallback(async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/users/suggestions?limit=20`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Fetch chat rooms
  const fetchChatRooms = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/chat/rooms`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setChatRooms(data.rooms || []);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  }, []);

  useEffect(() => {
    fetchChatRooms();
  }, [fetchChatRooms]);

  // Initial data load based on active tab
  useEffect(() => {
    if (activeMainTab === 'followers') fetchFollowers();
    else if (activeMainTab === 'following') fetchFollowing();
    else if (activeMainTab === 'suggestions') fetchSuggestions();
  }, [activeMainTab, fetchFollowers, fetchFollowing, fetchSuggestions]);

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
        
        if (activeMainTab === 'followers') {
          setFollowers(prev => prev.map(f => f.id === userId ? { ...f, isFollowing: !isCurrentlyFollowing } : f));
        } else if (activeMainTab === 'following') {
          setFollowing(prev => prev.filter(f => f.id !== userId));
        } else if (activeMainTab === 'suggestions') {
          setSuggestions(prev => prev.map(s => s.id === userId ? { ...s, isFollowing: !isCurrentlyFollowing } : s));
        }
        
        addRecentActivity({ type: isCurrentlyFollowing ? 'unfollow' : 'follow', userId, timestamp: new Date().toISOString() });
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
    if (userStatusService.isConnected?.()) userStatusService.getOnlineUsers?.();
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

  // Render user card
  const renderUserCard = (user) => {
    const formattedUser = formatUserForDisplay(user);
    const isCurrentUser = currentUser?.id === formattedUser.id;
    
    return (
      <div
        key={formattedUser.id}
        className={`connection-panel-user-item ${formattedUser.online ? 'online' : ''} ${hoveredItem === formattedUser.id ? 'hovered' : ''}`}
        onClick={() => handleUserClick(formattedUser.id)}
        onMouseEnter={() => setHoveredItem(formattedUser.id)}
        onMouseLeave={() => setHoveredItem(null)}
      >
        <div className="connection-panel-user-avatar">
          {formattedUser.hasAvatar ? (
            <img src={formattedUser.avatar} alt={formattedUser.name} onError={() => handleAvatarError(formattedUser.id)} loading="lazy" />
          ) : (
            <span className="avatar-initial">{formattedUser.avatarInitial}</span>
          )}
          <div className={`online-indicator ${formattedUser.online ? 'online' : 'offline'}`}>
            {formattedUser.online ? <FaCircle /> : <FaRegCircle />}
          </div>
        </div>
        <div className="connection-panel-user-info">
          <div className="user-name">
            <strong>{formattedUser.name}</strong>
          </div>
          <span className="user-username">@{formattedUser.username}</span>
          {formattedUser.country && (
            <div className="user-location"><FaMapMarkerAlt /> {formattedUser.country}</div>
          )}
          {formattedUser.tradingExperience && (
            <div className={`user-level ${formattedUser.tradingExperience}`}>
              <FaChartLine /> {formattedUser.tradingExperience}
            </div>
          )}
          <div className="user-stats">
            <span className="user-stat"><FaUsers /> {formattedUser.followersCount} followers</span>
          </div>
        </div>
        <div className="connection-panel-user-actions">
          {!isCurrentUser && (
            <>
              <button className={`action-button follow-button ${formattedUser.isFollowing ? 'following' : ''}`} onClick={(e) => handleFollowUser(formattedUser.id, e)}>
                {formattedUser.isFollowing ? <FaUserCheck /> : <FaUserPlus />}
              </button>
              <button className="action-button message-button" onClick={(e) => handleMessageUser(formattedUser.id, e)}>
                <FaRegCommentDots />
              </button>
            </>
          )}
          {isCurrentUser && <span className="you-badge"><FaUser /> You</span>}
        </div>
      </div>
    );
  };

  // Render chat rooms
  const renderChatRooms = () => {
    return (
      <div className="connection-panel-chat-rooms-section">
        <div className="section-header">
          <span>🎙️ Active Rooms</span>
          <button className="create-room-button" onClick={handleCreateRoom}><FaPlus /> New Room</button>
        </div>
        <div className="chat-rooms-list">
          {chatRooms.map(room => (
            <div key={room.id} className="room-container">
              <div className={`chat-room-item ${room.isMember ? 'member' : ''}`} onClick={() => handleChatRoomClick(room.id)}>
                <div className="room-icon">{room.type === 'private' ? <FaLock /> : <FaHashtag />}</div>
                <div className="room-info">
                  <div className="room-title"><strong>{room.title}</strong></div>
                  <span className="room-meta"><FaUsers /> {room.memberCount} members • {room.onlineCount || 0} online</span>
                </div>
                <div className="room-actions">
                  <button className={`join-button ${room.isMember ? 'member' : ''}`} onClick={(e) => handleJoinRoom(room.id, e)}>
                    {room.isMember ? <FaSignOutAlt /> : <FaSignInAlt />}
                  </button>
                </div>
              </div>
            </div>
          ))}
          {chatRooms.length === 0 && (
            <div className="empty-state">
              <FaComments size={48} />
              <p>No chat rooms available</p>
              <button className="create-first-room" onClick={handleCreateRoom}>Create your first room</button>
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
    
    const tabsData = { followers, following, suggestions, search: searchResults };
    const currentData = tabsData[activeMainTab] || [];
    
    return (
      <>
        <div className="content-header">
          <h4>
            {activeMainTab === 'followers' && `👥 Followers (${followers.length})`}
            {activeMainTab === 'following' && `🤝 Following (${following.length})`}
            {activeMainTab === 'suggestions' && `✨ Suggestions (${suggestions.length})`}
            {activeMainTab === 'search' && `🔍 Search Results (${searchResults.length})`}
          </h4>
          {activeMainTab === 'suggestions' && (
            <button onClick={fetchSuggestions} className="refresh-button"><FaSyncAlt /></button>
          )}
        </div>
        <div className="users-list">
          {loading && currentData.length === 0 ? (
            <div className="loading-state"><div className="spinner"></div><span>Loading...</span></div>
          ) : currentData.length > 0 ? (
            currentData.map(user => renderUserCard(user))
          ) : (
            <div className="empty-state">
              <FaUserFriends size={48} />
              <p>No users found</p>
              <span>Explore and connect with traders</span>
            </div>
          )}
        </div>
      </>
    );
  };

  // If embedded mode, return directly
  if (embedded) {
    return (
      <div className={`connection-panel-embedded ${darkMode ? 'dark' : 'light'}`}>
        {panelContent}
      </div>
    );
  }

  // Modal mode with fullscreen center + scale animation
  if (!shouldRender) return null;

  return (
    <div 
      className={`connection-panel-modal-overlay ${isVisible ? 'visible' : ''} ${isClosing ? 'closing' : ''}`} 
      onClick={onClose}
    >
      <div 
        className={`connection-panel-modal-container ${isVisible ? 'visible' : ''} ${isClosing ? 'closing' : ''} ${darkMode ? 'dark' : 'light'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button className="connection-panel-close-button" onClick={onClose}>
          <FaTimes />
        </button>

        {/* Header */}
        <div className="connection-panel-header">
          <div className="header-title">
            <h3>Connect</h3>
            <span className="header-badge">Live</span>
          </div>
          <button className="header-refresh-button" onClick={refreshOnlineStatus} disabled={isRefreshing}>
            <FaSyncAlt className={isRefreshing ? 'spinning' : ''} />
          </button>
        </div>

        {/* Tabs */}
        <div className="connection-panel-tabs">
          {['followers', 'following', 'suggestions', 'search', 'rooms'].map(tab => (
            <button 
              key={tab} 
              className={`connection-panel-tab ${activeMainTab === tab ? 'active' : ''}`} 
              onClick={() => setActiveMainTab(tab)}
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

        {/* Search Section */}
        {activeMainTab === 'search' && (
          <div className="connection-panel-search-section">
            <div className="search-container">
              <FaSearch className="search-icon" />
              <input 
                ref={searchInputRef} 
                type="text" 
                placeholder="Search by name, username..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="search-input" 
              />
              {searchQuery && (
                <button className="clear-search" onClick={handleClearSearch}>
                  <FaTimes />
                </button>
              )}
            </div>
            <button 
              className={`filter-button ${showFilters ? 'active' : ''}`} 
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter /> Filters
            </button>
            {showFilters && (
              <div className="filter-panel">
                <div className="filter-group">
                  <label><FaMapMarkerAlt /> Location</label>
                  <input 
                    type="text" 
                    placeholder="City or country" 
                    value={filters.location} 
                    onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))} 
                    className="filter-input" 
                  />
                </div>
                <div className="filter-group">
                  <label><FaChartLine /> Experience</label>
                  <select 
                    value={filters.tradingExperience} 
                    onChange={(e) => setFilters(prev => ({ ...prev, tradingExperience: e.target.value }))} 
                    className="filter-select"
                  >
                    <option value="">All</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
                <button 
                  className="reset-filters-button" 
                  onClick={() => setFilters({ location: '', tradingExperience: '', interests: [], sortBy: 'relevance' })}
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Content Area */}
        <div className="connection-panel-content">
          {renderContent()}
        </div>

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <div className="connection-panel-activity">
            <div className="activity-header">
              <FaInfoCircle />
              <span>Recent Activity</span>
              <FaFire className="activity-icon" />
            </div>
            <div className="activity-list">
              {recentActivity.slice(0, 3).map((act, idx) => (
                <div key={idx} className="activity-item">
                  {act.type === 'follow' && <FaUserPlus />}
                  {act.type === 'room-join' && <FaSignInAlt />}
                  {act.type === 'user-online' && <FaCircle className="online-icon" />}
                  <span className="activity-text">
                    {act.type === 'follow' ? 'Followed a trader' : 
                     act.type === 'room-join' ? `Joined ${act.roomName || 'a room'}` : 
                     `${act.userName || 'Someone'} came online`}
                  </span>
                  <span className="activity-time">
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectionPanel;