import React from 'react';
import { FaChartLine, FaComments, FaImage, FaBookOpen, FaUsers, FaStar, FaEye, FaExclamationTriangle } from 'react-icons/fa';
// eslint-disable-next-line no-unused-vars
import { safeFormatCount, getAcademyValue, getAcademyNumber } from '../../utils/educationHelpers';
import CommentSection from './CommentSection';
import '../../styles/education/TabContent.css';

const TabContent = ({ academy, activeTab }) => {
  // Safe academy data extraction with fallbacks
  const safeAcademy = academy || {};

  // Safe author data
  const author = safeAcademy.author || {};
  const authorName = getAcademyValue(author, 'name', 'Unknown Instructor');
  const authorStatus = getAcademyValue(author, 'status', 'Offline');
  const isAuthorVerified = Boolean(author.verified);
  
  // Safe number values (keeping for other potential uses, but not displaying in overview)


  
  // Safe array values
  const courses = Array.isArray(safeAcademy.courses) ? safeAcademy.courses : [];
  const chatRooms = Array.isArray(safeAcademy.chatRooms) ? safeAcademy.chatRooms : [];
  const gallery = Array.isArray(safeAcademy.gallery) ? safeAcademy.gallery : [];
  
  // Safe chart data
  const chartData = safeAcademy.chartData || {};
  const chartSymbol = getAcademyValue(chartData, 'symbol', 'N/A');
  const chartInterval = getAcademyValue(chartData, 'interval', '1D');

  // Error state - if no valid academy data
  if (!academy) {
    return (
      <div className="edu-tab-content">
        <div className="edu-error-state">
          <FaExclamationTriangle className="edu-error-state__icon" />
          <h3>Unable to Load Content</h3>
          <p>There was a problem loading the academy data. Please try again.</p>
        </div>
      </div>
    );
  }

  // Home Tab - REMOVED STATS FROM HERE
  if (activeTab === 'home') {
    return (
      <div className="edu-tab-content">
        {/* REMOVED STATS SECTION - They're already displayed in the banner */}
        
        {/* Instructor Section */}
        <div className="edu-tab-section">
          <h3 className="edu-tab-section__title">Instructor</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-md)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--edu-gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
              {safeAcademy.profilePic || '👤'}
            </div>
            <div>
              <div style={{ fontWeight: '600', color: 'var(--color-text)' }}>
                {authorName}
                {isAuthorVerified && ' ✅'}
              </div>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                Status: <span style={{ color: authorStatus === 'Online' ? 'var(--color-success)' : 'var(--color-text-tertiary)' }}>
                  {authorStatus}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    );
  }

  // Courses Tab
  if (activeTab === 'courses') {
    return (
      <div className="edu-tab-content">
        <div className="edu-tab-section">
          <h2 className="edu-tab-section__title">
            Courses Offered ({courses.length})
          </h2>
          
          {courses.length > 0 ? (
            courses.map((course, index) => {
              const safeCourse = course || {};
              const courseTitle = getAcademyValue(safeCourse, 'title', `Course ${index + 1}`);
              const courseDescription = getAcademyValue(safeCourse, 'description', 'No description available');
              const courseLevel = getAcademyValue(safeCourse, 'level', 'Beginner');
              const courseLessons = getAcademyNumber(safeCourse, 'lessons', 0);
              const courseDuration = getAcademyValue(safeCourse, 'duration', 'N/A');
              const coursePrice = getAcademyValue(safeCourse, 'price', '$0');
              const courseIcon = safeCourse.icon || '📚';

              return (
                <div key={safeCourse.id || index} className="edu-course-card">
                  <div className="edu-course-card__header">
                    <div>
                      <h4 className="edu-course-card__title">{courseTitle}</h4>
                      <p className="edu-course-card__description">{courseDescription}</p>
                      <div className="edu-course-card__meta">
                        <span>Level: {courseLevel}</span>
                        <span>•</span>
                        <span>{courseLessons} lessons</span>
                        <span>•</span>
                        <span>{courseDuration}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '1.5rem', marginBottom: 'var(--space-xs)' }}>
                        {courseIcon}
                      </div>
                      <div style={{ fontWeight: '700', color: 'var(--color-text)' }}>
                        {coursePrice}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="edu-empty-state">
              <div className="edu-empty-state__icon">📚</div>
              <div className="edu-empty-state__text">No courses published yet</div>
              <p style={{ color: 'var(--color-text-tertiary)' }}>Check back later for new course offerings</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Community Tab
  if (activeTab === 'community') {
    return (
      <div className="edu-tab-content">
        <div className="edu-tab-section">
          <h2 className="edu-tab-section__title">Community & Chat Rooms</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)' }}>
            Join live chat rooms to discuss content and strategies with fellow learners.
          </p>
          
          {chatRooms.length > 0 ? (
            chatRooms.map((room, index) => {
              const safeRoom = room || {};
              const roomName = getAcademyValue(safeRoom, 'name', `Chat Room ${index + 1}`);
              const roomMembers = getAcademyNumber(safeRoom, 'members', 0);

              return (
                <div key={safeRoom.id || index} className="edu-course-card">
                  <div className="edu-course-card__header">
                    <div>
                      <h4 className="edu-course-card__title">
                        <FaComments style={{ marginRight: 'var(--space-xs)', color: 'var(--color-primary)' }} />
                        {roomName}
                      </h4>
                      <div className="edu-course-card__meta">
                        <span>{roomMembers} members</span>
                      </div>
                    </div>
                    <button 
                      className="edu-btn edu-btn--primary"
                      onClick={() => alert(`(Demo) Joining chat room: ${roomName}`)}
                    >
                      Join Chat
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="edu-empty-state">
              <div className="edu-empty-state__icon">💬</div>
              <div className="edu-empty-state__text">No chat rooms available</div>
              <p style={{ color: 'var(--color-text-tertiary)' }}>Community features coming soon</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Charts Tab
  if (activeTab === 'charts') {
    if (!chartData || !chartSymbol || chartSymbol === 'N/A') {
      return (
        <div className="edu-tab-content">
          <div className="edu-empty-state">
            <div className="edu-empty-state__icon">📈</div>
            <div className="edu-empty-state__text">Charts Unavailable</div>
            <p style={{ color: 'var(--color-text-tertiary)' }}>
              Charts are only available for academies with market data integration.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="edu-tab-content">
        <div className="edu-tab-section">
          <h2 className="edu-tab-section__title">
            Live Chart: {chartSymbol}
            <small style={{ color: 'var(--color-text-secondary)', marginLeft: 'var(--space-xs)' }}>
              ({chartInterval})
            </small>
          </h2>
          
          <div className="edu-chart-container">
            <div className="edu-chart-placeholder">
              <FaChartLine size={48} style={{ color: 'var(--color-text-tertiary)' }} />
            </div>
          </div>
          
          <div style={{ marginTop: 'var(--space-lg)', textAlign: 'center' }}>
            <button 
              className="edu-btn edu-btn--primary"
              onClick={() => alert(`(Demo) Opening TradingView for ${chartSymbol}`)}
            >
              Open TradingView
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Gallery Tab
  if (activeTab === 'gallery') {
    return (
      <div className="edu-tab-content">
        <div className="edu-tab-section">
          <h2 className="edu-tab-section__title">Gallery</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)' }}>
            A visual journey through the academy's resources and learning environment.
          </p>
          
          {gallery.length > 0 ? (
            <div className="edu-gallery">
              {gallery.map((image, index) => (
                <div 
                  key={index}
                  className="edu-gallery-item"
                  style={{ backgroundImage: `url(${image})` }}
                  onClick={() => alert(`(Demo) Viewing image ${index + 1}`)}
                >
                  <div className="edu-gallery-item__label">Resource {index + 1}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="edu-empty-state">
              <div className="edu-empty-state__icon">🖼️</div>
              <div className="edu-empty-state__text">No gallery images</div>
              <p style={{ color: 'var(--color-text-tertiary)' }}>Gallery content coming soon</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Comments Tab
  if (activeTab === 'comments') {
    return (
      <div className="edu-tab-content">
        <CommentSection academy={safeAcademy} />
      </div>
    );
  }

  // Default/Unknown Tab
  return (
    <div className="edu-tab-content">
      <div className="edu-empty-state">
        <div className="edu-empty-state__text">Content coming soon</div>
      </div>
    </div>
  );
};

export default TabContent;