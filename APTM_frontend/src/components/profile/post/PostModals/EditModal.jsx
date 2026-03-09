// EditModal.jsx
// Modal for editing post content
// Forward ref for click outside handling

import React, { forwardRef } from 'react';
import { FaTimes, FaSpinner } from 'react-icons/fa';
import styles from '../../styles/post.module.css';

const EditModal = forwardRef(({
  editContent,
  setEditContent,
  isEditing,
  originalContent,
  onClose,
  onSave
}, ref) => {
  return (
    <div className={styles.editModalOverlay}>
      <div className={styles.editModal} ref={ref}>
        <div className={styles.editModalHeader}>
          <h3>Edit Post</h3>
          <button 
            className={styles.closeModalBtn}
            onClick={onClose}
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
              onClick={onClose}
              disabled={isEditing}
            >
              Cancel
            </button>
            <button 
              className={styles.confirmEditBtn}
              onClick={onSave}
              disabled={isEditing || !editContent.trim() || editContent === originalContent}
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
});

EditModal.displayName = 'EditModal';
export default EditModal;