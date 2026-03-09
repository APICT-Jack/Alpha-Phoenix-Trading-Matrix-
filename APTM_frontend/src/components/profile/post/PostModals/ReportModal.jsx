// ReportModal.jsx
// Modal for reporting inappropriate content
// Provides reason selection and additional details

import React from 'react';
import { FaTimes, FaSpinner } from 'react-icons/fa';
import styles from '../../styles/post.module.css';

const ReportModal = ({
  reportReason,
  setReportReason,
  reportDetails,
  setReportDetails,
  isReporting,
  onClose,
  onSubmit
}) => {
  return (
    <div className={styles.reportModalOverlay}>
      <div className={styles.reportModal}>
        <div className={styles.reportModalHeader}>
          <h3>Report Post</h3>
          <button 
            className={styles.closeModalBtn}
            onClick={onClose}
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
              onClick={onClose}
              disabled={isReporting}
            >
              Cancel
            </button>
            <button 
              className={styles.submitReportBtn}
              onClick={onSubmit}
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
};

export default ReportModal;