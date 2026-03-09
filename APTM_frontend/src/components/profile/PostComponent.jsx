// PostComponent.jsx - Complete fixed version with working poll voting
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './UserProfileView.module.css';
import { 
  FaHeart, 
  FaRegHeart, 
  FaComment, 
  FaShare, 
  FaTrash, 
  FaEdit,
  FaReply,
  FaEllipsisH,
  FaFlag,
  FaBookmark,
  FaRegBookmark,
  FaUser,
  FaLink,
  FaExternalLinkAlt,
  FaCheckCircle,
  FaTimes,
  FaPaperPlane,
  FaShareAlt,
  FaCopy,
  FaTwitter,
  FaFacebook,
  FaWhatsapp,
  FaTelegram,
  FaEnvelope,
  FaRetweet,
  FaGlobe,
  FaUserFriends,
  FaLock,
  FaSpinner,
  FaImage,
  FaVideo,
  FaFileAlt,
  FaPlay,
  FaPause,
  FaVolumeUp,
  FaVolumeMute,
  FaExpand,
  FaCompress,
  FaExclamationCircle,
  FaMapMarkerAlt  // <-- ADD THIS MISSING IMPORT
} from 'react-icons/fa';
import AvatarWithFallback from './AvatarWithFallback';
import Lightbox from 'react-image-lightbox';
import 'react-image-lightbox/style.css';

// Simple notification service - FIXED
const notificationService = {
  success: (message) => {
    console.log(`✅ Success: ${message}`);
    
  },
  error: (message) => {
    console.error(`❌ Error: ${message}`);
    //alert(message);
  },
  warning: (message) => {
    console.warn(`⚠️ Warning: ${message}`);
    //alert(message);
  },
  info: (message) => {
    console.log(`ℹ️ Info: ${message}`);
   // alert(message);
  }
};

// Simple socket service
const socketService = {
  getSocket: () => {
    // Return a mock socket or try to get from window
    if (typeof window !== 'undefined' && window.io) {
      return window.io();
    }
    return {
      emit: () => {},
      on: () => {},
      off: () => {}
    };
  },
  isConnected: () => false,
  emit: (event, data) => {
    console.log(`📡 Socket emit: ${event}`, data);
  }
};

