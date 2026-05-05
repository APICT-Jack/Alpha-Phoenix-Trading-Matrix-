// src/pages/auth-home/hooks/useSearch.js
import { useState, useCallback, useRef, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
const API_BASE = `${API_URL}/api`;

const getAuthHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json'
});

export const useSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ posts: [], users: [], hashtags: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchTab, setSearchTab] = useState('all');
  
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);

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
      
      setSearchResults({ 
        posts: postsRes.posts || [], 
        users: usersRes.users || [], 
        hashtags 
      });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  }, [searchQuery, searchPerformed, apiFetch]);

  const fetchSearchSuggestions = useCallback(async (query) => {
    if (query.length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    try {
      const data = await apiFetch(`/users/search?q=${encodeURIComponent(query)}&limit=5`);
      if (data.success && data.users) {
        setSearchSuggestions(data.users.map(user => ({ ...user, resultType: 'user' })));
        setShowSuggestions(data.users.length > 0);
      }
    } catch (error) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  }, [apiFetch]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults({ posts: [], users: [], hashtags: [] });
    setSearchPerformed(false);
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  }, []);

  const getFilteredSearchResults = useCallback(() => {
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
  }, [searchTab, searchResults]);

  // Debounced search suggestions
  useEffect(() => {
    if (searchPerformed) return;
    const timer = setTimeout(() => fetchSearchSuggestions(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchPerformed, fetchSearchSuggestions]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target) && 
          searchInputRef.current && !searchInputRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return {
    // State
    searchQuery,
    searchResults,
    showSuggestions,
    searchSuggestions,
    searchPerformed,
    searching,
    searchTab,
    searchInputRef,
    suggestionsRef,
    
    // Actions
    setSearchQuery,
    setSearchTab,
    performSearch,
    clearSearch,
    getFilteredSearchResults
  };
};