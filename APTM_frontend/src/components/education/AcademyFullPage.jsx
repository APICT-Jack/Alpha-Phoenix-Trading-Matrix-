import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FaUsers, FaGraduationCap, FaHeart, FaArrowLeft, FaBell, FaRegBell } from 'react-icons/fa';
import { useEducation } from '../../context/EducationContext';
import { formatCount } from '../../utils/educationHelpers';
import TabContent from './TabContent';
import ChartTab from '../../pages/Education/ChartTab';
import '../../styles/education/AcademyFullPage.css';

const AcademyFullPage = ({ academy, onClose }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [isScrolled, setIsScrolled] = useState(false);
  const academyIdRef = useRef(null);
  const mainContentRef = useRef(null);
  
  // Use education context - this will re-render when context changes
  const { 
    isFavorite, 
    isSubscribed, 
    toggleFavorite, 
    toggleSubscription, 
    addRecentView 
  } = useEducation();

  // Memoize tabs configuration
  const tabs = useMemo(() => {
    if (!academy) return [];
    
    return [
      { key: 'home', label: 'Overview', icon: '🏠', badge: null },
      { key: 'courses', label: 'Courses', icon: '📚', badge: academy.courses?.length || 0 },
      { key: 'community', label: 'Community', icon: '💬', badge: academy.chatRooms?.length || 0 },
      ...(academy.chartData ? [{ key: 'charts', label: 'Analytics', icon: '📈', badge: null }] : []),
      { key: 'gallery', label: 'Gallery', icon: '🖼️', badge: academy.gallery?.length || 0 },
      { key: 'comments', label: 'Discussion', icon: '💭', badge: academy.comments?.length || 0 },
    ].filter(tab => tab.badge !== 0 || !tab.badge);
  }, [academy]);

  // Reset tab when academy changes
  useEffect(() => {
    if (academy && academy.id !== academyIdRef.current) {
      setActiveTab('home');
      addRecentView(academy.id);
      academyIdRef.current = academy.id;
      window.scrollTo(0, 0);
    }
  }, [academy, addRecentView]);

  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.pageYOffset > 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Event handlers
  const handleFavoriteClick = useCallback((e) => {
    e.stopPropagation();
    if (academy?.id) {
      console.log('Toggling favorite for:', academy.id);
      toggleFavorite(academy.id);
    }
  }, [academy, toggleFavorite]);

  const handleSubscribeClick = useCallback((e) => {
    e.stopPropagation();
    if (academy?.id) {
      console.log('Toggling subscription for:', academy.id);
      toggleSubscription(academy.id);
    }
  }, [academy, toggleSubscription]);

  const handleTabClick = useCallback((tabKey) => {
    setActiveTab(tabKey);
    if (window.innerWidth < 768 && mainContentRef.current) {
      const headerHeight = document.querySelector('.edu-fullpage__header')?.offsetHeight || 0;
      const scrollPosition = mainContentRef.current.offsetTop - headerHeight - 20;
      window.scrollTo({ top: scrollPosition, behavior: 'smooth' });
    }
  }, []);

  const handleBackClick = useCallback(() => {
    onClose();
  }, [onClose]);

  // Prevent render if no academy
  if (!academy) return null;

  const favoriteActive = isFavorite(academy.id);
  const subscribedActive = isSubscribed(academy.id);
  const bannerStyle = academy.bannerImage ? { backgroundImage: `url(${academy.bannerImage})` } : {};
  const hasCharts = academy.chartData;

  console.log('AcademyFullPage Render - Favorite:', favoriteActive, 'Subscribed:', subscribedActive);

  return (
    <div className="academy-detail-page">
      <EducationStateDebugger />
      <div className="edu-fullpage">
        <header className={`edu-fullpage__header ${isScrolled ? 'edu-fullpage__header--scrolled' : ''}`}>
          <div className="edu-fullpage__header-content">
            <button onClick={handleBackClick} className="edu-fullpage__back-btn">
              <FaArrowLeft />
              Back
            </button>
            
            <div className="edu-fullpage__header-info">
              <div className="edu-fullpage__header-avatar">
                {academy.profilePic || academy.name?.charAt(0)}
              </div>
              <div className="edu-fullpage__header-text">
                <h2 className="edu-fullpage__header-name">{academy.name}</h2>
                <p className="edu-fullpage__header-title">{academy.title}</p>
              </div>
              
              {isScrolled && (
                <div className="edu-fullpage__header-stats">
                  <span className="edu-fullpage__header-stat">{academy.rating} ★</span>
                  <span className="edu-fullpage__header-stat">{formatCount(academy.followers)} followers</span>
                  <span className="edu-fullpage__header-stat">{formatCount(academy.activeLearners)} active</span>
                </div>
              )}
            </div>
            
            <div className="edu-fullpage__header-actions">
              <button 
                className={`edu-favorite-btn ${favoriteActive ? 'edu-favorite-btn--active' : ''}`}
                onClick={handleFavoriteClick}
              >
                <FaHeart />
              </button>
              <button 
                className={`edu-subscribe-btn ${subscribedActive ? 'edu-subscribe-btn--active' : ''}`}
                onClick={handleSubscribeClick}
              >
                {subscribedActive ? (
                  <>
                    <FaBell className="edu-subscribe-btn__icon" />
                    Subscribed
                  </>
                ) : (
                  <>
                    <FaRegBell className="edu-subscribe-btn__icon" />
                    Subscribe
                  </>
                )}
              </button>
            </div>
          </div>
        </header>

        <div className="edu-fullpage__banner" style={bannerStyle}>
          <div className="edu-fullpage__banner-overlay">
            <div className="edu-fullpage__profile">
              <div className="edu-fullpage__avatar">
                {academy.profilePic || academy.name?.charAt(0)}
              </div>
              
              <div className="edu-fullpage__info">
                <h1 className="edu-fullpage__name">{academy.name}</h1>
                <p className="edu-fullpage__title">{academy.title}</p>
                
                {!isScrolled && (
                  <div className="edu-fullpage__stats">
                    <div className="edu-fullpage__stat">
                      <span className="edu-fullpage__stat-value">{academy.rating}</span>
                      <span className="edu-fullpage__stat-label">Rating</span>
                    </div>
                    <div className="edu-fullpage__stat">
                      <span className="edu-fullpage__stat-value">{formatCount(academy.followers)}</span>
                      <span className="edu-fullpage__stat-label">Followers</span>
                    </div>
                    <div className="edu-fullpage__stat">
                      <span className="edu-fullpage__stat-value">{formatCount(academy.activeLearners)}</span>
                      <span className="edu-fullpage__stat-label">Active Learners</span>
                    </div>
                    <div className="edu-fullpage__stat">
                      <span className="edu-fullpage__stat-value">{formatCount(academy.totalViews)}</span>
                      <span className="edu-fullpage__stat-label">Total Views</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <main className="edu-fullpage__main" ref={mainContentRef}>
          <nav className="edu-fullpage__tabs">
            <div className="edu-fullpage__tabs-list">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  className={`edu-fullpage__tab ${activeTab === tab.key ? 'edu-fullpage__tab--active' : ''}`}
                  onClick={() => handleTabClick(tab.key)}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                  {tab.badge && tab.badge > 0 && (
                    <span className="edu-fullpage__tab-badge">{tab.badge}</span>
                  )}
                </button>
              ))}
            </div>
          </nav>

          <div className="edu-fullpage__content">
            {activeTab === 'charts' && hasCharts ? (
              <ChartTab academy={academy} />
            ) : (
              <TabContent academy={academy} activeTab={activeTab} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
// Add this temporary component to debug context state
const EducationStateDebugger = () => {
  const { favorites, subscriptions } = useEducation();
  
  useEffect(() => {
    console.log('🎯 Education Context State:', {
      favorites,
      subscriptions
    });
  }, [favorites, subscriptions]);
  
  return null;
};


export default AcademyFullPage;