// src/pages/AuthHomePage.jsx - Complete Rebuild with Mobile-First Layout
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  
  const [activeActivityTab, setActiveActivityTab] = useState('news');
  const [activities, setActivities] = useState({ news: [], trades: [], chats: [], updates: [] });
  const [activityLoading, setActivityLoading] = useState(false);
  
  const [activeFilters, setActiveFilters] = useState(['all']);
  const [showPeopleMenu, setShowPeopleMenu] = useState(false);
  const [showTraderMenu, setShowTraderMenu] = useState(false);
  const [peopleFilters, setPeopleFilters] = useState({
    traders: [], developers: false, students: false, friends: false
  });
  
  // Mobile UI State
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth <= 1024);
  const [showMobileActivity, setShowMobileActivity] = useState(false);
  const [showConnectionPanel, setShowConnectionPanel] = useState(false);
  const [activeBottomNav, setActiveBottomNav] = useState('home');
  
  // Wallpaper State
  const [showWallpaperModal, setShowWallpaperModal] = useState(false);
  const [wallpaperSettings, setWallpaperSettings] = useState(() => {
    const saved = localStorage.getItem('wallpaper_settings');
    return saved ? JSON.parse(saved) : {
      url: 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?w=1920&h=1080&fit=crop',
      brightness: 0.5, blur: 0, opacity: 1
    };
  });
  const [activeWallpaperCategory, setActiveWallpaperCategory] = useState('all');
  
  // Refs
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const peopleMenuRef = useRef(null);
  const traderMenuRef = useRef(null);
  const traderBtnRef = useRef(null);
  const pageRef = useRef(null);

  // ============ BOTTOM NAV ITEMS ============
  const bottomNavItems = useMemo(() => [
    { id: 'home', label: 'Home', icon: 'FaHome', path: '/' },
    { id: 'search', label: 'Search', icon: 'FaSearch', action: () => { searchInputRef.current?.focus(); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
    { id: 'activity', label: 'Activity', icon: 'FaBell', action: () => setShowMobileActivity(!showMobileActivity) },
    { id: 'connect', label: 'Connect', icon: 'FaUsers', action: () => setShowConnectionPanel(true) },
    { id: 'profile', label: 'Profile', icon: 'FaUser', path: `/profile/${currentUser?.id}` },
  ], [currentUser, showMobileActivity]);

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

  // Fetch feed
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
        if (append) {
          setFeedPosts(prev => [...prev, ...newPosts]);
        } else {
          setFeedPosts(newPosts);
        }
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

  // Perform search
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

      setSearchResults({
        posts: postsRes.posts || [],
        users: usersRes.users || [],
        hashtags: hashtags
      });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  }, [searchQuery, searchPerformed, apiFetch]);

  // Fetch trending
  const fetchTrending = useCallback(async () => {
    try {
      const [hashtagsRes, usersRes] = await Promise.all([
        apiFetch('/posts/hashtags/trending').catch(() => ({ success: true, hashtags: [] })),
        apiFetch('/users/suggestions?limit=5').catch(() => ({ success: true, users: [] }))
      ]);
      if (hashtagsRes.success) setTrendingHashtags(hashtagsRes.hashtags || []);
      if (usersRes.success) setTrendingUsers(usersRes.users || []);
    } catch (error) {
      console.error('Error fetching trending:', error);
    }
  }, [apiFetch]);

  // Fetch search suggestions
  const fetchSearchSuggestions = useCallback(async (query) => {
    if (query.length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const data = await apiFetch(`/users/search?q=${encodeURIComponent(query)}&limit=5`);
      if (data.success && data.users) {
        setSearchSuggestions(data.users.map(user => ({ ...user, resultType: 'user' })));
        setShowSuggestions(data.users.length > 0);
      }
    } catch (error) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  }, [apiFetch]);

  // Build activities from feed
  const buildActivities = useCallback((posts) => {
    setActivities({
      news: posts.slice(0, 10).map(post => ({
        id: post._id,
        type: 'post',
        title: post.content?.substring(0, 80) || 'New post',
        time: post.createdAt,
        user: post.userId?.name || 'User',
        postId: post._id,
        likes: post.likes?.length || 0,
        comments: post.comments?.length || 0
      })),
      trades: posts
        .filter(post => post.media?.some(m => m.type === 'chart'))
        .slice(0, 5)
        .map(post => ({
          id: post._id,
          type: 'trade',
          user: post.userId?.name || 'Trader',
          action: 'shared analysis',
          time: post.createdAt,
          postId: post._id
        })),
      chats: trendingUsers.slice(0, 5).map((user, i) => ({
        id: user.id || user._id || i,
        type: 'chat',
        user: user.name,
        message: 'Recent activity',
        time: new Date().toISOString(),
        userId: user.id || user._id
      })),
      updates: trendingUsers.slice(0, 5).map(user => ({
        id: user.id || user._id,
        type: 'follow_suggestion',
        user: user.name,
        action: 'suggested to follow',
        time: new Date().toISOString(),
        userId: user.id || user._id
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
        onUserOffline: (data) => setOnlineUsers(prev => { const updated = { ...prev }; delete updated[data.userId]; return updated; })
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

  // Build activities when feed posts change
  useEffect(() => {
    if (feedPosts.length > 0) buildActivities(feedPosts);
  }, [feedPosts, buildActivities]);

  // Debounced suggestions
  useEffect(() => {
    if (searchPerformed) return;
    const timer = setTimeout(() => fetchSearchSuggestions(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchPerformed, fetchSearchSuggestions]);

  // Refresh feed when filters change
  useEffect(() => {
    if (!searchPerformed) fetchFeed(1, false);
  }, [activeFilters]);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsTablet(window.innerWidth <= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Apply wallpaper
  useEffect(() => {
    const root = document.querySelector('.auth-homepage');
    if (root) {
      root.style.setProperty('--auth-wallpaper-url', `url(${wallpaperSettings.url})`);
      root.style.setProperty('--auth-wallpaper-brightness', wallpaperSettings.brightness);
      root.style.setProperty('--auth-wallpaper-blur', `${wallpaperSettings.blur}px`);
      root.style.setProperty('--auth-wallpaper-opacity', wallpaperSettings.opacity);
    }
  }, [wallpaperSettings]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target) &&
          searchInputRef.current && !searchInputRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
      if (peopleMenuRef.current && !peopleMenuRef.current.contains(e.target) &&
          !e.target.closest('.filter-chip.has-submenu')) {
        setShowPeopleMenu(false);
      }
      if (traderMenuRef.current && !traderMenuRef.current.contains(e.target) &&
          traderBtnRef.current && !traderBtnRef.current.contains(e.target)) {
        setShowTraderMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ============ HANDLERS ============
  const handleFilterClick = (filterId) => {
    if (filterId === 'all') {
      setActiveFilters(['all']);
    } else if (filterId === 'people') {
      setShowPeopleMenu(!showPeopleMenu);
    } else {
      setActiveFilters(prev => {
        const newFilters = prev.filter(f => f !== 'all');
        if (newFilters.includes(filterId)) {
          const filtered = newFilters.filter(f => f !== filterId);
          return filtered.length === 0 ? ['all'] : filtered;
        }
        return [...newFilters, filterId];
      });
    }
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

  const handleFollowToggle = async (userId, currentStatus) => {
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
      localStorage.setItem('wallpaper_settings', JSON.stringify(updated));
      return updated;
    });
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
            <button className="clear-search" onClick={clearSearch}>
              {renderIcon('FaTimes', 12)}
            </button>
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

  const renderFilterChips = () => (
    <div className="filter-section">
      <div className="filter-chips">
        {['all', 'videos', 'charts', 'academies', 'tools', 'people'].map(filterId => (
          <div key={filterId} className="filter-chip-wrapper">
            <button
              className={`filter-chip ${activeFilters.includes(filterId) ? 'active' : ''} ${filterId === 'people' ? 'has-submenu' : ''}`}
              onClick={() => handleFilterClick(filterId)}
            >
              {filterId === 'all' ? 'All' : filterId === 'people' ? 'People' : filterId.charAt(0).toUpperCase() + filterId.slice(1)}
              {filterId === 'people' && <span className="dropdown-arrow">▼</span>}
            </button>
            {filterId === 'people' && showPeopleMenu && (
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
                maxInitialComments={isMobile ? 1 : 2}
                showMediaLightbox={true}
                allowEditing={true}
                allowDeletion={true}
                allowReporting={true}
                allowSaving={true}
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
          {[{ id: 'all', label: 'All' }, { id: 'posts', label: 'Posts' }, { id: 'people', label: 'People' }].map(tab => (
            <button key={tab.id} className={`search-tab ${searchTab === tab.id ? 'active' : ''}`} onClick={() => setSearchTab(tab.id)}>
              {tab.label}
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
                        <button className={`follow-btn ${result.isFollowing ? 'following' : ''}`} onClick={e => { e.stopPropagation(); handleFollowToggle(userId, result.isFollowing); }}>
                          {result.isFollowing ? 'Following' : 'Follow'}
                        </button>
                      )}
                    </div>
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

  // Mobile Activity Panel (slides up from bottom)
  const renderMobileActivity = () => (
    <div className={`mobile-activity-panel ${showMobileActivity ? 'open' : ''}`}>
      <div className="mobile-activity-header">
        <h3>Recent Activity</h3>
        <button onClick={() => setShowMobileActivity(false)}>{renderIcon('FaTimes', 18)}</button>
      </div>
      <div className="mobile-activity-tabs">
        {['news', 'trades', 'updates'].map(tab => (
          <button key={tab} className={`activity-tab ${activeActivityTab === tab ? 'active' : ''}`} onClick={() => setActiveActivityTab(tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
      <div className="mobile-activity-list">
        {activities[activeActivityTab]?.map(activity => (
          <div key={activity.id} className="activity-item" onClick={() => activity.postId && navigate(`/post/${activity.postId}`)}>
            <div className="activity-content">
              <div className="activity-title">
                <span className="activity-user">{activity.user}</span>
                <span className="activity-action">{activity.action || activity.title}</span>
              </div>
              <div className="activity-time">{activity.time ? new Date(activity.time).toLocaleTimeString() : ''}</div>
            </div>
          </div>
        ))}
        {(!activities[activeActivityTab] || activities[activeActivityTab].length === 0) && (
          <p className="no-activity">No recent activity</p>
        )}
      </div>
    </div>
  );

  // Desktop sidebar
  const renderSidebar = () => {
    if (isMobile) return null;
    
    return (
      <aside className="sidebar-column">
        <div className="activity-panel">
          <div className="activity-tabs">
            {['news', 'trades', 'updates'].map(tab => (
              <button key={tab} className={`activity-tab ${activeActivityTab === tab ? 'active' : ''}`} onClick={() => setActiveActivityTab(tab)}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <div className="activity-list">
            {activities[activeActivityTab]?.map(activity => (
              <div key={activity.id} className="activity-item" onClick={() => activity.postId && navigate(`/post/${activity.postId}`)}>
                <div className="activity-icon news-icon">{renderIcon('FaNewspaper', 12)}</div>
                <div className="activity-content">
                  <div className="activity-title">
                    <span className="activity-user">{activity.user}</span>
                    <span className="activity-action">{activity.action || activity.title}</span>
                  </div>
                  <div className="activity-time">{activity.time ? new Date(activity.time).toLocaleTimeString() : ''}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    );
  };

  // ============ MAIN RENDER ============
  return (
    <div className="auth-homepage" ref={pageRef}>
      {/* Connection Panel Overlay */}
      {showConnectionPanel && (
        <div className="connection-panel-overlay" onClick={() => setShowConnectionPanel(false)}>
          <div onClick={e => e.stopPropagation()} style={{ height: '100%', maxWidth: '400px', marginLeft: 'auto' }}>
            <ConnectionPanel initialTab="followers" onClose={() => setShowConnectionPanel(false)} embedded={false} />
          </div>
        </div>
      )}

      {/* Wallpaper Controls */}
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
                { id: 3, name: 'Candles', url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1920&h=1080&fit=crop', category: 'trading' },
                { id: 4, name: 'Market', url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1920&h=1080&fit=crop', category: 'trading' },
                { id: 5, name: 'City Night', url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920&h=1080&fit=crop', category: 'city' },
                { id: 6, name: 'Neon', url: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=1920&h=1080&fit=crop', category: 'abstract' },
              ].filter(w => activeWallpaperCategory === 'all' || w.category === activeWallpaperCategory).map(w => (
                <div key={w.id} className={`wallpaper-option ${wallpaperSettings.url === w.url ? 'selected' : ''}`}
                  style={{ backgroundImage: `url(${w.url})` }}
                  onClick={() => { updateWallpaper('url', w.url); setShowWallpaperModal(false); }}>
                  <span className="wallpaper-name">{w.name}</span>
                </div>
              ))}
            </div>
            <div className="wallpaper-settings">
              <div className="setting">
                <label>Brightness</label>
                <input type="range" min="0.3" max="1" step="0.01" value={wallpaperSettings.brightness} onChange={e => updateWallpaper('brightness', parseFloat(e.target.value))} />
              </div>
              <div className="setting">
                <label>Blur</label>
                <input type="range" min="0" max="20" step="1" value={wallpaperSettings.blur} onChange={e => updateWallpaper('blur', parseInt(e.target.value))} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Header Area */}
      <header className="sticky-header">
        {renderSearchBar()}
        {renderFilterChips()}
      </header>

      {/* Main Content Area */}
      <div className="main-content-area">
        <div className="feed-column">
          {renderSearchResults()}
          {renderFeed()}
        </div>
        {renderSidebar()}
      </div>

      {/* Mobile Activity Panel */}
      {renderMobileActivity()}

      {/* Bottom Navigation Bar - Fixed to bottom */}
      <nav className="bottom-nav">
        <div className="nav-items">
          {bottomNavItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeBottomNav === item.id ? 'active' : ''}`}
              onClick={() => {
                setActiveBottomNav(item.id);
                if (item.path) navigate(item.path);
                if (item.action) item.action();
              }}
            >
              <div className="nav-icon">{renderIcon(item.icon, 20)}</div>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Overlay for mobile activity */}
      {showMobileActivity && <div className="mobile-overlay" onClick={() => setShowMobileActivity(false)} />}
    </div>
  );
};

export default AuthHomePage;