import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { FaTimes, FaUsers, FaGraduationCap, FaBookOpen, FaHeart } from 'react-icons/fa';
import { useEducation } from '../../context/EducationContext';
// eslint-disable-next-line no-unused-vars
import { formatCount } from '../../utils/educationHelpers';
import TabContent from './TabContent';
import '../../styles/education/AcademyModal.css';

const AcademyModal = ({ academy, onClose }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [isClosing, setIsClosing] = useState(false);
  const overlayRef = useRef(null);
  const modalRef = useRef(null);
  const academyIdRef = useRef(null);
  const { isFavorite, toggleFavorite, addRecentView } = useEducation();

  // Memoize tabs configuration to prevent unnecessary recalculations
  const tabs = useMemo(() => {
    if (!academy) return [];
    
    return [
      { key: 'home', label: 'Overview', icon: '🏠', badge: null },
      { key: 'courses', label: 'Courses', icon: '📚', badge: academy.courses?.length || 0 },
      { key: 'community', label: 'Community', icon: '💬', badge: academy.chatRooms?.length || 0 },
      ...(academy.chartData ? [{ key: 'charts', label: 'Charts', icon: '📈', badge: null }] : []),
      { key: 'gallery', label: 'Gallery', icon: '🖼️', badge: academy.gallery?.length || 0 },
      { key: 'comments', label: 'Discussion', icon: '💭', badge: academy.comments?.length || 0 },
    ].filter(tab => tab.badge !== 0 || tab.key === 'home' || tab.key === 'charts'); // Filter out empty tabs except home/charts
  }, [academy]);

  // Reset tab when academy changes with animation support
  useEffect(() => {
    if (academy && academy.id !== academyIdRef.current) {
      setActiveTab('home');
      addRecentView(academy.id);
      academyIdRef.current = academy.id;
    }
  }, [academy, addRecentView]);

  // Enhanced close handler with animation
  const handleClose = useCallback(() => {
    setIsClosing(true);
    // Wait for animation to complete before actually closing
    setTimeout(() => {
      onClose();
    }, 300); // Match this with CSS animation duration
  }, [onClose]);

  // Close modal on ESC with animation
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !isClosing) {
        handleClose();
      }
    };

    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.documentElement.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [handleClose, isClosing]);

  // Improved overlay click handler
  const handleOverlayClick = useCallback((e) => {
    if (e.target === overlayRef.current && !isClosing) {
      handleClose();
    }
  }, [handleClose, isClosing]);

  // Memoized event handlers
  const handleFavoriteClick = useCallback((e) => {
    e.stopPropagation();
    if (academy?.id) {
      toggleFavorite(academy.id);
    }
  }, [academy, toggleFavorite]);

  const handleTabClick = useCallback((tabKey) => {
    setActiveTab(tabKey);
  }, []);

  // Prevent render if no academy or not in browser
  if (!academy || typeof document === 'undefined') return null;

  const favoriteActive = isFavorite(academy.id);
  const bannerStyle = academy.bannerImage ? { backgroundImage: `url(${academy.bannerImage})` } : {};

  return createPortal(
    <div 
      className={`edu-modal-overlay ${isClosing ? 'edu-modal-overlay--closing' : ''}`}
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="academy-modal-title"
    >
      <div 
        className={`edu-modal ${isClosing ? 'edu-modal--closing' : ''}`}
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner */}
        <div 
          className="edu-modal__banner"
          style={bannerStyle}
          role="img"
          aria-label={`Banner image for ${academy.name}`}
        >
          <button 
            className="edu-modal__close"
            onClick={handleClose}
            aria-label="Close modal"
            type="button"
            disabled={isClosing}
          >
            <FaTimes />
          </button>
        </div>

        {/* Profile Section - REMOVED STATS FROM HERE */}
        <div className="edu-modal__profile">
          <div 
            className="edu-modal__avatar"
            aria-hidden="true"
          >
            {academy.profilePic || academy.name?.charAt(0)}
          </div>
          
          <div className="edu-modal__info">
            <h1 id="academy-modal-title" className="edu-modal__name">
              {academy.name}
            </h1>
            <p className="edu-modal__title">{academy.title}</p>
            
            {/* REMOVED STATS SECTION - They're displayed in TabContent */}
          </div>

          <div className="edu-modal__actions">
            <button 
              className={`edu-favorite-btn ${favoriteActive ? 'edu-favorite-btn--active' : ''}`}
              onClick={handleFavoriteClick}
              aria-label={favoriteActive ? 'Remove from favorites' : 'Add to favorites'}
              type="button"
              disabled={isClosing}
            >
              <FaHeart />
            </button>
            <button 
              className="edu-btn edu-btn--primary" 
              type="button"
              disabled={isClosing}
            >
              Subscribe
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="edu-modal__body">
          <nav className="edu-tabs" aria-label="Academy details navigation">
            <div className="edu-tabs__list" role="tablist">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  className={`edu-tab ${activeTab === tab.key ? 'edu-tab--active' : ''}`}
                  onClick={() => handleTabClick(tab.key)}
                  role="tab"
                  aria-selected={activeTab === tab.key}
                  aria-controls={`tabpanel-${tab.key}`}
                  id={`tab-${tab.key}`}
                  type="button"
                  disabled={isClosing}
                >
                  <span aria-hidden="true">{tab.icon}</span>
                  {tab.label}
                  {tab.badge && tab.badge > 0 && (
                    <span className="edu-tab__badge">{tab.badge}</span>
                  )}
                </button>
              ))}
            </div>
          </nav>

          {/* Tab Content - Stats will be displayed here in the Overview tab */}
          <div 
            className="edu-tab-content"
            role="tabpanel"
            id={`tabpanel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
          >
            <TabContent academy={academy} activeTab={activeTab} />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default React.memo(AcademyModal);