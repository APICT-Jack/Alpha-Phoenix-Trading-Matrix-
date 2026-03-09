// components/education/LibraryCard.jsx
import React from 'react';
import '../../styles/education/LibraryCard.css';
import { FaDownload, FaStar, FaComment, FaInfoCircle } from 'react-icons/fa';

const LibraryCard = ({ resource, onClick, variant = 'default', size = 'default', layout = 'vertical', showStats = true, interactive = true }) => {
  const handleClick = () => {
    if (interactive && onClick) {
      onClick(resource);
    }
  };

  const cardClass = `library-card ${variant === 'premium' ? 'library-card--premium' : ''} ${size === 'compact' ? 'library-card--compact' : ''} ${layout === 'horizontal' ? 'library-card--horizontal' : ''} ${interactive ? 'library-card--interactive' : ''}`;

  return (
    <div className={cardClass} onClick={handleClick}>
      <div className="library-card__header">
        <div className="library-card__icon">
          {resource.icon}
        </div>
        <div className="library-card__info">
          <div className="library-card__title-wrapper">
            <h3 className="library-card__title">{resource.title}</h3>
            
          </div>
          <div className="library-card__meta">
            <span className="library-card__category">{resource.category}</span>
            <span className="library-card__version">{resource.version}</span>
          </div>
        </div>
      </div>

      <div className="library-card__content">
        <p className="library-card__description">{resource.description}</p>
      </div>

      {showStats && (
        <div className="library-card__stats">
          <div className="library-card__stat">
            <FaDownload className="library-card__stat-icon" />
            <span className="library-card__stat-value">{resource.stats.downloads.toLocaleString()}</span>
          </div>
          <div className="library-card__stat">
            <FaStar className="library-card__stat-icon" />
            <span className="library-card__stat-value">{resource.stats.rating}</span>
          </div>
          <div className="library-card__stat">
            <FaComment className="library-card__stat-icon" />
            <span className="library-card__stat-value">{resource.stats.comments}</span>
          </div>
        </div>
      )}

      <div className="library-card__actions">
        <button className="library-download-btn">
          <FaDownload className="library-download-btn__icon" />
          <span className="library-download-btn__text">Download</span>
        </button>
        <button className="library-details-btn">
          <FaInfoCircle className="library-details-btn__icon" />
        </button>
      </div>
    </div>
  );
};

export default LibraryCard;