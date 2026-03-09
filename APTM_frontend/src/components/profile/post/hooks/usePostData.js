// usePostData.js
// Manages post data state and user information extraction
// Handles post structure normalization

import { useState, useEffect, useCallback, useMemo } from 'react';

const usePostData = ({ post, currentUserId, isSaved, onlineStatus = {} }) => {
  const [postData, setPostData] = useState(post);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Update post data when prop changes
  useEffect(() => {
    if (post) {
      setPostData(post);
    }
  }, [post]);

  // Get post user data with fallbacks
  const getPostUser = useCallback(() => {
    if (!postData) return {};
    
    try {
      let user = postData.userId || postData.user || postData.author || {};
      
      if (typeof user === 'string') {
        return {
          _id: user,
          name: 'User',
          username: 'user',
          avatar: null,
          isVerified: false,
          isOnline: onlineStatus[user] || false
        };
      }
      
      if (!user || typeof user !== 'object') {
        return {
          _id: null,
          name: 'Unknown User',
          username: 'unknown',
          avatar: null,
          isVerified: false,
          isOnline: false
        };
      }
      
      return {
        _id: user._id || user.id,
        name: user.name || user.displayName || 'Unknown User',
        username: user.username || user.userName || 'user',
        avatar: user.avatar || user.profilePicture || user.avatarUrl,
        isVerified: user.isVerified || false,
        isOnline: onlineStatus[user._id || user.id] || false
      };
    } catch (error) {
      console.error('Error in getPostUser:', error);
      return {
        _id: null,
        name: 'Unknown User',
        username: 'unknown',
        avatar: null,
        isVerified: false,
        isOnline: false
      };
    }
  }, [postData, onlineStatus]);

  const postUser = useMemo(() => getPostUser(), [getPostUser]);

  const isRepost = useMemo(() => {
    return postData?.repostOf || postData?.sharedPost || postData?.originalPost;
  }, [postData]);

  const originalPost = useMemo(() => {
    return postData?.repostOf || postData?.sharedPost || postData?.originalPost || null;
  }, [postData]);

  return {
    postData,
    setPostData,
    postUser,
    originalPost,
    isRepost,
    loading,
    setLoading,
    error,
    setError
  };
};

export default usePostData;