const PostComponent = ({ 
  // Core props
  post, 
  currentUserId, 
  
  // Callback props
  onLike, 
  onComment, 
  onDelete,
  onReply,
  onShare,
  onRepost,
  onSave,
  onReplyLike,
  onReplyDelete,
  onReport,
  onPostUpdate,
  onUserClick,
  
  // UI state props
  showActions = true,
  isSaved = false,
  showAllReplies = false,
  maxInitialComments = 3,
  realtimeEnabled = true,
  expanded = false,
  hideStats = false,
  hideActions = false,
  hideComments = false,
  
  // Feature flags
  allowEditing = true,
  allowDeletion = true,
  allowReporting = true,
  allowSaving = true,
  showMediaLightbox = true,
  autoPlayVideo = false,
  muteVideo = true
}) => {
  const navigate = useNavigate();
  
  // ============ STATE MANAGEMENT ============
  const [postData, setPostData] = useState(post);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Interaction states
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isSavedState, setIsSavedState] = useState(isSaved);
  const [isReposted, setIsReposted] = useState(false);
  const [repostCount, setRepostCount] = useState(0);
  const [shareCount, setShareCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  
  // Poll states - FIXED
  const [pollData, setPollData] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [pollResults, setPollResults] = useState(null); // Store poll results separately
  
  // UI states
  const [showComments, setShowComments] = useState(expanded);
  const [showReplies, setShowReplies] = useState({});
  const [showAllCommentsState, setShowAllCommentsState] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showMediaLightboxState, setShowMediaLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  
  // Input states
  const [commentText, setCommentText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyToComment, setReplyToComment] = useState(null);
  const [replyingToReply, setReplyingToReply] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [repostContent, setRepostContent] = useState('');
  const [repostVisibility, setRepostVisibility] = useState('public');
  
  // Media states
  const [imageError, setImageError] = useState({});
  const [videoPlaying, setVideoPlaying] = useState({});
  const [videoMuted, setVideoMuted] = useState({});
  const [videoFullscreen, setVideoFullscreen] = useState({});
  
  // Real-time states
  const [onlineStatus, setOnlineStatus] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [replyLikes, setReplyLikes] = useState({});
  const [commentLikes, setCommentLikes] = useState({});
  
  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReposting, setIsReposting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  
  // Share URL state
  const [shareUrl, setShareUrl] = useState('');
  const [copySuccess, setCopySuccess] = useState('');
  
  // Refs
  const commentInputRef = useRef(null);
  const replyInputRef = useRef(null);
  const shareModalRef = useRef(null);
  const repostModalRef = useRef(null);
  const editModalRef = useRef(null);
  const optionsRef = useRef(null);
  const videoRefs = useRef({});
  
  // ============ INITIALIZATION ============
  // ============ INITIALIZATION ============
useEffect(() => {
  if (post) {
    console.log('📦 Post data received:', post);
    setPostData(post);
    setIsLiked(checkIfLiked());
    setLikesCount(getLikesCount());
    setIsSavedState(isSaved);
    setIsReposted(checkIfReposted());
    setRepostCount(getRepostCount());
    setShareCount(getShareCount());
    setCommentCount(getCommentCount());
    setEditContent(post.content || '');
    
    // Initialize poll data if it exists - FIXED
    if (post.poll) {
      console.log('📊 Poll data found:', post.poll);
      setPollData(post.poll);
      
      // Check if user has already voted
      if (post.poll.userVotes && post.poll.userVotes.length > 0) {
        setHasVoted(true);
        setSelectedOption(post.poll.userVotes[0]);
      } else {
        setHasVoted(false);
        setSelectedOption(null);
      }
    } else {
      // Reset poll state if no poll
      setPollData(null);
      setHasVoted(false);
      setSelectedOption(null);
    }
  }
}, [post, isSaved]);

  // Generate share URL
  useEffect(() => {
    if (postData?._id) {
      setShareUrl(`${window.location.origin}/post/${postData._id}`);
    }
  }, [postData?._id]);

  // Initialize reply and comment likes
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

  // ============ HELPER FUNCTIONS ============
  const checkIfLiked = () => {
    if (!post?.likes) return false;
    if (Array.isArray(post.likes)) {
      return post.likes.some(like => {
        if (!like) return false;
        const likeId = (typeof like === 'object' ? like?._id || like?.userId : like);
        return likeId === currentUserId;
      });
    }
    return false;
  };

  const getLikesCount = () => {
    if (!post?.likes) return 0;
    if (Array.isArray(post.likes)) return post.likes.length;
    if (typeof post.likes === 'number') return post.likes;
    return 0;
  };

  const checkIfReposted = () => {
    if (!post?.reposts || !Array.isArray(post.reposts)) return false;
    return post.reposts.some(r => {
      if (!r) return false;
      const repostUserId = r.userId?._id || r.userId;
      return repostUserId === currentUserId;
    });
  };

  const getRepostCount = () => {
    return post?.reposts?.length || 0;
  };

  const getShareCount = () => {
    return post?.shares || 0;
  };

  const getCommentCount = () => {
    return post?.comments?.length || 0;
  };

  // Get post user data
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

  const postUser = getPostUser();

  const isRepost = useMemo(() => {
    return postData?.repostOf || postData?.sharedPost || postData?.originalPost;
  }, [postData]);

  const originalPost = useMemo(() => {
    return postData?.repostOf || postData?.sharedPost || postData?.originalPost || null;
  }, [postData]);

  const formatAvatarUrl = useCallback((avatar) => {
    if (!avatar) return null;
    if (typeof avatar === 'string' && (avatar.startsWith('http') || avatar.startsWith('data:'))) {
      return avatar;
    }
    if (typeof avatar === 'object' && avatar?.url) {
      return avatar.url;
    }
    if (typeof avatar === 'string') {
      const cleanPath = avatar.replace(/^\/+/, '');
      if (cleanPath.startsWith('uploads/')) {
        return `http://localhost:5000/${cleanPath}`;
      }
      return `http://localhost:5000/uploads/${cleanPath}`;
    }
    return null;
  }, []);

  const formatMediaUrl = useCallback((media) => {
    if (!media) return null;
    if (typeof media === 'string') {
      if (media.startsWith('http') || media.startsWith('data:')) {
        return media;
      }
      const cleanPath = media.replace(/^\/+/, '');
      return `http://localhost:5000/${cleanPath}`;
    }
    if (media.url) {
      if (media.url.startsWith('http') || media.url.startsWith('data:')) {
        return media.url;
      }
      const cleanPath = media.url.replace(/^\/+/, '');
      return `http://localhost:5000/${cleanPath}`;
    }
    return null;
  }, []);

  const handleImageError = useCallback((userId) => {
    setImageError(prev => ({ ...prev, [userId]: true }));
  }, []);

  const getUserDisplay = useCallback((user) => {
    if (!user) return { 
      name: 'User', 
      initial: 'U', 
      avatarUrl: null, 
      userId: null, 
      username: 'user',
      hasAvatar: false,
      isOnline: false 
    };
    
    try {
      let userObj = user;
      
      if (typeof user === 'string') {
        return { 
          name: 'User', 
          initial: 'U', 
          avatarUrl: null, 
          userId: user, 
          username: 'user',
          hasAvatar: false,
          isOnline: onlineStatus[user] || false
        };
      }
      
      if (user.user && typeof user.user === 'object') {
        userObj = user.user;
      }
      
      const userId = userObj?._id || userObj?.id || (userObj?.userId && (userObj.userId._id || userObj.userId));
      
      let name = userObj?.name || userObj?.displayName || userObj?.fullName || 'User';
      let username = userObj?.username || userObj?.userName || 'user';
      let avatar = userObj?.avatar || userObj?.avatarUrl || userObj?.profilePicture;
      
      if (avatar && typeof avatar === 'object') {
        avatar = avatar?.url || avatar?.avatarUrl || null;
      }
      
      const initial = name?.charAt(0).toUpperCase() || 'U';
      const avatarUrl = formatAvatarUrl(avatar);
      const hasAvatar = avatarUrl && !imageError[userId];
      
      return { 
        userId, 
        name, 
        username, 
        initial, 
        avatarUrl, 
        hasAvatar,
        isOnline: onlineStatus[userId] || false
      };
    } catch (error) {
      console.error('Error in getUserDisplay:', error, user);
      return { 
        name: 'User', 
        initial: 'U', 
        avatarUrl: null, 
        userId: null, 
        username: 'user',
        hasAvatar: false,
        isOnline: false 
      };
    }
  }, [formatAvatarUrl, imageError, onlineStatus]);

  // ============ POLL VOTING FUNCTIONALITY - FIXED ============
  const handleVote = useCallback(async (optionIndex) => {
  if (!currentUserId) {
    notificationService.warning('Please login to vote');
    return;
  }

  if (!pollData) {
    notificationService.error('Poll data not found');
    return;
  }

  if (hasVoted) {
    notificationService.info('You have already voted in this poll');
    return;
  }

  // Check if poll has expired
  const now = new Date();
  const endsAt = new Date(pollData.endsAt);
  if (now > endsAt) {
    notificationService.info('This poll has ended');
    return;
  }

  if (isVoting) return;

  setIsVoting(true);
  console.log('🗳️ Voting on poll:', pollData._id, 'Option:', optionIndex);

  try {
    const token = localStorage.getItem('token');
    // FIXED URL - Added /posts/ prefix
    const response = await fetch(`http://localhost:5000/api/posts/polls/${pollData._id}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ optionIndices: [optionIndex] })
    });

    const data = await response.json();
    console.log('📥 Vote response:', data);

    if (!response.ok) {
      throw new Error(data.message || 'Failed to vote');
    }

    // Update poll data with new results
    if (data.poll) {
      console.log('✅ Vote successful, updating poll data:', data.poll);
      setPollData(data.poll);
      setHasVoted(true);
      setSelectedOption(optionIndex);
      
      // Update postData as well
      setPostData(prev => ({
        ...prev,
        poll: data.poll
      }));
    }

    notificationService.success('Your vote has been recorded');
    
  } catch (error) {
    console.error('❌ Failed to vote:', error);
    notificationService.error(error.message || 'Could not vote on poll');
  } finally {
    setIsVoting(false);
  }
}, [currentUserId, pollData, hasVoted, isVoting]);

  // ============ RENDER POLL - FIXED ============
  const renderPoll = () => {
    // Use pollResults if available, otherwise use pollData
    const currentPoll = pollResults || pollData;
    if (!currentPoll) return null;
    
    const now = new Date();
    const endsAt = new Date(currentPoll.endsAt);
    const hasExpired = now > endsAt;
    const totalVotes = currentPoll.totalVotes || 0;
    
    return (
      <div className={styles.pollContainer}>
        <div className={styles.pollHeader}>
          <h4 className={styles.pollQuestion}>{currentPoll.question}</h4>
          {hasExpired && <span className={styles.pollExpired}>Ended</span>}
          {hasVoted && !hasExpired && <span className={styles.pollVoted}>✓ You voted</span>}
        </div>
        
        <div className={styles.pollOptions}>
          {currentPoll.options.map((option, index) => {
            const voteCount = option.voteCount || 0;
            const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
            const isSelected = selectedOption === index;
            
            // Check if this option should be selectable
            const canVote = !hasVoted && !hasExpired && !isVoting;
            
            return (
              <div key={index} className={styles.pollOptionWrapper}>
                <button
                  className={`${styles.pollOptionButton} ${
                    hasVoted || hasExpired ? styles.pollOptionResults : ''
                  } ${isSelected ? styles.pollOptionSelected : ''} ${
                    isVoting ? styles.voting : ''
                  }`}
                  onClick={() => canVote && handleVote(index)}
                  disabled={!canVote}
                  data-selected={isSelected}
                >
                  <span className={styles.pollOptionText}>{option.text}</span>
                  {/* ALWAYS SHOW STATS - REMOVED THE CONDITION */}
                  <span className={styles.pollPercentage}>
                    {Math.round(percentage)}% ({voteCount} vote{voteCount !== 1 ? 's' : ''})
                  </span>
                </button>
                
                {/* Progress bar always visible */}
                <div 
                  className={styles.pollProgressBar}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            );
          })}
        </div>
        
        <div className={styles.pollFooter}>
          <span className={styles.pollTotalVotes}>
            {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
          </span>
          <span className={styles.pollDot}>•</span>
          <span className={styles.pollEnds}>
            {hasExpired ? ' Ended' : ` Ends ${endsAt.toLocaleDateString()}`}
          </span>
          {currentPoll.multipleChoice && (
            <>
              <span className={styles.pollDot}>•</span>
              <span className={styles.pollMultipleChoice}>Multiple choices allowed</span>
            </>
          )}
        </div>
      </div>
    );
  };

  // ============ CLICK OUTSIDE HANDLER ============
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target)) {
        setShowOptions(false);
      }
      if (shareModalRef.current && !shareModalRef.current.contains(event.target)) {
        setShowShareModal(false);
      }
      if (repostModalRef.current && !repostModalRef.current.contains(event.target)) {
        setShowRepostModal(false);
      }
      if (editModalRef.current && !editModalRef.current.contains(event.target)) {
        setShowEditModal(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ============ USER INTERACTION ============
  const handleUserClick = useCallback((userId, event) => {
    event?.stopPropagation();
    
    let targetUserId = userId;
    
    if (userId && typeof userId === 'object') {
      targetUserId = userId._id || userId.id;
    }
    
    if (!targetUserId) {
      console.error('No user ID found:', userId);
      return;
    }
    
    if (onUserClick) {
      onUserClick(targetUserId);
    } else {
      navigate(`/profile/${targetUserId}`);
    }
  }, [navigate, onUserClick]);

  // ============ LIKE FUNCTIONALITY ============
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
      const response = await fetch(`http://localhost:5000/api/posts/${postData._id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to like post');
      
    } catch (error) {
      setIsLiked(!newLikedState);
      setLikesCount(likesCount);
      console.error('Failed to like post:', error);
      notificationService.error('Could not like post');
    }
  }, [isLiked, likesCount, postData?._id, currentUserId]);

  // ============ COMMENT FUNCTIONALITY ============
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
      const response = await fetch(`http://localhost:5000/api/posts/${postData._id}/comments`, {
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
      setCommentCount(prev => prev + 1);
      setShowComments(true);
      
    } catch (error) {
      console.error('Failed to comment:', error);
      setCommentText(text);
      notificationService.error('Could not add comment');
    } finally {
      setIsSubmitting(false);
    }
  }, [commentText, postData?._id, isSubmitting, currentUserId]);

  // ============ REPLY FUNCTIONALITY ============
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
      const response = await fetch(`http://localhost:5000/api/posts/${postData._id}/comments/${commentId}/replies`, {
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
  }, [replyText, replyingToReply, postData?._id, isSubmitting, currentUserId]);

  // ============ REPLY LIKE FUNCTIONALITY ============
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
        `http://localhost:5000/api/posts/${postData._id}/comments/${commentId}/replies/${replyId}/like`,
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
  }, [replyLikes, postData?._id, currentUserId]);

  // ============ COMMENT LIKE FUNCTIONALITY ============
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
        `http://localhost:5000/api/posts/${postData._id}/comments/${commentId}/like`,
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
  }, [commentLikes, postData?._id, currentUserId]);

  // ============ DELETE COMMENT FUNCTIONALITY ============
  const handleDeleteComment = useCallback(async (commentId) => {
    if (!currentUserId) return;
    
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/posts/${postData._id}/comments/${commentId}`,
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
      setCommentCount(prev => Math.max(0, prev - 1));
      
      notificationService.success('Comment deleted');
    } catch (error) {
      console.error('Failed to delete comment:', error);
      notificationService.error(error.message || 'Could not delete comment');
    }
  }, [postData?._id, currentUserId]);

  // ============ DELETE REPLY FUNCTIONALITY ============
  const handleDeleteReply = useCallback(async (commentId, replyId) => {
    if (!currentUserId) return;
    
    if (!window.confirm('Are you sure you want to delete this reply?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/posts/${postData._id}/comments/${commentId}/replies/${replyId}`,
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
  }, [postData?._id, currentUserId]);

  // ============ SHARE FUNCTIONALITY ============
  const handleShare = useCallback(async (platform = null) => {
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
              setShowShareModal(false);
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
        setShowShareModal(false);
      }
      
      try {
        const token = localStorage.getItem('token');
        await fetch(`http://localhost:5000/api/posts/${postData._id}/share`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setShareCount(prev => prev + 1);
      } catch (error) {
        console.error('Failed to track share:', error);
      }
      
    } else {
      setShowShareModal(true);
    }
  }, [shareUrl, postData, postUser, currentUserId]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setCopySuccess('Copied!');
        setTimeout(() => setCopySuccess(''), 2000);
        notificationService.success('Link copied to clipboard');
      })
      .catch(() => {
        setCopySuccess('Failed to copy');
        setTimeout(() => setCopySuccess(''), 2000);
      });
  }, [shareUrl]);

  // ============ REPOST FUNCTIONALITY ============
  const handleRepost = useCallback(async () => {
    if (!currentUserId) {
      notificationService.warning('Please login to repost');
      return;
    }

    if (isReposting) return;

    setIsReposting(true);

    try {
      const repostData = {
        originalPostId: postData._id,
        content: repostContent.trim() || null,
        visibility: repostVisibility
      };

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/posts/${postData._id}/repost`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(repostData)
      });
      
      if (!response.ok) throw new Error('Failed to repost');
      
      setShowRepostModal(false);
      setRepostContent('');
      setRepostCount(prev => prev + 1);
      setIsReposted(true);
      
      notificationService.success('Post shared to your timeline!');
      
    } catch (error) {
      console.error('Failed to repost:', error);
      notificationService.error('Could not share post');
    } finally {
      setIsReposting(false);
    }
  }, [postData?._id, currentUserId, repostContent, repostVisibility, isReposting]);

  // ============ SAVE FUNCTIONALITY ============
  const handleSave = useCallback(async () => {
    if (!currentUserId) {
      notificationService.warning('Please login to save posts');
      return;
    }

    const newSavedState = !isSavedState;
    setIsSavedState(newSavedState);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/posts/${postData._id}/save`, {
        method: newSavedState ? 'POST' : 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to save post');
      
      notificationService.success(newSavedState ? 'Post saved' : 'Post unsaved');
      
    } catch (error) {
      setIsSavedState(!newSavedState);
      console.error('Failed to save post:', error);
      notificationService.error('Could not save post');
    }
  }, [isSavedState, postData?._id, currentUserId]);

  // ============ DELETE POST FUNCTIONALITY ============
  const handleDelete = useCallback(async () => {
    if (!currentUserId) return;
    
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/posts/${postData._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to delete post');
      
      notificationService.success('Post deleted');
      
      if (window.location.pathname.includes(`/post/${postData._id}`)) {
        navigate(-1);
      }
      
    } catch (error) {
      console.error('Failed to delete post:', error);
      notificationService.error('Could not delete post');
    } finally {
      setIsDeleting(false);
    }
  }, [postData?._id, currentUserId, navigate]);

  // ============ EDIT POST FUNCTIONALITY ============
  const handleEdit = useCallback(async () => {
    if (!currentUserId) return;
    
    if (!editContent.trim()) {
      notificationService.warning('Post content cannot be empty');
      return;
    }

    setIsEditing(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/posts/${postData._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: editContent.trim() })
      });
      
      if (!response.ok) throw new Error('Failed to update post');
      
      const data = await response.json();
      
      setPostData(prev => ({ ...prev, content: editContent.trim(), isEdited: true }));
      setShowEditModal(false);
      
      notificationService.success('Post updated');
      
    } catch (error) {
      console.error('Failed to edit post:', error);
      notificationService.error('Could not update post');
    } finally {
      setIsEditing(false);
    }
  }, [editContent, postData?._id, currentUserId]);

  // ============ REPORT POST FUNCTIONALITY ============
  const handleReport = useCallback(async () => {
    if (!currentUserId) {
      notificationService.warning('Please login to report posts');
      return;
    }

    if (!reportReason) {
      notificationService.warning('Please select a reason');
      return;
    }

    setIsReporting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/posts/${postData._id}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason: reportReason, details: reportDetails })
      });
      
      if (!response.ok) throw new Error('Failed to report post');
      
      setShowReportModal(false);
      setReportReason('');
      setReportDetails('');
      setShowOptions(false);
      
      notificationService.success('Post has been reported for review');
      
    } catch (error) {
      console.error('Failed to report post:', error);
      notificationService.error('Could not report post');
    } finally {
      setIsReporting(false);
    }
  }, [postData?._id, reportReason, reportDetails, currentUserId]);

  // ============ VIDEO CONTROLS ============
  const handleVideoPlay = useCallback((videoId) => {
    setVideoPlaying(prev => ({ ...prev, [videoId]: true }));
  }, []);

  const handleVideoPause = useCallback((videoId) => {
    setVideoPlaying(prev => ({ ...prev, [videoId]: false }));
  }, []);

  const handleVideoMute = useCallback((videoId) => {
    setVideoMuted(prev => ({ ...prev, [videoId]: !prev[videoId] }));
  }, []);

  const handleVideoFullscreen = useCallback((videoId) => {
    const video = videoRefs.current[videoId];
    if (video) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
        setVideoFullscreen(prev => ({ ...prev, [videoId]: false }));
      } else {
        video.requestFullscreen();
        setVideoFullscreen(prev => ({ ...prev, [videoId]: true }));
      }
    }
  }, []);

  // ============ MEDIA LIGHTBOX ============
  const openLightbox = useCallback((index) => {
    setLightboxIndex(index);
    setShowMediaLightbox(true);
  }, []);

  // ============ TOGGLE FUNCTIONS ============
  const toggleReplies = useCallback((commentId) => {
    setShowReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  }, []);

  const loadMoreComments = useCallback(() => {
    setShowAllCommentsState(true);
  }, []);

  // ============ VISIBLE COMMENTS ============
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

  // ============ MEDIA RENDERING ============
  const renderMedia = useCallback((media, index) => {
    const mediaUrl = formatMediaUrl(media);
    if (!mediaUrl) return null;
    
    const mediaType = typeof media === 'object' ? media?.type : 
      (media.url ? media.type : media.split('.').pop()?.toLowerCase());
    
    const mediaId = `${postData._id}-${index}`;
    
    if (mediaType?.startsWith('image') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(mediaType)) {
      return (
        <div 
          key={index} 
          className={styles.mediaItem}
          onClick={() => showMediaLightbox && openLightbox(index)}
        >
          <img 
            src={mediaUrl} 
            alt={`Post media ${index + 1}`} 
            className={styles.postImage}
            onError={(e) => e.target.style.display = 'none'}
            loading="lazy"
          />
          {showMediaLightbox && (
            <div className={styles.mediaOverlay}>
              <FaExpand />
            </div>
          )}
        </div>
      );
    }
    
    if (mediaType?.startsWith('video') || ['mp4', 'webm', 'mov', 'avi'].includes(mediaType)) {
      return (
        <div key={index} className={styles.mediaItem}>
          <video 
            ref={el => videoRefs.current[mediaId] = el}
            src={mediaUrl} 
            className={styles.postVideo}
            controls
            autoPlay={autoPlayVideo && videoPlaying[mediaId]}
            muted={muteVideo || videoMuted[mediaId]}
            onPlay={() => handleVideoPlay(mediaId)}
            onPause={() => handleVideoPause(mediaId)}
          />
          <div className={styles.videoControls}>
            <button onClick={() => handleVideoMute(mediaId)}>
              {videoMuted[mediaId] ? <FaVolumeMute /> : <FaVolumeUp />}
            </button>
            <button onClick={() => handleVideoFullscreen(mediaId)}>
              {videoFullscreen[mediaId] ? <FaCompress /> : <FaExpand />}
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div key={index} className={styles.mediaItem}>
        <a 
          href={mediaUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className={styles.documentLink}
        >
          <FaFileAlt />
          <span>View Attachment</span>
          <FaExternalLinkAlt />
        </a>
      </div>
    );
  }, [formatMediaUrl, postData?._id, showMediaLightbox, autoPlayVideo, muteVideo, videoPlaying, videoMuted, videoFullscreen, openLightbox, handleVideoPlay, handleVideoPause, handleVideoMute, handleVideoFullscreen]);

  // ============ RENDER MODALS ============
  const renderShareModal = () => (
    <div className={styles.shareModalOverlay}>
      <div className={styles.shareModal} ref={shareModalRef}>
        <div className={styles.shareModalHeader}>
          <h3>Share Post</h3>
          <button 
            className={styles.closeModalBtn}
            onClick={() => setShowShareModal(false)}
          >
            <FaTimes />
          </button>
        </div>
        
        <div className={styles.shareModalBody}>
          <div className={styles.shareLinkContainer}>
            <input 
              type="text" 
              value={shareUrl} 
              readOnly 
              className={styles.shareLinkInput}
            />
            <button 
              className={styles.copyLinkBtn}
              onClick={handleCopyLink}
            >
              {copySuccess || <FaCopy />}
            </button>
          </div>

          <div className={styles.shareDivider}>
            <span>Share to</span>
          </div>

          <div className={styles.sharePlatforms}>
            <button 
              className={`${styles.sharePlatform} ${styles.twitter}`}
              onClick={() => handleShare('twitter')}
            >
              <FaTwitter /> Twitter
            </button>
            <button 
              className={`${styles.sharePlatform} ${styles.facebook}`}
              onClick={() => handleShare('facebook')}
            >
              <FaFacebook /> Facebook
            </button>
            <button 
              className={`${styles.sharePlatform} ${styles.whatsapp}`}
              onClick={() => handleShare('whatsapp')}
            >
              <FaWhatsapp /> WhatsApp
            </button>
            <button 
              className={`${styles.sharePlatform} ${styles.telegram}`}
              onClick={() => handleShare('telegram')}
            >
              <FaTelegram /> Telegram
            </button>
            <button 
              className={`${styles.sharePlatform} ${styles.email}`}
              onClick={() => handleShare('email')}
            >
              <FaEnvelope /> Email
            </button>
          </div>

          {navigator.share && (
            <>
              <div className={styles.shareDivider}>or</div>
              <button 
                className={styles.nativeShareBtn}
                onClick={() => handleShare('native')}
              >
                <FaShareAlt /> Share via...
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderRepostModal = () => (
    <div className={styles.repostModalOverlay}>
      <div className={styles.repostModal} ref={repostModalRef}>
        <div className={styles.repostModalHeader}>
          <h3>Share to Your Timeline</h3>
          <button 
            className={styles.closeModalBtn}
            onClick={() => setShowRepostModal(false)}
          >
            <FaTimes />
          </button>
        </div>
        
        <div className={styles.repostModalBody}>
          <div className={styles.originalPostPreview}>
            <div className={styles.previewHeader}>
              <div className={styles.previewAvatar}>
                <AvatarWithFallback user={postUser} size="small" />
              </div>
              <div className={styles.previewUserInfo}>
                <strong>{postUser.name}</strong>
                <span>@{postUser.username}</span>
              </div>
            </div>
            <p className={styles.previewContent}>{postData.content}</p>
          </div>

          <div className={styles.repostCommentSection}>
            <label htmlFor="repostComment">Add a comment (optional)</label>
            <textarea
              id="repostComment"
              placeholder="What's on your mind about this post?"
              value={repostContent}
              onChange={(e) => setRepostContent(e.target.value)}
              className={styles.repostTextarea}
              rows={3}
              maxLength={500}
            />
          </div>

          <div className={styles.repostActions}>
            <button 
              className={styles.cancelRepostBtn}
              onClick={() => setShowRepostModal(false)}
              disabled={isReposting}
            >
              Cancel
            </button>
            <button 
              className={styles.confirmRepostBtn}
              onClick={handleRepost}
              disabled={isReposting}
            >
              {isReposting ? (
                <>
                  <FaSpinner className={styles.spinning} />
                  Sharing...
                </>
              ) : (
                <>
                  Share to Timeline
                  <FaRetweet />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEditModal = () => (
    <div className={styles.editModalOverlay}>
      <div className={styles.editModal} ref={editModalRef}>
        <div className={styles.editModalHeader}>
          <h3>Edit Post</h3>
          <button 
            className={styles.closeModalBtn}
            onClick={() => setShowEditModal(false)}
          >
            <FaTimes />
          </button>
        </div>
        
        <div className={styles.editModalBody}>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className={styles.editTextarea}
            rows={5}
            maxLength={2000}
            placeholder="What's on your mind?"
          />
          <div className={styles.characterCounter}>
            {editContent.length}/2000
          </div>

          <div className={styles.editActions}>
            <button 
              className={styles.cancelEditBtn}
              onClick={() => setShowEditModal(false)}
              disabled={isEditing}
            >
              Cancel
            </button>
            <button 
              className={styles.confirmEditBtn}
              onClick={handleEdit}
              disabled={isEditing || !editContent.trim() || editContent === postData.content}
            >
              {isEditing ? (
                <>
                  <FaSpinner className={styles.spinning} />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderReportModal = () => (
    <div className={styles.reportModalOverlay}>
      <div className={styles.reportModal}>
        <div className={styles.reportModalHeader}>
          <h3>Report Post</h3>
          <button 
            className={styles.closeModalBtn}
            onClick={() => setShowReportModal(false)}
          >
            <FaTimes />
          </button>
        </div>
        
        <div className={styles.reportModalBody}>
          <div className={styles.reportReason}>
            <label>Reason for reporting</label>
            <select 
              value={reportReason} 
              onChange={(e) => setReportReason(e.target.value)}
              disabled={isReporting}
            >
              <option value="">Select a reason</option>
              <option value="spam">Spam</option>
              <option value="harassment">Harassment</option>
              <option value="hate_speech">Hate speech</option>
              <option value="violence">Violence</option>
              <option value="nudity">Nudity or sexual content</option>
              <option value="false_information">False information</option>
              <option value="copyright">Copyright violation</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className={styles.reportDetails}>
            <label>Additional details (optional)</label>
            <textarea
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              placeholder="Please provide any additional information..."
              rows={4}
              disabled={isReporting}
            />
          </div>

          <div className={styles.reportActions}>
            <button 
              className={styles.cancelReportBtn}
              onClick={() => setShowReportModal(false)}
              disabled={isReporting}
            >
              Cancel
            </button>
            <button 
              className={styles.submitReportBtn}
              onClick={handleReport}
              disabled={isReporting || !reportReason}
            >
              {isReporting ? (
                <>
                  <FaSpinner className={styles.spinning} />
                  Submitting...
                </>
              ) : (
                'Submit Report'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ============ RENDER LOADING/ERROR STATE ============
  if (loading) {
    return (
      <div className={styles.postCard}>
        <div className={styles.loadingState}>
          <FaSpinner className={styles.spinning} />
          <span>Loading post...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.postCard}>
        <div className={styles.errorState}>
          <FaExclamationCircle />
          <span>Error: {error}</span>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  if (!postData) return null;

  // ============ MAIN RENDER ============
  return (
    <div className={styles.postCard} data-post-id={postData._id}>
      {/* Modals */}
      {showShareModal && renderShareModal()}
      {showRepostModal && renderRepostModal()}
      {showEditModal && renderEditModal()}
      {showReportModal && renderReportModal()}
      
      {/* Media Lightbox */}
      {showMediaLightboxState && postData.media && postData.media.length > 0 && (
        <Lightbox
          mainSrc={formatMediaUrl(postData.media[lightboxIndex])}
          nextSrc={formatMediaUrl(postData.media[(lightboxIndex + 1) % postData.media.length])}
          prevSrc={formatMediaUrl(postData.media[(lightboxIndex + postData.media.length - 1) % postData.media.length])}
          onCloseRequest={() => setShowMediaLightbox(false)}
          onMovePrevRequest={() => setLightboxIndex((lightboxIndex + postData.media.length - 1) % postData.media.length)}
          onMoveNextRequest={() => setLightboxIndex((lightboxIndex + 1) % postData.media.length)}
          enableZoom={true}
        />
      )}

      {/* Post Header */}
      <div className={styles.postHeader}>
        <div 
          className={styles.postAuthor}
          onClick={(e) => handleUserClick(postUser._id, e)}
        >
          <div className={styles.postAvatar}>
            <AvatarWithFallback
              user={postUser}
              size="medium"
            />
            <span className={`${styles.userOnlineIndicator} ${postUser.isOnline ? styles.online : ''}`} />
          </div>
          
          <div className={styles.postAuthorInfo}>
            <div className={styles.nameWrapper}>
              <strong>{postUser.name}</strong>
              {postUser.isVerified && <FaCheckCircle className={styles.verifiedBadge} />}
            </div>
            <span className={styles.postUsername}>@{postUser.username}</span>
            <span className={styles.postTime}>
              {postData.createdAt ? new Date(postData.createdAt).toLocaleDateString() : 'Just now'}
              {postData.isEdited && <span className={styles.editedIndicator}> (edited)</span>}
            </span>
          </div>
        </div>
        
        {showActions && (
          <div className={styles.postHeaderActions} ref={optionsRef}>
            {allowSaving && (
              <button 
                className={`${styles.iconButton} ${isSavedState ? styles.saved : ''}`}
                onClick={handleSave}
                title={isSavedState ? 'Unsave post' : 'Save post'}
                disabled={isDeleting || isEditing}
              >
                {isSavedState ? <FaBookmark /> : <FaRegBookmark />}
              </button>
            )}
            
            <div className={styles.optionsContainer}>
              <button 
                className={styles.optionsButton}
                onClick={() => setShowOptions(!showOptions)}
                disabled={isDeleting || isEditing}
              >
                <FaEllipsisH />
              </button>
              
              {showOptions && (
                <div className={styles.optionsMenu}>
                  {postUser._id === currentUserId ? (
                    <>
                      {allowEditing && (
                        <button 
                          className={styles.optionItem}
                          onClick={() => setShowEditModal(true)}
                        >
                          <FaEdit /> Edit
                        </button>
                      )}
                      {allowDeletion && (
                        <button 
                          className={`${styles.optionItem} ${styles.deleteOption}`}
                          onClick={handleDelete}
                          disabled={isDeleting}
                        >
                          {isDeleting ? <FaSpinner className={styles.spinning} /> : <FaTrash />} 
                          Delete
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      {allowReporting && (
                        <button 
                          className={styles.optionItem}
                          onClick={() => setShowReportModal(true)}
                        >
                          <FaFlag /> Report
                        </button>
                      )}
                      <button 
                        className={styles.optionItem}
                        onClick={(e) => handleUserClick(postUser._id, e)}
                      >
                        <FaUser /> View Profile
                      </button>
                      <button 
                        className={styles.optionItem}
                        onClick={handleCopyLink}
                      >
                        <FaLink /> Copy Link
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Show repost indicator if this is a repost */}
      {isRepost && originalPost && (
        <div className={styles.repostIndicator}>
          <FaRetweet /> You reposted
        </div>
      )}

      {/* If this is a repost, show the reposter's comment first */}
      {isRepost && postData.content && (
        <div className={styles.reposterComment}>
          <p>{postData.content}</p>
        </div>
      )}
      
      {/* Post Content with Poll */}
      <div className={`${styles.postContent} ${isRepost ? styles.repostedContent : ''}`}>
        {isRepost && originalPost ? (
          <>
            {/* Original Post Header */}
            <div className={styles.originalPostHeader}>
              <div className={styles.originalPostAuthor}>
                <div className={styles.originalPostAvatar}>
                  <AvatarWithFallback
                    user={originalPost.userId}
                    size="small"
                  />
                </div>
                <div className={styles.originalPostUserInfo}>
                  <strong>{originalPost.userId?.name}</strong>
                  <span>@{originalPost.userId?.username}</span>
                </div>
              </div>
            </div>
            <p className={styles.postText}>{originalPost.content || ''}</p>
            
            {/* Render poll for original post if it exists */}
            {originalPost.poll && renderPoll()}
            
            {/* Original Post Media */}
            {originalPost.media && originalPost.media.length > 0 && (
              <div className={`${styles.postMedia} ${originalPost.media.length > 1 ? styles.mediaGrid : ''}`}>
                {originalPost.media.map((media, index) => renderMedia(media, index))}
              </div>
            )}
          </>
        ) : (
          <>
            <p className={styles.postText}>{postData.content || ''}</p>
            
            {/* Render poll if it exists */}
            {pollData && renderPoll()}
            
            {/* Media attachments */}
            {postData.media && postData.media.length > 0 && (
              <div className={`${styles.postMedia} ${postData.media.length > 1 ? styles.mediaGrid : ''}`}>
                {postData.media.map((media, index) => renderMedia(media, index))}
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Location */}
      {postData.location && (
        <div className={styles.postLocation}>
          <FaMapMarkerAlt />
          <span>{postData.location.name}</span>
        </div>
      )}

      {/* Post Stats */}
      {!hideStats && (
        <div className={styles.postStats}>
          <button 
            className={`${styles.statButton} ${isLiked ? styles.liked : ''}`}
            onClick={handleLike}
            disabled={isSubmitting}
          >
            <span className={styles.statIcon}>
              {isLiked ? <FaHeart className={styles.likedIcon} /> : <FaRegHeart />}
            </span>
            <span>{likesCount} {likesCount === 1 ? 'like' : 'likes'}</span>
          </button>
          
          <button 
            className={styles.statButton}
            onClick={() => setShowComments(!showComments)}
          >
            <FaComment />
            <span>{commentCount} {commentCount === 1 ? 'comment' : 'comments'}</span>
          </button>
          
          <button 
            className={styles.statButton}
            onClick={() => handleShare()}
          >
            <FaShare />
            <span>{shareCount} {shareCount === 1 ? 'share' : 'shares'}</span>
          </button>

          <button 
            className={`${styles.statButton} ${isReposted ? styles.reposted : ''}`}
            onClick={() => setShowRepostModal(true)}
            title="Repost to your timeline"
          >
            <FaRetweet />
            <span>{repostCount} {repostCount === 1 ? 'repost' : 'reposts'}</span>
          </button>
        </div>
      )}

      {/* Comments Section */}
      {!hideComments && showComments && (
        <div className={styles.commentsSection}>
          {/* Comment Input */}
          {currentUserId && (
            <div className={styles.commentInputContainer}>
              <div className={styles.commentInputWrapper}>
                <AvatarWithFallback
                  user={{ _id: currentUserId }}
                  size="small"
                  className={styles.commentAvatar}
                />
                <input
                  ref={commentInputRef}
                  type="text"
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleComment();
                    }
                  }}
                  disabled={isSubmitting}
                  className={styles.commentInputField}
                />
                <button 
                  onClick={handleComment}
                  disabled={!commentText.trim() || isSubmitting}
                  className={styles.commentSubmitButton}
                >
                  {isSubmitting ? <FaSpinner className={styles.spinning} /> : <FaPaperPlane />}
                </button>
              </div>
            </div>
          )}
          
          {/* Comments List */}
          <div className={styles.commentsList}>
            {visibleComments.map((comment) => {
              if (!comment) return null;
              
              const commentUser = comment?.userId || comment?.user || {};
              const userDisplay = getUserDisplay(commentUser);
              
              const commentUserId = userDisplay.userId;
              const commentName = userDisplay.name || 'User';
              const commentUsername = userDisplay.username || 'user';
              const commentIsOnline = userDisplay.isOnline || false;
              
              const commentReplies = Array.isArray(comment.replies) ? comment.replies : [];
              const repliesCount = commentReplies.length;
              const showRepliesForComment = showReplies[comment._id] || showAllReplies;
              const visibleReplies = showRepliesForComment ? commentReplies : commentReplies.slice(0, 2);
              const hasMoreReplies = commentReplies.length > 2 && !showRepliesForComment;
              const commentLike = commentLikes[comment._id] || { count: 0, liked: false };
              
              return (
                <div key={comment._id || comment.id || Math.random()} className={styles.commentItem}>
                  <div className={styles.commentMain}>
                    {/* Comment Avatar */}
                    <div 
                      className={styles.commentAvatar}
                      onClick={(e) => handleUserClick(commentUserId, e)}
                    >
                      <AvatarWithFallback
                        user={commentUser}
                        size="small"
                      />
                      <span className={`${styles.userOnlineIndicatorSmall} ${commentIsOnline ? styles.online : ''}`} />
                    </div>
                    
                    <div className={styles.commentContent}>
                      <div className={styles.commentHeader}>
                        <div 
                          className={styles.commentUserInfo}
                          onClick={(e) => handleUserClick(commentUserId, e)}
                        >
                          <strong>{commentName}</strong>
                          {commentUser?.isVerified && <FaCheckCircle className={styles.verifiedBadgeSmall} />}
                          <span className={styles.commentUsername}>@{commentUsername}</span>
                        </div>
                        <span className={styles.commentTime}>
                          {comment?.createdAt ? new Date(comment.createdAt).toLocaleDateString() : 'Just now'}
                        </span>
                      </div>
                      
                      <p className={styles.commentText}>{comment?.content || ''}</p>
                      
                      {currentUserId && (
                        <div className={styles.commentActions}>
                          <button 
                            className={`${styles.commentAction} ${commentLike.liked ? styles.liked : ''}`}
                            onClick={() => handleCommentLike(comment._id)}
                          >
                            <span className={styles.actionIcon}>
                              {commentLike.liked ? <FaHeart className={styles.likedIcon} /> : <FaRegHeart />}
                            </span>
                            <span>{commentLike.count > 0 ? commentLike.count : 'Like'}</span>
                          </button>
                          
                          <button 
                            className={styles.commentAction}
                            onClick={(e) => {
                              e.stopPropagation();
                              setReplyToComment(comment._id);
                              setReplyingToReply(null);
                              setReplyText('');
                              setTimeout(() => replyInputRef.current?.focus(), 100);
                            }}
                          >
                            <FaReply /> Reply
                          </button>
                          
                          {commentUserId === currentUserId && (
                            <button 
                              className={`${styles.commentAction} ${styles.deleteComment}`}
                              onClick={() => handleDeleteComment(comment._id)}
                            >
                              <FaTrash /> Delete
                            </button>
                          )}
                        </div>
                      )}

                      {/* Replies count toggle - FIXED: Always show if there are replies */}
                      {repliesCount > 0 && (
                        <button 
                          className={styles.showRepliesBtn}
                          onClick={() => toggleReplies(comment._id)}
                        >
                          {showRepliesForComment ? 'Hide' : 'Show'} {repliesCount} {repliesCount === 1 ? 'reply' : 'replies'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Reply Input for top-level replies */}
                  {currentUserId && replyToComment === comment._id && !replyingToReply && (
                    <div className={styles.replyInputContainer}>
                      <div className={styles.replyInputWrapper}>
                        <AvatarWithFallback
                          user={{ _id: currentUserId }}
                          size="small"
                          className={styles.replyAvatar}
                        />
                        <input
                          ref={replyInputRef}
                          type="text"
                          placeholder={`Reply to ${commentName}...`}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleReply(comment._id);
                            }
                          }}
                          disabled={isSubmitting}
                          className={styles.replyInputField}
                        />
                        <button 
                          onClick={() => handleReply(comment._id)}
                          disabled={!replyText.trim() || isSubmitting}
                          className={styles.replySubmitButton}
                        >
                          {isSubmitting ? <FaSpinner className={styles.spinning} /> : <FaPaperPlane />}
                        </button>
                        <button 
                          className={styles.cancelReplyBtn}
                          onClick={() => {
                            setReplyToComment(null);
                            setReplyText('');
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Replies */}
                  {visibleReplies && visibleReplies.length > 0 && (
                    <div className={styles.repliesList}>
                      {visibleReplies.map((reply) => {
                        if (!reply) return null;
                        
                        const replyUser = reply?.userId || reply?.user || {};
                        const replyDisplay = getUserDisplay(replyUser);
                        const replyUserId = replyDisplay.userId;
                        const replyName = replyDisplay.name || 'User';
                        const replyUsername = replyDisplay.username || 'user';
                        const replyIsOnline = replyDisplay.isOnline || false;
                        const replyLike = replyLikes[reply._id] || { count: 0, liked: false };
                        
                        const isNestedReply = reply.parentReplyId && reply.parentReplyId !== null;
                        const parentUsername = reply.parentReplyUsername;
                        const replyContent = reply?.content || '';
                        
                        return (
                          <div 
                            key={reply._id || `reply-${Date.now()}-${Math.random()}`} 
                            className={`${styles.replyItem} ${isNestedReply ? styles.nestedReply : ''}`}
                          >
                            {isNestedReply && <div className={styles.threadLine} />}
                            
                            {/* Reply Avatar - FIXED: AvatarWithFallback properly used */}
                            <div 
                              className={styles.replyAvatar}
                              onClick={(e) => handleUserClick(replyUserId, e)}
                            >
                              <AvatarWithFallback
                                user={replyUser}
                                size="small"
                              />
                              <span className={`${styles.userOnlineIndicatorSmall} ${replyIsOnline ? styles.online : ''}`} />
                            </div>
                            
                            <div className={styles.replyContent}>
                              <div className={styles.replyHeader}>
                                <div 
                                  className={styles.replyUserInfo}
                                  onClick={(e) => handleUserClick(replyUserId, e)}
                                >
                                  <strong>{replyName}</strong>
                                  {replyUser?.isVerified && <FaCheckCircle className={styles.verifiedBadgeSmall} />}
                                  <span className={styles.replyUsername}>@{replyUsername}</span>
                                </div>
                                <span className={styles.replyTime}>
                                  {reply?.createdAt ? new Date(reply.createdAt).toLocaleDateString() : 'Just now'}
                                </span>
                              </div>
                              
                              {/* Show parent reference for nested replies */}
                              {isNestedReply && parentUsername && (
                                <div className={styles.replyParentReference}>
                                  <FaReply className={styles.replyIcon} />
                                  <span className={styles.replyToUsername}>@{parentUsername}</span>
                                </div>
                              )}
                              
                              {/* Reply Content */}
                              <div className={styles.replyTextContainer}>
                                {replyContent ? (
                                  <p className={styles.replyText}>{replyContent}</p>
                                ) : (
                                  <p className={`${styles.replyText} ${styles.emptyReply}`}>
                                    [Empty reply - content missing]
                                  </p>
                                )}
                              </div>
                              
                              {currentUserId && (
                                <div className={styles.replyActions}>
                                  <button 
                                    className={`${styles.replyAction} ${replyLike.liked ? styles.liked : ''}`}
                                    onClick={() => handleReplyLike(reply._id, comment._id)}
                                  >
                                    <span className={styles.actionIcon}>
                                      {replyLike.liked ? <FaHeart className={styles.likedIcon} /> : <FaRegHeart />}
                                    </span>
                                    <span>{replyLike.count > 0 ? replyLike.count : 'Like'}</span>
                                  </button>
                                  
                                  <button 
                                    className={styles.replyAction}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setReplyToComment(comment._id);
                                      setReplyingToReply(reply._id);
                                      setReplyText(`@${replyUsername} `);
                                      setTimeout(() => {
                                        if (replyInputRef.current) {
                                          replyInputRef.current.focus();
                                        }
                                      }, 100);
                                    }}
                                  >
                                    <FaReply /> Reply
                                  </button>
                                  
                                  {replyUserId === currentUserId && (
                                    <button 
                                      className={`${styles.replyAction} ${styles.deleteReply}`}
                                      onClick={() => handleDeleteReply(comment._id, reply._id)}
                                    >
                                      <FaTrash /> Delete
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Show more replies button */}
                      {hasMoreReplies && (
                        <button 
                          className={styles.showMoreRepliesBtn}
                          onClick={() => toggleReplies(comment._id)}
                        >
                          View all {repliesCount} replies
                        </button>
                      )}
                    </div>
                  )}

                  {/* Reply input for nested replies */}
                  {currentUserId && replyToComment === comment._id && replyingToReply && (
                    <div className={styles.replyInputContainer}>
                      <div className={styles.replyInputWrapper}>
                        <AvatarWithFallback
                          user={{ _id: currentUserId }}
                          size="small"
                          className={styles.replyAvatar}
                        />
                        <input
                          ref={replyInputRef}
                          type="text"
                          placeholder="Write a reply..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleReply(comment._id);
                            }
                          }}
                          disabled={isSubmitting}
                          className={styles.replyInputField}
                        />
                        <button 
                          onClick={() => handleReply(comment._id)}
                          disabled={!replyText.trim() || isSubmitting}
                          className={styles.replySubmitButton}
                        >
                          {isSubmitting ? <FaSpinner className={styles.spinning} /> : <FaPaperPlane />}
                        </button>
                        <button 
                          className={styles.cancelReplyBtn}
                          onClick={() => {
                            setReplyToComment(null);
                            setReplyingToReply(null);
                            setReplyText('');
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Load more comments button */}
            {hasMoreComments && (
              <button 
                className={styles.loadMoreCommentsBtn}
                onClick={loadMoreComments}
              >
                Load more comments ({postData.comments.length - maxInitialComments})
              </button>
            )}
            
            {/* No comments message */}
            {commentCount === 0 && (
              <div className={styles.noComments}>
                <p>No comments yet. Be the first to share your thoughts!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostComponent;