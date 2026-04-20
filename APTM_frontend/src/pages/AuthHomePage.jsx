// src/pages/AuthHomePage.jsx - Premium Edition with macOS/iOS Style
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as Icons from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import Container from '../components/ui/Container';
import './AuthHomePage.css';

const AuthHomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // State Management
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeNavItem, setActiveNavItem] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  
  // Filter State - Multiple selection for people
  const [activeFilters, setActiveFilters] = useState(['all']);
  const [peopleFilters, setPeopleFilters] = useState({
    traders: [],
    developers: false,
    students: false,
    friends: false
  });
  
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
  const filterBarRef = useRef(null);
  const mainContentRef = useRef(null);

  // Filter categories
  const filterCategories = [
    { id: 'all', label: 'All', icon: 'FaGlobe' },
    { id: 'videos', label: 'Videos', icon: 'FaVideo' },
    { id: 'charts', label: 'Charts', icon: 'FaChartBar' },
    { id: 'academies', label: 'Academies', icon: 'FaGraduationCap' },
    { id: 'tools', label: 'Tools', icon: 'FaToolbox' },
    { id: 'people', label: 'People', icon: 'FaUsers', hasSubmenu: true }
  ];

  // People subcategories
  const peopleSubCategories = {
    traders: {
      label: 'Traders',
      icon: 'FaChartLine',
      subcategories: ['new', 'advance', 'beginner', 'pro', 'mentor']
    },
    developers: { label: 'Developers', icon: 'FaCode' },
    students: { label: 'Students', icon: 'FaUserGraduate' },
    friends: { label: 'Friends', icon: 'FaUserFriends' }
  };

  // Extended wallpapers collection with candlestick charts
  const wallpapers = [
    // Nature & Landscapes
    { 
      id: 1, 
      name: 'macOS Default', 
      url: 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?w=1920&h=1080&fit=crop', 
      gradient: 'linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 100%)',
      category: 'nature'
    },
    { 
      id: 2, 
      name: 'iOS Sunset', 
      url: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=1920&h=1080&fit=crop', 
      gradient: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 100%)',
      category: 'nature'
    },
    { 
      id: 3, 
      name: 'Abstract Ocean', 
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&h=1080&fit=crop', 
      gradient: 'linear-gradient(135deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 100%)',
      category: 'nature'
    },
    { 
      id: 4, 
      name: 'Mountain Peak', 
      url: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1920&h=1080&fit=crop', 
      gradient: 'linear-gradient(135deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.45) 100%)',
      category: 'nature'
    },
    { 
      id: 5, 
      name: 'Night City', 
      url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920&h=1080&fit=crop', 
      gradient: 'linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 100%)',
      category: 'city'
    },
    { 
      id: 6, 
      name: 'Forest Dreams', 
      url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&h=1080&fit=crop', 
      gradient: 'linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 100%)',
      category: 'nature'
    },
    // Candlestick Chart Wallpapers
    {
      id: 7,
      name: 'Bullish Candles',
      url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1920&h=1080&fit=crop',
      gradient: 'linear-gradient(135deg, rgba(34, 197, 94, 0.3) 0%, rgba(0, 0, 0, 0.6) 100%)',
      category: 'trading'
    },
    {
      id: 8,
      name: 'Dark Chart',
      url: 'https://images.unsplash.com/photo-1535320903710-d993d3d77d29?w=1920&h=1080&fit=crop',
      gradient: 'linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(20, 30, 48, 0.7) 100%)',
      category: 'trading'
    },
    {
      id: 9,
      name: 'Forex Chart',
      url: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f801?w=1920&h=1080&fit=crop',
      gradient: 'linear-gradient(135deg, rgba(0, 100, 200, 0.4) 0%, rgba(0, 0, 0, 0.7) 100%)',
      category: 'trading'
    },
    {
      id: 10,
      name: 'Crypto Bull Run',
      url: 'https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=1920&h=1080&fit=crop',
      gradient: 'linear-gradient(135deg, rgba(247, 147, 26, 0.4) 0%, rgba(0, 0, 0, 0.65) 100%)',
      category: 'trading'
    },
    {
      id: 11,
      name: 'Technical Analysis',
      url: 'https://images.unsplash.com/photo-1642790551116-18e150f248e3?w=1920&h=1080&fit=crop',
      gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.35) 0%, rgba(0, 0, 0, 0.7) 100%)',
      category: 'trading'
    },
    {
      id: 12,
      name: 'Market Data',
      url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1920&h=1080&fit=crop',
      gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(0, 0, 0, 0.65) 100%)',
      category: 'trading'
    },
    // Abstract & Minimal
    {
      id: 13,
      name: 'Neon Grid',
      url: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=1920&h=1080&fit=crop',
      gradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.4) 0%, rgba(0, 0, 0, 0.75) 100%)',
      category: 'abstract'
    },
    {
      id: 14,
      name: 'Geometric Dark',
      url: 'https://images.unsplash.com/photo-1553356084-58ef4a67b2a7?w=1920&h=1080&fit=crop',
      gradient: 'linear-gradient(135deg, rgba(0, 0, 0, 0.85) 0%, rgba(30, 30, 40, 0.8) 100%)',
      category: 'abstract'
    },
    {
      id: 15,
      name: 'Finance Abstract',
      url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&h=1080&fit=crop',
      gradient: 'linear-gradient(135deg, rgba(0, 150, 255, 0.3) 0%, rgba(0, 0, 0, 0.7) 100%)',
      category: 'abstract'
    }
  ];

  const wallpaperCategories = [
    { id: 'all', label: 'All' },
    { id: 'nature', label: 'Nature' },
    { id: 'city', label: 'City' },
    { id: 'trading', label: 'Trading Charts' },
    { id: 'abstract', label: 'Abstract' }
  ];
  
  const [activeWallpaperCategory, setActiveWallpaperCategory] = useState('all');

  // Navigation Items with Icons
  const navigationItems = [
    { id: 'home', label: 'Home', icon: 'FaHome', path: '/' },
    { id: 'dashboard', label: 'Dashboard', icon: 'FaTachometerAlt', path: '/dashboard' },
    { id: 'profile', label: 'Profile', icon: 'FaUser', path: '/profile' },
    { id: 'chat', label: 'Trading Chat', icon: 'FaComments', path: '/chat' },
    { id: 'education', label: 'Academy', icon: 'FaGraduationCap', path: '/education' },
    { id: 'tools', label: 'Tools Suite', icon: 'FaToolbox', path: '/tools' },
    { id: 'library', label: 'Library', icon: 'FaBookOpen', path: '/education' },
    { id: 'cashier', label: 'Cashier', icon: 'FaDollarSign', path: '/cashier' },
    { id: 'friends', label: 'Network', icon: 'FaUserFriends', path: '/friends' },
    { id: 'settings', label: 'Settings', icon: 'FaCog', path: '/profile/settings' }
  ];

  // Filter handlers with multiple selection
  const handleFilterToggle = (filterId) => {
    setActiveFilters(prev => {
      if (filterId === 'all') {
        return ['all'];
      }
      
      const newFilters = prev.filter(f => f !== 'all');
      
      if (newFilters.includes(filterId)) {
        const filtered = newFilters.filter(f => f !== filterId);
        return filtered.length === 0 ? ['all'] : filtered;
      } else {
        return [...newFilters, filterId];
      }
    });
  };

  const handlePeopleFilterToggle = (category, subcategory = null) => {
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

  const filteredWallpapers = useCallback(() => {
    if (activeWallpaperCategory === 'all') return wallpapers;
    return wallpapers.filter(w => w.category === activeWallpaperCategory);
  }, [activeWallpaperCategory]);

  useEffect(() => {
    if (searchQuery.length > 1) {
      const filtered = [
        ...navigationItems.filter(item => 
          item.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
      ];
      setSearchSuggestions(filtered.slice(0, 6));
      setShowSearchSuggestions(true);
    } else {
      setSearchSuggestions([]);
      setShowSearchSuggestions(false);
    }
  }, [searchQuery, navigationItems]);

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

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Adjust main content margin based on header height
  useEffect(() => {
    const adjustContentMargin = () => {
      const header = document.querySelector('.main-header');
      if (header && mainContentRef.current) {
        const headerHeight = header.offsetHeight;
        mainContentRef.current.style.paddingTop = `${headerHeight}px`;
        
        // Also adjust side panel top position
        const sidePanel = document.querySelector('.side-panel');
        if (sidePanel) {
          sidePanel.style.top = `${headerHeight}px`;
        }
      }
    };

    adjustContentMargin();
    window.addEventListener('resize', adjustContentMargin);
    
    // Observe header changes
    const observer = new ResizeObserver(adjustContentMargin);
    const header = document.querySelector('.main-header');
    if (header) observer.observe(header);

    return () => {
      window.removeEventListener('resize', adjustContentMargin);
      observer.disconnect();
    };
  }, []);

  const applyWallpaperSettings = (settings) => {
    document.documentElement.style.setProperty('--wallpaper-url', `url(${settings.url})`);
    document.documentElement.style.setProperty('--wallpaper-brightness', settings.brightness);
    document.documentElement.style.setProperty('--wallpaper-blur', `${settings.blur}px`);
    document.documentElement.style.setProperty('--wallpaper-opacity', settings.opacity);
    document.documentElement.style.setProperty('--wallpaper-overlay', settings.overlay);
  };

  const handleNavigation = (item) => {
    setActiveNavItem(item.id);
    if (item.path) {
      navigate(item.path);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSearchSuggestions(false);
      setIsSearchFocused(false);
    }
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
    if (!iconName || !Icons[iconName]) return null;
    const IconComponent = Icons[iconName];
    return React.createElement(IconComponent, { size: size, className: className });
  };

  // Get active filter label
  const getActiveFilterLabel = () => {
    if (activeFilters.includes('all')) return 'All';
    
    const labels = activeFilters.map(f => {
      const category = filterCategories.find(c => c.id === f);
      return category?.label || f;
    });
    
    if (activeFilters.includes('people')) {
      const peopleLabels = [];
      if (peopleFilters.traders.length > 0) {
        peopleLabels.push(`Traders: ${peopleFilters.traders.join(', ')}`);
      }
      if (peopleFilters.developers) peopleLabels.push('Developers');
      if (peopleFilters.students) peopleLabels.push('Students');
      if (peopleFilters.friends) peopleLabels.push('Friends');
      
      if (peopleLabels.length > 0) {
        return `${labels.join(' + ')} (${peopleLabels.join('; ')})`;
      }
    }
    
    return labels.join(' + ');
  };

  return (
    <div className={`auth-homepage ${isMobile ? 'mobile-mode' : 'desktop-mode'}`}>
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
            
            {/* Wallpaper Category Tabs */}
            <div className="wallpaper-categories">
              {wallpaperCategories.map(category => (
                <button
                  key={category.id}
                  className={`category-tab ${activeWallpaperCategory === category.id ? 'active' : ''}`}
                  onClick={() => setActiveWallpaperCategory(category.id)}
                >
                  {category.label}
                </button>
              ))}
            </div>
            
            <div className="wallpaper-grid">
              {filteredWallpapers().map(wallpaper => (
                <div
                  key={wallpaper.id}
                  className={`wallpaper-option ${wallpaperSettings.url === wallpaper.url ? 'selected' : ''}`}
                  style={{ backgroundImage: `url(${wallpaper.url})` }}
                  onClick={() => handleWallpaperChange(wallpaper)}
                >
                  <span className="wallpaper-name">{wallpaper.name}</span>
                </div>
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

      {/* macOS/iOS Style Side Navigation Panel - No hover effects */}
      <div className={`side-panel ${isSidebarCollapsed ? 'collapsed' : 'expanded'}`}>
        <div className="panel-header">
          <button 
            className="collapse-btn"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          >
            {renderIcon(isSidebarCollapsed ? 'FaChevronRight' : 'FaChevronLeft', 14)}
          </button>
        </div>

        <nav className="panel-nav">
          {navigationItems.map((item) => (
            <div 
              key={item.id} 
              className={`nav-item ${activeNavItem === item.id ? 'active' : ''}`}
              onClick={() => handleNavigation(item)}
            >
              <div className="nav-icon">
                {renderIcon(item.icon, 22)}
              </div>
              {!isSidebarCollapsed && <span className="nav-label">{item.label}</span>}
            </div>
          ))}
        </nav>

        {!isSidebarCollapsed && (
          <div className="panel-footer">
            <div className="user-info">
              <div className="user-avatar">
                {renderIcon('FaUserCircle', 32)}
              </div>
              <div className="user-details">
                <span className="user-name">{user?.name || 'Trader'}</span>
                <span className="user-status">Online</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content - No hero section */}
      <main ref={mainContentRef} className="main-content">
        {/* Sticky Search and Filter Bar */}
        <div ref={filterBarRef} className="sticky-search-filter">
          <Container>
            {/* Google-style Search Bar */}
            <div className="search-section">
              <div className="search-container">
                <div className={`search-box ${isSearchFocused ? 'focused' : ''}`}>
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
                    <button className="clear-btn" onClick={() => setSearchQuery('')}>
                      {renderIcon('FaTimes', 14)}
                    </button>
                  )}
                  <button className="search-button" onClick={handleSearch}>
                    Search
                  </button>
                </div>
                
                {showSearchSuggestions && searchSuggestions.length > 0 && (
                  <div className="search-suggestions" ref={searchSuggestionsRef}>
                    {searchSuggestions.map((suggestion, index) => (
                      <div key={index} className="suggestion" onClick={() => handleNavigation(suggestion)}>
                        <div className="suggestion-icon">
                          {renderIcon(suggestion.icon || 'FaSearch', 14)}
                        </div>
                        <div className="suggestion-text">{suggestion.label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Filter Buttons Section */}
            <div className="filter-section">
              <div className="filter-container">
                <div className="filter-label">Filters:</div>
                <div className="filter-buttons">
                  {filterCategories.map(category => (
                    <div key={category.id} className="filter-group">
                      <button
                        className={`filter-btn ${activeFilters.includes(category.id) ? 'active' : ''}`}
                        onClick={() => handleFilterToggle(category.id)}
                      >
                        {renderIcon(category.icon, 16)}
                        <span>{category.label}</span>
                        {category.hasSubmenu && renderIcon('FaChevronDown', 10, 'dropdown-arrow')}
                      </button>
                      
                      {/* People Submenu - Multiple selection */}
                      {category.id === 'people' && activeFilters.includes('people') && (
                        <div className="people-submenu">
                          {/* Traders with nested subcategories */}
                          <div className="submenu-group">
                            <button
                              className={`submenu-btn ${peopleFilters.traders.length > 0 ? 'active' : ''}`}
                              onClick={() => {}}
                            >
                              {renderIcon(peopleSubCategories.traders.icon, 14)}
                              <span>{peopleSubCategories.traders.label}</span>
                              {renderIcon('FaChevronRight', 10)}
                            </button>
                            
                            <div className="nested-submenu">
                              {peopleSubCategories.traders.subcategories.map(sub => (
                                <button
                                  key={sub}
                                  className={`nested-btn ${peopleFilters.traders.includes(sub) ? 'active' : ''}`}
                                  onClick={() => handlePeopleFilterToggle('traders', sub)}
                                >
                                  <span className="checkbox-indicator">
                                    {peopleFilters.traders.includes(sub) ? '✓ ' : '○ '}
                                  </span>
                                  {sub.charAt(0).toUpperCase() + sub.slice(1)}
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          {/* Developers */}
                          <button
                            className={`submenu-btn ${peopleFilters.developers ? 'active' : ''}`}
                            onClick={() => handlePeopleFilterToggle('developers')}
                          >
                            <span className="checkbox-indicator">
                              {peopleFilters.developers ? '✓ ' : '○ '}
                            </span>
                            {renderIcon(peopleSubCategories.developers.icon, 14)}
                            <span>{peopleSubCategories.developers.label}</span>
                          </button>
                          
                          {/* Students */}
                          <button
                            className={`submenu-btn ${peopleFilters.students ? 'active' : ''}`}
                            onClick={() => handlePeopleFilterToggle('students')}
                          >
                            <span className="checkbox-indicator">
                              {peopleFilters.students ? '✓ ' : '○ '}
                            </span>
                            {renderIcon(peopleSubCategories.students.icon, 14)}
                            <span>{peopleSubCategories.students.label}</span>
                          </button>
                          
                          {/* Friends */}
                          <button
                            className={`submenu-btn ${peopleFilters.friends ? 'active' : ''}`}
                            onClick={() => handlePeopleFilterToggle('friends')}
                          >
                            <span className="checkbox-indicator">
                              {peopleFilters.friends ? '✓ ' : '○ '}
                            </span>
                            {renderIcon(peopleSubCategories.friends.icon, 14)}
                            <span>{peopleSubCategories.friends.label}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Active Filter Indicator */}
                {!activeFilters.includes('all') && (
                  <div className="active-filter-indicator">
                    <span>Active: {getActiveFilterLabel()}</span>
                    <button className="clear-filter" onClick={clearAllFilters}>
                      {renderIcon('FaTimes', 12)}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </Container>
        </div>

        {/* Content Area - Transparent with blur */}
        <div className="content-area">
          <Container>
            <div className="content-wrapper">
              <div className="content-card">
                <p className="placeholder-text">
                  {activeFilters.includes('all') && 'Showing all content...'}
                  {!activeFilters.includes('all') && `Showing filtered content: ${getActiveFilterLabel()}`}
                </p>
              </div>
            </div>
          </Container>
        </div>
      </main>

      {isMobile && !isSidebarCollapsed && (
        <div className="mobile-overlay" onClick={() => setIsSidebarCollapsed(true)} />
      )}
    </div>
  );
};

export default AuthHomePage;