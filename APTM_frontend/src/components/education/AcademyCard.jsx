/* eslint-disable no-unused-vars */
import React, { useState, useCallback, useMemo } from 'react';
import { useEducationAcademy } from '../../hooks/useEducationAcademy';
import { 
  FaStar, 
  FaUsers, 
  FaEye, 
  FaHeart, 
  FaBell, 
  FaCheck,
  FaGraduationCap,
  FaCrown,
  FaRegHeart,
  FaRegBell
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useEducation } from '../../context/EducationContext';
import '../../styles/education/AcademyCard.css';

// Enhanced Image Service Configuration
const STOCK_IMAGE_CONFIG = {
  service: 'unsplash',
  defaultSearchTerm: 'education course learning',
  categoryKeywords: {
    'coding': 'programming code', 'computer': 'technology', 'tech': 'technology', 
    'programming': 'programming', 'software': 'software development', 
    'developer': 'web development', 'ai': 'artificial intelligence', 
    'machine learning': 'data science', 'data': 'data science',
    'business': 'business finance', 'finance': 'finance', 
    'marketing': 'digital marketing', 'entrepreneur': 'startup', 
    'management': 'business leadership', 'leadership': 'leadership',
    'design': 'graphic design', 'art': 'creative art', 'creative': 'creative', 
    'ui': 'ui design', 'ux': 'ux design', 'graphic': 'graphic design', 
    'illustration': 'digital illustration', 'photography': 'photography',
    'science': 'science research', 'research': 'scientific research', 
    'lab': 'science laboratory', 'biology': 'biology', 'chemistry': 'chemistry', 
    'physics': 'physics', 'medical': 'medical', 'health': 'healthcare',
    'music': 'music', 'guitar': 'guitar', 'piano': 'piano', 
    'violin': 'violin', 'singing': 'singing', 'production': 'music production', 
    'audio': 'audio engineering', 'dj': 'dj',
    'education': 'education', 'learning': 'online learning', 
    'school': 'school', 'university': 'university', 
    'course': 'online course', 'online': 'online education', 
    'study': 'study', 'knowledge': 'knowledge'
  },
  fallbackColors: ['#4f46e5', '#059669', '#dc2626', '#7c3aed', '#db2777', '#ea580c'],
};

// Utility functions
const getSearchTermFromTitle = (title) => {
  if (!title) return STOCK_IMAGE_CONFIG.defaultSearchTerm;
  
  const lowerTitle = title.toLowerCase();
  for (const [keyword, term] of Object.entries(STOCK_IMAGE_CONFIG.categoryKeywords)) {
    if (lowerTitle.includes(keyword)) {
      return term;
    }
  }
  
  const significantWords = lowerTitle.split(/\s+/)
    .filter(word => word.length > 3)
    .slice(0, 3)
    .join(' ');
  return significantWords || STOCK_IMAGE_CONFIG.defaultSearchTerm;
};

const getCharCode = (str, index = 0) => {
  if (!str || typeof str !== 'string') return 0;
  return str.charCodeAt(index) || 0;
};

const generateTitleBasedImageUrl = (academyId, title, width = 400, height = 200) => {
  const searchTerm = getSearchTermFromTitle(title);
  const uniqueId = academyId ? academyId.toString() : Math.random().toString(36).substr(2, 9);
  return `https://source.unsplash.com/${width}x${height}/?${encodeURIComponent(searchTerm)}&${uniqueId}`;
};

const generateTitleGradient = (title, academyId) => {
  const colors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)',
    'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)'
  ];
  const index = academyId ? getCharCode(academyId.toString()) % colors.length : 0;
  return colors[index];
};

const getCategoryFromTitle = (title) => {
  if (!title) return 'education';
  
  const lowerTitle = title.toLowerCase();
  const categories = {
    technology: ['coding', 'computer', 'tech', 'programming', 'software', 'developer', 'ai', 'machine learning', 'data'],
    business: ['business', 'finance', 'marketing', 'entrepreneur', 'startup', 'management', 'leadership'],
    design: ['design', 'art', 'creative', 'ui', 'ux', 'graphic', 'illustration', 'photography'],
    science: ['science', 'research', 'lab', 'biology', 'chemistry', 'physics', 'medical', 'health'],
    music: ['music', 'guitar', 'piano', 'violin', 'singing', 'production', 'audio', 'dj'],
    education: ['education', 'learning', 'school', 'university', 'course', 'online', 'study', 'knowledge']
  };
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowerTitle.includes(keyword))) {
      return category;
    }
  }
  return 'education';
};

