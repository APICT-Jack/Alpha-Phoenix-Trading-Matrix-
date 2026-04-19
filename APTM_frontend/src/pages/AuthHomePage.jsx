// src/pages/AuthHomePage.jsx - Premium Edition with YouTube-style Navigation & Integrated Activity Panel
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
  const [showMoreTools, setShowMoreTools] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedActivity, setExpandedActivity] = useState(null);
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'trade', message: 'AAPL up 2.5%', read: false, time: '5 min ago' },
    { id: 2, type: 'signal', message: 'New buy signal for BTC', read: false, time: '15 min ago' },
    { id: 3, type: 'news', message: 'Fed announces rate decision', read: true, time: '1 hour ago' }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sidebarScrollTop, setSidebarScrollTop] = useState(0);
  
  const searchInputRef = useRef(null);
  const searchSuggestionsRef = useRef(null);
  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);
  const sidebarRef = useRef(null);

  // Navigation Items with Icons and Sub-items
  const navigationItems = [
    { id: 'home', label: 'Home', icon: 'FaHome', path: '/', requiresAuth: false, divider: false },
    { id: 'dashboard', label: 'Dashboard', icon: 'FaTachometerAlt', path: '/dashboard', badge: 'Live', requiresAuth: true, divider: false },
    { id: 'profile', label: 'Profile', icon: 'FaUser', path: '/profile', requiresAuth: true, divider: false },
    { id: 'chat', label: 'Trading Chat', icon: 'FaComments', path: '/chat', badge: '12', requiresAuth: true, divider: false },
    { id: 'education', label: 'Academy', icon: 'FaGraduationCap', path: '/education', requiresAuth: true, divider: false },
    { id: 'tools', label: 'Tools Suite', icon: 'FaToolbox', path: '/tools', requiresAuth: true, divider: false },
    { id: 'library', label: 'Library', icon: 'FaBookOpen', path: '/education', requiresAuth: true, divider: false },
    { id: 'cashier', label: 'Cashier', icon: 'FaDollarSign', path: '/cashier', requiresAuth: true, divider: false },
    { id: 'friends', label: 'Network', icon: 'FaUserFriends', path: '/friends', requiresAuth: true, divider: true },
    { id: 'settings', label: 'Settings', icon: 'FaCog', path: '/profile/settings', requiresAuth: true, divider: false }
  ];

  // Activity Data - Will be displayed in sidebar
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

  // Advanced Tools Data
  const advancedTools = useMemo(() => [
    { id: 'scanner', icon: 'FaChartLine', title: 'Market Scanner Pro', description: 'AI-powered market scanning for high-probability setups', color: '#3b82f6', category: 'Analysis', popular: true },
    { id: 'ai_assistant', icon: 'FaRobot', title: 'AI Trading Assistant', description: '24/7 intelligent assistant with real-time insights', color: '#10b981', category: 'AI', popular: true },
    { id: 'live_trading', icon: 'FaVideo', title: 'Live Trading Room', description: 'Watch professional traders in real-time', color: '#ef4444', category: 'Live', popular: true },
    { id: 'podcasts', icon: 'FaPodcast', title: 'Trading Podcasts', description: 'Expert interviews and market analysis', color: '#8b5cf6', category: 'Education', popular: false },
    { id: 'news_aggregator', icon: 'FaNewspaper', title: 'News Aggregator', description: 'Real-time news from 100+ sources', color: '#f59e0b', category: 'News', popular: true },
    { id: 'portfolio_analytics', icon: 'FaChartPie', title: 'Portfolio Analytics', description: 'Advanced performance metrics and risk analysis', color: '#ec489a', category: 'Analytics', popular: true },
    { id: 'economic_calendar', icon: 'FaCalendarAlt', title: 'Economic Calendar', description: 'Earnings reports and economic events', color: '#14b8a6', category: 'Calendar', popular: false },
    { id: 'global_markets', icon: 'FaGlobe', title: 'Global Markets', description: 'Stocks, forex, crypto, and commodities', color: '#6b7280', category: 'Markets', popular: true },
    { id: 'risk_management', icon: 'FaShieldAlt', title: 'Risk Management Suite', description: 'Advanced risk analysis and position sizing', color: '#10b981', category: 'Risk', popular: false },
    { id: 'cloud_sync', icon: 'FaCloudUploadAlt', title: 'Cloud Sync', description: 'Sync your data across all devices', color: '#3b82f6', category: 'Sync', popular: false },
    { id: 'backtesting', icon: 'FaHistory', title: 'Strategy Backtester', description: 'Test your strategies with historical data', color: '#8b5cf6', category: 'Analysis', popular: true },
    { id: 'social_trading', icon: 'FaUsers', title: 'Social Trading', description: 'Copy top traders and share strategies', color: '#ec489a', category: 'Social', popular: false }
  ], []);

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
        ...advancedTools.filter(tool => 
          tool.title.toLowerCase().includes(searchQuery.toLowerCase())
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
  }, [searchQuery, navigationItems, advancedTools, getAllActivities]);

  // Handle click outside for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchSuggestionsRef.current && !searchSuggestionsRef.current.contains(event.target) &&
          searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setShowSearchSuggestions(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      if (mobile) setIsSidebarExpanded(false);
      else setIsSidebarExpanded(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle sidebar scroll
  useEffect(() => {
    const handleSidebarScroll = () => {
      if (sidebarRef.current) {
        setSidebarScrollTop(sidebarRef.current.scrollTop);
      }
    };
    if (sidebarRef.current) {
      sidebarRef.current.addEventListener('scroll', handleSidebarScroll);
    }
    return () => {
      if (sidebarRef.current) {
        sidebarRef.current.removeEventListener('scroll', handleSidebarScroll);
      }
    };
  }, []);

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
      // Implement search functionality
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

  const markNotificationRead = (id) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
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
      {/* YouTube-style Side Navigation Panel with Activity Feed */}
      <aside 
        className={`side-navigation ${isSidebarExpanded ? 'expanded' : 'collapsed'} ${isSidebarHovered ? 'hovered' : ''}`}
        onMouseEnter={() => !isMobile && setIsSidebarHovered(true)}
        onMouseLeave={() => !isMobile && setIsSidebarHovered(false)}
        style={{ width: sidebarWidth }}
      >
        <div className="sidebar-container" ref={sidebarRef}>
          {/* Sidebar Header with Logo */}
          <div className="sidebar-header">
            <div className="logo-container" onClick={() => handleNavigation({ id: 'home', path: '/' })}>
              {renderIcon('FaChartLine', 28, 'logo-icon')}
              {(isSidebarExpanded && (isSidebarHovered || !isMobile)) && (
                <span className="logo-text">TradePro</span>
              )}
            </div>
            <button 
              className="sidebar-toggle-btn"
              onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
            >
              {renderIcon(isSidebarExpanded ? 'FaChevronLeft' : 'FaChevronRight', 16)}
            </button>
          </div>

          {/* Main Navigation Items */}
          <nav className="sidebar-nav">
            {navigationItems.map((item, index) => (
              <React.Fragment key={item.id}>
                <div 
                  className={`nav-item ${activeNavItem === item.id ? 'active' : ''} ${item.divider ? 'with-divider' : ''}`}
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
                {item.divider && (isSidebarExpanded && (isSidebarHovered || !isMobile)) && (
                  <div className="sidebar-divider" />
                )}
              </React.Fragment>
            ))}
          </nav>

          {/* Recent Activity Section in Sidebar */}
          <div className="sidebar-activity-section">
            {(isSidebarExpanded && (isSidebarHovered || !isMobile)) && (
              <>
                <div className="activity-section-header">
                  <div className="activity-header-title">
                    {renderIcon('FaClock', 18)}
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
                      onClick={() => handleActivityClick(activity)}
                    >
                      <div className="activity-item-header">
                        <div className="activity-icon" style={{ background: activity.color }}>
                          {renderIcon(activity.icon, 18)}
                        </div>
                        <div className="activity-info">
                          <div className="activity-title">{activity.title}</div>
                          <div className="activity-time">{activity.time}</div>
                        </div>
                        <button 
                          className="activity-expand-btn"
                          onClick={(e) => { e.stopPropagation(); toggleExpandActivity(activity.id); }}
                        >
                          {renderIcon(expandedActivity === activity.id ? 'FaChevronUp' : 'FaChevronDown', 12)}
                        </button>
                      </div>
                      {expandedActivity === activity.id && (
                        <div className="activity-expanded-content">
                          <p className="activity-description">{activity.description}</p>
                          <div className="activity-priority" style={{ color: getPriorityColor(activity.priority) }}>
                            {renderIcon('FaFlag', 12)}
                            <span>{activity.priority?.toUpperCase()}</span>
                          </div>
                          <button className="activity-action-btn">
                            View Details {renderIcon('FaArrowRight', 12)}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  {getFilteredActivities().length > 8 && (
                    <div className="view-all-activities" onClick={() => navigate('/activity')}>
                      View all activities {renderIcon('FaArrowRight', 12)}
                    </div>
                  )}
                </div>
              </>
            )}
            {(!isSidebarExpanded || (!isSidebarHovered && isMobile)) && (
              <div className="collapsed-activity-indicator">
                <div className="activity-dot" />
                <div className="activity-dot" />
                <div className="activity-dot" />
              </div>
            )}
          </div>

          {/* User Profile Section in Sidebar */}
          {(isSidebarExpanded && (isSidebarHovered || !isMobile)) && (
            <div className="sidebar-user-section">
              <div className="sidebar-user-info" onClick={() => setShowUserMenu(!showUserMenu)}>
                <div className="user-avatar">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user?.name} />
                  ) : (
                    <span>{user?.name?.charAt(0) || 'U'}</span>
                  )}
                </div>
                <div className="user-details">
                  <div className="user-name">{user?.name || 'Guest User'}</div>
                  <div className="user-email">{user?.email || 'guest@example.com'}</div>
                </div>
                {renderIcon('FaChevronDown', 12, 'user-menu-icon')}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="auth-main-content" style={{ marginLeft: mainMarginLeft }}>
        {/* Top Navigation Bar */}
        <header className="top-navbar">
          <Container>
            <div className="navbar-container">
              {/* Mobile menu toggle */}
              {isMobile && (
                <button 
                  className="mobile-menu-toggle"
                  onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
                >
                  {renderIcon('FaBars', 24)}
                </button>
              )}

              {/* Right side actions */}
              <div className="navbar-actions">
                <button 
                  className="notification-btn"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  {renderIcon('FaBell', 20)}
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="notification-badge">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </button>
                
                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="notifications-dropdown" ref={notificationRef}>
                    <div className="dropdown-header">
                      <h4>Notifications</h4>
                      <button onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}>
                        Mark all read
                      </button>
                    </div>
                    <div className="notifications-list">
                      {notifications.map(notif => (
                        <div 
                          key={notif.id} 
                          className={`notification-item ${!notif.read ? 'unread' : ''}`}
                          onClick={() => markNotificationRead(notif.id)}
                        >
                          <div className="notification-content">
                            <div className="notification-message">{notif.message}</div>
                            <div className="notification-time">{notif.time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="user-menu-container" ref={userMenuRef}>
                  <button 
                    className="user-menu-btn"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                  >
                    <div className="user-avatar-small">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user?.name} />
                      ) : (
                        <span>{user?.name?.charAt(0) || 'U'}</span>
                      )}
                    </div>
                  </button>
                  
                  {showUserMenu && (
                    <div className="user-menu-dropdown">
                      <div className="dropdown-user-info">
                        <div className="user-avatar-dropdown">
                          {user?.avatar ? (
                            <img src={user.avatar} alt={user?.name} />
                          ) : (
                            <span>{user?.name?.charAt(0) || 'U'}</span>
                          )}
                        </div>
                        <div className="user-info-dropdown">
                          <div className="user-name-dropdown">{user?.name || 'Guest User'}</div>
                          <div className="user-email-dropdown">{user?.email || 'guest@example.com'}</div>
                        </div>
                      </div>
                      <div className="dropdown-divider" />
                      <div className="dropdown-menu-items">
                        <div className="dropdown-item" onClick={() => navigate('/profile')}>
                          {renderIcon('FaUser', 16)} Profile
                        </div>
                        <div className="dropdown-item" onClick={() => navigate('/profile/settings')}>
                          {renderIcon('FaCog', 16)} Settings
                        </div>
                        <div className="dropdown-divider" />
                        <div className="dropdown-item" onClick={() => { /* Handle logout */ }}>
                          {renderIcon('FaSignOutAlt', 16)} Logout
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Container>
        </header>

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

        {/* Google-style Search Bar */}
        <div className="search-section">
          <Container>
            <div className="search-container">
              <div className={`search-wrapper ${isSearchFocused ? 'focused' : ''}`}>
                <div className="search-icon">
                  {renderIcon('FaSearch', 20)}
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
                    {renderIcon('FaTimes', 16)}
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
                        {renderIcon(suggestion.icon || (suggestion.type === 'action' ? 'FaSearch' : 'FaLink'), 16)}
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

        {/* Main Features Section */}
        <section className="main-features-section">
          <Container>
            <div className="section-header">
              <h2 className="section-title">Your Dashboard</h2>
              <p className="section-subtitle">Quick access to your favorite tools and features</p>
            </div>
            
            <div className="features-grid">
              {navigationItems.slice(0, 8).map((item) => (
                <div 
                  key={item.id} 
                  className={`feature-card ${activeNavItem === item.id ? 'active' : ''}`}
                  onClick={() => handleNavigation(item)}
                >
                  <div className="feature-card-icon" style={{ color: item.id === 'dashboard' ? '#3b82f6' : '#6b7280' }}>
                    {renderIcon(item.icon, 32)}
                  </div>
                  <div className="feature-card-content">
                    <h3 className="feature-title">{item.label}</h3>
                    <p className="feature-description">
                      {item.id === 'dashboard' && 'View real-time analytics and performance metrics'}
                      {item.id === 'profile' && 'Manage your personal information and preferences'}
                      {item.id === 'chat' && 'Connect with traders in real-time discussions'}
                      {item.id === 'education' && 'Access premium courses and learning materials'}
                      {item.id === 'tools' && 'Professional-grade trading tools and indicators'}
                      {item.id === 'library' && 'Curated library of trading resources'}
                      {item.id === 'cashier' && 'Secure deposits, withdrawals, and transactions'}
                      {item.id === 'friends' && 'Build your trading network and community'}
                    </p>
                    {item.badge && <div className="feature-badge">{item.badge}</div>}
                  </div>
                  <div className="feature-arrow">
                    {renderIcon('FaArrowRight', 16)}
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* Advanced Tools Section */}
        <section className="advanced-tools-section">
          <Container>
            <div className="section-header">
              <h2 className="section-title">Advanced Trading Suite</h2>
              <p className="section-subtitle">Professional-grade tools to elevate your strategy</p>
            </div>
            <div className="tools-grid">
              {(showMoreTools ? advancedTools : advancedTools.slice(0, 8)).map((tool) => (
                <div key={tool.id} className="tool-card">
                  <div className="tool-card-icon" style={{ color: tool.color }}>
                    {renderIcon(tool.icon, 28)}
                  </div>
                  <div className="tool-card-content">
                    <h4 className="tool-title">
                      {tool.title}
                      {tool.popular && <span className="popular-badge">Popular</span>}
                    </h4>
                    <p className="tool-description">{tool.description}</p>
                    <div className="tool-category">{tool.category}</div>
                  </div>
                </div>
              ))}
            </div>
            {!showMoreTools && advancedTools.length > 8 && (
              <div className="show-more-container">
                <button className="show-more-btn" onClick={() => setShowMoreTools(true)}>
                  {renderIcon('FaPlus', 14)} Explore All {advancedTools.length} Tools
                </button>
              </div>
            )}
          </Container>
        </section>

        <Footer />
      </main>

      {/* Mobile Overlay */}
      {isMobile && isSidebarExpanded && (
        <div className="mobile-overlay" onClick={() => setIsSidebarExpanded(false)} />
      )}
    </div>
  );
};

export default AuthHomePage;