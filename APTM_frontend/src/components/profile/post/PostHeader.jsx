// PostHeader.jsx
// Displays post author information, timestamp, and action buttons
// Handles user profile navigation and post options menu

import React from 'react';
import { 
  FaEllipsisH, 
  FaBookmark, 
  FaRegBookmark,
  FaEdit,
  FaTrash,
  FaFlag,
  FaUser,
  FaLink,
  FaSpinner
} from 'react-icons/fa';
import AvatarWithFallback from '../AvatarWithFallback';
import styles from '../styles/post.module.css';
const PostHeader = ({
  postUser,
  postData,
  currentUserId,
  isSavedState,
  showOptions,
  setShowOptions,
  optionsRef,
  allowSaving,
  allowEditing,
  allowDeletion,
  allowReporting,
  isDeleting,
  isEditing,
  onUserClick,
  onSave,
  onEdit,
  onDelete,
  onReport,
  onCopyLink
}) => {
  const isOwnPost = postUser._id === currentUserId;

  return (
    <div className={styles.postHeader}>
      <div 
        className={styles.postAuthor}
        onClick={(e) => onUserClick(postUser._id, e)}
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
      
      <div className={styles.postHeaderActions} ref={optionsRef}>
        {allowSaving && (
          <button 
            className={`${styles.iconButton} ${isSavedState ? styles.saved : ''}`}
            onClick={onSave}
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
              {isOwnPost ? (
                <>
                  {allowEditing && (
                    <button 
                      className={styles.optionItem}
                      onClick={onEdit}
                    >
                      <FaEdit /> Edit
                    </button>
                  )}
                  {allowDeletion && (
                    <button 
                      className={`${styles.optionItem} ${styles.deleteOption}`}
                      onClick={onDelete}
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
                      onClick={onReport}
                    >
                      <FaFlag /> Report
                    </button>
                  )}
                  <button 
                    className={styles.optionItem}
                    onClick={(e) => onUserClick(postUser._id, e)}
                  >
                    <FaUser /> View Profile
                  </button>
                  <button 
                    className={styles.optionItem}
                    onClick={onCopyLink}
                  >
                    <FaLink /> Copy Link
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostHeader;