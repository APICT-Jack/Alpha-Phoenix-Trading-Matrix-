// src/pages/AuthHomePage.jsx - Premium Edition with YouTube-style Navigation
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as Icons from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useConnectionPanel } from '../context/ConnectionPanelContext';
import Container from '../components/ui/Container';
import Footer from '../components/layout/Footer';
import './AuthHomePage.css';

const AuthHomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { openPanel } = useConnectionPanel();
  
  // State Management
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [activeNavItem, setActiveNavItem] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [activeActivityTab, setActiveActivityTab] = useState('all');
  const [expandedActivity, setExpandedActivity] = useState(null);
  const [sidebarScrollTop, setSidebarScrollTop] = useState(0);
  
  // Wallpaper Settings
  const [showWallpaperModal, setShowWallpaperModal] = useState(false);
  const [wallpaperSettings, setWallpaperSettings] = useState({
    url: 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?w=1920&h=1080&fit=crop',
    brightness: 0.6,
    blur: 0,
    opacity: 0.8,
    overlay: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 100%)'
  });
  
  const searchInputRef = useRef(null);
  const searchSuggestionsRef = useRef(null);
  const sidebarRef = useRef(null);

  // Predefined wallpapers
  const wallpapers = [
    { id: 1, name: 'macOS Default', url: 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?w=1920&h=1080&fit=crop', gradient: 'linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 100%)' },
    { id: 2, name: 'iOS Sunset', url: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=1920&h=1080&fit=crop', gradient: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 100%)' },
    { id: 3, name: 'Abstract Ocean', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&h=1080&fit=crop', gradient: 'linear-gradient(135deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 100%)' },
    { id: 4, name: 'Mountain Peak', url: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1920&h=1080&fit=crop', gradient: 'linear-gradient(135deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.45) 100%)' },
    { id: 5, name: 'Night City', url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920&h=1080&fit=crop', gradient: 'linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 100%)' },
    { id: 6, name: 'Forest Dreams', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&h=1080&fit=crop', gradient: 'linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 100%)' }
  ];

  // Navigation Items with Icons (No title header)
  const navigationItems = [
    { id: 'home', label: 'Home', icon: 'FaHome', path: '/', requiresAuth: false },
    { id: 'dashboard', label: 'Dashboard', icon: 'FaTachometerAlt', path: '/dashboard', badge: 'Live', requiresAuth: true },
    { id: 'profile', label: 'Profile', icon: 'FaUser', path: '/profile', requiresAuth: true },
    { id: 'chat', label: 'Trading Chat', icon: 'FaComments', path: '/chat', badge: '12', requiresAuth: true },
    { id: 'education', label: 'Academy', icon: 'FaGraduationCap', path: '/education', requiresAuth: true },
    { id: 'tools', label: 'Tools Suite', icon: 'FaToolbox', path: '/tools', requiresAuth: true },
    { id: 'library', label: 'Library', icon: 'FaBookOpen', path: '/education', requiresAuth: true },
    { id: 'cashier', label: 'Cashier', icon: 'FaDollarSign', path: '/cashier', requiresAuth: true },
    { id: 'friends', label: 'Network', icon: 'FaUserFriends', path: '/friends', requiresAuth: true },
    { id: 'settings', label: 'Settings', icon: 'FaCog', path: '/profile/settings', requiresAuth: true }
  ];

  // Activity Data
  const activities = useMemo(() => ({
    news: [
      { id: 1, type: 'news', title: 'Fed Announces Rate Decision', description: 'Interest rates remain unchanged at 5.25%', time: '2 hours ago', timestamp: Date.now() - 2 * 60 * 60 * 1000, icon: 'FaNewspaper', color: '#3b82f6', link: '/news', priority: 'high' },
      { id: 2, type: 'news', title: 'Bitcoin Surpasses $50,000', description: 'Cryptocurrency market sees major rally', time: '5 hours ago', timestamp: Date.now() - 5 * 60 * 60 * 1000, icon: 'FaBitcoin', color: '#f59e0b', link: '/news', priority: 'high' },
      { id: 3, type: 'news', title: 'Oil Prices Drop 5%', description: 'Supply concerns ease as production increases', time: '1 day ago', timestamp: Date.now() - 24 * 60 * 60 * 1000, icon: 'FaOilCan', color: '#10b981', link: '/news', priority: 'medium' }
    ],
    trades: [
      { id: 4, type: 'trade', title: 'AAPL +2.5%', description: 'Apple stock hits new all-time high', time: '1 hour ago', timestamp: Date.now() - 1 * 60 * 60 * 1000, icon: 'FaChartLine', color: '#34c759', link: '/dashboard', priority: 'high' },
      { id: 5, type: 'trade', title: 'TSLA -1.2%', description: 'Tesla shares dip after earnings report', time: '3 hours ago', timestamp: Date.now() - 3 * 60 * 60 * 1000, icon: 'FaChartLine', color: '#ff3b30', link: '/dashboard', priority: 'medium' },
      { id: 6, type: 'trade', title: 'Volume Alert: NVDA', description: 'Unusual options activity detected', time: '6 hours ago', timestamp: Date.now() - 6 * 60 * 60 * 1000, icon: 'FaBell', color: '#f59e0b', link: '/dashboard', priority: 'medium' }
    ],
    signals: [
      { id: 7, type: 'signal', title: 'Buy Signal: EUR/USD', description: 'Bullish divergence detected on 4H chart', time: '30 minutes ago', timestamp: Date.now() - 30 * 60 * 1000, icon: 'FaSignal', color: '#34c759', link: '/tools', priority: 'critical' },
      { id: 8, type: 'signal', title: 'Take Profit: BTC/USD', description: 'Target reached at $52,000', time: '2 hours ago', timestamp: Date.now() - 2 * 60 * 60 * 1000, icon: 'FaDollarSign', color: '#34c759', link: '/tools', priority: 'high' },
      { id: 9, type: 'signal', title: 'Stop Loss Triggered', description: 'GBP/JPY hits stop loss at 188.50', time: '4 hours ago', timestamp: Date.now() - 4 * 60 * 60 * 1000, icon: 'FaStop', color: '#ff3b30', link: '/tools', priority: 'critical' }
    ]
  }), []);

  // Get all activities sorted by time
  const getAllActivities = useCallback(() => {
    return [...activities.news, ...activities.trades, ...activities.signals]
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [activities]);

  // Get filtered activities based on tab
  const getFilteredActivities = useCallback(() => {
    if (activeActivityTab === 'all') return getAllActivities();
    if (activeActivityTab === 'news') return activities.news;
    if (activeActivityTab === 'trades') return activities.trades;
    if (activeActivityTab === 'signals') return activities.signals;
    return getAllActivities();
  }, [activeActivityTab, activities, getAllActivities]);

  // Get priority color for activity
  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'critical': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'medium': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  // Search Suggestions based on query
  useEffect(() => {
    if (searchQuery.length > 1) {
      const filtered = [
        ...navigationItems.filter(item => 
          item.label.toLowerCase().includes(searchQuery.toLowerCase())
        ),
        ...getAllActivities().filter(activity => 
          activity.title.toLowerCase().includes(searchQuery.toLowerCase())
        ),
        { id: 'search_all', label: `Search all for "${searchQuery}"`, icon: 'FaSearch', type: 'action' }
      ];
      setSearchSuggestions(filtered.slice(0, 6));
      setShowSearchSuggestions(true);
    } else {
      setSearchSuggestions([]);
      setShowSearchSuggestions(false);
    }
  }, [searchQuery, navigationItems, getAllActivities]);

  // Handle click outside for search suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchSuggestionsRef.current && !searchSuggestionsRef.current.contains(event.target) &&
          searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setShowSearchSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setIsSidebarExpanded(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load wallpaper settings
  useEffect(() => {
    const savedWallpaper = localStorage.getItem('wallpaper_settings');
    if (savedWallpaper) {
      try {
        const parsed = JSON.parse(savedWallpaper);
        setWallpaperSettings(parsed);
        applyWallpaperSettings(parsed);
      } catch (e) {
        console.error('Error loading wallpaper:', e);
      }
    } else {
      applyWallpaperSettings(wallpaperSettings);
    }
  }, []);

  const applyWallpaperSettings = (settings) => {
    document.documentElement.style.setProperty('--wallpaper-url', `url(${settings.url})`);
    document.documentElement.style.setProperty('--wallpaper-brightness', settings.brightness);
    document.documentElement.style.setProperty('--wallpaper-blur', `${settings.blur}px`);
    document.documentElement.style.setProperty('--wallpaper-opacity', settings.opacity);
    document.documentElement.style.setProperty('--wallpaper-overlay', settings.overlay);
  };

  const handleNavigation = (item) => {
    if (item.id === 'search_all') {
      handleSearch();
      return;
    }
    setActiveNavItem(item.id);
    if (item.path) {
      navigate(item.path);
    }
    if (isMobile) {
      setIsSidebarExpanded(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery);
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSearchSuggestions(false);
      setIsSearchFocused(false);
    }
  };

  const handleActivityClick = (activity) => {
    if (activity.link) {
      navigate(activity.link);
    }
    if (isMobile) {
      setIsSidebarExpanded(false);
    }
  };

  const toggleExpandActivity = (activityId) => {
    setExpandedActivity(expandedActivity === activityId ? null : activityId);
  };

  const handleWallpaperChange = (wallpaper) => {
    const newSettings = {
      ...wallpaperSettings,
      url: wallpaper.url,
      overlay: wallpaper.gradient
    };
    setWallpaperSettings(newSettings);
    applyWallpaperSettings(newSettings);
    localStorage.setItem('wallpaper_settings', JSON.stringify(newSettings));
    setShowWallpaperModal(false);
  };

  const updateWallpaperSetting = (key, value) => {
    const newSettings = { ...wallpaperSettings, [key]: value };
    setWallpaperSettings(newSettings);
    applyWallpaperSettings(newSettings);
    localStorage.setItem('wallpaper_settings', JSON.stringify(newSettings));
  };

  const renderIcon = (iconName, size = 20, className = '') => {
    if (!iconName || !Icons[iconName]) {
      return null;
    }
    const IconComponent = Icons[iconName];
    return React.createElement(IconComponent, { size: size, className: className });
  };

  // Sidebar width based on expansion state
  const sidebarWidth = isSidebarExpanded ? (isSidebarHovered || !isMobile ? '280px' : '72px') : '0px';
  const mainMarginLeft = isSidebarExpanded ? (isSidebarHovered || !isMobile ? '280px' : '72px') : '0px';

  return (
    <div className={`auth-homepage ${isMobile ? 'mobile-mode' : 'desktop-mode'} ${isSidebarExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
      {/* Wallpaper Controls - Floating Buttons */}
      <div className="wallpaper-controls">
        <button className="wallpaper-btn" onClick={() => setShowWallpaperModal(true)}>
          {renderIcon('FaImage', 18)}
        </button>
        <button className="wallpaper-btn" onClick={() => updateWallpaperSetting('brightness', Math.min(1, wallpaperSettings.brightness + 0.1))}>
          {renderIcon('FaSun', 16)}
        </button>
        <button className="wallpaper-btn" onClick={() => updateWallpaperSetting('brightness', Math.max(0.3, wallpaperSettings.brightness - 0.1))}>
          {renderIcon('FaMoon', 14)}
        </button>
      </div>

      {/* Wallpaper Modal */}
      {showWallpaperModal && (
        <div className="wallpaper-modal" onClick={() => setShowWallpaperModal(false)}>
          <div className="wallpaper-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="wallpaper-modal-header">
              <h3>Choose Wallpaper</h3>
              <button className="close-modal" onClick={() => setShowWallpaperModal(false)}>
                {renderIcon('FaTimes', 20)}
              </button>
            </div>
            <div className="wallpaper-grid">
              {wallpapers.map(wallpaper => (
                <div
                  key={wallpaper.id}
                  className={`wallpaper-option ${wallpaperSettings.url === wallpaper.url ? 'selected' : ''}`}
                  style={{ backgroundImage: `url(${wallpaper.url})` }}
                  onClick={() => handleWallpaperChange(wallpaper)}
                />
              ))}
            </div>
            <div className="wallpaper-settings">
              <div className="wallpaper-setting">
                <label>Brightness</label>
                <input type="range" min="0.3" max="1" step="0.01" value={wallpaperSettings.brightness} onChange={(e) => updateWallpaperSetting('brightness', parseFloat(e.target.value))} />
              </div>
              <div className="wallpaper-setting">
                <label>Blur Effect</label>
                <input type="range" min="0" max="20" step="1" value={wallpaperSettings.blur} onChange={(e) => updateWallpaperSetting('blur', parseInt(e.target.value))} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* YouTube-style Side Navigation Panel with Activity Feed - No Header Title */}
      <aside 
        className={`side-navigation ${isSidebarExpanded ? 'expanded' : 'collapsed'} ${isSidebarHovered ? 'hovered' : ''}`}
        onMouseEnter={() => !isMobile && setIsSidebarHovered(true)}
        onMouseLeave={() => !isMobile && setIsSidebarHovered(false)}
        style={{ width: sidebarWidth }}
      >
        <div className="sidebar-container" ref={sidebarRef}>
          {/* Sidebar Toggle Button - No Logo/Header */}
          <div className="sidebar-toggle-wrapper">
            <button 
              className="sidebar-toggle-btn"
              onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
            >
              {renderIcon(isSidebarExpanded ? 'FaChevronLeft' : 'FaChevronRight', 16)}
            </button>
          </div>

          {/* Main Navigation Items */}
          <nav className="sidebar-nav">
            {navigationItems.map((item) => (
              <div 
                key={item.id} 
                className={`nav-item ${activeNavItem === item.id ? 'active' : ''}`}
                onClick={() => handleNavigation(item)}
              >
                <div className="nav-item-icon">
                  {renderIcon(item.icon, 22)}
                  {item.badge && <span className="nav-badge">{item.badge}</span>}
                </div>
                {(isSidebarExpanded && (isSidebarHovered || !isMobile)) && (
                  <span className="nav-item-label">{item.label}</span>
                )}
              </div>
            ))}
          </nav>

          {/* Recent Activity Section in Sidebar */}
          <div className="sidebar-activity-section">
            {(isSidebarExpanded && (isSidebarHovered || !isMobile)) ? (
              <>
                <div className="activity-section-header">
                  <div className="activity-header-title">
                    {renderIcon('FaClock', 16)}
                    <h3>Recent Activity</h3>
                  </div>
                  <div className="activity-tabs">
                    <button 
                      className={`activity-tab ${activeActivityTab === 'all' ? 'active' : ''}`}
                      onClick={(e) => { e.stopPropagation(); setActiveActivityTab('all'); }}
                    >
                      All
                    </button>
                    <button 
                      className={`activity-tab ${activeActivityTab === 'news' ? 'active' : ''}`}
                      onClick={(e) => { e.stopPropagation(); setActiveActivityTab('news'); }}
                    >
                      News
                    </button>
                    <button 
                      className={`activity-tab ${activeActivityTab === 'trades' ? 'active' : ''}`}
                      onClick={(e) => { e.stopPropagation(); setActiveActivityTab('trades'); }}
                    >
                      Trades
                    </button>
                    <button 
                      className={`activity-tab ${activeActivityTab === 'signals' ? 'active' : ''}`}
                      onClick={(e) => { e.stopPropagation(); setActiveActivityTab('signals'); }}
                    >
                      Signals
                    </button>
                  </div>
                </div>
                <div className="activity-list">
                  {getFilteredActivities().slice(0, 8).map((activity) => (
                    <div 
                      key={activity.id} 
                      className={`activity-item ${expandedActivity === activity.id ? 'expanded' : ''}`}
                    >
                      <div className="activity-item-header" onClick={() => handleActivityClick(activity)}>
                        <div className="activity-icon" style={{ background: activity.color }}>
                          {renderIcon(activity.icon, 16)}
                        </div>
                        <div className="activity-info">
                          <div className="activity-title">{activity.title}</div>
                          <div className="activity-time">{activity.time}</div>
                        </div>
                        <button 
                          className="activity-expand-btn"
                          onClick={(e) => { e.stopPropagation(); toggleExpandActivity(activity.id); }}
                        >
                          {renderIcon(expandedActivity === activity.id ? 'FaChevronUp' : 'FaChevronDown', 10)}
                        </button>
                      </div>
                      {expandedActivity === activity.id && (
                        <div className="activity-expanded-content" onClick={() => handleActivityClick(activity)}>
                          <p className="activity-description">{activity.description}</p>
                          <div className="activity-priority" style={{ color: getPriorityColor(activity.priority) }}>
                            {renderIcon('FaFlag', 10)}
                            <span>{activity.priority?.toUpperCase()}</span>
                          </div>
                          <button className="activity-action-btn">
                            View Details {renderIcon('FaArrowRight', 10)}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  {getFilteredActivities().length > 8 && (
                    <div className="view-all-activities" onClick={() => navigate('/activity')}>
                      View all activities {renderIcon('FaArrowRight', 10)}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="collapsed-activity-indicator">
                <div className="activity-dot" />
                <div className="activity-dot" />
                <div className="activity-dot" />
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="auth-main-content" style={{ marginLeft: mainMarginLeft }}>
        {/* Hero Welcome Section */}
        <div className="welcome-section">
          <Container>
            <div className="welcome-content">
              <h1 className="welcome-title">
                Welcome back, <span className="user-name">{user?.name || 'Trader'}</span>
              </h1>
              <p className="welcome-description">
                Your premium trading dashboard is ready. Track performance, discover insights, and elevate your trading.
              </p>
            </div>
          </Container>
        </div>

        {/* Google-style Search Bar - Below Hero Section */}
        <div className="search-section">
          <Container>
            <div className="search-container">
              <div className={`search-wrapper ${isSearchFocused ? 'focused' : ''}`}>
                <div className="search-icon">
                  {renderIcon('FaSearch', 18)}
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  className="search-input"
                  placeholder="Search trading tools, news, signals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                {searchQuery && (
                  <button className="search-clear" onClick={() => setSearchQuery('')}>
                    {renderIcon('FaTimes', 14)}
                  </button>
                )}
                <button className="search-btn" onClick={handleSearch}>
                  Search
                </button>
              </div>
              
              {/* Search Suggestions */}
              {showSearchSuggestions && searchSuggestions.length > 0 && (
                <div className="search-suggestions" ref={searchSuggestionsRef}>
                  {searchSuggestions.map((suggestion, index) => (
                    <div 
                      key={index}
                      className="suggestion-item"
                      onClick={() => handleNavigation(suggestion)}
                    >
                      <div className="suggestion-icon">
                        {renderIcon(suggestion.icon || (suggestion.type === 'action' ? 'FaSearch' : 'FaLink'), 14)}
                      </div>
                      <div className="suggestion-text">{suggestion.label}</div>
                      {suggestion.type === 'action' && (
                        <div className="suggestion-action">Search</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Container>
        </div>

        {/* NOTHING BELOW SEARCH BAR - Everything removed as requested */}
      </main>

      {/* Mobile Overlay */}
      {isMobile && isSidebarExpanded && (
        <div className="mobile-overlay" onClick={() => setIsSidebarExpanded(false)} />
      )}
    </div>
  );
};

export default AuthHomePage;