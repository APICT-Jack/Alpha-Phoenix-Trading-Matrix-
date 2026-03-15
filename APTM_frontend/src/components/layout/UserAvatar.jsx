/* eslint-disable react-refresh/only-export-components */
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaChevronDown, FaCog, FaCashRegister, FaUserCircle, FaSignOutAlt, FaCrown } from 'react-icons/fa';
import './UserAvatar.css';

// Constants for API URLs
// Constants for API URLs
const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 
                 import.meta.env.VITE_BASE_URL ||
                 (import.meta.env.PROD ? window.location.origin : 'http://localhost:5000');

// Safe user data access utilities
export const getUserAvatar = (user) => {
  if (!user) return null;
  
  // Get avatar from various possible locations
  let avatar = user.avatar || user.avatarUrl || user.profilePicture || user.profile?.avatar || null;
  
  if (!avatar) return null;
  
  // Handle object type avatar (from some APIs)
  if (typeof avatar === 'object') {
    avatar = avatar.url || avatar.avatarUrl || null;
  }
  
  if (!avatar) return null;
  
  // If it's already a full URL, return as is
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar;
  }
  
  // If it's a data URL, return as is
  if (avatar.startsWith('data:')) {
    return avatar;
  }
  
  // Extract just the filename if it contains path
  let cleanPath = avatar;
  if (avatar.includes('/')) {
    cleanPath = avatar.split('/').pop();
  }
  
  return `${BASE_URL}/uploads/avatars/${cleanPath}`;
};

export const getUserInitial = (user) => {
  if (!user) return <FaUser />;
  
  // Try to get initial from name, username, or email
  const name = user.name || user.displayName || '';
  const username = user.username || user.userName || '';
  const email = user.email || '';
  
  const initial = name.charAt(0) || username.charAt(0) || email.charAt(0);
  return initial ? initial.toUpperCase() : <FaUser />;
};

export const getDisplayName = (user) => {
  if (!user) return '';
  return user.name?.split(' ')[0] || 
         user.username || 
         user.displayName?.split(' ')[0] || 
         user.email?.split('@')[0] || 
         'User';
};

export const getFullName = (user) => {
  if (!user) return 'User';
  return user.name || user.displayName || user.username || 'User';
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
    console.log('Avatar failed to load:', avatarUrl);
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
      navigate('/profile');
    }
  };

  const handleSettingsClick = () => {
    if (onSettingsClick) {
      onSettingsClick();
    } else {
      navigate('/profile/settings');
    }
  };

  const handleCasherClick = () => {
    if (onCasherClick) {
      onCasherClick();
    } else {
      navigate('/dashboard');
    }
  };

  const handleSubscriptionClick = () => {
    if (onSubscriptionClick) {
      onSubscriptionClick();
    } else {
      navigate('/subscription');
    }
  };

  const handleLogoutClick = () => {
    if (onLogoutClick) {
      onLogoutClick();
    } else {
      console.log('Logging out...');
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
              loading="lazy"
            />
          )}
          
          {shouldShowFallback && (
            <div className="avatar-fallback">
              {typeof initials === 'string' ? initials : initials}
            </div>
          )}
        </div>
        
        {showName && (
          <span className="avatar-name" title={fullName}>
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
              aria-label="User menu"
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
                        <img 
                          src={avatarUrl} 
                          alt="Profile" 
                          className="header-avatar-image"
                          onError={handleImageError}
                        />
                      ) : (
                        <div className="header-avatar-fallback">
                          {typeof initials === 'string' ? initials : initials}
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