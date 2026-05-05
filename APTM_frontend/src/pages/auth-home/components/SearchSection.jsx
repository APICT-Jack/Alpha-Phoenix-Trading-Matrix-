// src/pages/auth-home/components/SearchSection.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useSearch } from '../hooks/useSearch';
import * as Icons from 'react-icons/fa';
import './SearchSection.css';

const SearchSection = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [activeFilters, setActiveFilters] = useState(['all']);
  const [showPeopleMenu, setShowPeopleMenu] = useState(false);
  const [showTraderMenu, setShowTraderMenu] = useState(false);
  const [peopleFilters, setPeopleFilters] = useState({ traders: [], developers: false, students: false, friends: false });
  const [isScrolled, setIsScrolled] = useState(false);
  
  const peopleMenuRef = useRef(null);
  const traderMenuRef = useRef(null);
  const traderBtnRef = useRef(null);
  const headerRef = useRef(null);

  const {
    searchQuery,
    searchResults,
    showSuggestions,
    searchSuggestions,
    searchPerformed,
    searching,
    searchTab,
    searchInputRef,
    suggestionsRef,
    setSearchQuery,
    setSearchTab,
    performSearch,
    clearSearch,
    getFilteredSearchResults
  } = useSearch();

  const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
  const API_BASE = `${API_URL}/api`;

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  });

  const apiFetch = async (endpoint, options = {}) => {
    const url = `${API_BASE}${endpoint}`;
    const config = { headers: getAuthHeaders(), ...options };
    const response = await fetch(url, config);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  };

  const handleFollowToggle = async (userId, currentStatus, e) => {
    if (e) e.stopPropagation();
    try {
      const endpoint = currentStatus ? '/follow/unfollow' : '/follow/follow';
      await apiFetch(`${endpoint}/${userId}`, { method: 'POST' });
      // Update the search results users list
      const updatedUsers = searchResults.users.map(u => 
        (u.id || u._id) === userId ? { ...u, isFollowing: !currentStatus } : u
      );
      setSearchResults(prev => ({ ...prev, users: updatedUsers }));
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
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

  // Handle scroll for sticky header effects
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Click outside for people menu
  useEffect(() => {
    const handleClickOutside = (e) => {
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

  const renderIcon = (name, size = 16) => {
    const Icon = Icons[name];
    return Icon ? <Icon size={size} /> : null;
  };

  // Filter chips data
  const filterChips = [
    { id: 'all', label: 'All', icon: 'FaHome' },
    { id: 'videos', label: 'Videos', icon: 'FaVideo' },
    { id: 'charts', label: 'Charts', icon: 'FaChartLine' },
    { id: 'academies', label: 'Learn', icon: 'FaGraduationCap' },
    { id: 'tools', label: 'Tools', icon: 'FaTools' },
    { id: 'people', label: 'People', icon: 'FaUsers', hasSubmenu: true }
  ];

  const filteredResults = getFilteredSearchResults();

  return (
    <div className={`search-section ${isScrolled ? 'scrolled' : ''}`} ref={headerRef}>
      {/* Hero Title - Hidden when search is performed */}
      <div className={`search-hero ${searchPerformed && searchQuery.trim() ? 'hidden' : ''}`}>
        <div className="search-hero-content">
          <h1 className="search-hero-title">
            Alpha Phoenix
            <span className="search-hero-accent"> Trading</span>
          </h1>
          <p className="search-hero-subtitle">
            Discover trading content and connect with traders
          </p>
        </div>
      </div>

      {/* macOS/iOS Style Search Bar */}
      <div className="search-container">
        <div className={`search-bar-wrapper ${searchPerformed && searchQuery.trim() ? 'compact' : ''}`}>
          <div className="search-bar">
            <div className="search-icon-wrapper">
              {renderIcon('FaSearch', 16)}
            </div>
            <input
              ref={searchInputRef}
              type="text"
              className="search-input"
              placeholder="Search posts, users, or hashtags..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                if (searchPerformed && !e.target.value.trim()) {
                  clearSearch();
                }
              }}
              onKeyPress={e => { if (e.key === 'Enter') performSearch(); }}
            />
            {searchQuery && (
              <button className="search-clear-btn" onClick={clearSearch}>
                {renderIcon('FaTimes', 12)}
              </button>
            )}
            <button className="search-submit-btn" onClick={performSearch} disabled={searching}>
              {searching ? <Icons.FaSpinner className="spinner-button" /> : 'Go'}
            </button>
          </div>

          {/* Search Suggestions - iOS Style */}
          {showSuggestions && searchSuggestions.length > 0 && (
            <div className="search-suggestions-glass" ref={suggestionsRef}>
              <div className="suggestions-header">
                <span className="suggestions-title">Recent searches</span>
                <button className="suggestions-clear" onClick={clearSearch}>Clear</button>
              </div>
              {searchSuggestions.map((item, idx) => (
                <div key={item.id || item._id || idx} className="suggestion-item-glass" onClick={() => {
                  setShowSuggestions(false);
                  navigate(`/profile/${item.id || item._id}`);
                }}>
                  <div className="suggestion-avatar-glass">
                    {item.avatar ? (
                      <img src={item.avatar} alt={item.name} />
                    ) : (
                      <span>{item.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                    )}
                  </div>
                  <div className="suggestion-info">
                    <span className="suggestion-name-glass">{item.name}</span>
                    <span className="suggestion-username-glass">@{item.username}</span>
                  </div>
                  {currentUser && (item.id || item._id) !== currentUser.id && (
                    <button 
                      className="suggestion-follow-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFollowToggle(item.id || item._id, item.isFollowing, e);
                      }}
                    >
                      {item.isFollowing ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Filter Chips - iOS Style Scrollable */}
        {!searchPerformed && (
          <div className="filter-chips-container">
            <div className="filter-chips-scroll">
              {filterChips.map(filter => (
                <div key={filter.id} className="filter-chip-wrapper">
                  <button
                    className={`filter-chip-glass ${activeFilters.includes(filter.id) ? 'active' : ''}`}
                    onClick={() => handleFilterClick(filter.id)}
                  >
                    <span className="filter-chip-icon">{renderIcon(filter.icon, 10)}</span>
                    <span className="filter-chip-label">{filter.label}</span>
                    {filter.hasSubmenu && <span className="filter-chip-arrow">⌵</span>}
                  </button>
                  
                  {filter.hasSubmenu && showPeopleMenu && (
                    <div className="people-submenu-glass" ref={peopleMenuRef}>
                      <div className="submenu-header">
                        <span>Filter by trader level</span>
                      </div>
                      <button ref={traderBtnRef} className="submenu-trigger" onClick={() => setShowTraderMenu(!showTraderMenu)}>
                        <span>📊 Trader Level</span>
                        <span className="submenu-arrow">{showTraderMenu ? '▲' : '▼'}</span>
                      </button>
                      {showTraderMenu && (
                        <div className="submenu-options" ref={traderMenuRef}>
                          {['beginner', 'intermediate', 'advanced', 'expert', 'mentor'].map(level => (
                            <button 
                              key={level} 
                              className={`submenu-option ${peopleFilters.traders.includes(level) ? 'selected' : ''}`}
                              onClick={() => setPeopleFilters(prev => ({
                                ...prev,
                                traders: prev.traders.includes(level) 
                                  ? prev.traders.filter(s => s !== level) 
                                  : [...prev.traders, level]
                              }))}
                            >
                              <span className="option-check">{peopleFilters.traders.includes(level) ? '✓' : '○'}</span>
                              <span className="option-label">{level.charAt(0).toUpperCase() + level.slice(1)}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Search Results - iOS Style */}
      {searchPerformed && searchQuery.trim() && (
        <div className="search-results-glass">
          <div className="results-header-glass">
            <div className="results-title-section">
              <h3>Results for "{searchQuery}"</h3>
              <span className="results-count">{filteredResults.length} items</span>
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
                {tab === 'all' && renderIcon('FaGlobe', 10)}
                {tab === 'posts' && renderIcon('FaFileAlt', 10)}
                {tab === 'people' && renderIcon('FaUsers', 10)}
                <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
                {searchTab === tab && filteredResults.length > 0 && (
                  <span className="tab-count">{filteredResults.length}</span>
                )}
              </button>
            ))}
          </div>

          {searching ? (
            <div className="loading-state-glass">
              <Icons.FaSpinner className="spinner" />
              <p>Searching...</p>
            </div>
          ) : filteredResults.length > 0 ? (
            <div className="search-results-list">
              {filteredResults.map((result, idx) => {
                if (result.resultType === 'user') {
                  const userId = result.id || result._id;
                  return (
                    <div key={userId || idx} className="result-card-glass" onClick={() => navigate(`/profile/${userId}`)}>
                      <div className="result-card-content">
                        <div className="result-avatar">
                          {result.avatar ? (
                            <img src={result.avatar} alt={result.name} />
                          ) : (
                            <span>{result.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                          )}
                          {result.isOnline && <span className="online-dot" />}
                        </div>
                        <div className="result-info">
                          <div className="result-name-row">
                            <h4>{result.name}</h4>
                            {result.isVerified && <span className="verified-badge">✓</span>}
                          </div>
                          <span className="result-username">@{result.username}</span>
                          <span className="result-stats">{result.followersCount || 0} followers</span>
                          {result.bio && <p className="result-bio">{result.bio}</p>}
                        </div>
                        {currentUser && userId !== currentUser.id && (
                          <button 
                            className={`follow-btn-glass ${result.isFollowing ? 'following' : ''}`} 
                            onClick={(e) => handleFollowToggle(userId, result.isFollowing, e)}
                          >
                            {result.isFollowing ? 'Following' : 'Follow'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }
                // Post result
                return (
                  <div key={result._id || idx} className="result-card-glass post-result" onClick={() => navigate(`/post/${result._id}`)}>
                    <div className="post-result-content">
                      <div className="post-result-avatar">
                        {renderIcon('FaFileAlt', 20)}
                      </div>
                      <div className="post-result-info">
                        <div className="post-result-title">
                          <span className="post-result-type">Post</span>
                          <span className="post-result-time">
                            {new Date(result.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="post-result-preview">{result.content?.substring(0, 100)}...</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="no-results-glass">
              <div className="no-results-icon">{renderIcon('FaSearch', 48)}</div>
              <h3>No results found</h3>
              <p>Try different keywords or check your spelling</p>
              <button className="suggest-search-btn" onClick={clearSearch}>Clear search</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchSection;