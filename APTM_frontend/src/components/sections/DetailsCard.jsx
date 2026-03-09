import React from 'react';
import { FaDownload, FaStar, FaComment, FaTimes } from 'react-icons/fa';
import '../../styles/DetailsCardStyle.css';

const DetailsCard = ({ resource, onClose }) => {
  if (!resource) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="resource-icon-large">{resource.icon}</div>
          <div>
            <h3>{resource.title}</h3>
            <div className="resource-meta">
              <span className="resource-category">{resource.category}</span>
              <span className="resource-version">{resource.version}</span>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close modal">
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          <div className="description-section">
            <h4>Description</h4>
            <p>{resource.description}</p>
          </div>

          <div className="stats-section">
            <h4>Statistics</h4>
            <div className="stats-grid">
              <div className="stat-item">
                <FaDownload /> Downloads: {resource.stats.downloads.toLocaleString()}
              </div>
              <div className="stat-item">
                <FaStar /> Rating: {resource.stats.rating}
              </div>
              <div className="stat-item">
                <FaComment /> Comments: {resource.stats.comments}
              </div>
            </div>
          </div>

          <div className="features-section">
            <h4>Key Features</h4>
            <ul>
              <li>Advanced trend detection algorithms</li>
              <li>Customizable parameters for different trading styles</li>
              <li>Multi-timeframe compatibility</li>
              <li>Visual alerts and notifications</li>
            </ul>
          </div>

          <div className="screenshots-section">
            <h4>Screenshots</h4>
            <div className="screenshots-grid">
              <div className="screenshot-placeholder">Screenshot 1</div>
              <div className="screenshot-placeholder">Screenshot 2</div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="download-btn primary">
            <FaDownload /> Download Now
          </button>
          <button className="download-btn secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailsCard;