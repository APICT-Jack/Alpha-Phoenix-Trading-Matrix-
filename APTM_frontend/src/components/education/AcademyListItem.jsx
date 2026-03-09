import React from 'react';
import { FaStar, FaUsers, FaClock, FaBook, FaGraduationCap } from 'react-icons/fa';
import './AcademyListItem.css';

// eslint-disable-next-line no-unused-vars
const AcademyListItem = ({ academy, onClick, viewMode }) => {
  const handleClick = () => {
    onClick(academy);
  };

  // Safe data extraction with fallbacks
  const academyData = {
    id: academy?.id || 'unknown',
    name: academy?.name || 'Unknown Academy',
    title: academy?.title || 'Education Platform',
    description: academy?.description || academy?.bio || 'No description available.',
    image: academy?.image || academy?.profilePic || '/default-academy.jpg',
    rating: academy?.rating || 4.5,
    students: academy?.students || academy?.studentsCount || academy?.followers || '100+',
    duration: academy?.duration || 'Self-paced',
    category: academy?.category || 'Education',
    price: academy?.price,
    level: academy?.level || 'All Levels',
    coursesCount: academy?.coursesCount || 0,
    isVerified: academy?.isVerified || false,
    isPremium: academy?.isPremium || false
  };

  const formatPrice = (price) => {
    if (!price || price === 0) return 'Free';
    return `$${price}`;
  };

  const formatRating = (rating) => {
    return typeof rating === 'number' ? rating.toFixed(1) : rating;
  };

  return (
    <div className="academy-list-item" onClick={handleClick}>
      <div className="academy-list-item-image">
        <img 
          src={academyData.image} 
          alt={academyData.name}
          onError={(e) => {
            e.target.src = '/default-academy.jpg';
          }}
        />
        {academyData.isPremium && (
          <div className="academy-list-item-premium-badge">Premium</div>
        )}
      </div>
      
      <div className="academy-list-item-content">
        <div className="academy-list-item-header">
          <div className="academy-list-item-title-section">
            <h3 className="academy-list-item-title">
              {academyData.name}
              {academyData.isVerified && (
                <span className="academy-list-item-verified" title="Verified Academy">✓</span>
              )}
            </h3>
            <p className="academy-list-item-subtitle">{academyData.title}</p>
          </div>
          
          <div className="academy-list-item-rating">
            <FaStar className="academy-list-item-star" />
            <span>{formatRating(academyData.rating)}</span>
          </div>
        </div>
        
        <p className="academy-list-item-description">
          {academyData.description}
        </p>
        
        <div className="academy-list-item-meta">
          <div className="academy-list-item-meta-items">
            <div className="academy-list-item-meta-item">
              <FaUsers />
              <span>{academyData.students} students</span>
            </div>
            <div className="academy-list-item-meta-item">
              <FaClock />
              <span>{academyData.duration}</span>
            </div>
            {academyData.coursesCount > 0 && (
              <div className="academy-list-item-meta-item">
                <FaBook />
                <span>{academyData.coursesCount} courses</span>
              </div>
            )}
            <div className="academy-list-item-category">
              {academyData.category}
            </div>
          </div>
        </div>
        
        <div className="academy-list-item-footer">
          <div className="academy-list-item-price">
            {formatPrice(academyData.price)}
          </div>
          <div className="academy-list-item-level">
            {academyData.level}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcademyListItem;