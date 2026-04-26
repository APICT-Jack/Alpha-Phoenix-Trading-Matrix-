// src/pages/AuthHomePage.jsx - Sticky Search Bar with Real Data Integration
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import * as Icons from 'react-icons/fa';
import './AuthHomePage.css';

const AuthHomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State
  const [activeBottomNav, setActiveBottomNav] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [activeActivityTab, setActiveActivityTab] = useState('news');
  
  // Real data states
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [followSuggestions, setFollowSuggestions] = useState([]);
  const [activities, setActivities] = useState({
    news: [],
    trades: [],
    chats: [],
    updates: []
  });
  const [loading, setLoading] = useState({
    posts: false,
    users: false,
    activities: false
  });
  
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
  
  // Wallpaper State
  const [showWallpaperModal, setShowWallpaperModal] = useState(false);
  const [wallpaperSettings, setWallpaperSettings] = useState({
    url: 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?w=1920&h=1080&fit=crop',
    brightness: 0.5,
    blur: 0,
    opacity: 1
  });
  
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const peopleMenuRef = useRef(null);
  const traderMenuRef = useRef(null);
  const traderBtnRef = useRef(null);
  const searchSectionRef = useRef(null);
  const [isBottomNavExpanded, setIsBottomNavExpanded] = useState(false);
  const [isSearchSticky, setIsSearchSticky] = useState(false);

  // Bottom navigation items
  const bottomNavItems = [
    { id: 'home', label: 'Home', icon: 'FaHome', path: '/' },
    { id: 'dashboard', label: 'Dashboard', icon: 'FaTachometerAlt', path: '/dashboard' },
    { id: 'profile', label: 'Profile', icon: 'FaUser', path: '/profile' },
    { id: 'education', label: 'Academy', icon: 'FaGraduationCap', path: '/education' },
    { id: 'tools', label: 'Tools', icon: 'FaToolbox', path: '/tools' },
    { id: 'library', label: 'Library', icon: 'FaBook', path: '/library' },
    { id: 'chat', label: 'Chat', icon: 'FaComments', path: '/chat' },
    { id: 'cashier', label: 'Cashier', icon: 'FaDollarSign', path: '/cashier' }
  ];

  // Activity tabs
  const activityTabs = [
    { id: 'news', label: 'News', icon: 'FaNewspaper' },
    { id: 'trades', label: 'Trades', icon: 'FaChartLine' },
    { id: 'chats', label: 'Chats', icon: 'FaComments' },
    { id: 'updates', label: 'Updates', icon: 'FaBell' }
  ];

  // Filter options
  const filterOptions = [
    { id: 'all', label: 'All' },
    { id: 'videos', label: 'Videos' },
    { id: 'charts', label: 'Charts' },
    { id: 'academies', label: 'Academies' },
    { id: 'tools', label: 'Tools' },
    { id: 'people', label: 'People', hasSubmenu: true }
  ];

  // Wallpaper collections
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

  const [activeWallpaperCategory, setActiveWallpaperCategory] = useState('all');

  // API calls
  const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  // Fetch real posts from backend
  const fetchPosts = useCallback(async () => {
    setLoading(prev => ({ ...prev, posts: true }));
    try {
      const response = await api.get('/posts/feed');
      if (response.data.success) {
        setPosts(response.data.posts || []);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(prev => ({ ...prev, posts: false }));
    }
  }, []);

  // Fetch users for people search
  const fetchUsers = useCallback(async (searchTerm = '') => {
    try {
      const response = await api.get('/users/all', {
        params: { search: searchTerm, limit: 20 }
      });
      if (response.data.success) {
        setUsers(response.data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, []);

  // Fetch friend suggestions
  const fetchFriendSuggestions = useCallback(async () => {
    try {
      const response = await api.get('/users/suggestions', { params: { limit: 10 } });
      if (response.data.success) {
        setFollowSuggestions(response.data.users || []);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  }, []);

  // Fetch conversations for chat activity
  const fetchConversations = useCallback(async () => {
    try {
      const response = await api.get('/chat/conversations');
      if (response.data.success) {
        setConversations(response.data.conversations || []);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  }, []);

  // Search function - searches posts and users
  const performSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      if (searchPerformed) clearSearch();
      return;
    }

    setSearching(true);
    const results = [];

    try {
      // Search posts if filter includes posts categories
      let searchPosts = true;
      let searchPeople = false;

      if (!activeFilters.includes('all')) {
        searchPosts = activeFilters.some(f => ['videos', 'charts', 'academies', 'tools'].includes(f));
        searchPeople = activeFilters.includes('people');
      }

      // Fetch posts with search query
      if (searchPosts) {
        try {
          const postsResponse = await api.get('/posts/feed', {
            params: { search: searchQuery, limit: 20 }
          });
          if (postsResponse.data.success && postsResponse.data.posts) {
            results.push(...postsResponse.data.posts.map(p => ({ ...p, resultType: 'post' })));
          }
        } catch (error) {
          console.error('Error searching posts:', error);
        }
      }

      // Fetch users
      if (searchPeople && searchQuery.length >= 2) {
        try {
          const usersResponse = await api.get('/users/advanced-search', {
            params: { q: searchQuery, limit: 20 }
          });
          if (usersResponse.data.success && usersResponse.data.users) {
            results.push(...usersResponse.data.users.map(u => ({ ...u, resultType: 'person' })));
          }
        } catch (error) {
          console.error('Error searching users:', error);
        }
      }

      setSearchResults(results);
      setSearchPerformed(true);
      setShowSuggestions(false);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  }, [searchQuery, activeFilters, searchPerformed]);

  // Search suggestions
  useEffect(() => {
    const getSuggestions = async () => {
      if (searchQuery.length > 1 && !searchPerformed) {
        const suggestions = [];
        
        // Get post suggestions
        if (posts.length > 0) {
          const matchedPosts = posts.filter(post =>
            post.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase())
          ).slice(0, 3);
          suggestions.push(...matchedPosts.map(p => ({ ...p, resultType: 'post', displayName: p.content?.substring(0, 50) })));
        }
        
        // Get user suggestions
        if (users.length > 0) {
          const matchedUsers = users.filter(user =>
            user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.username?.toLowerCase().includes(searchQuery.toLowerCase())
          ).slice(0, 3);
          suggestions.push(...matchedUsers.map(u => ({ ...u, resultType: 'person' })));
        }
        
        setSearchSuggestions(suggestions.slice(0, 5));
        setShowSuggestions(true);
      } else {
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
    };
    
    getSuggestions();
  }, [searchQuery, searchPerformed, posts, users]);

  // Initialize real data
  useEffect(() => {
    fetchPosts();
    fetchUsers();
    fetchFriendSuggestions();
    fetchConversations();
  }, [fetchPosts, fetchUsers, fetchFriendSuggestions, fetchConversations]);

  // Build activity data from real sources
  useEffect(() => {
    // Transform posts into news/trades activities
    const newsActivities = posts.slice(0, 5).map(post => ({
      id: post._id,
      title: post.content?.substring(0, 100) || 'New post',
      time: new Date(post.createdAt).toLocaleTimeString(),
      source: post.userId?.name || 'User'
    }));

    // Trade activities from posts with charts
    const tradeActivities = posts
      .filter(post => post.media?.some(m => m.type === 'chart'))
      .slice(0, 5)
      .map(post => ({
        id: post._id,
        user: post.userId?.name || 'Trader',
        action: 'shared',
        symbol: post.media?.find(m => m.type === 'chart')?.chartData?.symbol || 'BTC',
        time: new Date(post.createdAt).toLocaleTimeString()
      }));

    // Chat activities from conversations
    const chatActivities = conversations.slice(0, 5).map(conv => ({
      id: conv.id,
      user: conv.userName,
      message: conv.lastMessage || 'New message',
      time: new Date(conv.lastMessageTime).toLocaleTimeString(),
      unread: conv.unreadCount > 0
    }));

    // Update activities from follows and suggestions
    const updateActivities = followSuggestions.slice(0, 5).map(user => ({
      id: user.id,
      type: 'follow',
      user: user.name,
      action: 'joined the community',
      time: new Date().toLocaleTimeString()
    }));

    setActivities({
      news: newsActivities,
      trades: tradeActivities,
      chats: chatActivities,
      updates: updateActivities
    });
  }, [posts, conversations, followSuggestions]);

  // Sticky scroll effect for search bar
  useEffect(() => {
    const handleScroll = () => {
      if (searchSectionRef.current) {
        const rect = searchSectionRef.current.getBoundingClientRect();
        setIsSearchSticky(rect.top <= 0);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load wallpaper settings
  useEffect(() => {
    const saved = localStorage.getItem('wallpaper_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setWallpaperSettings(parsed);
        applyWallpaper(parsed);
      } catch (e) {}
    } else {
      applyWallpaper(wallpaperSettings);
    }
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
    const newSettings = { ...wallpaperSettings, [key]: value };
    setWallpaperSettings(newSettings);
    applyWallpaper(newSettings);
    localStorage.setItem('wallpaper_settings', JSON.stringify(newSettings));
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
        } else {
          return [...newFilters, filterId];
        }
      });
    }
  };

  const handlePeopleFilter = (category, subcategory = null) => {
    setActiveFilters(prev => {
      const newFilters = prev.filter(f => f !== 'all');
      if (!newFilters.includes('people')) {
        newFilters.push('people');
      }
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

  const handleNavigation = (item) => {
    setActiveBottomNav(item.id);
    if (item.path) {
      navigate(item.path);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchPerformed(false);
    setShowSuggestions(false);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  };

  const handleFollowToggle = async (userId, currentStatus) => {
    try {
      if (currentStatus) {
        await api.post(`/follow/unfollow/${userId}`);
      } else {
        await api.post(`/follow/follow/${userId}`);
      }
      // Refresh suggestions
      fetchFriendSuggestions();
      // Update local state
      setFollowSuggestions(prev => 
        prev.map(u => u.id === userId ? { ...u, isFollowing: !currentStatus } : u)
      );
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
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

  const filteredWallpapers = wallpapers.filter(w => 
    activeWallpaperCategory === 'all' || w.category === activeWallpaperCategory
  );

  const renderIcon = (name, size = 16) => {
    const Icon = Icons[name];
    return Icon ? <Icon size={size} /> : null;
  };

  const hideTitles = searchPerformed && searchQuery.trim().length > 0;

  return (
    <div className="auth-homepage">
      {/* Wallpaper Controls */}
      <div className="wallpaper-controls">
        <button className="wallpaper-btn" onClick={() => setShowWallpaperModal(true)}>
          {renderIcon('FaImage', 14)}
        </button>
        <button className="wallpaper-btn" onClick={() => updateWallpaper('brightness', Math.min(1, wallpaperSettings.brightness + 0.1))}>
          {renderIcon('FaSun', 12)}
        </button>
        <button className="wallpaper-btn" onClick={() => updateWallpaper('brightness', Math.max(0.3, wallpaperSettings.brightness - 0.1))}>
          {renderIcon('FaMoon', 12)}
        </button>
      </div>

      {/* Wallpaper Modal */}
      {showWallpaperModal && (
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
      )}

      {/* Main Container */}
      <div className="auth-container">
        {/* Sticky Search and Filter Section */}
        <div 
          ref={searchSectionRef}
          className={`search-filter-section ${isSearchSticky ? 'is-sticky' : ''}`}
        >
          {/* Centered Search Section */}
          <div className="search-section">
            <div className={`search-label ${hideTitles ? 'hide-titles' : ''}`}>
              <h1>Alpha Phoenix Trading</h1>
              <p>Search trading tools, signals, and educational content</p>
            </div>
            
            <div className="search-wrapper" style={{ position: 'relative' }}>
              <div className="search-box">
                <div className="search-icon">{renderIcon('FaSearch', 16)}</div>
                <input
                  ref={searchInputRef}
                  type="text"
                  className="search-input"
                  placeholder={searchPerformed ? "Search again..." : "Search posts or people..."}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onKeyPress={handleKeyPress}
                />
                {searchQuery && (
                  <button className="clear-search" onClick={clearSearch}>
                    {renderIcon('FaTimes', 12)}
                  </button>
                )}
                <button className="search-button" onClick={performSearch} disabled={searching}>
                  {searching ? '...' : 'Search'}
                </button>
                
                {showSuggestions && searchSuggestions.length > 0 && !searchPerformed && (
                  <div className="search-suggestions" ref={suggestionsRef}>
                    {searchSuggestions.map((item, idx) => (
                      <div key={idx} className="suggestion-item" onClick={() => {
                        if (item.resultType === 'person') {
                          navigate(`/profile/${item.id || item._id}`);
                        } else {
                          navigate(`/post/${item._id}`);
                        }
                      }}>
                        <div className="suggestion-icon">
                          {item.resultType === 'person' 
                            ? <div className="suggestion-avatar">{item.avatarInitial || item.name?.[0]}</div>
                            : renderIcon('FaFileAlt', 12)}
                        </div>
                        <div className="suggestion-text">
                          {item.resultType === 'person' ? item.name : item.displayName || 'Post'}
                          {item.username && <span className="suggestion-username">{item.username}</span>}
                        </div>
                        <div className="suggestion-action">
                          {item.resultType === 'person' ? 'View profile' : 'View post'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="filter-section">
            <div className="filter-chips">
              {filterOptions.map(filter => (
                <div key={filter.id} style={{ position: 'relative' }}>
                  <button
                    className={`filter-chip ${activeFilters.includes(filter.id) ? 'active' : ''} ${filter.hasSubmenu ? 'has-submenu' : ''}`}
                    onClick={() => handleFilterClick(filter.id)}
                  >
                    {filter.label}
                  </button>
                  
                  {filter.hasSubmenu && showPeopleMenu && (
                    <div className="people-submenu" ref={peopleMenuRef}>
                      <div style={{ position: 'relative' }}>
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
                            {['new', 'beginner', 'advance', 'pro', 'mentor'].map(level => (
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

            {getActiveFilterLabel() && (
              <div className="active-filters-bar">
                <div className="active-filter-badge">
                  <span>Active: {getActiveFilterLabel()}</span>
                </div>
                <button className="clear-filters-btn" onClick={clearAllFilters}>
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Two-Column Content Area */}
        <div className={`two-column-layout ${hideTitles ? 'expanded' : ''}`}>
          {/* Left Column - Search Results */}
          <div className="search-results-column">
            {searchPerformed && searchQuery.trim() ? (
              <div className="results-container">
                <div className="results-header">
                  <h3>Search Results for "{searchQuery}"</h3>
                  <span className="results-count">{searchResults.length} results found</span>
                </div>
                {searching ? (
                  <div className="glass-card">
                    <p>Searching...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="results-list">
                    {searchResults.map(result => (
                      <div key={result.id || result._id} className="result-card" onClick={() => {
                        if (result.resultType === 'person') {
                          navigate(`/profile/${result.id || result._id}`);
                        } else {
                          navigate(`/post/${result._id}`);
                        }
                      }}>
                        {result.resultType === 'person' ? (
                          <>
                            <div className="result-card-header">
                              <div className="person-avatar-large">
                                {result.avatarInitial || result.name?.[0] || 'U'}
                              </div>
                              <div className="person-info">
                                <h4>{result.name}</h4>
                                <div className="person-username">@{result.username}</div>
                                <div className="person-stats">{result.followersCount || 0} followers</div>
                              </div>
                              <button 
                                className={`follow-btn ${result.isFollowing ? 'following' : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFollowToggle(result.id || result._id, result.isFollowing);
                                }}
                              >
                                {result.isFollowing ? 'Following' : 'Follow'}
                              </button>
                            </div>
                            <div className="person-badge">
                              <span className={`badge ${result.tradingExperience || 'beginner'}`}>
                                {result.tradingExperience || 'Trader'}
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="result-icon">
                              {result.media?.[0]?.type === 'chart' ? renderIcon('FaChartLine', 24) :
                               result.media?.[0]?.type === 'image' ? renderIcon('FaImage', 24) :
                               renderIcon('FaFileAlt', 24)}
                            </div>
                            <h4>{result.content?.substring(0, 100)}</h4>
                            <p>{result.content?.substring(0, 150)}...</p>
                            <div className="result-meta">
                              <span className="result-author">By {result.userId?.name || 'User'}</span>
                              <div className="result-stats">
                                <span><Icons.FaHeart size={12} /> {result.likes?.length || 0}</span>
                                <span><Icons.FaComment size={12} /> {result.comments?.length || 0}</span>
                                <span>{new Date(result.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="result-type-badge">
                              <span className={`type-badge ${result.media?.[0]?.type || 'post'}`}>
                                {result.media?.[0]?.type === 'chart' ? 'Chart' :
                                 result.media?.[0]?.type === 'image' ? 'Image' : 'Post'}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="glass-card">
                    <h2>No results found</h2>
                    <p>Try different keywords or check your spelling.</p>
                    <button className="filter-chip" onClick={clearSearch} style={{ marginTop: '20px' }}>
                      Clear Search
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="glass-card welcome-card">
                <h2>Welcome to Alpha Phoenix Trading</h2>
                <p>
                  {getActiveFilterLabel() 
                    ? `Showing filtered content: ${getActiveFilterLabel()}`
                    : 'Discover premium trading tools, educational content, and connect with traders worldwide.'}
                </p>
                <div className="featured-posts">
                  <h3>Recent Posts</h3>
                  <div className="featured-list">
                    {loading.posts ? (
                      <p>Loading posts...</p>
                    ) : posts.slice(0, 5).map(post => (
                      <div key={post._id} className="featured-item" onClick={() => navigate(`/post/${post._id}`)}>
                        <div className="featured-icon">
                          {post.media?.[0]?.type === 'chart' ? renderIcon('FaChartLine', 20) : renderIcon('FaFileAlt', 20)}
                        </div>
                        <div className="featured-content">
                          <h4>{post.userId?.name || 'User'}</h4>
                          <p>{post.content?.substring(0, 80)}...</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Recent Activity */}
          <div className="activity-column">
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
            
            <div className="activity-list">
              {activities[activeActivityTab]?.length > 0 ? (
                activities[activeActivityTab].map(activity => (
                  <div key={activity.id} className="activity-item">
                    {activeActivityTab === 'news' && (
                      <>
                        <div className="activity-icon news-icon">
                          {renderIcon('FaNewspaper', 14)}
                        </div>
                        <div className="activity-content">
                          <div className="activity-title">{activity.title}</div>
                          <div className="activity-meta">
                            <span className="activity-source">{activity.source}</span>
                            <span className="activity-time">{activity.time}</span>
                          </div>
                        </div>
                      </>
                    )}
                    {activeActivityTab === 'trades' && (
                      <>
                        <div className="activity-icon trade-icon">
                          {renderIcon('FaChartLine', 14)}
                        </div>
                        <div className="activity-content">
                          <div className="activity-title">
                            <span className="trade-user">{activity.user}</span>
                            <span className={`trade-action ${activity.action}`}>{activity.action}</span>
                            {activity.symbol && <span className="trade-amount">{activity.symbol}</span>}
                          </div>
                          <div className="activity-time">{activity.time}</div>
                        </div>
                      </>
                    )}
                    {activeActivityTab === 'chats' && (
                      <>
                        <div className="activity-icon chat-icon">
                          {renderIcon('FaComments', 14)}
                        </div>
                        <div className="activity-content">
                          <div className="activity-title">
                            <span className="chat-user">{activity.user}</span>
                            {activity.unread && <span className="unread-badge">New</span>}
                          </div>
                          <div className="activity-message">{activity.message}</div>
                          <div className="activity-time">{activity.time}</div>
                        </div>
                      </>
                    )}
                    {activeActivityTab === 'updates' && (
                      <>
                        <div className="activity-icon update-icon">
                          {activity.type === 'achievement' ? '🎉' : renderIcon('FaUserPlus', 12)}
                        </div>
                        <div className="activity-content">
                          <div className="activity-title">
                            <span className="update-user">{activity.user}</span>
                            <span className="update-action">{activity.action}</span>
                          </div>
                          <div className="activity-time">{activity.time}</div>
                        </div>
                      </>
                    )}
                  </div>
                ))
              ) : (
                <div className="glass-card" style={{ padding: '30px', textAlign: 'center' }}>
                  <p>No recent activity</p>
                </div>
              )}
            </div>
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
                className={`nav-item ${activeBottomNav === item.id ? 'active' : ''}`}
                onClick={() => handleNavigation(item)}
              >
                <div className="nav-icon">{renderIcon(item.icon, isMobile ? 20 : 18)}</div>
                {!isMobile && <span className="nav-label">{item.label}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthHomePage;