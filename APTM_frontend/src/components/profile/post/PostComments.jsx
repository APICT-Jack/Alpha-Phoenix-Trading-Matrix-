// src/components/profile/post/hooks/usePostComments.js

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { notificationService } from '../../../services/notificationService';

const usePostComments = ({
  postId,
  currentUserId,
  postData,
  setPostData,
  maxInitialComments = 3,
  showAllReplies = false,
  expanded = false
}) => {
  // ===== STATE =====
  const [commentText, setCommentText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyToComment, setReplyToComment] = useState(null);
  const [replyingToReply, setReplyingToReply] = useState(null);
  const [showComments, setShowComments] = useState(expanded);
  const [showReplies, setShowReplies] = useState({});
  const [showAllCommentsState, setShowAllCommentsState] = useState(false);
  const [commentLikes, setCommentLikes] = useState({});
  const [replyLikes, setReplyLikes] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // ===== REFS =====
  const commentInputRef = useRef(null);
  const replyInputRef = useRef(null);

  // ===== CALCULATE COMMENT COUNT =====
  const commentCount = useMemo(() => {
    return postData?.comments?.length || 0;
  }, [postData?.comments]);

  // ===== INITIALIZE LIKES =====
  useEffect(() => {
    if (!postData?.comments || !Array.isArray(postData.comments)) return;
    
    const replyLikesMap = {};
    const commentLikesMap = {};
    
    postData.comments.forEach(comment => {
      if (!comment) return;
      
      const commentId = comment._id;
      if (commentId) {
        commentLikesMap[commentId] = {
          count: comment.likes?.length || 0,
          liked: Array.isArray(comment.likes) && comment.likes.some(like => {
            const likeId = (typeof like === 'object' ? like?._id || like?.userId : like);
            return likeId === currentUserId;
          }) || false
        };
      }
      
      if (comment.replies && Array.isArray(comment.replies)) {
        comment.replies.forEach(reply => {
          if (!reply) return;
          
          const replyId = reply._id;
          if (replyId) {
            replyLikesMap[replyId] = {
              count: reply.likes?.length || 0,
              liked: Array.isArray(reply.likes) && reply.likes.some(like => {
                const likeId = (typeof like === 'object' ? like?._id || like?.userId : like);
                return likeId === currentUserId;
              }) || false
            };
          }
        });
      }
    });
    
    setReplyLikes(replyLikesMap);
    setCommentLikes(commentLikesMap);
  }, [postData, currentUserId]);

  // ===== VISIBLE COMMENTS =====
  const visibleComments = useMemo(() => {
    if (!postData?.comments) return [];
    const comments = Array.isArray(postData.comments) ? postData.comments : [];
    
    if (!showAllCommentsState && comments.length > maxInitialComments) {
      return comments.slice(0, maxInitialComments);
    }
    return comments;
  }, [postData?.comments, showAllCommentsState, maxInitialComments]);

  const hasMoreComments = useMemo(() => {
    if (!postData?.comments) return false;
    return postData.comments.length > maxInitialComments && !showAllCommentsState;
  }, [postData?.comments, maxInitialComments, showAllCommentsState]);

  // ===== TOGGLE FUNCTIONS =====
  const toggleReplies = useCallback((commentId) => {
    setShowReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  }, []);

  // ===== ADD COMMENT =====
  const handleComment = useCallback(async () => {
    if (!currentUserId) {
      notificationService.warning('Please login to comment');
      return;
    }

    if (!commentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const text = commentText.trim();
    setCommentText('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: text })
      });
      
      if (!response.ok) throw new Error('Failed to add comment');
      
      const data = await response.json();
      
      setPostData(prev => ({
        ...prev,
        comments: [...(prev.comments || []), data.comment]
      }));
      
      setShowComments(true);
      
    } catch (error) {
      console.error('Failed to comment:', error);
      setCommentText(text);
      notificationService.error('Could not add comment');
    } finally {
      setIsSubmitting(false);
    }
  }, [commentText, postId, isSubmitting, currentUserId, setPostData]);

  // ===== ADD REPLY =====
  const handleReply = useCallback(async (commentId) => {
    if (!currentUserId) {
      notificationService.warning('Please login to reply');
      return;
    }

    if (!replyText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const text = replyText.trim();
    setReplyText('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/posts/${postId}/comments/${commentId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          content: text,
          parentReplyId: replyingToReply
        })
      });
      
      if (!response.ok) throw new Error('Failed to add reply');
      
      const data = await response.json();
      
      setPostData(prev => ({
        ...prev,
        comments: prev.comments?.map(comment => 
          comment._id === commentId
            ? { 
                ...comment, 
                replies: [...(comment.replies || []), data.reply] 
              }
            : comment
        )
      }));
      
      setShowReplies(prev => ({ ...prev, [commentId]: true }));
      setReplyToComment(null);
      setReplyingToReply(null);
      
    } catch (error) {
      console.error('Failed to reply:', error);
      setReplyText(text);
      notificationService.error(error.message || 'Could not add reply');
    } finally {
      setIsSubmitting(false);
    }
  }, [replyText, replyingToReply, postId, isSubmitting, currentUserId, setPostData]);

  // ===== LIKE COMMENT =====
  const handleCommentLike = useCallback(async (commentId) => {
    if (!currentUserId) {
      notificationService.warning('Please login to like comments');
      return;
    }

    const currentLike = commentLikes[commentId] || { liked: false, count: 0 };
    const newLikedState = !currentLike.liked;
    const newCount = newLikedState ? currentLike.count + 1 : currentLike.count - 1;

    setCommentLikes(prev => ({
      ...prev,
      [commentId]: { count: newCount, liked: newLikedState }
    }));

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/posts/${postId}/comments/${commentId}/like`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (!response.ok) throw new Error('Failed to like comment');
      
    } catch (error) {
      setCommentLikes(prev => ({
        ...prev,
        [commentId]: currentLike
      }));
      console.error('Failed to like comment:', error);
      notificationService.error('Could not like comment');
    }
  }, [commentLikes, postId, currentUserId]);

  // ===== LIKE REPLY =====
  const handleReplyLike = useCallback(async (replyId, commentId) => {
    if (!currentUserId) {
      notificationService.warning('Please login to like replies');
      return;
    }

    const currentLike = replyLikes[replyId] || { liked: false, count: 0 };
    const newLikedState = !currentLike.liked;
    const newCount = newLikedState ? currentLike.count + 1 : currentLike.count - 1;

    setReplyLikes(prev => ({
      ...prev,
      [replyId]: { count: newCount, liked: newLikedState }
    }));

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/posts/${postId}/comments/${commentId}/replies/${replyId}/like`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (!response.ok) throw new Error('Failed to like reply');
      
    } catch (error) {
      setReplyLikes(prev => ({
        ...prev,
        [replyId]: currentLike
      }));
      console.error('Failed to like reply:', error);
      notificationService.error('Could not like reply');
    }
  }, [replyLikes, postId, currentUserId]);

  // ===== DELETE COMMENT =====
  const handleDeleteComment = useCallback(async (commentId) => {
    if (!currentUserId) return;
    
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/posts/${postId}/comments/${commentId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (!response.ok) throw new Error('Failed to delete comment');
      
      setPostData(prev => ({
        ...prev,
        comments: prev.comments?.filter(c => c._id !== commentId)
      }));
      
      notificationService.success('Comment deleted');
    } catch (error) {
      console.error('Failed to delete comment:', error);
      notificationService.error(error.message || 'Could not delete comment');
    }
  }, [postId, currentUserId, setPostData]);

  // ===== DELETE REPLY =====
  const handleDeleteReply = useCallback(async (commentId, replyId) => {
    if (!currentUserId) return;
    
    if (!window.confirm('Are you sure you want to delete this reply?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/posts/${postId}/comments/${commentId}/replies/${replyId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (!response.ok) throw new Error('Failed to delete reply');
      
      setPostData(prev => ({
        ...prev,
        comments: prev.comments?.map(comment => 
          comment._id === commentId
            ? { 
                ...comment, 
                replies: comment.replies?.filter(r => r._id !== replyId) 
              }
            : comment
        )
      }));
      
      notificationService.success('Reply deleted');
    } catch (error) {
      console.error('Failed to delete reply:', error);
      notificationService.error(error.message || 'Could not delete reply');
    }
  }, [postId, currentUserId, setPostData]);

  // ===== RETURN ALL VALUES =====
  return {
    commentText,
    setCommentText,
    replyText,
    setReplyText,
    replyToComment,
    setReplyToComment,
    replyingToReply,
    setReplyingToReply,
    showComments,
    setShowComments,
    showReplies,
    toggleReplies,
    showAllCommentsState,
    setShowAllCommentsState,
    commentLikes,
    replyLikes,
    isSubmitting,
    visibleComments,
    hasMoreComments,
    commentCount,  // <-- ADD THIS LINE
    handleComment,
    handleReply,
    handleCommentLike,
    handleReplyLike,
    handleDeleteComment,
    handleDeleteReply,
    commentInputRef,
    replyInputRef
  };
};

export default usePostComments;