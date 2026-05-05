// src/pages/auth-home/index.jsx - Updated with hooks
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { userStatusService } from '../../services/userStatusService';
import ConnectionPanel from '../../components/navigation/ConnectionPanel';
import SearchSection from './components/SearchSection';
import ActivitySection from './components/ActivitySection';
import FeedSection from './components/FeedSection';
import { useWallpaper } from './hooks';
import * as Icons from 'react-icons/fa';
import './AuthHomePage.css';

const AuthHomePage = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { darkMode } = useTheme();
  
  // Hooks
  const {
    showWallpaperModal,
    activeWallpaperCategory,
    wallpaperSettings,
    setShowWallpaperModal,
    setActiveWallpaperCategory,
    updateWallpaper,
    handleWallpaperSelect,
    getFilteredWallpapers,
    wallpaperCategories
  } = useWallpaper();

  // State
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showConnectionPanel, setShowConnectionPanel] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState({});

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize user status service
  useEffect(() => {
    if (currentUser && userStatusService) {
      userStatusService.init(currentUser, {
        onOnlineUsers: (users) => setOnlineUsers(users),
        onUserOnline: (data) => setOnlineUsers(prev => ({ ...prev, [data.userId]: { online: true, ...data.userData } })),
        onUserOffline: (data) => setOnlineUsers(prev => { const u = { ...prev }; delete u[data.userId]; return u; })
      });
    }
    return () => {
      if (userStatusService) {
        userStatusService.offUserOnline();
        userStatusService.offUserOffline();
        userStatusService.offUsersOnline();
      }
    };
  }, [currentUser]);
 useEffect(() => {
  const handleScroll = () => {
    const header = document.querySelector('.sticky-header');
    if (header) {
      if (window.scrollY > 10) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }
  };
  
  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);
  const renderIcon = (name, size = 16) => {
    const Icon = Icons[name];
    return Icon ? <Icon size={size} /> : null;
  };

  // Bottom navigation items
  const bottomNavItems = [
    { id: 'home', icon: 'FaHome', label: 'Home', action: () => { window.scrollTo({ top: 0, behavior: 'smooth' }); } },
    { id: 'search', icon: 'FaSearch', label: 'Search', action: () => document.querySelector('.search-input')?.focus() },
    { id: 'create', icon: 'FaPlusSquare', label: 'Create', action: () => navigate('/create-post') },
    { id: 'activity', icon: 'FaHeart', label: 'Activity', action: () => document.querySelector('.mobile-activity-panel')?.classList.add('open') },
    { id: 'profile', icon: 'FaUser', label: 'Profile', action: () => navigate(`/profile/${currentUser?.id}`) },
  ];

  const toggleMobileActivity = () => {
    const panel = document.querySelector('.mobile-activity-panel');
    if (panel) panel.classList.toggle('open');
  };

  return (
    <div className="auth-homepage">
      {/* Connection Panel Overlay */}
      {showConnectionPanel && (
        <div className="connection-panel-overlay" onClick={() => setShowConnectionPanel(false)}>
          <div className="connection-panel-wrapper" onClick={e => e.stopPropagation()}>
            <ConnectionPanel initialTab="followers" onClose={() => setShowConnectionPanel(false)} embedded={false} />
          </div>
        </div>
      )}

      {/* Wallpaper Button */}
      <div className="wallpaper-controls">
        <button className="wallpaper-btn" onClick={() => setShowWallpaperModal(true)} title="Change wallpaper">
          {renderIcon('FaImage', 14)}
        </button>
      </div>

      {/* Wallpaper Modal */}
      {showWallpaperModal && (
        <div className="wallpaper-modal" onClick={() => setShowWallpaperModal(false)}>
          <div className="wallpaper-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Choose Wallpaper</h3>
              <button className="close-modal" onClick={() => setShowWallpaperModal(false)}>
                {renderIcon('FaTimes', 16)}
              </button>
            </div>
            
            <div className="wallpaper-categories">
              {wallpaperCategories.map(cat => (
                <button 
                  key={cat.id} 
                  className={`category-chip ${activeWallpaperCategory === cat.id ? 'active' : ''}`} 
                  onClick={() => setActiveWallpaperCategory(cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            
            <div className="wallpaper-grid">
              {getFilteredWallpapers().map(w => (
                <div 
                  key={w.id} 
                  className={`wallpaper-option ${wallpaperSettings.url === w.url ? 'selected' : ''}`} 
                  style={{ backgroundImage: `url(${w.url})` }} 
                  onClick={() => handleWallpaperSelect(w)}
                >
                  <span className="wallpaper-name">{w.name}</span>
                  {wallpaperSettings.url === w.url && <span className="wallpaper-check">✓</span>}
                </div>
              ))}
            </div>
            
            <div className="wallpaper-settings">
              <div className="setting">
                <label>Brightness</label>
                <input 
                  type="range" 
                  min="0.2" 
                  max="1" 
                  step="0.01" 
                  value={wallpaperSettings.brightness} 
                  onChange={e => updateWallpaper('brightness', parseFloat(e.target.value))} 
                />
              </div>
              <div className="setting">
                <label>Blur</label>
                <input 
                  type="range" 
                  min="0" 
                  max="15" 
                  step="1" 
                  value={wallpaperSettings.blur} 
                  onChange={e => updateWallpaper('blur', parseInt(e.target.value))} 
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Header with Search Section */}
      <header className="sticky-header">
        <SearchSection />
      </header>

      {/* Main Content Area */}
      <div className="main-content-area">
        <div className="feed-column">
          <FeedSection currentUser={currentUser} onlineUsers={onlineUsers} />
        </div>
        {!isMobile && <ActivitySection currentUser={currentUser} onlineUsers={onlineUsers} />}
      </div>

      {/* Mobile Activity Panel */}
      {isMobile && (
        <div className="mobile-activity-panel">
          <div className="mobile-activity-handle" onClick={toggleMobileActivity} />
          <div className="mobile-activity-header">
            <h3>Activity</h3>
            <button onClick={toggleMobileActivity}>
              {renderIcon('FaTimes', 18)}
            </button>
          </div>
          <ActivitySection currentUser={currentUser} onlineUsers={onlineUsers} isMobile={true} />
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <div className="nav-items">
          {bottomNavItems.map(item => (
            <button key={item.id} className="nav-item" onClick={item.action}>
              <div className="nav-icon">{renderIcon(item.icon, 22)}</div>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default AuthHomePage;