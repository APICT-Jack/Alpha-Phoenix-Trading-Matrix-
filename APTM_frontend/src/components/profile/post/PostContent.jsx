// PostContent.jsx
// Renders post text, media attachments, and embedded poll
// Handles repost display logic with original post content

import React from 'react';
import { FaRetweet, FaMapMarkerAlt } from 'react-icons/fa';
import AvatarWithFallback from '../AvatarWithFallback';
import styles from '../styles/post.module.css';

const PostContent = ({
  postData,
  isRepost,
  originalPost,
  renderPoll,
  renderMedia
}) => {
  // Show repost indicator
  if (isRepost && originalPost) {
    return (
      <>
        <div className={styles.repostIndicator}>
          <FaRetweet /> You reposted
        </div>
        
        {postData.content && (
          <div className={styles.reposterComment}>
            <p>{postData.content}</p>
          </div>
        )}
        
        <div className={`${styles.postContent} ${styles.repostedContent}`}>
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
          
          {/* Render poll for original post */}
          {originalPost.poll && renderPoll()}
          
          {/* Original Post Media */}
          {originalPost.media && originalPost.media.length > 0 && (
            <div className={`${styles.postMedia} ${originalPost.media.length > 1 ? styles.mediaGrid : ''}`}>
              {originalPost.media.map((media, index) => renderMedia(media, index))}
            </div>
          )}
        </div>
      </>
    );
  }

  // Regular post (not a repost)
  return (
    <div className={styles.postContent}>
      <p className={styles.postText}>{postData.content || ''}</p>
      
      {/* Render poll if exists */}
      {renderPoll()}
      
      {/* Media attachments */}
      {postData.media && postData.media.length > 0 && (
        <div className={`${styles.postMedia} ${postData.media.length > 1 ? styles.mediaGrid : ''}`}>
          {postData.media.map((media, index) => renderMedia(media, index))}
        </div>
      )}
      
      {/* Location */}
      {postData.location && (
        <div className={styles.postLocation}>
          <FaMapMarkerAlt />
          <span>{postData.location.name}</span>
        </div>
      )}
    </div>
  );
};

export default PostContent;