const formatCount = (count) => {
  if (!count && count !== 0) return '0';
  if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
  if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
  return count.toString();
};

// Main Component
const AcademyCard = ({ 
  academy, 
  onClick, 
  variant = 'default',
  size = 'default',
  layout = 'vertical',
  showStats = true,
  interactive = true,
  showCoverImage = true,
  compact = false,
  disableNavigation = false
}) => {
  const { isFavorite, toggleFavorite, isSubscribed, toggleSubscription, favorites, subscriptions } = useEducation();
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
// Enhanced academy data with safe defaults and memoization
  const academyData = useMemo(() => {
    const safeAcademy = academy || {};
    
    const academyId = safeAcademy.id ? safeAcademy.id.toString() : Math.random().toString(36).substr(2, 9);
    const name = safeAcademy.name || 'Education Platform';
    const title = safeAcademy.title || 'Unknown Course/Academy';
    const category = getCategoryFromTitle(title);
    
    return {
      id: academyId,
      name: name,
      title: title,
      bio: safeAcademy.bio || 'No description available',
      rating: Math.min(Math.max(Number(safeAcademy.rating) || 0, 0), 5),
      followers: Math.max(Number(safeAcademy.followers) || 0, 0),
      totalViews: Math.max(Number(safeAcademy.totalViews) || 0, 0),
      activeLearners: Math.max(Number(safeAcademy.activeLearners) || 0, 0),
      studentsCount: Math.max(Number(safeAcademy.studentsCount) || 0, 0),
      isPremium: Boolean(safeAcademy.isPremium),
      isVerified: Boolean(safeAcademy.isVerified),
      isNew: Boolean(safeAcademy.isNew),
      isFeatured: Boolean(safeAcademy.isFeatured),
      joinDate: safeAcademy.joinDate || new Date().toISOString(),
      category,
      coverImage: safeAcademy.coverImage || generateTitleBasedImageUrl(academyId, title),
      customCover: Boolean(safeAcademy.coverImage),
      titleGradient: generateTitleGradient(title, academyId)
    };
  }, [academy]);

  // Event handlers
  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoaded(false);
  }, []);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    setImageError(false);
  }, []);

  const handleCardClick = useCallback((e) => {
    if (!interactive || disableNavigation) return;
    
    // Prevent default and stop propagation to ensure no other handlers interfere
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Navigating to academy:', academyData.id);
    
    if (onClick) {
      // If a custom onClick is provided, use it but also navigate
      onClick(academyData);
    }
    
    // Always navigate to the full academy page
    navigate(`/education/academy/${academyData.id}`);
  }, [academyData, interactive, disableNavigation, onClick, navigate]);

  const handleFavoriteClick = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!interactive) return;
    console.log('Toggling favorite for academy:', academyData.id);
    toggleFavorite(academyData.id);
  }, [academyData.id, toggleFavorite, interactive]);

  const handleSubscribeClick = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!interactive) return;
    console.log('Toggling subscription for academy:', academyData.id);
    toggleSubscription(academyData.id);
  }, [academyData.id, toggleSubscription, interactive]);

  // Stats rendering
  const renderStats = useCallback(() => {
    if (!showStats) return null;

    return (
      <div className="edu-card__stats">
        <div className="edu-card__stat">
          <FaStar className="edu-card__stat-icon edu-card__stat-icon--star" />
          <span className="edu-card__stat-value">{academyData.rating.toFixed(1)} <span className="edu-card__stat-label">Rating</span> </span>
          
        </div>
        <div className="edu-card__stat">
          <FaUsers className="edu-card__stat-icon edu-card__stat-icon--followers" />
          <span className="edu-card__stat-value">{formatCount(academyData.followers)} <span className="edu-card__stat-label">Followers</span> </span>
          
        </div>
        <div className="edu-card__stat">
          <FaGraduationCap className="edu-card__stat-icon edu-card__stat-icon--students" />
          <span className="edu-card__stat-value">{formatCount(academyData.activeLearners)} <span className="edu-card__stat-label"> Learners</span> </span>
          
        </div>
        <div className="edu-card__stat">
          <FaEye className="edu-card__stat-icon edu-card__stat-icon--views" />
          <span className="edu-card__stat-value">{formatCount(academyData.totalViews)} <span className="edu-card__stat-label">Total Views</span> </span>
          
        </div>
      </div>
    );
  }, [academyData, showStats]);

  // Badges rendering
  const renderBadges = useCallback(() => {
    const badges = [];

    if (academyData.isPremium) {
      badges.push(
        <div key="premium" className="edu-badge edu-badge--premium" title="Premium Academy">
          <FaCrown />
          <span>Premium</span>
        </div>
      );
    }

    if (academyData.isNew) {
      badges.push(
        <div key="new" className="edu-badge edu-badge--new" title="New Academy">
          <span>New</span>
        </div>
      );
    }

    if (academyData.isFeatured) {
      badges.push(
        <div key="featured" className="edu-badge edu-badge--featured" title="Featured Academy">
          <span>Featured</span>
        </div>
      );
    }

    // Always show category badge
    badges.push(
      <div key="category" className="edu-badge edu-badge--category" title={`Category: ${academyData.category}`}>
        <span>{academyData.category}</span>
      </div>
    );

    return badges.length > 0 ? (
      <div className="edu-card__badges">
        {badges}
      </div>
    ) : null;
  }, [academyData]);

  // Cover image section
  const renderCoverImage = useCallback(() => {
    if (!showCoverImage || imageError) return null;

    return (
      <div className="edu-card__cover">
        <img
          src={academyData.coverImage}
          alt={`Cover for ${academyData.name}`}
          className="edu-card__cover-image"
          onError={handleImageError}
          onLoad={handleImageLoad}
          loading="lazy"
        />
        <div className="edu-card__cover-overlay">
          <div className="edu-card__view-details-text">
            View Full Academy
          </div>
        </div>
        
        {/* Stock image indicator */}
        {!academyData.customCover && (
          <div className="edu-card__stock-badge" title="Stock Image">
            <FaEye />
          </div>
        )}
      </div>
    );
  }, [showCoverImage, imageError, academyData, handleImageError, handleImageLoad]);

  // Title initial render
  const renderTitleInitial = useCallback(() => {
    const initial = academyData.name?.charAt(0)?.toUpperCase() || 'A';
    return (
      <div 
        className="edu-card__title-initial"
        style={{ background: academyData.titleGradient }}
        title={academyData.name}
      >
        {academyData.isPremium && (
          <div className="edu-card__premium-badge">
            <FaCrown />
          </div>
        )}
        {initial}
      </div>
    );
  }, [academyData.name, academyData.titleGradient, academyData.isPremium]);

  // Format join date safely
  const formattedJoinDate = useMemo(() => {
    try {
      const joinYear = new Date(academyData.joinDate).getFullYear();
      const currentYear = new Date().getFullYear();
      
      if (joinYear === currentYear) {
        return 'Joined this year';
      } else if (joinYear === currentYear - 1) {
        return 'Joined last year';
      } else {
        return `Joined ${joinYear}`;
      }
    } catch {
      return 'Recently joined';
    }
  }, [academyData.joinDate]);

  // Dynamic class names
  const cardClassNames = useMemo(() => {
    const classes = ['edu-card'];
    
    if (size !== 'default') classes.push(`edu-card--${size}`);
    if (compact) classes.push('edu-card--compact');
    if (layout !== 'vertical') classes.push(`edu-card--${layout}`);
    if (academyData.isPremium) classes.push('edu-card--premium');
    if (academyData.isFeatured) classes.push('edu-card--featured');
    if (academyData.isVerified) classes.push('edu-card--verified');
    classes.push(`edu-card--category-${academyData.category}`);
    if (showCoverImage && !imageError) classes.push('edu-card--with-cover');
    if (showCoverImage && !imageLoaded && !imageError) classes.push('edu-card--loading');
    
    return classes.join(' ');
  }, [size, layout, academyData, compact, showCoverImage, imageError, imageLoaded]);

  // Get current state for buttons
  const favoriteActive = isFavorite(academyData.id);
  const subscribedActive = isSubscribed(academyData.id);

  console.log(`AcademyCard ${academyData.id}:`, { 
    favorite: favoriteActive, 
    subscribed: subscribedActive 
  });

  return (
    <article 
      className={cardClassNames}
      onClick={handleCardClick}
      tabIndex={interactive ? 0 : -1}
      data-academy-id={academyData.id}
      data-category={academyData.category}
      role="button"
      aria-label={`View full academy details for ${academyData.name}`}
    >
      {/* Cover Image */}
      {renderCoverImage()}

      {/* Header */}
      <div className="edu-card__header">
        {renderTitleInitial()}
        
        <div className="edu-card__info">
          <div className="edu-card__title-wrapper">
            <h3 className="edu-card__title" title={academyData.name}>
              {academyData.name}
              {academyData.isVerified && (
                <span className="edu-card__verified-badge" title="Verified Academy">
                  <FaCheck />
                </span>
              )}
            </h3>
          </div>
          
          <p className="edu-card__subtitle" title={academyData.title}>
            {academyData.title}
          </p>
          
          {/* Additional Info */}
          {layout === 'vertical' && (
            <div className="edu-card__additional-info">
              <span className="edu-card__join-date">
                {formattedJoinDate}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Badges */}
      {renderBadges()}

      {/* Bio */}
      {(layout === 'vertical' || academyData.bio.length < 100) && (
        <div className="edu-card__bio-container">
          <p className="edu-card__bio">{academyData.bio}</p>
        </div>
      )}

      {/* Stats */}
      {layout === 'vertical' && renderStats()}

      {/* Meta Section */}
      <div className="edu-card__meta">
        <div className="edu-card__actions">
          <button 
            className={`edu-subscribe-btn ${subscribedActive ? 'edu-subscribe-btn--active' : ''}`}
            onClick={handleSubscribeClick}
            disabled={!interactive}
            aria-label={subscribedActive ? 'Unsubscribe from academy' : 'Subscribe to academy'}
            type="button"
          >
            {subscribedActive ? (
              <>
                <FaBell className="edu-subscribe-btn__icon" />
                {layout === 'vertical' && (
                  <span className="edu-subscribe-btn__text">Subscribed</span>
                )}
              </>
            ) : (
              <>
                <FaRegBell className="edu-subscribe-btn__icon" />
                {layout === 'vertical' && (
                  <span className="edu-subscribe-btn__text">Subscribe</span>
                )}
              </>
            )}
          </button>
          
          <button 
            className={`edu-favorite-btn ${favoriteActive ? 'edu-favorite-btn--active' : ''}`}
            onClick={handleFavoriteClick}
            disabled={!interactive}
            aria-label={favoriteActive ? 'Remove from favorites' : 'Add to favorites'}
            type="button"
          >
            {favoriteActive ? (
              <FaHeart className="edu-favorite-btn__icon" />
            ) : (
              <FaRegHeart className="edu-favorite-btn__icon" />
            )}
          </button>
        </div>
      </div>
    </article>
  );
};

// Error Boundary
class AcademyCardErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('AcademyCard Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="edu-card edu-card--error">
          <div className="edu-card__header">
            <div 
              className="edu-card__title-initial" 
              style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}
            >
              !
            </div>
            <div className="edu-card__info">
              <h3 className="edu-card__title">Error Loading Academy</h3>
              <p className="edu-card__subtitle">Please try again later</p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Export with Error Boundary
export default function AcademyCardWithErrorBoundary(props) {
  return (
    <AcademyCardErrorBoundary>
      <AcademyCard {...props} />
    </AcademyCardErrorBoundary>
  );
}

// Also export the main component directly for testing
export { AcademyCard };