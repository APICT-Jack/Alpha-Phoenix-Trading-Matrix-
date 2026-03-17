import React, { useState, useEffect, useRef } from 'react'; 
import { useNavigate, Link, useLocation } from 'react-router-dom'; 
import { 
  FaHome, 
  FaChartBar, 
  FaGraduationCap, 
  FaUsers, 
  FaTools, 
  FaBell, 
  FaBars,
  FaTimes,
  FaUser,
  FaSignInAlt  // Added login icon
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import AuthModal from '../auth/AuthModal';
import UserAvatar from './UserAvatar';
import './Header.css';

// Constants for API URLs
const API_URL = import.meta.env.VITE_API_URL || 
                (import.meta.env.PROD ? `${window.location.origin}/api` : 'http://localhost:5000/api');
const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 
                 import.meta.env.VITE_BASE_URL || 
                 (import.meta.env.PROD ? window.location.origin : 'http://localhost:5000');

// Notification service (simplified) with dynamic URL
const notificationService = {
  getNotificationCounts: async (token) => {
    try {
      const response = await fetch(`${API_URL}/notifications/counts`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return { success: false, data: {} };
    }
  }
};

// Simplified NotificationsPanel Component
const NotificationsPanel = ({ onClose, user }) => {
  const panelRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div className="notifications-overlay">
      <div ref={panelRef} className="notifications-panel">
        <div className="notifications-header">
          <h3>Notifications</h3>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        <div className="notifications-content">
          <p>No new notifications</p>
        </div>
      </div>
    </div>
  );
};

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, isAuthenticated } = useAuth();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [activeNav, setActiveNav] = useState('home');
  const [isMobile, setIsMobile] = useState(false);
  
  const mobileNavRef = useRef(null);
  const mobileMenuToggleRef = useRef(null);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Initial check
    checkMobile();

    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Auth check
  const canShowDashboard = user && typeof user === 'object' && (isAuthenticated || localStorage.getItem('token'));

  // Set active nav based on current route
  useEffect(() => {
    const path = location.pathname;
    
    if (path === '/') {
      setActiveNav('home');
    } else if (path === '/education' || path.startsWith('/education/')) {
      setActiveNav('education');
    } else if (path === '/dashboard') {
      setActiveNav('dashboard');
    } else if (path === '/profile') {
      setActiveNav('profile');
    } else {
      setActiveNav('');
    }
  }, [location]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isMobileNavClick = mobileNavRef.current?.contains(event.target);
      const isMobileToggleClick = mobileMenuToggleRef.current?.contains(event.target);
      const isNotificationClick = event.target.closest('.notification-btn') || 
                                 event.target.closest('.notifications-container');

      if (showMobileNav && !isMobileNavClick && !isMobileToggleClick) {
        setShowMobileNav(false);
      }

      if (showNotifications && !isNotificationClick) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showMobileNav, showNotifications]);

  // Close mobile nav when scrolling
  useEffect(() => {
    const handleScroll = () => {
      setShowMobileNav(false);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle body scroll when mobile nav is open
  useEffect(() => {
    if (showMobileNav) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [showMobileNav]);

  // Fetch notification count
  const fetchNotificationCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await notificationService.getNotificationCounts(token);
      if (response.success) {
        const total = Object.values(response.data).reduce((sum, count) => sum + count, 0);
        setNotificationCount(total);
      }
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  };

  useEffect(() => {
    if (canShowDashboard) {
      fetchNotificationCount();
    } else {
      setNotificationCount(0);
    }
  }, [canShowDashboard]);

  // Navigation handlers
  const handleMobileNavToggle = () => {
    setShowMobileNav(prev => !prev);
    setShowNotifications(false);
  };

  const handleNavLinkClick = (navItem) => {
    setActiveNav(navItem);
    setShowMobileNav(false);
  };

  // Scroll to section function
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerHeight = document.querySelector('.main-header')?.offsetHeight || 0;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - headerHeight - 20;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Handle home click to scroll to hero section
  const handleHomeClick = (e) => {
    e.preventDefault();
    setActiveNav('home');
    setShowMobileNav(false);
    
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        scrollToSection('hero');
      }, 100);
    } else {
      scrollToSection('hero');
    }
  };

  const handleSectionClick = (sectionId, event) => {
    event.preventDefault();
    setActiveNav(sectionId);
    setShowMobileNav(false);
    
    if (location.pathname !== '/') {
      navigate(`/#${sectionId}`);
      setTimeout(() => {
        scrollToSection(sectionId);
      }, 100);
    } else {
      scrollToSection(sectionId);
    }
  };

  // User Avatar handlers
  const handleSettingsClick = () => {
    navigate('/settings');
  };
  
  const handleSubscriptionClick = () => {
    navigate('/subscription');
  };

  const handleCasherClick = () => {
    navigate('/casher');
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleNotificationPanelClose = () => {
    setShowNotifications(false);
    if (canShowDashboard) {
      fetchNotificationCount();
    }
  };

  const handleUserAction = () => {
    if (!canShowDashboard) {
      setShowAuthModal(true);
    }
  };

  // Handle mobile login click
  const handleMobileLoginClick = () => {
    setShowAuthModal(true);
    setShowMobileNav(false);
  };

  // Format user object for UserAvatar
  const getFormattedUser = () => {
    if (!user) return null;
    
    // Ensure user has all required fields
    return {
      ...user,
      // Make sure avatar URL is properly formatted if needed
      avatar: user.avatar || user.avatarUrl || null,
      name: user.name || user.displayName || 'User',
      username: user.username || user.userName || 'user'
    };
  };

  const formattedUser = getFormattedUser();

  return (
    <>
      <header className="main-header">
        <div className="container">
          <div className="header-content">
            {/* Logo */}
            <a 
              href="/" 
              className="logo-container"
              onClick={handleHomeClick}
            >
              <div className="logo-mark">
                <div className="logo-squares">
                  <div className="logo-square square-1"></div>
                  <div className="logo-square square-2"></div>
                  <div className="logo-square square-3"></div>
                </div>
              </div>
              <div className="logo-text">
                <p>Alpha Phoenix</p>
                <p>Trading Matrix</p>
              </div>
            </a>
            
            {/* Desktop Navigation */}
            <nav className="desktop-nav">
              <ul>
                <li>
                  <a 
                    href="/" 
                    className={activeNav === 'home' ? 'active' : ''}
                    onClick={handleHomeClick}
                  >
                    <FaHome /> Home
                  </a>
                </li>
                <li>
                  <Link 
                    to="/education" 
                    className={activeNav === 'education' ? 'active' : ''}
                    onClick={() => handleNavLinkClick('education')}
                  >
                    <FaChartBar /> Library
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/education" 
                    className={activeNav === 'education' ? 'active' : ''}
                    onClick={() => handleNavLinkClick('education')}
                  >
                    <FaGraduationCap /> Academy
                  </Link>
                </li>
                <li>
                  <a 
                    href="#community" 
                    className={activeNav === 'community' ? 'active' : ''}
                    onClick={(e) => handleSectionClick('community', e)}
                  >
                    <FaUsers /> Community
                  </a>
                </li>
                <li>
                  <a 
                    href="#tools"
                    onClick={(e) => handleSectionClick('tools', e)}
                  >
                    <FaTools /> Tools
                  </a>
                </li>
                
                {canShowDashboard && (
                  <li>
                    <Link 
                      to="/dashboard" 
                      className={activeNav === 'dashboard' ? 'active' : ''}
                      onClick={() => handleNavLinkClick('dashboard')}
                    >
                      <FaChartBar /> Dashboard
                    </Link>
                  </li>
                )}
              </ul>
            </nav>
            
            {/* User Actions */}
            <div className="user-actions">
              {/* Notifications */}
              {canShowDashboard && (
                <button 
                  className={`notification-btn ${showNotifications ? 'active' : ''}`}
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowMobileNav(false);
                  }}
                >
                  <FaBell />
                  {notificationCount > 0 && (
                    <span className="notification-count">
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </span>
                  )}
                </button>
              )}
              
              {/* User Avatar with Dropdown - Hidden on mobile */}
              {!isMobile && (
                <div className="user-avatar-container">
                  <UserAvatar 
                    user={formattedUser}
                    size="medium"
                    showName={false}  
                    showDropdown={canShowDashboard}
                    onSettingsClick={handleSettingsClick}
                    onCasherClick={handleCasherClick}
                    onProfileClick={handleProfileClick}
                    onSubscriptionClick={handleSubscriptionClick}
                    onLogoutClick={handleLogout}
                    className={canShowDashboard ? 'logged-in' : 'logged-out'}
                    onClick={handleUserAction}
                  />
                </div>
              )}
              
              {/* Mobile Login Button - Only shown when not logged in on mobile */}
              {isMobile && !canShowDashboard && (
                <button 
                  className="mobile-login-btn"
                  onClick={() => setShowAuthModal(true)}
                  aria-label="Login"
                >
                  <FaSignInAlt />
                  <span className="mobile-login-text">Login</span>
                </button>
              )}
              
              {/* Mobile Menu Toggle */}
              <button 
                ref={mobileMenuToggleRef}
                className={`mobile-menu-toggle ${showMobileNav ? 'active' : ''}`}
                onClick={handleMobileNavToggle}
              >
                <span></span>
                <span></span>
                <span></span>
              </button>
            </div>

            {/* Mobile Navigation */}
            <nav 
              ref={mobileNavRef}
              className={`mobile-nav ${showMobileNav ? 'active' : ''}`}
            >
              <div className="mobile-nav-content">
                <div className="mobile-nav-header">
                  <h3>Menu</h3>
                  <button className="close-btn" onClick={handleMobileNavToggle}>
                    <FaTimes />
                  </button>
                </div>
                
                <ul className="mobile-nav-links">
                  <li>
                    <a 
                      href="/" 
                      className={activeNav === 'home' ? 'active' : ''}
                      onClick={handleHomeClick}
                    >
                      <FaHome /> Home
                    </a>
                  </li>
                  <li>
                    <Link 
                      to="/education" 
                      className={activeNav === 'education' ? 'active' : ''}
                      onClick={() => handleNavLinkClick('education')}
                    >
                      <FaChartBar /> Library
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/education" 
                      className={activeNav === 'education' ? 'active' : ''}
                      onClick={() => handleNavLinkClick('education')}
                    >
                      <FaGraduationCap /> Academy
                    </Link>
                  </li>
                  <li>
                    <a 
                      href="#community" 
                      className={activeNav === 'community' ? 'active' : ''}
                      onClick={(e) => handleSectionClick('community', e)}
                    >
                      <FaUsers /> Community
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#tools"
                      onClick={(e) => handleSectionClick('tools', e)}
                    >
                      <FaTools /> Tools
                    </a>
                  </li>
                  
                  {canShowDashboard && (
                    <>
                      <li>
                        <Link 
                          to="/dashboard" 
                          className={activeNav === 'dashboard' ? 'active' : ''}
                          onClick={() => handleNavLinkClick('dashboard')}
                        >
                          <FaChartBar /> Dashboard
                        </Link>
                      </li>
                      <li>
                        <Link 
                          to="/profile" 
                          className={activeNav === 'profile' ? 'active' : ''}
                          onClick={() => handleNavLinkClick('profile')}
                        >
                          <FaUser /> Profile
                        </Link>
                      </li>
                    </>
                  )}
                  
                  {/* Login option in mobile nav for non-authenticated users */}
                  {!canShowDashboard && (
                    <li className="mobile-nav-login">
                      <button 
                        className="mobile-nav-login-btn"
                        onClick={handleMobileLoginClick}
                      >
                        <FaSignInAlt /> Login / Sign Up
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Notifications Panel */}
      {showNotifications && (
        <NotificationsPanel 
          onClose={handleNotificationPanelClose}
          user={formattedUser}
        />
      )}
      
      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)}
          initialForm="login"
        />
      )}
    </>
  );
}