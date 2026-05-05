// src/pages/auth-home/components/SearchSection.jsx
import React, { useState, useRef, useCallback } from 'react';
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
  React.useEffect(() => {
    if (searchPerformed) return;
    const timer = setTimeout(() => fetchSearchSuggestions(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchPerformed, fetchSearchSuggestions]);

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target) && 
          searchInputRef.current && !searchInputRef.current.contains(e.target)) 
        setShowSuggestions(false);
      if (peopleMenuRef.current && !peopleMenuRef.current.contains(e.target) && 
          !e.target.closest('.filter-chip.has-submenu')) 
        setShowPeopleMenu(false);
      if (traderMenuRef.current && !traderMenuRef.current.contains(e.target) && 
          traderBtnRef.current && !traderBtnRef.current.contains(e.target)) 
        setShowTraderMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
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

      {/* Filter Chips */}
      {!searchPerformed && (
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
                      <button ref={traderBtnRef} className="submenu-item" onClick={() => setShowTraderMenu(!showTraderMenu)}>
                        <span className="checkbox-indicator">▶</span> Traders
                      </button>
                      {showTraderMenu && (
                        <div className="nested-submenu" ref={traderMenuRef}>
                          {['beginner', 'intermediate', 'advanced', 'expert', 'mentor'].map(level => (
                            <button key={level} className="nested-option"
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
      )}

      {/* Search Results */}
      {searchPerformed && searchQuery.trim() && (
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
          ) : getFilteredSearchResults().length > 0 ? (
            <div className="search-results-list">
              {/* Results will be rendered by FeedSection with search mode */}
            </div>
          ) : (
            <div className="no-results">
              <Icons.FaSearch size={48} />
              <h3>No results found</h3>
              <p>Try different keywords</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchSection;