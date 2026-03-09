// PostActions.jsx
// Compact action buttons for mobile/feed view
// Shows like, comment, share, repost buttons with icons only

import React from 'react';
import { 
  FaHeart, 
  FaRegHeart, 
  FaComment, 
  FaShare, 
  FaRetweet 
} from 'react-icons/fa';
import styles from '../styles/post.module.css';

const PostActions = ({
  isLiked,
  likesCount,
  commentCount,
  shareCount,
  repostCount,
  isReposted,
  showComments,
  setShowComments,
  onLike,
  onCommentToggle,
  onShare,
  onRepost
}) => {
  
};

export default PostActions;