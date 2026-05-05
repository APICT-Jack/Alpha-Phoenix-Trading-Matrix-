// src/pages/auth-home/hooks/useFeed.js
import { useState, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
const API_BASE = `${API_URL}/api`;

const getAuthHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json'
});

export const useFeed = () => {
  const [feedPosts, setFeedPosts] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState(null);
  const [feedPage, setFeedPage] = useState(1);
  const [hasMoreFeed, setHasMoreFeed] = useState(true);
  const [feedRefreshing, setFeedRefreshing] = useState(false);
  const [activeFilters, setActiveFilters] = useState(['all']);

  const apiFetch = useCallback(async (endpoint, options = {}) => {
    const url = `${API_BASE}${endpoint}`;
    const config = { headers: getAuthHeaders(), ...options };
    const response = await fetch(url, config);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    return response.json();
  }, []);

  const fetchFeed = useCallback(async (page = 1, append = false) => {
    try {
      if (page === 1) setFeedLoading(true);
      else setFeedRefreshing(true);
      
      const params = new URLSearchParams({ 
        page: page.toString(), 
        limit: '10', 
        sortBy: 'latest' 
      });
      
      if (activeFilters.includes('videos')) params.append('mediaType', 'video');
      if (activeFilters.includes('charts')) params.append('mediaType', 'chart');
      
      const data = await apiFetch(`/posts/feed?${params.toString()}`);
      
      if (data.success) {
        const newPosts = data.posts || [];
        setFeedPosts(prev => append ? [...prev, ...newPosts] : newPosts);
        setHasMoreFeed(data.pagination?.hasMore || false);
        setFeedPage(page);
      }
    } catch (error) {
      console.error('Error fetching feed:', error);
      if (!append) setFeedError(error.message);
    } finally {
      setFeedLoading(false);
      setFeedRefreshing(false);
    }
  }, [apiFetch, activeFilters]);

  const handleLoadMore = useCallback(() => {
    if (!hasMoreFeed || feedRefreshing) return;
    fetchFeed(feedPage + 1, true);
  }, [hasMoreFeed, feedRefreshing, feedPage, fetchFeed]);

  const refreshFeed = useCallback(() => {
    fetchFeed(1, false);
  }, [fetchFeed]);

  const updateFilters = useCallback((filters) => {
    setActiveFilters(filters);
  }, []);

  return {
    // State
    feedPosts,
    feedLoading,
    feedError,
    hasMoreFeed,
    feedRefreshing,
    activeFilters,
    
    // Actions
    fetchFeed,
    handleLoadMore,
    refreshFeed,
    updateFilters,
    setActiveFilters
  };
};