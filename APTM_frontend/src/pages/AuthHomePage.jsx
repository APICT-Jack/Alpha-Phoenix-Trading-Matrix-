// src/pages/AuthHomePage.jsx - Complete Rebuild with PostComponent Integration
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { userStatusService } from '../services/userStatusService';
import PostComponent from '../components/profile/PostComponent';
import ConnectionPanel from '../components/navigation/ConnectionPanel';
import AvatarWithFallback from '../components/AvatarWithFallback';
import * as Icons from 'react-icons/fa';
import './AuthHomePage.css';

// API Configuration
const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
const API_BASE = `${API_URL}/api`;

// Helper to get auth headers
const getAuthHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json'
});

const AuthHomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser, isAuthenticated } = useAuth();
  const { darkMode } = useTheme();

  // ============ STATE MANAGEMENT ============
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ posts: [], users: [], hashtags: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchTab, setSearchTab] = useState('all'); // 'all', 'posts', 'people', 'hashtags'
  
  // Feed State
  const [feedPosts, setFeedPosts] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState(null);
  const [feedPage, setFeedPage] = useState(1);
  const [hasMoreFeed, setHasMoreFeed] = useState(true);
  const [feedRefreshing, setFeedRefreshing] = useState(false);
  
  // Trending State
  const [trendingHashtags, setTrendingHashtags] = useState([]);
  const [trendingUsers, setTrendingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState({});
  
  // Activity State
  const [activeActivityTab, setActiveActivityTab] = useState('news');
  const [activities, setActivities] = useState({
    news: [],
    trades: [],
    chats: [],
    updates: []
  });
  const [activityLoading, setActivityLoading] = useState(false);
  
  // Filter State
  const [activeFilters, setActiveFilters] = useState(['all']);
  const [showPeopleMenu, setShowPeopleMenu] = useState(false);
  const [showTraderMenu, setShowTraderMenu] = useState(false);
  const [peopleFilters, setPeopleFilters] = useState({
    traders: [],
    developers: false,
    students: false,
    friends: false
  });
  
  // UI State
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth <= 1024);
  const [showConnectionPanel, setShowConnectionPanel] = useState(false);
  const [isBottomNavExpanded, setIsBottomNavExpanded] = useState(true);
  const [isSearchSticky, setIsSearchSticky] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Wallpaper State
  const [showWallpaperModal, setShowWallpaperModal] = useState(false);
  const [wallpaperSettings, setWallpaperSettings] = useState(() => {
    const saved = localStorage.getItem('wallpaper_settings');
    return saved ? JSON.parse(saved) : {
      url: 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?w=1920&h=1080&fit=crop',
      brightness: 0.5,
      blur: 0,
      opacity: 1
    };
  });
  const [activeWallpaperCategory, setActiveWallpaperCategory] = useState('all');
  
  // Refs
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const searchSectionRef = useRef(null);
  const feedRef = useRef(null);
  const peopleMenuRef = useRef(null);
  const traderMenuRef = useRef(null);
  const traderBtnRef = useRef(null);
  
  // ============ CONSTANTS ============
  
  const bottomNavItems = [
    { id: 'home', label: 'Home', icon: 'FaHome', path: '/' },
    { id: 'dashboard', label: 'Dashboard', icon: 'FaTachometerAlt', path: '/dashboard' },
    { id: 'profile', label: 'Profile', icon: 'FaUser', path: `/profile/${currentUser?.id}` },
    { id: 'education', label: 'Academy', icon: 'FaGraduationCap', path: '/education' },
    { id: 'tools', label: 'Tools', icon: 'FaToolbox', path: '/tools' },
    { id: 'library', label: 'Library', icon: 'FaBook', path: '/library' },
    { id: 'chat', label: 'Chat', icon: 'FaComments', path: '/chat' }
  ];

  const activityTabs = [
    { id: 'news', label: 'News', icon: 'FaNewspaper' },
    { id: 'trades', label: 'Trades', icon: 'FaChartLine' },
    { id: 'chats', label: 'Chats', icon: 'FaComments' },
    { id: 'updates', label: 'Updates', icon: 'FaBell' }
  ];

  const filterOptions = [
    { id: 'all', label: 'All' },
    { id: 'videos', label: 'Videos' },
    { id: 'charts', label: 'Charts' },
    { id: 'academies', label: 'Academies' },
    { id: 'tools', label: 'Tools' },
    { id: 'people', label: 'People', hasSubmenu: true }
  ];

  const searchTabs = [
    { id: 'all', label: 'All', icon: 'FaGlobe' },
    { id: 'posts', label: 'Posts', icon: 'FaFileAlt' },
    { id: 'people', label: 'People', icon: 'FaUsers' },
    { id: 'hashtags', label: 'Hashtags', icon: 'FaHashtag' }
  ];

  const wallpapers = [
    { id: 1, name: 'Abstract Ocean', url: 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?w=1920&h=1080&fit=crop', category: 'nature' },
    { id: 2, name: 'Mountain Peak', url: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1920&h=1080&fit=crop', category: 'nature' },
    { id: 3, name: 'Bullish Candles', url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1920&h=1080&fit=crop', category: 'trading' },
    { id: 4, name: 'Market Data', url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1920&h=1080&fit=crop', category: 'trading' },
    { id: 5, name: 'Night City', url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920&h=1080&fit=crop', category: 'city' },
    { id: 6, name: 'Neon Grid', url: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=1920&h=1080&fit=crop', category: 'abstract' },
    { id: 7, name: 'Forest Dreams', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&h=1080&fit=crop', category: 'nature' },
    { id: 8, name: 'Crypto Bull Run', url: 'https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=1920&h=1080&fit=crop', category: 'trading' }
  ];

  const wallpaperCategories = [
    { id: 'all', label: 'All' },
    { id: 'nature', label: 'Nature' },
    { id: 'trading', label: 'Trading' },
    { id: 'city', label: 'City' },
    { id: 'abstract', label: 'Abstract' }
  ];

  // ============ API FUNCTIONS ============
  
  const apiFetch = useCallback(async (endpoint, options = {}) => {
    const url = `${API_BASE}${endpoint}`;
    const config = {
      headers: getAuthHeaders(),
      ...options
    };
    
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    
    return response.json();
  }, []);

  // Fetch feed posts
  const fetchFeed = useCallback(async (page = 1, append = false) => {
    try {
      if (page === 1) setFeedLoading(true);
      else setFeedRefreshing(true);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        sortBy: 'latest'
      });
      
      // Add filters
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

  // Perform comprehensive search
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
      const params = new URLSearchParams({
        q: searchQuery.trim(),
        limit: '20'
      });

      // Build filter params
      if (peopleFilters.traders.length > 0) params.append('tradingExperience', peopleFilters.traders.join(','));
      if (peopleFilters.developers) params.append('role', 'developer');
      if (peopleFilters.students) params.append('role', 'student');

      const [postsRes, usersRes] = await Promise.all([
        apiFetch(`/posts/feed?search=${encodeURIComponent(searchQuery.trim())}&limit=20`).catch(() => ({ success: true, posts: [] })),
        apiFetch(`/users/advanced-search?${params.toString()}`).catch(() => ({ success: true, users: [] }))
      ]);

      // Also search hashtags
      let hashtags = [];
      try {
        const hashtagRes = await apiFetch(`/posts/hashtags/${searchQuery.trim().replace('#', '')}`);
        if (hashtagRes.success) {
          hashtags = hashtagRes.posts || [];
        }
      } catch (error) {
        // Hashtag search failed silently
      }

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
  }, [searchQuery, searchPerformed, apiFetch, peopleFilters]);

  // Fetch trending data
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

  // Fetch activities
  const fetchActivities = useCallback(async () => {
    setActivityLoading(true);
    try {
      const [feedRes, chatRes] = await Promise.all([
        apiFetch('/posts/feed?limit=10').catch(() => ({ success: true, posts: [] })),
        apiFetch('/chat/rooms').catch(() => ({ success: true, rooms: [] }))
      ]);

      const posts = feedRes.posts || [];
      const rooms = chatRes.rooms || [];

      setActivities({
        news: posts.slice(0, 5).map(post => ({
          id: post._id,
          type: 'post',
          title: post.content?.substring(0, 100) || 'New post',
          time: post.createdAt,
          user: post.userId?.name || 'User',
          postId: post._id
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
        chats: rooms.slice(0, 5).map(room => ({
          id: room.id,
          type: 'chat',
          room: room.title,
          message: room.lastMessage || 'New activity',
          time: room.lastActivity,
          unread: room.unreadCount > 0,
          roomId: room.id
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
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setActivityLoading(false);
    }
  }, [apiFetch, trendingUsers]);

  // Fetch search suggestions
  const fetchSearchSuggestions = useCallback(async (query) => {
    if (query.length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const params = new URLSearchParams({ q: query, limit: '5' });
      const data = await apiFetch(`/users/search?${params.toString()}`);
      
      if (data.success && data.users) {
        const suggestions = data.users.map(user => ({
          ...user,
          resultType: 'user'
        }));
        setSearchSuggestions(suggestions);
        setShowSuggestions(suggestions.length > 0);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  }, [apiFetch]);

  // ============ EFFECTS ============
  
  // Initialize data
  useEffect(() => {
    fetchFeed(1, false);
    fetchTrending();
    
    // Set up user status service for online indicators
    if (currentUser && userStatusService) {
      userStatusService.init(currentUser, {
        onOnlineUsers: (users) => setOnlineUsers(users),
        onUserOnline: (data) => setOnlineUsers(prev => ({ ...prev, [data.userId]: { online: true, ...data.userData } })),
        onUserOffline: (data) => setOnlineUsers(prev => {
          const updated = { ...prev };
          delete updated[data.userId];
          return updated;
        })
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

  // Fetch activities when trending users change
  useEffect(() => {
    if (trendingUsers.length > 0) {
      fetchActivities();
    }
  }, [trendingUsers]);

  // Debounced search suggestions
  useEffect(() => {
    if (searchPerformed) return;
    
    const timer = setTimeout(() => {
      fetchSearchSuggestions(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchPerformed, fetchSearchSuggestions]);

  // Refresh feed when filters change
  useEffect(() => {
    if (!searchPerformed) {
      fetchFeed(1, false);
    }
  }, [activeFilters]);

  // Scroll handler for sticky search
  useEffect(() => {
    const handleScroll = () => {
      if (searchSectionRef.current) {
        const rect = searchSectionRef.current.getBoundingClientRect();
        setIsSearchSticky(rect.top <= 0);
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    applyWallpaper(wallpaperSettings);
  }, []);

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

  // ============ HELPER FUNCTIONS ============
  
  const applyWallpaper = (settings) => {
    const root = document.querySelector('.auth-homepage');
    if (root) {
      root.style.setProperty('--auth-wallpaper-url', `url(${settings.url})`);
      root.style.setProperty('--auth-wallpaper-brightness', settings.brightness);
      root.style.setProperty('--auth-wallpaper-blur', `${settings.blur}px`);
      root.style.setProperty('--auth-wallpaper-opacity', settings.opacity);
    }
  };

  const updateWallpaper = (key, value) => {
    setWallpaperSettings(prev => {
      const updated = { ...prev, [key]: value };
      applyWallpaper(updated);
      localStorage.setItem('wallpaper_settings', JSON.stringify(updated));
      return updated;
    });
  };

  const handleWallpaperSelect = (wallpaper) => {
    updateWallpaper('url', wallpaper.url);
    setShowWallpaperModal(false);
  };

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

  const handlePeopleFilter = (category, subcategory = null) => {
    setActiveFilters(prev => {
      const newFilters = prev.filter(f => f !== 'all');
      if (!newFilters.includes('people')) newFilters.push('people');
      return newFilters;
    });

    if (category === 'traders' && subcategory) {
      setPeopleFilters(prev => ({
        ...prev,
        traders: prev.traders.includes(subcategory)
          ? prev.traders.filter(s => s !== subcategory)
          : [...prev.traders, subcategory]
      }));
    } else {
      setPeopleFilters(prev => ({
        ...prev,
        [category]: !prev[category]
      }));
    }
  };

  const clearAllFilters = () => {
    setActiveFilters(['all']);
    setPeopleFilters({
      traders: [],
      developers: false,
      students: false,
      friends: false
    });
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults({ posts: [], users: [], hashtags: [] });
    setSearchPerformed(false);
    setShowSuggestions(false);
    if (searchInputRef.current) searchInputRef.current.focus();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setShowSuggestions(false);
    if (suggestion.resultType === 'user') {
      navigate(`/profile/${suggestion.id || suggestion._id}`);
    }
  };

  const handleLoadMore = () => {
    if (!hasMoreFeed || feedRefreshing) return;
    fetchFeed(feedPage + 1, true);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchFeed(1, false), fetchTrending(), fetchActivities()]);
    setIsRefreshing(false);
  };

  const handleFollowToggle = async (userId, currentStatus) => {
    try {
      const endpoint = currentStatus ? '/follow/unfollow' : '/follow/follow';
      await apiFetch(`${endpoint}/${userId}`, { method: 'POST' });
      
      // Update trending users
      setTrendingUsers(prev => 
        prev.map(u => (u.id || u._id) === userId ? { ...u, isFollowing: !currentStatus } : u)
      );
      
      // Update search results
      setSearchResults(prev => ({
        ...prev,
        users: prev.users.map(u => (u.id || u._id) === userId ? { ...u, isFollowing: !currentStatus } : u)
      }));
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const handleNavigation = (item) => {
    if (item.path) navigate(item.path);
  };

  const handleActivityClick = (activity) => {
    if (activity.postId) navigate(`/post/${activity.postId}`);
    else if (activity.roomId) navigate(`/chat/room/${activity.roomId}`);
    else if (activity.userId) navigate(`/profile/${activity.userId}`);
  };

  const getActiveFilterLabel = () => {
    if (activeFilters.includes('all')) return null;
    const filters = [];
    if (activeFilters.includes('videos')) filters.push('Videos');
    if (activeFilters.includes('charts')) filters.push('Charts');
    if (activeFilters.includes('academies')) filters.push('Academies');
    if (activeFilters.includes('tools')) filters.push('Tools');
    if (activeFilters.includes('people')) {
      let peopleStr = 'People';
      const subs = [];
      if (peopleFilters.traders.length > 0) subs.push(`Traders: ${peopleFilters.traders.join(', ')}`);
      if (peopleFilters.developers) subs.push('Developers');
      if (peopleFilters.students) subs.push('Students');
      if (peopleFilters.friends) subs.push('Friends');
      if (subs.length > 0) peopleStr += ` (${subs.join(', ')})`;
      filters.push(peopleStr);
    }
    return filters.join(' + ');
  };

  const getTotalSearchResults = () => {
    return searchResults.posts.length + searchResults.users.length + searchResults.hashtags.length;
  };

  const getFilteredSearchResults = () => {
    let results = [];
    if (searchTab === 'all' || searchTab === 'posts') {
      results = [...results, ...searchResults.posts.map(p => ({ ...p, resultType: 'post' }))];
    }
    if (searchTab === 'all' || searchTab === 'people') {
      results = [...results, ...searchResults.users.map(u => ({ ...u, resultType: 'user' }))];
    }
    if (searchTab === 'all' || searchTab === 'hashtags') {
      results = [...results, ...searchResults.hashtags.map(h => ({ ...h, resultType: 'hashtag' }))];
    }
    return results;
  };

  // ============ RENDER FUNCTIONS ============
  
  const renderIcon = (name, size = 16) => {
    const Icon = Icons[name];
    return Icon ? <Icon size={size} /> : null;
  };

  const renderSearchSuggestions = () => {
    if (!showSuggestions || searchSuggestions.length === 0) return null;

    return (
      <div className="search-suggestions" ref={suggestionsRef}>
        {searchSuggestions.map((item, idx) => (
          <div 
            key={item.id || item._id || idx} 
            className="suggestion-item"
            onClick={() => handleSuggestionClick(item)}
          >
            <div className="suggestion-icon">
              {item.resultType === 'user' ? (
                <div className="suggestion-avatar">
                  {item.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              ) : (
                renderIcon('FaHashtag', 12)
              )}
            </div>
            <div className="suggestion-text">
              <span className="suggestion-name">{item.name || item.username}</span>
              {item.username && <span className="suggestion-username">@{item.username}</span>}
            </div>
            <div className="suggestion-action">
              {item.resultType === 'user' ? 'View Profile' : 'View'}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderSearchResults = () => {
    if (!searchPerformed || !searchQuery.trim()) return null;

    const filteredResults = getFilteredSearchResults();
    const totalResults = getTotalSearchResults();

    return (
      <div className="search-results-container">
        {/* Search Results Header */}
        <div className="results-header">
          <div className="results-title">
            <h3>Results for "{searchQuery}"</h3>
            <span className="results-count">
              {searching ? 'Searching...' : `${totalResults} result${totalResults !== 1 ? 's' : ''}`}
            </span>
          </div>
          <button className="clear-results-btn" onClick={clearSearch}>
            {renderIcon('FaTimes', 14)} Clear
          </button>
        </div>

        {/* Search Tabs */}
        <div className="search-tabs">
          {searchTabs.map(tab => (
            <button
              key={tab.id}
              className={`search-tab ${searchTab === tab.id ? 'active' : ''}`}
              onClick={() => setSearchTab(tab.id)}
            >
              {renderIcon(tab.icon, 14)}
              <span>{tab.label}</span>
              {tab.id === 'posts' && searchResults.posts.length > 0 && (
                <span className="tab-count">{searchResults.posts.length}</span>
              )}
              {tab.id === 'people' && searchResults.users.length > 0 && (
                <span className="tab-count">{searchResults.users.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Results List */}
        {searching ? (
          <div className="loading-state">
            <Icons.FaSpinner className="spinner" />
            <p>Searching across posts, users, and hashtags...</p>
          </div>
        ) : filteredResults.length > 0 ? (
          <div className="results-list">
            {filteredResults.map((result, index) => {
              if (result.resultType === 'user') {
                return renderUserResult(result, index);
              } else if (result.resultType === 'hashtag') {
                return renderHashtagResult(result, index);
              }
              return renderPostResult(result, index);
            })}
          </div>
        ) : (
          <div className="no-results">
            <Icons.FaSearch size={48} />
            <h3>No results found</h3>
            <p>Try different keywords or check your filters</p>
            <button className="clear-search-btn" onClick={clearSearch}>
              Clear Search
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderPostResult = (post, index) => {
    // For post results, use the PostComponent
    return (
      <div key={post._id || index} className="search-result-post">
        <PostComponent
          post={post}
          currentUserId={currentUser?.id}
          onLike={() => {}}
          onComment={() => {}}
          onDelete={() => fetchFeed(1, false)}
          showActions={true}
          maxInitialComments={1}
          showMediaLightbox={true}
        />
      </div>
    );
  };

  const renderUserResult = (user, index) => {
    const userId = user.id || user._id;
    const isFollowing = user.isFollowing || false;
    
    return (
      <div 
        key={userId || index} 
        className="result-card user-result"
        onClick={() => navigate(`/profile/${userId}`)}
      >
        <div className="result-card-header">
          <div className="person-avatar-large">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} />
            ) : (
              <span>{user.name?.charAt(0)?.toUpperCase() || 'U'}</span>
            )}
          </div>
          <div className="person-info">
            <h4>{user.name}</h4>
            <div className="person-username">@{user.username}</div>
            <div className="person-stats">
              <span>{user.followersCount || 0} followers</span>
              {user.tradingExperience && (
                <span className="person-level"> • {user.tradingExperience}</span>
              )}
            </div>
          </div>
          {currentUser && userId !== currentUser.id && (
            <button 
              className={`follow-btn ${isFollowing ? 'following' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handleFollowToggle(userId, isFollowing);
              }}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
        {user.bio && <p className="person-bio">{user.bio}</p>}
        {user.interests && user.interests.length > 0 && (
          <div className="person-interests">
            {user.interests.slice(0, 3).map(interest => (
              <span key={interest} className="interest-tag">{interest}</span>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderHashtagResult = (post, index) => {
    return (
      <div key={post._id || index} className="result-card hashtag-result">
        <PostComponent
          post={post}
          currentUserId={currentUser?.id}
          showActions={true}
          maxInitialComments={1}
        />
      </div>
    );
  };

  const renderFeed = () => {
    if (searchPerformed && searchQuery.trim()) return null;

    return (
      <div className="feed-container" ref={feedRef}>
        <div className="feed-header">
          <h2>Your Feed</h2>
          <button 
            className={`refresh-btn ${isRefreshing ? 'spinning' : ''}`}
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {renderIcon('FaSyncAlt', 16)}
          </button>
        </div>

        {getActiveFilterLabel() && (
          <div className="active-filters-bar">
            <div className="active-filter-badge">
              <span>Active: {getActiveFilterLabel()}</span>
            </div>
            <button className="clear-filters-btn" onClick={clearAllFilters}>
              Clear filters
            </button>
          </div>
        )}

        {feedLoading ? (
          <div className="loading-state">
            <Icons.FaSpinner className="spinner" />
            <p>Loading your feed...</p>
          </div>
        ) : feedError ? (
          <div className="error-state">
            <Icons.FaExclamationTriangle size={48} />
            <h3>Failed to load feed</h3>
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
                onLike={() => {}}
                onComment={() => {}}
                onDelete={() => fetchFeed(1, false)}
                onPostUpdate={(updatedPost) => {
                  setFeedPosts(prev => 
                    prev.map(p => p._id === updatedPost._id ? updatedPost : p)
                  );
                }}
                showActions={true}
                maxInitialComments={2}
                showMediaLightbox={true}
                allowEditing={true}
                allowDeletion={true}
                allowReporting={true}
                allowSaving={true}
              />
            ))}
            
            {hasMoreFeed && (
              <div className="load-more-container">
                <button 
                  className="load-more-btn"
                  onClick={handleLoadMore}
                  disabled={feedRefreshing}
                >
                  {feedRefreshing ? (
                    <><Icons.FaSpinner className="spinner" /> Loading...</>
                  ) : (
                    'Load More Posts'
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="empty-state">
            <Icons.FaNewspaper size={48} />
            <h3>No posts in your feed</h3>
            <p>Follow users or create your first post to get started!</p>
            <button onClick={() => navigate('/create-post')}>
              Create Post
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderActivityPanel = () => {
    return (
      <div className="activity-panel">
        {/* Activity Tabs */}
        <div className="activity-tabs">
          {activityTabs.map(tab => (
            <button
              key={tab.id}
              className={`activity-tab ${activeActivityTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveActivityTab(tab.id)}
            >
              {renderIcon(tab.icon, 14)}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Activity List */}
        <div className="activity-list">
          {activityLoading ? (
            <div className="activity-loading">
              <Icons.FaSpinner className="spinner" />
            </div>
          ) : activities[activeActivityTab]?.length > 0 ? (
            activities[activeActivityTab].map(activity => (
              <div 
                key={activity.id} 
                className="activity-item"
                onClick={() => handleActivityClick(activity)}
              >
                <div className={`activity-icon ${activeActivityTab}-icon`}>
                  {activeActivityTab === 'news' && renderIcon('FaNewspaper', 14)}
                  {activeActivityTab === 'trades' && renderIcon('FaChartLine', 14)}
                  {activeActivityTab === 'chats' && renderIcon('FaComments', 14)}
                  {activeActivityTab === 'updates' && renderIcon('FaUserPlus', 14)}
                </div>
                <div className="activity-content">
                  <div className="activity-title">
                    {activity.user && <span className="activity-user">{activity.user}</span>}
                    {activity.room && <span className="activity-room">{activity.room}</span>}
                    <span className="activity-action">{activity.action || activity.title}</span>
                  </div>
                  {activity.message && (
                    <div className="activity-message">{activity.message}</div>
                  )}
                  <div className="activity-time">
                    {activity.time ? new Date(activity.time).toLocaleTimeString() : ''}
                    {activity.unread && <span className="unread-dot">•</span>}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-activity">
              <p>No recent activity</p>
            </div>
          )}
        </div>

        {/* Trending Section */}
        <div className="trending-section">
          <h3>Trending</h3>
          
          {/* Trending Hashtags */}
          <div className="trending-hashtags">
            <h4>Hashtags</h4>
            {trendingHashtags.slice(0, 5).map((tag, idx) => (
              <div 
                key={idx} 
                className="trending-item"
                onClick={() => {
                  setSearchQuery(`#${tag._id || tag.hashtag}`);
                  setSearchPerformed(false);
                }}
              >
                <span className="trending-rank">#{idx + 1}</span>
                <div className="trending-info">
                  <span className="trending-name">#{tag._id || tag.hashtag}</span>
                  <span className="trending-count">{tag.count || 0} posts</span>
                </div>
              </div>
            ))}
          </div>

          {/* Suggested Users */}
          <div className="trending-users">
            <h4>Who to follow</h4>
            {trendingUsers.slice(0, 3).map(user => {
              const userId = user.id || user._id;
              return (
                <div 
                  key={userId} 
                  className="suggested-user"
                  onClick={() => navigate(`/profile/${userId}`)}
                >
                  <div className="suggested-avatar">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="suggested-info">
                    <span className="suggested-name">{user.name}</span>
                    <span className="suggested-username">@{user.username}</span>
                  </div>
                  {currentUser && userId !== currentUser.id && (
                    <button 
                      className={`follow-sm-btn ${user.isFollowing ? 'following' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFollowToggle(userId, user.isFollowing);
                      }}
                    >
                      {user.isFollowing ? '✓' : '+'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderWallpaperModal = () => {
    if (!showWallpaperModal) return null;

    const filteredWallpapers = wallpapers.filter(w => 
      activeWallpaperCategory === 'all' || w.category === activeWallpaperCategory
    );

    return (
      <div className="wallpaper-modal" onClick={() => setShowWallpaperModal(false)}>
        <div className="wallpaper-modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Choose Wallpaper</h3>
            <button className="close-modal" onClick={() => setShowWallpaperModal(false)}>
              {renderIcon('FaTimes', 16)}
            </button>
          </div>
          
          <div className="wallpaper-categories">
            {wallpaperCategories.map(cat => (
              <button
                key={cat.id}
                className={`category-chip ${activeWallpaperCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveWallpaperCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>
          
          <div className="wallpaper-grid">
            {filteredWallpapers.map(w => (
              <div
                key={w.id}
                className={`wallpaper-option ${wallpaperSettings.url === w.url ? 'selected' : ''}`}
                style={{ backgroundImage: `url(${w.url})` }}
                onClick={() => handleWallpaperSelect(w)}
              >
                <span className="wallpaper-name">{w.name}</span>
              </div>
            ))}
          </div>
          
          <div className="wallpaper-settings">
            <div className="setting">
              <label>Brightness</label>
              <input
                type="range"
                min="0.3"
                max="1"
                step="0.01"
                value={wallpaperSettings.brightness}
                onChange={e => updateWallpaper('brightness', parseFloat(e.target.value))}
              />
            </div>
            <div className="setting">
              <label>Blur</label>
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                value={wallpaperSettings.blur}
                onChange={e => updateWallpaper('blur', parseInt(e.target.value))}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============ MAIN RENDER ============
  
  return (
    <div className="auth-homepage">
      {/* Connection Panel (Mobile Overlay) */}
      {showConnectionPanel && (
        <div className="connection-panel-overlay">
          <ConnectionPanel
            initialTab="followers"
            onClose={() => setShowConnectionPanel(false)}
            embedded={false}
          />
        </div>
      )}

      {/* Wallpaper Controls */}
      <div className="wallpaper-controls">
        <button className="wallpaper-btn" onClick={() => setShowWallpaperModal(true)} title="Change wallpaper">
          {renderIcon('FaImage', 14)}
        </button>
        <button className="wallpaper-btn" onClick={() => updateWallpaper('brightness', Math.min(1, wallpaperSettings.brightness + 0.1))} title="Increase brightness">
          {renderIcon('FaSun', 12)}
        </button>
        <button className="wallpaper-btn" onClick={() => updateWallpaper('brightness', Math.max(0.3, wallpaperSettings.brightness - 0.1))} title="Decrease brightness">
          {renderIcon('FaMoon', 12)}
        </button>
      </div>

      {/* Wallpaper Modal */}
      {renderWallpaperModal()}

      {/* Main Container */}
      <div className="auth-container">
        {/* Sticky Search and Filter Section */}
        <div 
          ref={searchSectionRef}
          className={`search-filter-section ${isSearchSticky ? 'is-sticky' : ''}`}
        >
          {/* Centered Search Section */}
          <div className="search-section">
            <div className={`search-label ${searchPerformed && searchQuery.trim() ? 'hide-titles' : ''}`}>
              <h1>Alpha Phoenix Trading</h1>
              <p>Search trading tools, signals, and educational content</p>
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
                    if (searchPerformed && !e.target.value.trim()) {
                      setSearchPerformed(false);
                    }
                  }}
                  onFocus={() => {
                    if (searchSuggestions.length > 0) setShowSuggestions(true);
                  }}
                  onKeyPress={handleKeyPress}
                />
                {searchQuery && (
                  <button className="clear-search" onClick={clearSearch}>
                    {renderIcon('FaTimes', 12)}
                  </button>
                )}
                <button className="search-button" onClick={performSearch} disabled={searching}>
                  {searching ? (
                    <Icons.FaSpinner className="spinner-button" />
                  ) : (
                    'Search'
                  )}
                </button>
              </div>
              
              {renderSearchSuggestions()}
            </div>
          </div>

          {/* Filter Chips */}
          {!searchPerformed && (
            <div className="filter-section">
              <div className="filter-chips">
                {filterOptions.map(filter => (
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
                          <button 
                            ref={traderBtnRef}
                            className={`submenu-item ${peopleFilters.traders.length > 0 ? 'active' : ''}`}
                            onClick={() => setShowTraderMenu(!showTraderMenu)}
                          >
                            <span className="checkbox-indicator">▶</span>
                            <span>Traders</span>
                          </button>
                          {showTraderMenu && (
                            <div className="nested-submenu" ref={traderMenuRef}>
                              {['beginner', 'intermediate', 'advanced', 'expert', 'mentor'].map(level => (
                                <button
                                  key={level}
                                  className={`nested-option ${peopleFilters.traders.includes(level) ? 'active' : ''}`}
                                  onClick={() => handlePeopleFilter('traders', level)}
                                >
                                  {peopleFilters.traders.includes(level) ? '✓' : '○'} {level}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <button 
                          className={`submenu-item ${peopleFilters.developers ? 'active' : ''}`}
                          onClick={() => handlePeopleFilter('developers')}
                        >
                          <span className="checkbox-indicator">{peopleFilters.developers ? '✓' : '○'}</span>
                          <span>Developers</span>
                        </button>
                        <button 
                          className={`submenu-item ${peopleFilters.students ? 'active' : ''}`}
                          onClick={() => handlePeopleFilter('students')}
                        >
                          <span className="checkbox-indicator">{peopleFilters.students ? '✓' : '○'}</span>
                          <span>Students</span>
                        </button>
                        <button 
                          className={`submenu-item ${peopleFilters.friends ? 'active' : ''}`}
                          onClick={() => handlePeopleFilter('friends')}
                        >
                          <span className="checkbox-indicator">{peopleFilters.friends ? '✓' : '○'}</span>
                          <span>Friends</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className={`content-layout ${searchPerformed ? 'search-mode' : ''}`}>
          {/* Search Results or Feed */}
          <div className="main-column">
            {searchPerformed && searchQuery.trim() ? renderSearchResults() : renderFeed()}
          </div>

          {/* Sidebar - Activity & Trending */}
          <div className="sidebar-column">
            {renderActivityPanel()}
          </div>
        </div>

        {/* Bottom Navigation Bar */}
        <div className={`bottom-nav ${isBottomNavExpanded ? 'expanded' : 'collapsed'}`}>
          <button 
            className="nav-toggle-btn"
            onClick={() => setIsBottomNavExpanded(!isBottomNavExpanded)}
          >
            {isBottomNavExpanded ? renderIcon('FaChevronDown', 12) : renderIcon('FaChevronUp', 12)}
          </button>
          <div className="nav-items">
            {bottomNavItems.map(item => (
              <button
                key={item.id}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => handleNavigation(item)}
              >
                <div className="nav-icon">{renderIcon(item.icon, isMobile ? 20 : 18)}</div>
                {!isMobile && <span className="nav-label">{item.label}</span>}
              </button>
            ))}
            <button 
              className="nav-item"
              onClick={() => setShowConnectionPanel(!showConnectionPanel)}
            >
              <div className="nav-icon">{renderIcon('FaUsers', isMobile ? 20 : 18)}</div>
              {!isMobile && <span className="nav-label">Connect</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthHomePage;