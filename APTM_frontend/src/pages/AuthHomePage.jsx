// src/pages/AuthHomePage.jsx - Complete Redesign
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as Icons from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import './AuthHomePage.css';

const AuthHomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // State
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  
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

  // Navigation items
  const navItems = [
    { id: 'home', label: 'Home', icon: 'FaHome', path: '/' },
    { id: 'dashboard', label: 'Dashboard', icon: 'FaTachometerAlt', path: '/dashboard' },
    { id: 'profile', label: 'Profile', icon: 'FaUser', path: '/profile' },
    { id: 'education', label: 'Academy', icon: 'FaGraduationCap', path: '/education' },
    { id: 'tools', label: 'Tools', icon: 'FaToolbox', path: '/tools' },
    { id: 'library', label: 'Library', icon: 'FaBook', path: '/library' },
    { id: 'chat', label: 'Chat', icon: 'FaComments', path: '/chat' },
    { id: 'cashier', label: 'Cashier', icon: 'FaDollarSign', path: '/cashier' }
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
    { id: 6, name: 'Neon Grid', url: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=1920&h=1080&fit=crop', category: 'abstract' }
  ];

  const wallpaperCategories = [
    { id: 'all', label: 'All' },
    { id: 'nature', label: 'Nature' },
    { id: 'trading', label: 'Trading' },
    { id: 'city', label: 'City' },
    { id: 'abstract', label: 'Abstract' }
  ];

  const [activeWallpaperCategory, setActiveWallpaperCategory] = useState('all');

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setIsSidebarOpen(false);
      }
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

  // Search suggestions
  useEffect(() => {
    if (searchQuery.length > 1) {
      const filtered = navItems.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchSuggestions(filtered.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target) &&
          searchInputRef.current && !searchInputRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
      if (peopleMenuRef.current && !peopleMenuRef.current.contains(e.target)) {
        setShowPeopleMenu(false);
      }
      if (traderMenuRef.current && !traderMenuRef.current.contains(e.target)) {
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
    setActiveTab(item.id);
    if (item.path) {
      navigate(item.path);
    }
    setIsSidebarOpen(false);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSuggestions(false);
    }
  };

  const getActiveFilterLabel = () => {
    if (activeFilters.includes('all')) return 'All';
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

  const renderIcon = (name, size = 18) => {
    const Icon = Icons[name];
    return Icon ? <Icon size={size} /> : null;
  };

  return (
    <div className="auth-homepage">
      {/* Wallpaper Controls */}
      <div className="wallpaper-controls">
        <button className="wallpaper-btn" onClick={() => setShowWallpaperModal(true)}>
          {renderIcon('FaImage', 16)}
        </button>
        <button className="wallpaper-btn" onClick={() => updateWallpaper('brightness', Math.min(1, wallpaperSettings.brightness + 0.1))}>
          {renderIcon('FaSun', 14)}
        </button>
        <button className="wallpaper-btn" onClick={() => updateWallpaper('brightness', Math.max(0.3, wallpaperSettings.brightness - 0.1))}>
          {renderIcon('FaMoon', 14)}
        </button>
      </div>

      {/* Wallpaper Modal */}
      {showWallpaperModal && (
        <div className="wallpaper-modal" onClick={() => setShowWallpaperModal(false)}>
          <div className="wallpaper-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Choose Wallpaper</h3>
              <button className="close-modal" onClick={() => setShowWallpaperModal(false)}>
                {renderIcon('FaTimes', 18)}
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

      {/* Integrated Header */}
      <header className="auth-header">
        <div className="header-container">
          <div className="top-bar">
            {/* Logo */}
            <div className="logo">
              <div className="logo-icon">AP</div>
              <div className="logo-text">Alpha Phoenix<span>Trading</span></div>
            </div>

            {/* Centered Search */}
            <div className="search-wrapper">
              <div className="search-bar">
                <div className="search-icon">{renderIcon('FaSearch', 16)}</div>
                <input
                  ref={searchInputRef}
                  type="text"
                  className="search-input"
                  placeholder="Search trading tools, news, signals..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleSearch()}
                />
                {searchQuery && (
                  <button className="clear-search" onClick={() => setSearchQuery('')}>
                    {renderIcon('FaTimes', 12)}
                  </button>
                )}
              </div>
              
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="search-suggestions" ref={suggestionsRef}>
                  {searchSuggestions.map(item => (
                    <div key={item.id} className="suggestion-item" onClick={() => handleNavigation(item)}>
                      <div className="suggestion-icon">{renderIcon(item.icon, 14)}</div>
                      <div className="suggestion-text">{item.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="header-actions">
              <button className="notification-btn">
                {renderIcon('FaBell', 18)}
                <span className="notification-badge">3</span>
              </button>
              <button className="user-avatar-btn">
                {user?.name?.[0] || 'U'}
              </button>
              <button 
                className={`mobile-menu-toggle ${isSidebarOpen ? 'active' : ''}`}
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                <span></span>
                <span></span>
                <span></span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="nav-tabs">
            {navItems.map(item => (
              <button
                key={item.id}
                className={`nav-tab ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => handleNavigation(item)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Filter Chips */}
          <div className="filter-tabs">
            {filterOptions.map(filter => (
              <div key={filter.id} style={{ position: 'relative' }}>
                <button
                  className={`filter-chip ${activeFilters.includes(filter.id) ? 'active' : ''} ${filter.hasSubmenu ? 'has-submenu' : ''}`}
                  onClick={() => filter.hasSubmenu ? setShowPeopleMenu(!showPeopleMenu) : handleFilterClick(filter.id)}
                >
                  {filter.label}
                </button>
                
                {filter.hasSubmenu && showPeopleMenu && (
                  <div className="people-submenu" ref={peopleMenuRef}>
                    {/* Traders with nested */}
                    <div style={{ position: 'relative' }}>
                      <button 
                        className={`submenu-item ${peopleFilters.traders.length > 0 ? 'active' : ''}`}
                        onClick={() => setShowTraderMenu(!showTraderMenu)}
                      >
                        <span className="checkbox-mark">▶</span>
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
                              {peopleFilters.traders.includes(level) ? '✓ ' : '○ '}
                              {level}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <button 
                      className={`submenu-item ${peopleFilters.developers ? 'active' : ''}`}
                      onClick={() => handlePeopleFilter('developers')}
                    >
                      <span className="checkbox-mark">{peopleFilters.developers ? '✓' : '○'}</span>
                      <span>Developers</span>
                    </button>
                    <button 
                      className={`submenu-item ${peopleFilters.students ? 'active' : ''}`}
                      onClick={() => handlePeopleFilter('students')}
                    >
                      <span className="checkbox-mark">{peopleFilters.students ? '✓' : '○'}</span>
                      <span>Students</span>
                    </button>
                    <button 
                      className={`submenu-item ${peopleFilters.friends ? 'active' : ''}`}
                      onClick={() => handlePeopleFilter('friends')}
                    >
                      <span className="checkbox-mark">{peopleFilters.friends ? '✓' : '○'}</span>
                      <span>Friends</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Active Filters Display */}
          {!activeFilters.includes('all') && (
            <div className="active-filters">
              <div className="active-filter-badge">
                <span>Active: {getActiveFilterLabel()}</span>
              </div>
              <button className="clear-filters" onClick={clearAllFilters}>
                Clear all
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Sidebar */}
      {isMobile && (
        <>
          <div className={`nav-sidebar ${isSidebarOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
              <h3>Menu</h3>
              <button className="close-sidebar" onClick={() => setIsSidebarOpen(false)}>
                {renderIcon('FaTimes', 18)}
              </button>
            </div>
            <div className="sidebar-nav">
              {navItems.map(item => (
                <div
                  key={item.id}
                  className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => handleNavigation(item)}
                >
                  <div className="sidebar-nav-icon">{renderIcon(item.icon, 18)}</div>
                  <div className="sidebar-nav-label">{item.label}</div>
                </div>
              ))}
            </div>
            <div className="sidebar-footer">
              <div className="sidebar-avatar">
                {user?.name?.[0] || 'U'}
              </div>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{user?.name || 'Guest'}</div>
                <div className="sidebar-user-status">Online</div>
              </div>
            </div>
          </div>
          {isSidebarOpen && <div className="mobile-overlay" onClick={() => setIsSidebarOpen(false)} />}
        </>
      )}

      {/* Main Content */}
      <main className="content-area">
        <div className="content-card">
          <p>
            {activeFilters.includes('all') 
              ? 'Showing all content...' 
              : `Showing filtered content: ${getActiveFilterLabel()}`}
          </p>
        </div>
      </main>
    </div>
  );
};

export default AuthHomePage;