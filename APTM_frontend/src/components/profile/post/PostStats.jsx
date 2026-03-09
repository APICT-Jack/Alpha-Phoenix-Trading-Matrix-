// PostStats.jsx
// Detailed statistics row for expanded post view
// Shows full text labels and interactive buttons

import React from 'react';
import { 
  FaHeart, 
  FaRegHeart, 
  FaComment, 
  FaShare, 
  FaRetweet 
} from 'react-icons/fa';
import styles from '../styles/post.module.css';

const PostStats = ({
  isLiked,
  likesCount,
  commentCount,
  shareCount,
  repostCount,
  isReposted,
  onLike,
  onCommentToggle,
  onShare,
  onRepost
}) => {
  return (
    <div className={styles.postStats}>
      <button 
        className={`${styles.statButton} ${isLiked ? styles.liked : ''}`}
        onClick={onLike}
      >
        <span className={styles.statIcon}>
          {isLiked ? <FaHeart className={styles.likedIcon} /> : <FaRegHeart />}
        </span>
        <span>{likesCount} {likesCount === 1 ? 'like' : 'likes'}</span>
      </button>
      
      <button 
        className={styles.statButton}
        onClick={onCommentToggle}
      >
        <FaComment />
        <span>{commentCount} {commentCount === 1 ? 'comment' : 'comments'}</span>
      </button>
      
      <button 
        className={styles.statButton}
        onClick={onShare}
      >
        <FaShare />
        <span>{shareCount} {shareCount === 1 ? 'share' : 'shares'}</span>
      </button>

      <button 
        className={`${styles.statButton} ${isReposted ? styles.reposted : ''}`}
        onClick={onRepost}
        title="Repost to your timeline"
      >
        <FaRetweet />
        <span>{repostCount} {repostCount === 1 ? 'repost' : 'reposts'}</span>
      </button>
    </div>
  );
};

export default PostStats;