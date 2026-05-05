// src/pages/auth-home/components/FeedSection.jsx
import React, { useState, useEffect, useCallback } from 'react';
import PostComponent from '../../../components/profile/PostComponent';
import * as Icons from 'react-icons/fa';
import './FeedSection.css';

const FeedSection = ({ currentUser, onlineUsers }) => {
  const [feedPosts, setFeedPosts] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState(null);
  const [feedPage, setFeedPage] = useState(1);
  const [hasMoreFeed, setHasMoreFeed] = useState(true);
  const [feedRefreshing, setFeedRefreshing] = useState(false);
  const [activeFilters, setActiveFilters] = useState(['all']);

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
      const params = new URLSearchParams({ page: page.toString(), limit: '10', sortBy: 'latest' });
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

  const handleLoadMore = () => {
    if (!hasMoreFeed || feedRefreshing) return;
    fetchFeed(feedPage + 1, true);
  };

  useEffect(() => {
    fetchFeed(1, false);
  }, [activeFilters, fetchFeed]);

  if (feedLoading) {
    return (
      <div className="loading-state">
        <Icons.FaSpinner className="spinner" />
        <p>Loading feed...</p>
      </div>
    );
  }

  if (feedError) {
    return (
      <div className="error-state">
        <Icons.FaExclamationTriangle size={32} />
        <p>{feedError}</p>
        <button onClick={() => fetchFeed(1, false)}>Retry</button>
      </div>
    );
  }

  return (
    <div className="feed-section">
      {feedPosts.length > 0 ? (
        <>
          <div className="posts-list">
            {feedPosts.map(post => (
              <PostComponent
                key={post._id}
                post={post}
                currentUserId={currentUser?.id}
                onDelete={() => fetchFeed(1, false)}
                showActions={true}
                maxInitialComments={1}
                showMediaLightbox={true}
              />
            ))}
          </div>
          {hasMoreFeed && (
            <div className="load-more-container">
              <button className="load-more-btn" onClick={handleLoadMore} disabled={feedRefreshing}>
                {feedRefreshing ? <><Icons.FaSpinner className="spinner" /> Loading...</> : 'Load More'}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <Icons.FaNewspaper size={48} />
          <h3>No posts yet</h3>
          <p>Follow traders to see their posts here</p>
        </div>
      )}
    </div>
  );
};

export default FeedSection;