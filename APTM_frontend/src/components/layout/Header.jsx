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
  FaSignInAlt,
  FaComments,
  FaBook,
  FaDollarSign,
  FaCog
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import AuthModal from '../auth/AuthModal';
import UserAvatar from './UserAvatar';
import './Header.css';

// Constants for API URLs
const API_URL = import.meta.env.VITE_API_URL || 
                (import.meta.env.PROD ? `${window.location.origin}/api` : 'http://localhost:5000/api');

// Notification service
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

// NotificationsPanel Component
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
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showHeader, setShowHeader] = useState(true);
  
  const mobileNavRef = useRef(null);
  const mobileMenuToggleRef = useRef(null);
  const headerRef = useRef(null);

  // Mobile navigation items for dropdown
  const mobileNavItems = [
    { id: 'home', label: 'Home', icon: FaHome, path: '/' },
    { id: 'dashboard', label: 'Dashboard', icon: FaChartBar, path: '/dashboard' },
    { id: 'profile', label: 'Profile', icon: FaUser, path: '/profile' },
    { id: 'chat', label: 'Chat', icon: FaComments, path: '/chat' },
    { id: 'education', label: 'Academy', icon: FaGraduationCap, path: '/education' },
    { id: 'tools', label: 'Tools', icon: FaTools, path: '/tools' },
    { id: 'library', label: 'Library', icon: FaBook, path: '/education' },
    { id: 'cashier', label: 'Cashier', icon: FaDollarSign, path: '/cashier' },
    { id: 'settings', label: 'Settings', icon: FaCog, path: '/profile/settings' }
  ];

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Handle scroll behavior for mobile
  useEffect(() => {
    if (!isMobile) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (showMobileNav) {
        setShowHeader(true);
        return;
      }

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowHeader(false);
      } else {
        setShowHeader(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY, isMobile, showMobileNav]);

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
    } else if (path === '/chat') {
      setActiveNav('chat');
    } else if (path === '/tools') {
      setActiveNav('tools');
    } else if (path === '/cashier') {
      setActiveNav('cashier');
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
        setShowHeader(true);
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
      if (showMobileNav) {
        setShowMobileNav(false);
        setShowHeader(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showMobileNav]);

  // Handle body scroll when mobile nav is open
  useEffect(() => {
    if (showMobileNav) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${window.scrollY}px`;
    } else {
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
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

  const handleMobileNavToggle = () => {
    setShowMobileNav(prev => !prev);
    setShowNotifications(false);
    setShowHeader(true);
  };

  const handleNavLinkClick = (navItem) => {
    setActiveNav(navItem.id);
    setShowMobileNav(false);
    setShowHeader(true);
    if (navItem.path) {
      navigate(navItem.path);
    }
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerHeight = headerRef.current?.offsetHeight || 0;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - headerHeight - 20;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleHomeClick = (e) => {
    e.preventDefault();
    setActiveNav('home');
    setShowMobileNav(false);
    setShowHeader(true);
    
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
    setShowHeader(true);
    
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
    navigate('/cashier');
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

  const handleMobileLoginClick = () => {
    setShowAuthModal(true);
    setShowMobileNav(false);
    setShowHeader(true);
  };

  const getFormattedUser = () => {
    if (!user) return null;
    
    return {
      ...user,
      avatar: user.avatar || user.avatarUrl || null,
      name: user.name || user.displayName || 'User',
      username: user.username || user.userName || 'user'
    };
  };

  const formattedUser = getFormattedUser();
  const headerClasses = `main-header ${!showHeader && isMobile ? 'header-hidden' : ''} ${showMobileNav ? 'mobile-nav-open' : ''}`;

  return (
    <>
      <header ref={headerRef} className={headerClasses}>
        <div className="container">
          <div className="header-content">
            {/* Logo - Always visible */}
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
            
            {/* Desktop Navigation - REMOVED */}
            
            {/* User Actions - Only Notifications and Avatar */}
            <div className="user-actions">
              {/* Notifications - Transparent background */}
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
              
              {/* User Avatar - Desktop only */}
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
              
              {/* Mobile Menu Toggle */}
              <button 
                ref={mobileMenuToggleRef}
                className={`mobile-menu-toggle ${showMobileNav ? 'active' : ''}`}
                onClick={handleMobileNavToggle}
                aria-label="Toggle menu"
              >
                <span></span>
                <span></span>
                <span></span>
              </button>
            </div>

            {/* Mobile Navigation Dropdown - Shows all tabs */}
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
                  {mobileNavItems.map((item) => (
                    <li key={item.id}>
                      <button 
                        className={activeNav === item.id ? 'active' : ''}
                        onClick={() => handleNavLinkClick(item)}
                      >
                        <item.icon /> {item.label}
                      </button>
                    </li>
                  ))}
                  
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