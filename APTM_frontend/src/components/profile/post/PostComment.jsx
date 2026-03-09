// PostComment.jsx
// Renders a single comment with its replies
// Handles comment actions and reply thread display

import React from 'react';
import { 
  FaHeart, 
  FaRegHeart, 
  FaReply, 
  FaTrash,
  FaCheckCircle,
  FaPaperPlane,
  FaSpinner
} from 'react-icons/fa';
import AvatarWithFallback from '../AvatarWithFallback';
import PostReply from './PostReply';
import styles from '../styles/post.module.css';

const PostComment = ({
  comment,
  currentUserId,
  replyText,
  setReplyText,
  replyToComment,
  setReplyToComment,
  replyingToReply,
  setReplyingToReply,
  showReplies,
  toggleReplies,
  commentLikes,
  replyLikes,
  isSubmitting,
  replyInputRef,
  onReply,
  onCommentLike,
  onReplyLike,
  onDeleteComment,
  onDeleteReply,
  onUserClick
}) => {
  if (!comment) return null;
  
  const commentUser = comment?.userId || comment?.user || {};
  const commentUserId = commentUser._id || commentUser.id;
  const commentName = commentUser.name || 'User';
  const commentUsername = commentUser.username || 'user';
  const commentIsOnline = commentUser.isOnline || false;
  
  const commentReplies = Array.isArray(comment.replies) ? comment.replies : [];
  const repliesCount = commentReplies.length;
  const showRepliesForComment = showReplies[comment._id] || false;
  const visibleReplies = showRepliesForComment ? commentReplies : commentReplies.slice(0, 2);
  const hasMoreReplies = commentReplies.length > 2 && !showRepliesForComment;
  const commentLike = commentLikes[comment._id] || { count: 0, liked: false };
  
  const isReplyingToThisComment = replyToComment === comment._id && !replyingToReply;

  return (
    <div className={styles.commentItem}>
      <div className={styles.commentMain}>
        {/* Comment Avatar */}
        <div 
          className={styles.commentAvatar}
          onClick={(e) => onUserClick(commentUserId, e)}
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
              onClick={(e) => onUserClick(commentUserId, e)}
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
                onClick={() => onCommentLike(comment._id)}
              >
                <span className={styles.actionIcon}>
                  {commentLike.liked ? <FaHeart className={styles.likedIcon} /> : <FaRegHeart />}
                </span>
                <span>{commentLike.count > 0 ? commentLike.count : 'Like'}</span>
              </button>
              
              <button 
                className={styles.commentAction}
                onClick={() => {
                  setReplyToComment(comment._id);
                  setReplyingToReply(null);
                  setReplyText('');
                }}
              >
                <FaReply /> Reply
              </button>
              
              {commentUserId === currentUserId && (
                <button 
                  className={`${styles.commentAction} ${styles.deleteComment}`}
                  onClick={() => onDeleteComment(comment._id)}
                >
                  <FaTrash /> Delete
                </button>
              )}
            </div>
          )}

          {/* Replies count toggle */}
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
      {isReplyingToThisComment && (
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
                  onReply(comment._id);
                }
              }}
              disabled={isSubmitting}
              className={styles.replyInputField}
            />
            <button 
              onClick={() => onReply(comment._id)}
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
      {visibleReplies.length > 0 && (
        <div className={styles.repliesList}>
          {visibleReplies.map((reply) => (
            <PostReply
              key={reply._id}
              reply={reply}
              commentId={comment._id}
              currentUserId={currentUserId}
              replyText={replyText}
              setReplyText={setReplyText}
              replyToComment={replyToComment}
              setReplyToComment={setReplyToComment}
              replyingToReply={replyingToReply}
              setReplyingToReply={setReplyingToReply}
              replyLikes={replyLikes}
              isSubmitting={isSubmitting}
              replyInputRef={replyInputRef}
              onReply={onReply}
              onReplyLike={onReplyLike}
              onDeleteReply={onDeleteReply}
              onUserClick={onUserClick}
            />
          ))}

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
    </div>
  );
};

export default PostComment;