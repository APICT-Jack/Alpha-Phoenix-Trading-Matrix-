// RepostModal.jsx
// Modal for reposting content with optional comment
// Forward ref for click outside handling

import React, { forwardRef } from 'react';
import { FaTimes, FaSpinner, FaRetweet } from 'react-icons/fa';
import AvatarWithFallback from '../../AvatarWithFallback';
import styles from '../../styles/post.module.css';

const RepostModal = forwardRef(({
  postUser,
  postData,
  repostContent,
  setRepostContent,
  isReposting,
  onClose,
  onRepost
}, ref) => {
  return (
    <div className={styles.repostModalOverlay}>
      <div className={styles.repostModal} ref={ref}>
        <div className={styles.repostModalHeader}>
          <h3>Share to Your Timeline</h3>
          <button 
            className={styles.closeModalBtn}
            onClick={onClose}
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
              onClick={onClose}
              disabled={isReposting}
            >
              Cancel
            </button>
            <button 
              className={styles.confirmRepostBtn}
              onClick={onRepost}
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
});

RepostModal.displayName = 'RepostModal';
export default RepostModal;