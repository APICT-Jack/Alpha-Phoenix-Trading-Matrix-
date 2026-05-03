// src/pages/AuthHomePage.jsx - Complete Final Version
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { userStatusService } from '../services/userStatusService';
import PostComponent from '../components/profile/PostComponent';
import ConnectionPanel from '../components/navigation/ConnectionPanel';
import * as Icons from 'react-icons/fa';
import './AuthHomePage.css';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
const API_BASE = `${API_URL}/api`;

const getAuthHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json'
});

const AuthHomePage = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { darkMode } = useTheme();

  // ============ STATE ============
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ posts: [], users: [], hashtags: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchTab, setSearchTab] = useState('all');

  const [feedPosts, setFeedPosts] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState(null);
  const [feedPage, setFeedPage] = useState(1);
  const [hasMoreFeed, setHasMoreFeed] = useState(true);
  const [feedRefreshing, setFeedRefreshing] = useState(false);

  const [trendingHashtags, setTrendingHashtags] = useState([]);
  const [trendingUsers, setTrendingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [chatRooms, setChatRooms] = useState([]);

  const [activeActivityTab, setActiveActivityTab] = useState('all');
  const [activities, setActivities] = useState({ all: [], trades: [], chats: [], updates: [] });
  const [activityLoading, setActivityLoading] = useState(false);

  const [activeFilters, setActiveFilters] = useState(['all']);
  const [showPeopleMenu, setShowPeopleMenu] = useState(false);
  const [showTraderMenu, setShowTraderMenu] = useState(false);
  const [peopleFilters, setPeopleFilters] = useState({
    traders: [], developers: false, students: false, friends: false
  });

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showMobileActivity, setShowMobileActivity] = useState(false);
  const [showConnectionPanel, setShowConnectionPanel] = useState(false);

  const [showWallpaperModal, setShowWallpaperModal] = useState(false);
  const [wallpaperSettings, setWallpaperSettings] = useState(() => {
    const saved = localStorage.getItem('wallpaper_settings');
    return saved ? JSON.parse(saved) : {
      url: 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?w=1920&h=1080&fit=crop',
      brightness: 0.5, blur: 0, opacity: 1
    };
  });
  const [activeWallpaperCategory, setActiveWallpaperCategory] = useState('all');

  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const peopleMenuRef = useRef(null);
  const traderMenuRef = useRef(null);
  const traderBtnRef = useRef(null);

  // ============ BOTTOM NAV ITEMS (Like Instagram) ============
  const bottomNavItems = useMemo(() => [
    { id: 'home', icon: 'FaHome', label: 'Home', action: () => { window.scrollTo({ top: 0, behavior: 'smooth' }); } },
    { id: 'search', icon: 'FaSearch', label: 'Search', action: () => { searchInputRef.current?.focus(); } },
    { id: 'create', icon: 'FaPlusSquare', label: 'Create', action: () => navigate('/create-post') },
    { id: 'activity', icon: 'FaHeart', label: 'Activity', action: () => setShowMobileActivity(true) },
    { id: 'profile', icon: 'FaUser', label: 'Profile', action: () => navigate(`/profile/${currentUser?.id}`) },
  ], [currentUser, navigate]);

  // ============ API FUNCTIONS ============
  const apiFetch = useCallback(async (endpoint, options = {}) => {
    const url = `${API_BASE}${endpoint}`;
    const config = { headers: getAuthHeaders(), ...options };
    const response = await fetch(url, config);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    return response.json();
  }, []);

  const fetchFeed = useCallback(async (page = 1, append = false) => {
    try {
      if (page === 1) setFeedLoading(true);
      else setFeedRefreshing(true);
      const params = new URLSearchParams({ page: page.toString(), limit: '10', sortBy: 'latest' });
      if (activeFilters.includes('videos')) params.append('mediaType', 'video');
      if (activeFilters.includes('charts')) params.append('mediaType', 'chart');
      const data = await apiFetch(`/posts/feed?${params.toString()}`);
      if (data.success) {
        const newPosts = data.posts || [];
        setFeedPosts(prev => append ? [...prev, ...newPosts] : newPosts);
        setHasMoreFeed(data.pagination?.hasMore || false);
        setFeedPage(page);
      }
    } catch (error) {
      console.error('Error fetching feed:', error);
      if (!append) setFeedError(error.message);
    } finally {
      setFeedLoading(false);
      setFeedRefreshing(false);
    }
  }, [apiFetch, activeFilters]);

  const performSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      if (searchPerformed) {
        setSearchPerformed(false);
        setSearchResults({ posts: [], users: [], hashtags: [] });
      }
      return;
    }
    setSearching(true);
    setSearchPerformed(true);
    setShowSuggestions(false);
    try {
      const [postsRes, usersRes] = await Promise.all([
        apiFetch(`/posts/feed?search=${encodeURIComponent(searchQuery.trim())}&limit=20`).catch(() => ({ success: true, posts: [] })),
        apiFetch(`/users/advanced-search?q=${encodeURIComponent(searchQuery.trim())}&limit=20`).catch(() => ({ success: true, users: [] }))
      ]);
      let hashtags = [];
      try {
        const hashtagRes = await apiFetch(`/posts/hashtags/${searchQuery.trim().replace('#', '')}`);
        if (hashtagRes.success) hashtags = hashtagRes.posts || [];
      } catch (error) {}
      setSearchResults({ posts: postsRes.posts || [], users: usersRes.users || [], hashtags });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  }, [searchQuery, searchPerformed, apiFetch]);

  const fetchTrending = useCallback(async () => {
    try {
      const [hashtagsRes, usersRes, chatRes] = await Promise.all([
        apiFetch('/posts/hashtags/trending').catch(() => ({ success: true, hashtags: [] })),
        apiFetch('/users/suggestions?limit=5').catch(() => ({ success: true, users: [] })),
        apiFetch('/chat/rooms').catch(() => ({ success: true, rooms: [] }))
      ]);
      if (hashtagsRes.success) setTrendingHashtags(hashtagsRes.hashtags || []);
      if (usersRes.success) setTrendingUsers(usersRes.users || []);
      if (chatRes.success) setChatRooms(chatRes.rooms || []);
    } catch (error) {
      console.error('Error fetching trending:', error);
    }
  }, [apiFetch]);

  const fetchSearchSuggestions = useCallback(async (query) => {
    if (query.length < 2) { setSearchSuggestions([]); setShowSuggestions(false); return; }
    try {
      const data = await apiFetch(`/users/search?q=${encodeURIComponent(query)}&limit=5`);
      if (data.success && data.users) {
        setSearchSuggestions(data.users.map(user => ({ ...user, resultType: 'user' })));
        setShowSuggestions(data.users.length > 0);
      }
    } catch (error) { setSearchSuggestions([]); setShowSuggestions(false); }
  }, [apiFetch]);

  const buildActivities = useCallback((posts, chats) => {
    const allActivities = [];
    
    // Post activities
    posts.slice(0, 10).forEach(post => {
      allActivities.push({
        id: `post-${post._id}`,
        type: 'post',
        user: post.userId?.name || 'User',
        userId: post.userId?._id || post.userId,
        action: 'posted',
        content: post.content?.substring(0, 60),
        time: post.createdAt,
        postId: post._id,
        likes: post.likes?.length || 0
      });
    });

    // Chat activities
    (chats || []).slice(0, 10).forEach(chat => {
      allActivities.push({
        id: `chat-${chat.id || chat._id}`,
        type: 'chat',
        user: chat.title || 'Chat Room',
        roomId: chat.id || chat._id,
        action: 'chat activity',
        content: chat.lastMessage || 'New messages',
        time: chat.lastActivity || chat.updatedAt,
        unread: chat.unreadCount > 0,
        memberCount: chat.memberCount || 0
      });
    });

    // Sort by time
    allActivities.sort((a, b) => new Date(b.time) - new Date(a.time));

    setActivities({
      all: allActivities,
      trades: posts.filter(p => p.media?.some(m => m.type === 'chart')).slice(0, 5).map(post => ({
        id: post._id,
        type: 'trade',
        user: post.userId?.name || 'Trader',
        userId: post.userId?._id,
        action: 'shared analysis',
        time: post.createdAt,
        postId: post._id
      })),
      chats: (chats || []).slice(0, 10).map(chat => ({
        id: chat.id || chat._id,
        type: 'chat',
        user: chat.title || 'Chat Room',
        roomId: chat.id || chat._id,
        action: 'new messages',
        content: chat.lastMessage || 'Tap to view',
        time: chat.lastActivity || chat.updatedAt,
        unread: chat.unreadCount > 0,
        memberCount: chat.memberCount || 0
      })),
      updates: trendingUsers.slice(0, 5).map(user => ({
        id: user.id || user._id,
        type: 'follow_suggestion',
        user: user.name,
        userId: user.id || user._id,
        action: 'suggested to follow',
        time: new Date().toISOString()
      }))
    });
  }, [trendingUsers]);

  // ============ EFFECTS ============
  useEffect(() => {
    fetchFeed(1, false);
    fetchTrending();
    if (currentUser && userStatusService) {
      userStatusService.init(currentUser, {
        onOnlineUsers: (users) => setOnlineUsers(users),
        onUserOnline: (data) => setOnlineUsers(prev => ({ ...prev, [data.userId]: { online: true, ...data.userData } })),
        onUserOffline: (data) => setOnlineUsers(prev => { const u = { ...prev }; delete u[data.userId]; return u; })
      });
    }
    return () => {
      if (userStatusService) {
        userStatusService.offUserOnline();
        userStatusService.offUserOffline();
        userStatusService.offUsersOnline();
      }
    };
  }, [currentUser]);

  useEffect(() => {
    if (feedPosts.length > 0 || chatRooms.length > 0) {
      buildActivities(feedPosts, chatRooms);
    }
  }, [feedPosts, chatRooms, buildActivities]);

  useEffect(() => {
    if (searchPerformed) return;
    const timer = setTimeout(() => fetchSearchSuggestions(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchPerformed, fetchSearchSuggestions]);

  useEffect(() => {
    if (!searchPerformed) fetchFeed(1, false);
  }, [activeFilters]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const root = document.querySelector('.auth-homepage');
    if (root) {
      root.style.setProperty('--wallpaper-url', `url(${wallpaperSettings.url})`);
      root.style.setProperty('--wallpaper-brightness', wallpaperSettings.brightness);
      root.style.setProperty('--wallpaper-blur', `${wallpaperSettings.blur}px`);
      root.style.setProperty('--wallpaper-opacity', wallpaperSettings.opacity);
    }
  }, []);

  useEffect(() => {
    const root = document.querySelector('.auth-homepage');
    if (root) {
      root.style.setProperty('--wallpaper-url', `url(${wallpaperSettings.url})`);
      root.style.setProperty('--wallpaper-brightness', wallpaperSettings.brightness);
      root.style.setProperty('--wallpaper-blur', `${wallpaperSettings.blur}px`);
      root.style.setProperty('--wallpaper-opacity', wallpaperSettings.opacity);
    }
  }, [wallpaperSettings]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target) && searchInputRef.current && !searchInputRef.current.contains(e.target)) setShowSuggestions(false);
      if (peopleMenuRef.current && !peopleMenuRef.current.contains(e.target) && !e.target.closest('.filter-chip.has-submenu')) setShowPeopleMenu(false);
      if (traderMenuRef.current && !traderMenuRef.current.contains(e.target) && traderBtnRef.current && !traderBtnRef.current.contains(e.target)) setShowTraderMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ============ HANDLERS ============
  const handleFilterClick = (filterId) => {
    if (filterId === 'all') setActiveFilters(['all']);
    else if (filterId === 'people') setShowPeopleMenu(!showPeopleMenu);
    else setActiveFilters(prev => {
      const newFilters = prev.filter(f => f !== 'all');
      if (newFilters.includes(filterId)) {
        const filtered = newFilters.filter(f => f !== filterId);
        return filtered.length === 0 ? ['all'] : filtered;
      }
      return [...newFilters, filterId];
    });
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults({ posts: [], users: [], hashtags: [] });
    setSearchPerformed(false);
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  };

  const handleLoadMore = () => {
    if (!hasMoreFeed || feedRefreshing) return;
    fetchFeed(feedPage + 1, true);
  };

  const handleFollowToggle = async (userId, currentStatus, e) => {
    if (e) e.stopPropagation();
    try {
      const endpoint = currentStatus ? '/follow/unfollow' : '/follow/follow';
      await apiFetch(`${endpoint}/${userId}`, { method: 'POST' });
      setTrendingUsers(prev => prev.map(u => (u.id || u._id) === userId ? { ...u, isFollowing: !currentStatus } : u));
      setSearchResults(prev => ({
        ...prev,
        users: prev.users.map(u => (u.id || u._id) === userId ? { ...u, isFollowing: !currentStatus } : u)
      }));
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const updateWallpaper = (key, value) => {
    setWallpaperSettings(prev => {
      const updated = { ...prev, [key]: value };
      const root = document.querySelector('.auth-homepage');
      if (root) {
        if (key === 'url') root.style.setProperty('--wallpaper-url', `url(${value})`);
        else if (key === 'brightness') root.style.setProperty('--wallpaper-brightness', value);
        else if (key === 'blur') root.style.setProperty('--wallpaper-blur', `${value}px`);
        else if (key === 'opacity') root.style.setProperty('--wallpaper-opacity', value);
      }
      localStorage.setItem('wallpaper_settings', JSON.stringify(updated));
      return updated;
    });
  };

  const handleWallpaperSelect = (wallpaper) => {
    updateWallpaper('url', wallpaper.url);
    setShowWallpaperModal(false);
  };

  const handleActivityClick = (activity) => {
    if (activity.postId) navigate(`/post/${activity.postId}`);
    else if (activity.roomId) navigate(`/chat/room/${activity.roomId}`);
    else if (activity.userId) navigate(`/profile/${activity.userId}`);
    setShowMobileActivity(false);
  };

  const getFilteredSearchResults = () => {
    let results = [];
    if (searchTab === 'all' || searchTab === 'posts') results = [...results, ...searchResults.posts.map(p => ({ ...p, resultType: 'post' }))];
    if (searchTab === 'all' || searchTab === 'people') results = [...results, ...searchResults.users.map(u => ({ ...u, resultType: 'user' }))];
    if (searchTab === 'all' || searchTab === 'hashtags') results = [...results, ...searchResults.hashtags.map(h => ({ ...h, resultType: 'hashtag' }))];
    return results;
  };

  // ============ RENDER HELPERS ============
  const renderIcon = (name, size = 16) => {
    const Icon = Icons[name];
    return Icon ? <Icon size={size} /> : null;
  };

  const formatTime = (time) => {
    if (!time) return '';
    const date = new Date(time);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d`;
    return date.toLocaleDateString();
  };

  // ============ RENDER SEARCH BAR ============
  const renderSearchBar = () => (
    <div className="search-section">
      <div className={`search-label ${searchPerformed && searchQuery.trim() ? 'hide-titles' : ''}`}>
        <h1>Alpha Phoenix Trading</h1>
        <p>Discover trading content and connect with traders</p>
      </div>
      <div className="search-wrapper">
        <div className="search-box">
          <div className="search-icon">{renderIcon('FaSearch', 16)}</div>
          <input
            ref={searchInputRef}
            type="text"
            className="search-input"
            placeholder="Search posts, users, or hashtags..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              if (searchPerformed && !e.target.value.trim()) setSearchPerformed(false);
            }}
            onKeyPress={e => { if (e.key === 'Enter') performSearch(); }}
          />
          {searchQuery && (
            <button className="clear-search" onClick={clearSearch}>{renderIcon('FaTimes', 12)}</button>
          )}
          <button className="search-button" onClick={performSearch} disabled={searching}>
            {searching ? <Icons.FaSpinner className="spinner-button" /> : 'Search'}
          </button>
        </div>
        {showSuggestions && searchSuggestions.length > 0 && (
          <div className="search-suggestions" ref={suggestionsRef}>
            {searchSuggestions.map((item, idx) => (
              <div key={item.id || item._id || idx} className="suggestion-item" onClick={() => {
                setShowSuggestions(false);
                navigate(`/profile/${item.id || item._id}`);
              }}>
                <div className="suggestion-avatar">{item.name?.charAt(0)?.toUpperCase() || 'U'}</div>
                <div className="suggestion-text">
                  <span className="suggestion-name">{item.name}</span>
                  <span className="suggestion-username">@{item.username}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ============ RENDER FILTER CHIPS ============
  const renderFilterChips = () => (
    <div className="filter-section">
      <div className="filter-chips">
        {[
          { id: 'all', label: 'All' },
          { id: 'videos', label: 'Videos' },
          { id: 'charts', label: 'Charts' },
          { id: 'academies', label: 'Academies' },
          { id: 'tools', label: 'Tools' },
          { id: 'people', label: 'People', hasSubmenu: true }
        ].map(filter => (
          <div key={filter.id} className="filter-chip-wrapper">
            <button
              className={`filter-chip ${activeFilters.includes(filter.id) ? 'active' : ''} ${filter.hasSubmenu ? 'has-submenu' : ''}`}
              onClick={() => handleFilterClick(filter.id)}
            >
              {filter.label}
              {filter.hasSubmenu && <span className="dropdown-arrow">▼</span>}
            </button>
            {filter.hasSubmenu && showPeopleMenu && (
              <div className="people-submenu" ref={peopleMenuRef}>
                <div className="submenu-section">
                  <button ref={traderBtnRef} className={`submenu-item ${peopleFilters.traders.length > 0 ? 'active' : ''}`} onClick={() => setShowTraderMenu(!showTraderMenu)}>
                    <span className="checkbox-indicator">▶</span> Traders
                  </button>
                  {showTraderMenu && (
                    <div className="nested-submenu" ref={traderMenuRef}>
                      {['beginner', 'intermediate', 'advanced', 'expert', 'mentor'].map(level => (
                        <button key={level} className={`nested-option ${peopleFilters.traders.includes(level) ? 'active' : ''}`}
                          onClick={() => setPeopleFilters(prev => ({
                            ...prev,
                            traders: prev.traders.includes(level) ? prev.traders.filter(s => s !== level) : [...prev.traders, level]
                          }))}>
                          {peopleFilters.traders.includes(level) ? '✓' : '○'} {level}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // ============ RENDER FEED ============
  const renderFeed = () => {
    if (searchPerformed && searchQuery.trim()) return null;

    return (
      <div className="feed-container">
        {feedLoading ? (
          <div className="loading-state">
            <Icons.FaSpinner className="spinner" />
            <p>Loading feed...</p>
          </div>
        ) : feedError ? (
          <div className="error-state">
            <Icons.FaExclamationTriangle size={32} />
            <p>{feedError}</p>
            <button onClick={() => fetchFeed(1, false)}>Retry</button>
          </div>
        ) : feedPosts.length > 0 ? (
          <div className="posts-list">
            {feedPosts.map(post => (
              <PostComponent
                key={post._id}
                post={post}
                currentUserId={currentUser?.id}
                onDelete={() => fetchFeed(1, false)}
                showActions={true}
                maxInitialComments={1}
                showMediaLightbox={true}
              />
            ))}
            {hasMoreFeed && (
              <div className="load-more-container">
                <button className="load-more-btn" onClick={handleLoadMore} disabled={feedRefreshing}>
                  {feedRefreshing ? <><Icons.FaSpinner className="spinner" /> Loading...</> : 'Load More'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="empty-state">
            <Icons.FaNewspaper size={48} />
            <h3>No posts yet</h3>
            <p>Follow traders to see their posts here</p>
          </div>
        )}
      </div>
    );
  };

  // ============ RENDER SEARCH RESULTS ============
  const renderSearchResults = () => {
    if (!searchPerformed || !searchQuery.trim()) return null;
    const filteredResults = getFilteredSearchResults();

    return (
      <div className="search-results-container">
        <div className="results-header">
          <h3>Results for "{searchQuery}"</h3>
          <button className="clear-results-btn" onClick={clearSearch}>
            {renderIcon('FaTimes', 12)} Clear
          </button>
        </div>
        <div className="search-tabs">
          {['all', 'posts', 'people'].map(tab => (
            <button key={tab} className={`search-tab ${searchTab === tab ? 'active' : ''}`} onClick={() => setSearchTab(tab)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        {searching ? (
          <div className="loading-state"><Icons.FaSpinner className="spinner" /><p>Searching...</p></div>
        ) : filteredResults.length > 0 ? (
          <div className="posts-list">
            {filteredResults.map((result, idx) => {
              if (result.resultType === 'user') {
                const userId = result.id || result._id;
                return (
                  <div key={userId || idx} className="result-card user-result" onClick={() => navigate(`/profile/${userId}`)}>
                    <div className="result-card-header">
                      <div className="person-avatar-large">{result.name?.charAt(0)?.toUpperCase() || 'U'}</div>
                      <div className="person-info">
                        <h4>{result.name}</h4>
                        <span className="person-username">@{result.username}</span>
                        <span className="person-stats">{result.followersCount || 0} followers</span>
                      </div>
                      {currentUser && userId !== currentUser.id && (
                        <button className={`follow-btn ${result.isFollowing ? 'following' : ''}`} onClick={(e) => handleFollowToggle(userId, result.isFollowing, e)}>
                          {result.isFollowing ? 'Following' : 'Follow'}
                        </button>
                      )}
                    </div>
                    {result.bio && <p className="person-bio">{result.bio}</p>}
                  </div>
                );
              }
              return <PostComponent key={result._id || idx} post={result} currentUserId={currentUser?.id} showActions={true} maxInitialComments={1} />;
            })}
          </div>
        ) : (
          <div className="no-results">
            <Icons.FaSearch size={48} />
            <h3>No results found</h3>
            <p>Try different keywords</p>
          </div>
        )}
      </div>
    );
  };

  // ============ RENDER MOBILE ACTIVITY PANEL ============
  const renderMobileActivity = () => (
    <>
      {showMobileActivity && <div className="mobile-overlay" onClick={() => setShowMobileActivity(false)} />}
      <div className={`mobile-activity-panel ${showMobileActivity ? 'open' : ''}`}>
        <div className="mobile-activity-handle" />
        <div className="mobile-activity-header">
          <h3>Activity</h3>
          <button onClick={() => setShowMobileActivity(false)}>{renderIcon('FaTimes', 18)}</button>
        </div>
        <div className="mobile-activity-tabs">
          {[
            { id: 'all', label: 'All', icon: 'FaGlobe' },
            { id: 'chats', label: 'Chats', icon: 'FaComments' },
            { id: 'trades', label: 'Trades', icon: 'FaChartLine' },
            { id: 'updates', label: 'Updates', icon: 'FaBell' }
          ].map(tab => (
            <button key={tab.id} className={`activity-tab ${activeActivityTab === tab.id ? 'active' : ''}`} onClick={() => setActiveActivityTab(tab.id)}>
              {renderIcon(tab.icon, 12)}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        <div className="mobile-activity-list">
          {activities[activeActivityTab]?.length > 0 ? (
            activities[activeActivityTab].map(activity => (
              <div key={activity.id} className="activity-item" onClick={() => handleActivityClick(activity)}>
                <div className={`activity-dot ${activity.type}`} />
                <div className="activity-content">
                  <div className="activity-title">
                    <span className="activity-user">{activity.user}</span>
                    <span className="activity-action">
                      {activity.type === 'chat' ? '💬' : activity.type === 'trade' ? '📊' : activity.type === 'post' ? '📝' : '👤'}
                      {' '}{activity.action || activity.content}
                    </span>
                  </div>
                  <div className="activity-meta">
                    <span className="activity-time">{formatTime(activity.time)}</span>
                    {activity.unread && <span className="unread-dot" />}
                    {activity.likes > 0 && <span className="activity-likes">❤️ {activity.likes}</span>}
                    {activity.memberCount > 0 && <span className="activity-members">👥 {activity.memberCount}</span>}
                  </div>
                </div>
                <div className="activity-arrow">{renderIcon('FaChevronRight', 10)}</div>
              </div>
            ))
          ) : (
            <div className="no-activity">
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </>
  );

  // ============ RENDER DESKTOP SIDEBAR ============
  const renderSidebar = () => {
    if (isMobile) return null;

    return (
      <aside className="sidebar-column">
        {/* Activity Panel */}
        <div className="activity-panel">
          <div className="panel-header">
            <h3>Recent Activity</h3>
          </div>
          <div className="activity-tabs">
            {[
              { id: 'all', label: 'All', icon: 'FaGlobe' },
              { id: 'chats', label: 'Chats', icon: 'FaComments' },
              { id: 'trades', label: 'Trades', icon: 'FaChartLine' }
            ].map(tab => (
              <button key={tab.id} className={`activity-tab ${activeActivityTab === tab.id ? 'active' : ''}`} onClick={() => setActiveActivityTab(tab.id)}>
                {renderIcon(tab.icon, 11)}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
          <div className="activity-list">
            {activities[activeActivityTab]?.slice(0, 8).map(activity => (
              <div key={activity.id} className="activity-item" onClick={() => handleActivityClick(activity)}>
                <div className={`activity-dot ${activity.type}`} />
                <div className="activity-content">
                  <div className="activity-title">
                    <span className="activity-user">{activity.user}</span>
                    <span className="activity-action">{activity.action || activity.content}</span>
                  </div>
                  <div className="activity-meta">
                    <span className="activity-time">{formatTime(activity.time)}</span>
                    {activity.unread && <span className="unread-badge">New</span>}
                  </div>
                </div>
              </div>
            ))}
            {(!activities[activeActivityTab] || activities[activeActivityTab].length === 0) && (
              <div className="no-activity"><p>No activity yet</p></div>
            )}
          </div>
        </div>

        {/* Trending Chat Rooms */}
        {chatRooms.length > 0 && (
          <div className="trending-panel">
            <div className="panel-header">
              <h3>Active Chat Rooms</h3>
            </div>
            <div className="chat-rooms-list">
              {chatRooms.slice(0, 5).map(room => (
                <div key={room.id || room._id} className="chat-room-item" onClick={() => navigate(`/chat/room/${room.id || room._id}`)}>
                  <div className="room-icon">
                    {room.type === 'private' ? renderIcon('FaLock', 10) : renderIcon('FaHashtag', 10)}
                  </div>
                  <div className="room-info">
                    <span className="room-name">{room.title}</span>
                    <span className="room-meta">
                      {room.onlineCount || 0} online · {room.memberCount || 0} members
                    </span>
                  </div>
                  {room.unreadCount > 0 && <span className="room-unread">{room.unreadCount}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Who to Follow */}
        {trendingUsers.length > 0 && (
          <div className="trending-panel">
            <div className="panel-header">
              <h3>Who to Follow</h3>
            </div>
            <div className="follow-list">
              {trendingUsers.slice(0, 5).map(user => {
                const userId = user.id || user._id;
                return (
                  <div key={userId} className="follow-item" onClick={() => navigate(`/profile/${userId}`)}>
                    <div className="follow-avatar">{user.name?.charAt(0)?.toUpperCase() || 'U'}</div>
                    <div className="follow-info">
                      <span className="follow-name">{user.name}</span>
                      <span className="follow-username">@{user.username}</span>
                    </div>
                    {currentUser && userId !== currentUser.id && (
                      <button className={`follow-sm-btn ${user.isFollowing ? 'following' : ''}`} onClick={(e) => handleFollowToggle(userId, user.isFollowing, e)}>
                        {user.isFollowing ? '✓' : '+'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </aside>
    );
  };

  // ============ MAIN RENDER ============
  return (
    <div className="auth-homepage">
      {/* Connection Panel Overlay */}
      {showConnectionPanel && (
        <div className="connection-panel-overlay" onClick={() => setShowConnectionPanel(false)}>
          <div className="connection-panel-wrapper" onClick={e => e.stopPropagation()}>
            <ConnectionPanel
              initialTab="followers"
              onClose={() => setShowConnectionPanel(false)}
              embedded={false}
            />
          </div>
        </div>
      )}

      {/* Wallpaper Button */}
      <div className="wallpaper-controls">
        <button className="wallpaper-btn" onClick={() => setShowWallpaperModal(true)} title="Change wallpaper">
          {renderIcon('FaImage', 14)}
        </button>
      </div>

      {/* Wallpaper Modal */}
      {showWallpaperModal && (
        <div className="wallpaper-modal" onClick={() => setShowWallpaperModal(false)}>
          <div className="wallpaper-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Choose Wallpaper</h3>
              <button className="close-modal" onClick={() => setShowWallpaperModal(false)}>{renderIcon('FaTimes', 16)}</button>
            </div>
            <div className="wallpaper-categories">
              {['all', 'nature', 'trading', 'city', 'abstract'].map(cat => (
                <button key={cat} className={`category-chip ${activeWallpaperCategory === cat ? 'active' : ''}`} onClick={() => setActiveWallpaperCategory(cat)}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
            <div className="wallpaper-grid">
              {[
                { id: 1, name: 'Ocean', url: 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?w=1920&h=1080&fit=crop', category: 'nature' },
                { id: 2, name: 'Mountain', url: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1920&h=1080&fit=crop', category: 'nature' },
                { id: 3, name: 'Forest', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&h=1080&fit=crop', category: 'nature' },
                { id: 4, name: 'Charts', url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1920&h=1080&fit=crop', category: 'trading' },
                { id: 5, name: 'Market', url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1920&h=1080&fit=crop', category: 'trading' },
                { id: 6, name: 'Crypto', url: 'https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=1920&h=1080&fit=crop', category: 'trading' },
                { id: 7, name: 'City Night', url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920&h=1080&fit=crop', category: 'city' },
                { id: 8, name: 'Tokyo', url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1920&h=1080&fit=crop', category: 'city' },
                { id: 9, name: 'Neon', url: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=1920&h=1080&fit=crop', category: 'abstract' },
                { id: 10, name: 'Digital', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1920&h=1080&fit=crop', category: 'abstract' },
              ].filter(w => activeWallpaperCategory === 'all' || w.category === activeWallpaperCategory).map(w => (
                <div key={w.id} className={`wallpaper-option ${wallpaperSettings.url === w.url ? 'selected' : ''}`} style={{ backgroundImage: `url(${w.url})` }} onClick={() => handleWallpaperSelect(w)}>
                  <span className="wallpaper-name">{w.name}</span>
                  {wallpaperSettings.url === w.url && <span className="wallpaper-check">✓</span>}
                </div>
              ))}
            </div>
            <div className="wallpaper-settings">
              <div className="setting">
                <label>Brightness</label>
                <input type="range" min="0.2" max="1" step="0.01" value={wallpaperSettings.brightness} onChange={e => updateWallpaper('brightness', parseFloat(e.target.value))} />
              </div>
              <div className="setting">
                <label>Blur</label>
                <input type="range" min="0" max="15" step="1" value={wallpaperSettings.blur} onChange={e => updateWallpaper('blur', parseInt(e.target.value))} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Header */}
      <header className="sticky-header">
        {renderSearchBar()}
        {!searchPerformed && renderFilterChips()}
      </header>

      {/* Main Content */}
      <div className="main-content-area">
        <div className="feed-column">
          {renderSearchResults()}
          {renderFeed()}
        </div>
        {renderSidebar()}
      </div>

      {/* Mobile Activity Panel */}
      {renderMobileActivity()}

      {/* Bottom Navigation - Instagram Style */}
      <nav className="bottom-nav">
        <div className="nav-items">
          {bottomNavItems.map(item => (
            <button
              key={item.id}
              className="nav-item"
              onClick={item.action}
            >
              <div className="nav-icon">{renderIcon(item.icon, 22)}</div>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default AuthHomePage;