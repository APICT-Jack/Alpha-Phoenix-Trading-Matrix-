// PostReply.jsx
// Renders a single reply to a comment
// Handles nested replies and reply actions

import React from 'react';
import { 
  FaHeart, 
  FaRegHeart, 
  FaReply, 
  FaTrash,
  FaCheckCircle
} from 'react-icons/fa';
import AvatarWithFallback from '../AvatarWithFallback';
import styles from '../styles/post.module.css';

const PostReply = ({
  reply,
  commentId,
  currentUserId,
  replyText,
  setReplyText,
  replyToComment,
  setReplyToComment,
  replyingToReply,
  setReplyingToReply,
  replyLikes,
  isSubmitting,
  replyInputRef,
  onReply,
  onReplyLike,
  onDeleteReply,
  onUserClick
}) => {
  if (!reply) return null;
  
  const replyUser = reply?.userId || reply?.user || {};
  const replyUserId = replyUser._id || replyUser.id;
  const replyName = replyUser.name || 'User';
  const replyUsername = replyUser.username || 'user';
  const replyIsOnline = replyUser.isOnline || false;
  const replyLike = replyLikes[reply._id] || { count: 0, liked: false };
  
  const isNestedReply = reply.parentReplyId && reply.parentReplyId !== null;
  const parentUsername = reply.parentReplyUsername;
  const replyContent = reply?.content || '';

  const isReplyingToThisReply = replyToComment === commentId && replyingToReply === reply._id;

  return (
    <div className={`${styles.replyItem} ${isNestedReply ? styles.nestedReply : ''}`}>
      {isNestedReply && <div className={styles.threadLine} />}
      
      {/* Reply Avatar */}
      <div 
        className={styles.replyAvatar}
        onClick={(e) => onUserClick(replyUserId, e)}
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
            onClick={(e) => onUserClick(replyUserId, e)}
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
              onClick={() => onReplyLike(reply._id, commentId)}
            >
              <span className={styles.actionIcon}>
                {replyLike.liked ? <FaHeart className={styles.likedIcon} /> : <FaRegHeart />}
              </span>
              <span>{replyLike.count > 0 ? replyLike.count : 'Like'}</span>
            </button>
            
            <button 
              className={styles.replyAction}
              onClick={() => {
                setReplyToComment(commentId);
                setReplyingToReply(reply._id);
                setReplyText(`@${replyUsername} `);
              }}
            >
              <FaReply /> Reply
            </button>
            
            {replyUserId === currentUserId && (
              <button 
                className={`${styles.replyAction} ${styles.deleteReply}`}
                onClick={() => onDeleteReply(commentId, reply._id)}
              >
                <FaTrash /> Delete
              </button>
            )}
          </div>
        )}
      </div>

      {/* Reply input for nested replies */}
      {isReplyingToThisReply && (
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
                  onReply(commentId);
                }
              }}
              disabled={isSubmitting}
              className={styles.replyInputField}
            />
            <button 
              onClick={() => onReply(commentId)}
              disabled={!replyText.trim() || isSubmitting}
              className={styles.replySubmitButton}
            />
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
};

export default PostReply;