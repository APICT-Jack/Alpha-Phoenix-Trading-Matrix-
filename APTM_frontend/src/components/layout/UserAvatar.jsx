/* eslint-disable react-refresh/only-export-components */
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaChevronDown, FaCog, FaCashRegister, FaUserCircle, FaSignOutAlt, FaCrown } from 'react-icons/fa';
import './UserAvatar.css';

// Safe user data access utilities
export const getUserAvatar = (user) => {
  if (!user) return null;
  
  if (user.avatar) {
    if (user.avatar.startsWith('http')) {
      return user.avatar;
    }
    return `http://localhost:5000${user.avatar}`;
  }
  
  return null;
};

export const getUserInitial = (user) => {
  if (!user) return <FaUser />;
  
  const initial = user.name?.charAt(0) || user.email?.charAt(0);
  return initial ? initial.toUpperCase() : <FaUser />;
};

export const getDisplayName = (user) => {
  if (!user) return '';
  return user.name?.split(' ')[0] || user.email?.split('@')[0] || 'User';
};

export const getFullName = (user) => {
  if (!user) return 'User';
  return user.name || 'User';
};

export const getEmail = (user) => {
  if (!user) return 'No email';
  return user.email || 'No email';
};

const UserAvatar = ({ 
  user, 
  size = 'medium', 
  showName = false, 
  showDropdown = false,
  className = '',
  onSettingsClick,
  onCasherClick,
  onProfileClick,
  onSubscriptionClick,
  onLogoutClick,
  onClick,
  ...props 
}) => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const dropdownRef = useRef(null);
  const avatarRef = useRef(null);

  const avatarUrl = getUserAvatar(user);
  const initials = getUserInitial(user);
  const displayName = getDisplayName(user);
  const fullName = getFullName(user);
  const email = getEmail(user);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          avatarRef.current && !avatarRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoaded(false);
    setImageError(true);
  };

  const handleAvatarClick = (e) => {
    if (onClick) {
      onClick(e);
    }
    
    if (showDropdown && user) {
      e.stopPropagation();
      setIsDropdownOpen(!isDropdownOpen);
    }
  };

  const handleOptionClick = (handler) => {
    setIsDropdownOpen(false);
    if (handler) handler();
  };

  // Default handlers for navigation
  const handleProfileClick = () => {
    if (onProfileClick) {
      onProfileClick();
    } else {
      // Navigate to the user's profile view
      navigate('/profile');
    }
  };

  const handleSettingsClick = () => {
    if (onSettingsClick) {
      onSettingsClick();
    } else {
      // Navigate to profile settings
      navigate('/profile/settings');
    }
  };

  const handleCasherClick = () => {
    if (onCasherClick) {
      onCasherClick();
    } else {
      // Navigate to casher/dashboard
      navigate('/dashboard');
    }
  };

  const handleSubscriptionClick = () => {
    if (onSubscriptionClick) {
      onSubscriptionClick();
    } else {
      // Navigate to subscription page
      navigate('/subscription');
    }
  };

  const handleLogoutClick = () => {
    if (onLogoutClick) {
      onLogoutClick();
    } else {
      // Default logout behavior
      console.log('Logging out...');
      // Add your logout logic here
    }
  };

  const shouldShowImage = avatarUrl && !imageError;
  const shouldShowFallback = !avatarUrl || imageError;

  return (
    <div className={`user-avatar-wrapper ${className}`} {...props}>
      <div className={`user-avatar-content size-${size}`}>
        <div 
          ref={avatarRef}
          className={`avatar-container ${showDropdown ? 'clickable' : ''}`}
          onClick={handleAvatarClick}
        >
          {shouldShowImage && (
            <img 
              src={avatarUrl} 
              alt="Profile" 
              className="avatar-image"
              onLoad={handleImageLoad}
              onError={handleImageError}
              style={{ display: imageLoaded ? 'block' : 'none' }}
            />
          )}
          
          {shouldShowFallback && (
            <div className="avatar-fallback">
              {initials}
            </div>
          )}
        </div>
        
        {showName && (
          <span className="avatar-name">
            {displayName}
          </span>
        )}
        
        {showDropdown && user && (
          <div ref={dropdownRef} className="avatar-dropdown">
            <button 
              className={`dropdown-trigger ${isDropdownOpen ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setIsDropdownOpen(!isDropdownOpen);
              }}
            >
              <FaChevronDown className="dropdown-chevron" />
            </button>
            
            {isDropdownOpen && (
              <>
                <div 
                  className="dropdown-overlay"
                  onClick={() => setIsDropdownOpen(false)}
                />
                <div className="dropdown-menu">
                  {/* User Info Header */}
                  <div className="dropdown-header">
                    <div className="dropdown-user-avatar">
                      {shouldShowImage ? (
                        <img src={avatarUrl} alt="Profile" className="header-avatar-image" />
                      ) : (
                        <div className="header-avatar-fallback">
                          {initials}
                        </div>
                      )}
                    </div>
                    <div className="dropdown-user-info">
                      <div className="dropdown-user-name">{fullName}</div>
                      <div className="dropdown-user-email">{email}</div>
                    </div>
                  </div>
                  
                  <div className="dropdown-divider"></div>
                  
                  {/* Dropdown Options */}
                  <div className="dropdown-options">
                    <button 
                      className="dropdown-option" 
                      onClick={() => handleOptionClick(handleProfileClick)}
                    >
                      <FaUserCircle className="option-icon" />
                      <span>View Profile</span>
                    </button>
                    
                    <button 
                      className="dropdown-option" 
                      onClick={() => handleOptionClick(handleSettingsClick)}
                    >
                      <FaCog className="option-icon" />
                      <span>Profile Settings</span>
                    </button>
                    
                    <button 
                      className="dropdown-option" 
                      onClick={() => handleOptionClick(handleCasherClick)}
                    >
                      <FaCashRegister className="option-icon" />
                      <span>Dashboard</span>
                    </button>
                    
                    <button 
                      className="dropdown-option" 
                      onClick={() => handleOptionClick(handleSubscriptionClick)}
                    >
                      <FaCrown className="option-icon" />
                      <span>Subscription</span>
                    </button>
                    
                    <div className="dropdown-divider"></div>
                    
                    <button 
                      className="dropdown-option logout" 
                      onClick={() => handleOptionClick(handleLogoutClick)}
                    >
                      <FaSignOutAlt className="option-icon" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserAvatar;