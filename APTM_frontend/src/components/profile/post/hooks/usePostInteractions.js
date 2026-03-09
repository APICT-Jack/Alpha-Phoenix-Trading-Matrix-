// src/components/profile/post/hooks/usePostInteractions.js

import { useState, useCallback } from 'react';
import { notificationService } from '../../../../services/notificationService';

const usePostInteractions = ({
  postId,
  currentUserId,
  initialIsLiked = false,
  initialLikesCount = 0,
  initialIsSaved = false,
  initialIsReposted = false,
  initialRepostCount = 0,
  initialShareCount = 0,
  // Remove commentCount from here - it doesn't belong in interactions hook
  onLike,
  onSave,
  onRepost,
  onShare,
  onDelete,
  navigate
}) => {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isSavedState, setIsSavedState] = useState(initialIsSaved);
  const [isReposted, setIsReposted] = useState(initialIsReposted);
  const [repostCount, setRepostCount] = useState(initialRepostCount);
  const [shareCount, setShareCount] = useState(initialShareCount);
  
  // DO NOT reference commentCount here - it's not defined in this scope

  // Like handler with optimistic update
  const handleLike = useCallback(async () => {
    if (!currentUserId) {
      notificationService.warning('Please login to like posts');
      return;
    }

    const newLikedState = !isLiked;
    const newLikesCount = newLikedState ? likesCount + 1 : likesCount - 1;
    
    setIsLiked(newLikedState);
    setLikesCount(newLikesCount);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to like post');
      
      if (onLike) onLike(newLikedState);
      
    } catch (error) {
      setIsLiked(!newLikedState);
      setLikesCount(likesCount);
      console.error('Failed to like post:', error);
      notificationService.error('Could not like post');
    }
  }, [isLiked, likesCount, postId, currentUserId, onLike]);

  // Save handler
  const handleSave = useCallback(async () => {
    if (!currentUserId) {
      notificationService.warning('Please login to save posts');
      return;
    }

    const newSavedState = !isSavedState;
    setIsSavedState(newSavedState);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/posts/${postId}/save`, {
        method: newSavedState ? 'POST' : 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to save post');
      
      notificationService.success(newSavedState ? 'Post saved' : 'Post unsaved');
      if (onSave) onSave(newSavedState);
      
    } catch (error) {
      setIsSavedState(!newSavedState);
      console.error('Failed to save post:', error);
      notificationService.error('Could not save post');
    }
  }, [isSavedState, postId, currentUserId, onSave]);

  // Repost handler
  const handleRepost = useCallback(async ({ content, visibility }) => {
    if (!currentUserId) {
      notificationService.warning('Please login to repost');
      return;
    }

    try {
      const repostData = {
        originalPostId: postId,
        content: content || null,
        visibility: visibility || 'public'
      };

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/posts/${postId}/repost`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(repostData)
      });
      
      if (!response.ok) throw new Error('Failed to repost');
      
      setRepostCount(prev => prev + 1);
      setIsReposted(true);
      
      notificationService.success('Post shared to your timeline!');
      if (onRepost) onRepost();
      
    } catch (error) {
      console.error('Failed to repost:', error);
      notificationService.error('Could not share post');
      throw error;
    }
  }, [postId, currentUserId, onRepost]);

  // Share handler
  const handleShare = useCallback(async ({ platform, shareUrl, postData, postUser, onShare, setShowShareModal }) => {
    if (platform) {
      const shareData = {
        url: shareUrl,
        title: `Check out this post by ${postUser.name}`,
        text: postData.content
      };

      let shareLink = '';
      switch(platform) {
        case 'twitter':
          shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareData.url)}`;
          break;
        case 'facebook':
          shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}`;
          break;
        case 'whatsapp':
          shareLink = `https://wa.me/?text=${encodeURIComponent(shareData.text + ' ' + shareData.url)}`;
          break;
        case 'telegram':
          shareLink = `https://t.me/share/url?url=${encodeURIComponent(shareData.url)}&text=${encodeURIComponent(shareData.text)}`;
          break;
        case 'email':
          shareLink = `mailto:?subject=${encodeURIComponent(shareData.title)}&body=${encodeURIComponent(shareData.text + '\n\n' + shareData.url)}`;
          break;
        default:
          if (navigator.share) {
            try {
              await navigator.share(shareData);
              if (setShowShareModal) setShowShareModal(false);
            } catch (err) {
              if (err.name !== 'AbortError') {
                console.error('Share failed:', err);
              }
            }
            return;
          }
      }

      if (shareLink) {
        window.open(shareLink, '_blank', 'noopener,noreferrer');
        if (setShowShareModal) setShowShareModal(false);
      }
      
      // Track share count
      try {
        const token = localStorage.getItem('token');
        await fetch(`http://localhost:5000/api/posts/${postId}/share`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setShareCount(prev => prev + 1);
        if (onShare) onShare();
      } catch (error) {
        console.error('Failed to track share:', error);
      }
      
    } else {
      if (setShowShareModal) setShowShareModal(true);
    }
  }, [postId]);

  // Delete handler
  const handleDelete = useCallback(async () => {
    if (!currentUserId) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to delete post');
      
      notificationService.success('Post deleted');
      
      if (onDelete) onDelete(postId);
      
      if (window.location.pathname.includes(`/post/${postId}`)) {
        navigate(-1);
      }
      
    } catch (error) {
      console.error('Failed to delete post:', error);
      notificationService.error('Could not delete post');
      throw error;
    }
  }, [postId, currentUserId, navigate, onDelete]);

  // Return ONLY the values that belong in this hook
  return {
    isLiked,
    likesCount,
    isSavedState,
    isReposted,
    repostCount,
    shareCount,
    handleLike,
    handleSave,
    handleRepost,
    handleShare,
    handleDelete
    // DO NOT include commentCount here
  };
};

export default usePostInteractions;