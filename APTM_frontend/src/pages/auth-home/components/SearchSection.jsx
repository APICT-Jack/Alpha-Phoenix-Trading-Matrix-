// src/pages/auth-home/components/SearchSection.jsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Icons from 'react-icons/fa';
import './SearchSection.css';

const SearchSection = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ posts: [], users: [], hashtags: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchTab, setSearchTab] = useState('all');
  const [activeFilters, setActiveFilters] = useState(['all']);
  const [showPeopleMenu, setShowPeopleMenu] = useState(false);
  const [showTraderMenu, setShowTraderMenu] = useState(false);
  const [peopleFilters, setPeopleFilters] = useState({ traders: [], developers: false, students: false, friends: false });
  
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const peopleMenuRef = useRef(null);
  const traderMenuRef = useRef(null);
  const traderBtnRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
  const API_BASE = `${API_URL}/api`;

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  });

  const apiFetch = useCallback(async (endpoint, options = {}) => {
    const url = `${API_BASE}${endpoint}`;
    const config = { headers: getAuthHeaders(), ...options };
    const response = await fetch(url, config);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }, []);

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

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults({ posts: [], users: [], hashtags: [] });
    setSearchPerformed(false);
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  };

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

  const renderIcon = (name, size = 16) => {
    const Icon = Icons[name];
    return Icon ? <Icon size={size} /> : null;
  };

  const getFilteredSearchResults = () => {
    let results = [];
    if (searchTab === 'all' || searchTab === 'posts') results = [...results, ...searchResults.posts.map(p => ({ ...p, resultType: 'post' }))];
    if (searchTab === 'all' || searchTab === 'people') results = [...results, ...searchResults.users.map(u => ({ ...u, resultType: 'user' }))];
    if (searchTab === 'all' || searchTab === 'hashtags') results = [...results, ...searchResults.hashtags.map(h => ({ ...h, resultType: 'hashtag' }))];
    return results;
  };

  // Debounced search suggestions
  useEffect(() => {
    if (searchPerformed) return;
    const timer = setTimeout(() => fetchSearchSuggestions(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchPerformed, fetchSearchSuggestions]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target) && 
          searchInputRef.current && !searchInputRef.current.contains(e.target)) 
        setShowSuggestions(false);
      if (peopleMenuRef.current && !peopleMenuRef.current.contains(e.target) && 
          !e.target.closest('.filter-chip')) 
        setShowPeopleMenu(false);
      if (traderMenuRef.current && !traderMenuRef.current.contains(e.target) && 
          traderBtnRef.current && !traderBtnRef.current.contains(e.target)) 
        setShowTraderMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter chips - with responsive icons/labels
  const filterChips = [
    { id: 'all', label: 'All', icon: 'FaHome', mobileIcon: 'FaHome' },
    { id: 'videos', label: 'Videos', icon: 'FaVideo', mobileIcon: 'FaVideo' },
    { id: 'charts', label: 'Charts', icon: 'FaChartLine', mobileIcon: 'FaChartLine' },
    { id: 'academies', label: 'Learn', icon: 'FaGraduationCap', mobileIcon: 'FaGraduationCap' },
    { id: 'tools', label: 'Tools', icon: 'FaTools', mobileIcon: 'FaTools' },
    { id: 'people', label: 'People', icon: 'FaUsers', mobileIcon: 'FaUsers', hasSubmenu: true }
  ];

  return (
    <div className="search-section-sticky">
      {/* Hero Title - Hidden when search is performed */}
      <div className={`search-hero ${searchPerformed && searchQuery.trim() ? 'hidden' : ''}`}>
        <h1 className="search-hero-title">
          Alpha Phoenix <span className="search-hero-accent">Trading</span>
        </h1>
        <p className="search-hero-subtitle">Discover trading content and connect with traders</p>
      </div>

      {/* Glass Search Bar Container */}
      <div className="search-glass-container">
        {/* Search Bar - iOS Style */}
        <div className="search-bar-glass">
          <div className="search-icon-glass">
            {renderIcon('FaSearch', 16)}
          </div>
          <input
            ref={searchInputRef}
            type="text"
            className="search-input-glass"
            placeholder="Search posts, users, or hashtags..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              if (searchPerformed && !e.target.value.trim()) setSearchPerformed(false);
            }}
            onKeyPress={e => { if (e.key === 'Enter') performSearch(); }}
          />
          {searchQuery && (
            <button className="search-clear-glass" onClick={clearSearch}>
              {renderIcon('FaTimes', 12)}
            </button>
          )}
          <button className="search-submit-glass" onClick={performSearch} disabled={searching}>
            {searching ? <Icons.FaSpinner className="spinner-button" /> : 'Search'}
          </button>
        </div>

        {/* Search Suggestions */}
        {showSuggestions && searchSuggestions.length > 0 && (
          <div className="search-suggestions-glass" ref={suggestionsRef}>
            {searchSuggestions.map((item, idx) => (
              <div key={item.id || item._id || idx} className="suggestion-item-glass" onClick={() => {
                setShowSuggestions(false);
                navigate(`/profile/${item.id || item._id}`);
              }}>
                <div className="suggestion-avatar-glass">
                  {item.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="suggestion-info-glass">
                  <span className="suggestion-name-glass">{item.name}</span>
                  <span className="suggestion-username-glass">@{item.username}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filter Chips - Responsive (icons only on mobile, labels on desktop) */}
        {!searchPerformed && (
          <div className="filter-chips-glass">
            {filterChips.map(filter => (
              <div key={filter.id} className="filter-chip-wrapper">
                <button
                  className={`filter-chip-glass ${activeFilters.includes(filter.id) ? 'active' : ''}`}
                  onClick={() => handleFilterClick(filter.id)}
                >
                  <span className="filter-icon">{renderIcon(filter.icon, 12)}</span>
                  <span className="filter-label">{filter.label}</span>
                  {filter.hasSubmenu && <span className="filter-arrow">▼</span>}
                </button>
                
                {filter.hasSubmenu && showPeopleMenu && (
                  <div className="people-submenu-glass" ref={peopleMenuRef}>
                    <button ref={traderBtnRef} className="submenu-trigger-glass" onClick={() => setShowTraderMenu(!showTraderMenu)}>
                      <span>👥 Trader Level</span>
                      <span>{showTraderMenu ? '▲' : '▼'}</span>
                    </button>
                    {showTraderMenu && (
                      <div className="submenu-options-glass" ref={traderMenuRef}>
                        {['beginner', 'intermediate', 'advanced', 'expert', 'mentor'].map(level => (
                          <button 
                            key={level} 
                            className={`submenu-option-glass ${peopleFilters.traders.includes(level) ? 'selected' : ''}`}
                            onClick={() => setPeopleFilters(prev => ({
                              ...prev,
                              traders: prev.traders.includes(level) 
                                ? prev.traders.filter(s => s !== level) 
                                : [...prev.traders, level]
                            }))}
                          >
                            <span className="option-check">{peopleFilters.traders.includes(level) ? '✓' : '○'}</span>
                            <span>{level.charAt(0).toUpperCase() + level.slice(1)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search Results */}
      {searchPerformed && searchQuery.trim() && (
        <div className="search-results-glass">
          <div className="results-header-glass">
            <div>
              <h3>Results for "{searchQuery}"</h3>
              <span className="results-count">{getFilteredSearchResults().length} items</span>
            </div>
            <button className="clear-results-glass" onClick={clearSearch}>
              {renderIcon('FaTimes', 12)} Clear
            </button>
          </div>
          
          <div className="search-tabs-glass">
            {['all', 'posts', 'people'].map(tab => (
              <button 
                key={tab} 
                className={`search-tab-glass ${searchTab === tab ? 'active' : ''}`} 
                onClick={() => setSearchTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {searching ? (
            <div className="loading-state-glass">
              <Icons.FaSpinner className="spinner" />
              <p>Searching...</p>
            </div>
          ) : getFilteredSearchResults().length > 0 ? (
            <div className="search-results-list">
              {getFilteredSearchResults().slice(0, 20).map((result, idx) => {
                if (result.resultType === 'user') {
                  const userId = result.id || result._id;
                  return (
                    <div key={userId || idx} className="result-card-glass" onClick={() => navigate(`/profile/${userId}`)}>
                      <div className="result-avatar-glass">
                        {result.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="result-info-glass">
                        <h4>{result.name}</h4>
                        <span className="result-username-glass">@{result.username}</span>
                        <span className="result-stats-glass">{result.followersCount || 0} followers</span>
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={result._id || idx} className="result-card-glass post-result-glass">
                    <div className="post-result-content">
                      <div className="post-result-icon">{renderIcon('FaFileAlt', 20)}</div>
                      <div className="post-result-info">
                        <p className="post-result-preview">{result.content?.substring(0, 100)}...</p>
                        <span className="post-result-time">{new Date(result.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="no-results-glass">
              <p>No results found for "{searchQuery}"</p>
              <button className="suggest-search-btn" onClick={clearSearch}>Clear search</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchSection;