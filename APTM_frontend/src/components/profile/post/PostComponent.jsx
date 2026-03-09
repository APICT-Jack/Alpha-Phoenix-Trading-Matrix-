// PostComponent.jsx
// Main container - orchestrates all post subcomponents
// State management and prop drilling reduced by using custom hooks

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Lightbox from 'react-image-lightbox';
import 'react-image-lightbox/style.css';

// Import subcomponents
import { 
  PostHeader, 
  PostContent, 
  PostPoll,
  PostActions, 
  PostStats, 
  PostComments,
  ShareModal,
  RepostModal,
  EditModal,
  ReportModal
} from './post';

// Import custom hooks
import usePostData from './post/hooks/usePostData';
import usePostInteractions from './post/hooks/usePostInteractions';
import usePostComments from './post/hooks/usePostComments';
import usePostPoll from './post/hooks/usePostPoll';
import usePostMedia from './post/hooks/usePostMedia.jsx';

// Import services
import { notificationService } from '../../services/notificationService';
import { socketService } from '../../services/socketService';

// Import styles
import styles from './styles/post.module.css';

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
  
  // ===== CUSTOM HOOKS =====
  // Post data management
  const {
    postData,
    setPostData,
    postUser,
    originalPost,
    isRepost,
    loading,
    error,
    setError
  } = usePostData({ post, currentUserId, isSaved, onlineStatus: {} });

  // Post interactions (like, save, repost)
  const {
    isLiked,
    likesCount,
    isSavedState,
    isReposted,
    repostCount,
    shareCount,
    handleLike,
    handleSave,
    handleRepost: handleRepostAction,
    handleShare: handleShareAction,
    handleDelete
  } = usePostInteractions({
    postId: postData?._id,
    currentUserId,
    initialIsLiked: false,
    initialLikesCount: 0,
    initialIsSaved: isSaved,
    initialIsReposted: false,
    initialRepostCount: 0,
    onLike,
    onSave,
    onRepost,
    onShare,
    onDelete,
    navigate
  });

  // Comments management
  const {
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
    commentCount,
    handleComment,
    handleReply,
    handleCommentLike,
    handleReplyLike,
    handleDeleteComment,
    handleDeleteReply,
    commentInputRef,
    replyInputRef
  } = usePostComments({
    postId: postData?._id,
    currentUserId,
    postData,
    setPostData,
    maxInitialComments,
    showAllReplies,
    expanded
  });

  // Poll management
  const {
    pollData,
    hasVoted,
    selectedOption,
    isVoting,
    handleVote
  } = usePostPoll({
    post,
    currentUserId,
    onPostUpdate
  });

  // Media management
  const {
    imageError,
    videoPlaying,
    videoMuted,
    videoFullscreen,
    videoRefs,
    showMediaLightbox: showLightbox,
    lightboxIndex,
    setShowMediaLightbox,
    setLightboxIndex,
    handleImageError,
    formatMediaUrl,
    handleVideoPlay,
    handleVideoPause,
    handleVideoMute,
    handleVideoFullscreen,
    openLightbox,
    renderMedia
  } = usePostMedia({
    showMediaLightbox,
    autoPlayVideo,
    muteVideo
  });

  // ===== MODAL STATES =====
  const [showOptions, setShowOptions] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  
  // ===== MODAL DATA STATES =====
  const [editContent, setEditContent] = useState(post?.content || '');
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [repostContent, setRepostContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [isReposting, setIsReposting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // ===== SHARE URL =====
  const [shareUrl, setShareUrl] = useState('');
  const [copySuccess, setCopySuccess] = useState('');
  
  // ===== REFS =====
  const optionsRef = useRef(null);
  const shareModalRef = useRef(null);
  const repostModalRef = useRef(null);
  const editModalRef = useRef(null);

  // ===== EFFECTS =====
  // Generate share URL
  useEffect(() => {
    if (postData?._id) {
      setShareUrl(`${window.location.origin}/post/${postData._id}`);
    }
  }, [postData?._id]);

  // Click outside handler for dropdowns
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

  // ===== HANDLERS =====
  const handleUserClick = useCallback((userId, event) => {
    event?.stopPropagation();
    
    let targetUserId = userId;
    if (userId && typeof userId === 'object') {
      targetUserId = userId._id || userId.id;
    }
    
    if (!targetUserId) return;
    
    if (onUserClick) {
      onUserClick(targetUserId);
    } else {
      navigate(`/profile/${targetUserId}`);
    }
  }, [navigate, onUserClick]);

  const handleShare = useCallback((platform = null) => {
    handleShareAction({
      platform,
      shareUrl,
      postData,
      postUser,
      currentUserId,
      onShare,
      setShowShareModal,
      setShareCount: null // handled by hook
    });
  }, [handleShareAction, shareUrl, postData, postUser, currentUserId, onShare]);

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

  const handleRepost = useCallback(async () => {
    if (!currentUserId) {
      notificationService.warning('Please login to repost');
      return;
    }

    if (isReposting) return;
    setIsReposting(true);

    try {
      await handleRepostAction({
        content: repostContent,
        visibility: 'public'
      });
      setShowRepostModal(false);
      setRepostContent('');
    } catch (error) {
      console.error('Failed to repost:', error);
    } finally {
      setIsReposting(false);
    }
  }, [currentUserId, isReposting, repostContent, handleRepostAction]);

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
      
      setPostData(prev => ({ ...prev, content: editContent.trim(), isEdited: true }));
      setShowEditModal(false);
      notificationService.success('Post updated');
      
    } catch (error) {
      console.error('Failed to edit post:', error);
      notificationService.error('Could not update post');
    } finally {
      setIsEditing(false);
    }
  }, [editContent, postData, currentUserId, setPostData]);

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
  }, [postData, reportReason, reportDetails, currentUserId]);

  const handleDeleteWithConfirm = useCallback(async () => {
    if (!currentUserId) return;
    
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    await handleDelete();
    setIsDeleting(false);
  }, [currentUserId, handleDelete]);

  // ===== LOADING/ERROR STATES =====
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

  // ===== RENDER =====
  return (
    <div className={styles.postCard} data-post-id={postData._id}>
      {/* Modals */}
      {showShareModal && (
        <ShareModal
          ref={shareModalRef}
          shareUrl={shareUrl}
          copySuccess={copySuccess}
          onClose={() => setShowShareModal(false)}
          onCopyLink={handleCopyLink}
          onShare={handleShare}
          postUser={postUser}
          postData={postData}
        />
      )}
      
      {showRepostModal && (
        <RepostModal
          ref={repostModalRef}
          postUser={postUser}
          postData={postData}
          repostContent={repostContent}
          setRepostContent={setRepostContent}
          isReposting={isReposting}
          onClose={() => setShowRepostModal(false)}
          onRepost={handleRepost}
        />
      )}
      
      {showEditModal && (
        <EditModal
          ref={editModalRef}
          editContent={editContent}
          setEditContent={setEditContent}
          isEditing={isEditing}
          originalContent={postData.content}
          onClose={() => setShowEditModal(false)}
          onSave={handleEdit}
        />
      )}
      
      {showReportModal && (
        <ReportModal
          reportReason={reportReason}
          setReportReason={setReportReason}
          reportDetails={reportDetails}
          setReportDetails={setReportDetails}
          isReporting={isReporting}
          onClose={() => setShowReportModal(false)}
          onSubmit={handleReport}
        />
      )}
      
      {/* Media Lightbox */}
      {showLightbox && postData.media && postData.media.length > 0 && (
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
      <PostHeader
        postUser={postUser}
        postData={postData}
        currentUserId={currentUserId}
        isSavedState={isSavedState}
        showOptions={showOptions}
        setShowOptions={setShowOptions}
        optionsRef={optionsRef}
        allowSaving={allowSaving}
        allowEditing={allowEditing}
        allowDeletion={allowDeletion}
        allowReporting={allowReporting}
        isDeleting={isDeleting}
        isEditing={isEditing}
        onUserClick={handleUserClick}
        onSave={handleSave}
        onEdit={() => setShowEditModal(true)}
        onDelete={handleDeleteWithConfirm}
        onReport={() => setShowReportModal(true)}
        onCopyLink={handleCopyLink}
      />

      {/* Post Content */}
      <PostContent
  postData={postData}
  isRepost={isRepost}
  originalPost={originalPost}
  renderPoll={() => (
    <PostPoll
      pollData={pollData}
      hasVoted={hasVoted}
      selectedOption={selectedOption}
      isVoting={isVoting}
      onVote={handleVote}
    />
  )}
  renderMedia={(media, index) => renderMedia(media, index, postData._id)}
/>

      {/* Post Actions */}
      {!hideActions && (
        <PostActions
          isLiked={isLiked}
          likesCount={likesCount}
          commentCount={commentCount}
          shareCount={shareCount}
          repostCount={repostCount}
          isReposted={isReposted}
          showComments={showComments}
          setShowComments={setShowComments}
          onLike={handleLike}
          onCommentToggle={() => setShowComments(!showComments)}
          onShare={() => handleShare()}
          onRepost={() => setShowRepostModal(true)}
        />
      )}

      {/* Post Stats */}
      {!hideStats && (
        <PostStats
          isLiked={isLiked}
          likesCount={likesCount}
          commentCount={commentCount}
          shareCount={shareCount}
          repostCount={repostCount}
          isReposted={isReposted}
          onLike={handleLike}
          onCommentToggle={() => setShowComments(!showComments)}
          onShare={() => handleShare()}
          onRepost={() => setShowRepostModal(true)}
        />
      )}

      {/* Comments Section */}
      {!hideComments && showComments && (
        <PostComments
          postData={postData}
          currentUserId={currentUserId}
          commentText={commentText}
          setCommentText={setCommentText}
          replyText={replyText}
          setReplyText={setReplyText}
          replyToComment={replyToComment}
          setReplyToComment={setReplyToComment}
          replyingToReply={replyingToReply}
          setReplyingToReply={setReplyingToReply}
          showReplies={showReplies}
          toggleReplies={toggleReplies}
          visibleComments={visibleComments}
          hasMoreComments={hasMoreComments}
          loadMoreComments={() => setShowAllCommentsState(true)}
          commentLikes={commentLikes}
          replyLikes={replyLikes}
          isSubmitting={isSubmitting}
          commentInputRef={commentInputRef}
          replyInputRef={replyInputRef}
          onComment={handleComment}
          onReply={handleReply}
          onCommentLike={handleCommentLike}
          onReplyLike={handleReplyLike}
          onDeleteComment={handleDeleteComment}
          onDeleteReply={handleDeleteReply}
          onUserClick={handleUserClick}
        />
      )}
    </div>
  );
};

export default PostComponent;