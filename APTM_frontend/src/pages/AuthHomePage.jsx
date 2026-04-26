// src/pages/AuthHomePage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const [activeActivityTab, setActiveActivityTab] = useState('news'); // news, trades, chats, updates
  
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
  const [isBottomNavExpanded, setIsBottomNavExpanded] = useState(false);

  // Bottom navigation items - icons only on mobile, labels on desktop
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

  // Recent activity tabs
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

  // Mock search results data - posts and people
  const mockPosts = [
    { id: 1, title: 'Introduction to Trading', description: 'Learn the basics of trading', icon: 'FaVideo', type: 'video', author: 'CryptoMaster', likes: 234, comments: 45, timeAgo: '2 hours ago' },
    { id: 2, title: 'Bitcoin Price Analysis', description: 'Daily BTC market update with key levels', icon: 'FaChartLine', type: 'chart', author: 'BTCWhale', likes: 567, comments: 89, timeAgo: '5 hours ago' },
    { id: 3, title: 'Trading Academy', description: 'Complete trading course for beginners', icon: 'FaGraduationCap', type: 'academy', author: 'EduTrader', likes: 1234, comments: 234, timeAgo: '1 day ago' },
    { id: 4, title: 'Profit Calculator Tool', description: 'Calculate your trading profits easily', icon: 'FaCalculator', type: 'tool', author: 'ToolMaster', likes: 89, comments: 12, timeAgo: '3 days ago' },
    { id: 5, title: 'Ethereum Technicals', description: 'ETH support and resistance analysis', icon: 'FaChartLine', type: 'chart', author: 'ETHSage', likes: 345, comments: 56, timeAgo: '1 day ago' },
    { id: 6, title: 'Risk Management Guide', description: 'Manage your portfolio risk effectively', icon: 'FaShieldAlt', type: 'tool', author: 'RiskPro', likes: 678, comments: 123, timeAgo: '4 days ago' }
  ];

  const mockPeople = [
    { id: 1, name: 'John Trader', username: '@johntrader', avatar: 'JT', type: 'trader', followers: 1234, isFollowing: false },
    { id: 2, name: 'Sarah Developer', username: '@sarahdev', avatar: 'SD', type: 'developer', followers: 5678, isFollowing: true },
    { id: 3, name: 'Mike Student', username: '@mikestudent', avatar: 'MS', type: 'student', followers: 234, isFollowing: false },
    { id: 4, name: 'Emily Mentor', username: '@ementor', avatar: 'EM', type: 'mentor', followers: 3456, isFollowing: false },
    { id: 5, name: 'Alex Trader Pro', username: '@alextrader', avatar: 'AT', type: 'trader', followers: 7890, isFollowing: true }
  ];

  // Mock activity data for each tab
  const activityData = {
    news: [
      { id: 1, title: 'Bitcoin breaks $60k resistance', time: '10 min ago', type: 'news', source: 'CryptoNews' },
      { id: 2, title: 'New trading pairs listed on major exchange', time: '1 hour ago', type: 'news', source: 'ExchangeUpdate' },
      { id: 3, title: 'Regulatory updates for crypto traders', time: '3 hours ago', type: 'news', source: 'RegulatoryWatch' },
      { id: 4, title: 'Market sentiment turns bullish', time: '5 hours ago', type: 'news', source: 'SentimentAnalysis' }
    ],
    trades: [
      { id: 1, user: 'CryptoKing', action: 'bought', amount: '2.5 BTC', price: '$58,234', time: '2 min ago' },
      { id: 2, user: 'WhaleTrader', action: 'sold', amount: '100 ETH', price: '$3,456', time: '15 min ago' },
      { id: 3, user: 'ScalperPro', action: 'bought', amount: '5000 USDT', price: '$1.00', time: '1 hour ago' },
      { id: 4, user: 'LongTermHold', action: 'staked', amount: '1000 SOL', time: '3 hours ago' }
    ],
    chats: [
      { id: 1, user: 'SarahDev', message: 'Anyone know about the new DeFi protocol?', time: '5 min ago', unread: true },
      { id: 2, user: 'MikeTrader', message: 'Check out this chart pattern on BTC', time: '20 min ago', unread: false },
      { id: 3, user: 'EmilyMentor', message: 'Weekly trading session starting soon', time: '1 hour ago', unread: false },
      { id: 4, user: 'AlexPro', message: 'Great analysis on ETH!', time: '2 hours ago', unread: false }
    ],
    updates: [
      { id: 1, type: 'follow', user: 'CryptoSage', action: 'started following you', time: '10 min ago', avatar: 'CS' },
      { id: 2, type: 'like', user: 'TraderJoe', action: 'liked your post', time: '30 min ago', avatar: 'TJ' },
      { id: 3, type: 'comment', user: 'NewbieTrader', action: 'commented on your analysis', time: '2 hours ago', avatar: 'NT' },
      { id: 4, type: 'achievement', user: 'System', action: 'You reached 100 followers!', time: '1 day ago', avatar: '🎉' }
    ]
  };

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

  // Search suggestions
  useEffect(() => {
    if (searchQuery.length > 1 && !searchPerformed) {
      const filtered = [...mockPosts, ...mockPeople].filter(item => {
        const title = item.title || item.name || '';
        return title.toLowerCase().includes(searchQuery.toLowerCase());
      });
      setSearchSuggestions(filtered.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, searchPerformed]);

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

  const performSearch = () => {
    if (searchQuery.trim()) {
      // Search through posts and people
      let results = [];
      const query = searchQuery.toLowerCase();
      
      // Determine which categories to search based on active filters
      let categoriesToSearch = [];
      if (activeFilters.includes('all')) {
        categoriesToSearch = ['posts', 'people'];
      } else {
        if (activeFilters.includes('people')) categoriesToSearch.push('people');
        if (activeFilters.some(f => ['videos', 'charts', 'academies', 'tools'].includes(f))) categoriesToSearch.push('posts');
      }
      
      // Search posts
      if (categoriesToSearch.includes('posts')) {
        const matchedPosts = mockPosts.filter(post =>
          post.title.toLowerCase().includes(query) ||
          post.description.toLowerCase().includes(query) ||
          post.author.toLowerCase().includes(query)
        );
        results = [...results, ...matchedPosts.map(p => ({ ...p, resultType: 'post' }))];
      }
      
      // Search people
      if (categoriesToSearch.includes('people')) {
        const matchedPeople = mockPeople.filter(person =>
          person.name.toLowerCase().includes(query) ||
          person.username.toLowerCase().includes(query)
        );
        results = [...results, ...matchedPeople.map(p => ({ ...p, resultType: 'person' }))];
      }
      
      setSearchResults(results);
      setSearchPerformed(true);
      setShowSuggestions(false);
      setIsSearchFocused(false);
    } else if (searchPerformed) {
      clearSearch();
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

  const handleFollowToggle = (personId) => {
    // Toggle follow status
    const updatedPeople = mockPeople.map(p => 
      p.id === personId ? { ...p, isFollowing: !p.isFollowing } : p
    );
    // Update mockPeople array
    mockPeople.splice(0, mockPeople.length, ...updatedPeople);
  };

  const filteredWallpapers = wallpapers.filter(w => 
    activeWallpaperCategory === 'all' || w.category === activeWallpaperCategory
  );

  const renderIcon = (name, size = 16) => {
    const Icon = Icons[name];
    return Icon ? <Icon size={size} /> : null;
  };

  // Determine if titles should be hidden (after search)
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
        {/* Search and Filter Section */}
        <div className="search-filter-section">
          {/* Centered Search Section */}
          <div className="search-section">
            {/* Titles that disappear after search */}
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
                <button className="search-button" onClick={performSearch}>
                  Search
                </button>
                
                {showSuggestions && searchSuggestions.length > 0 && !searchPerformed && (
                  <div className="search-suggestions" ref={suggestionsRef}>
                    {searchSuggestions.map((item, idx) => (
                      <div key={idx} className="suggestion-item">
                        <div className="suggestion-icon">
                          {item.resultType === 'person' 
                            ? <div className="suggestion-avatar">{item.avatar}</div>
                            : renderIcon(item.icon, 12)}
                        </div>
                        <div className="suggestion-text">
                          {item.title || item.name}
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

            {/* Active Filters Display */}
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
                {searchResults.length > 0 ? (
                  <div className="results-list">
                    {searchResults.map(result => (
                      <div key={result.id} className="result-card">
                        {result.resultType === 'person' ? (
                          // Person result card
                          <>
                            <div className="result-card-header">
                              <div className="person-avatar-large">{result.avatar}</div>
                              <div className="person-info">
                                <h4>{result.name}</h4>
                                <div className="person-username">{result.username}</div>
                                <div className="person-stats">{result.followers} followers</div>
                              </div>
                              <button 
                                className={`follow-btn ${result.isFollowing ? 'following' : ''}`}
                                onClick={() => handleFollowToggle(result.id)}
                              >
                                {result.isFollowing ? 'Following' : 'Follow'}
                              </button>
                            </div>
                            <div className="person-badge">
                              <span className={`badge ${result.type}`}>{result.type}</span>
                            </div>
                          </>
                        ) : (
                          // Post result card
                          <>
                            <div className="result-icon">
                              {renderIcon(result.icon, 24)}
                            </div>
                            <h4>{result.title}</h4>
                            <p>{result.description}</p>
                            <div className="result-meta">
                              <span className="result-author">By {result.author}</span>
                              <div className="result-stats">
                                <span><Icons.FaHeart size={12} /> {result.likes}</span>
                                <span><Icons.FaComment size={12} /> {result.comments}</span>
                                <span>{result.timeAgo}</span>
                              </div>
                            </div>
                            <div className="result-type-badge">
                              <span className={`type-badge ${result.type}`}>{result.type}</span>
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
              // Default content when no search
              <div className="glass-card welcome-card">
                <h2>Welcome to Alpha Phoenix Trading</h2>
                <p>
                  {getActiveFilterLabel() 
                    ? `Showing filtered content: ${getActiveFilterLabel()}`
                    : 'Discover premium trading tools, educational content, and connect with traders worldwide.'}
                </p>
                <div className="featured-posts">
                  <h3>Trending Posts</h3>
                  <div className="featured-list">
                    {mockPosts.slice(0, 3).map(post => (
                      <div key={post.id} className="featured-item">
                        <div className="featured-icon">{renderIcon(post.icon, 20)}</div>
                        <div className="featured-content">
                          <h4>{post.title}</h4>
                          <p>{post.description}</p>
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
              {activityData[activeActivityTab].map(activity => (
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
                          {activity.amount && <span className="trade-amount">{activity.amount}</span>}
                          {activity.price && <span className="trade-price">@{activity.price}</span>}
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
                        {activity.type === 'achievement' ? '🎉' : 
                         activity.type === 'follow' ? renderIcon('FaUserPlus', 12) :
                         activity.type === 'like' ? renderIcon('FaHeart', 12) :
                         renderIcon('FaComment', 12)}
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
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Navigation Bar - Minimizable */}
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