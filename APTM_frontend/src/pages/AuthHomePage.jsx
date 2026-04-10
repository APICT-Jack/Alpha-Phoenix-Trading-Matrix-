// src/pages/AuthHomePage.jsx - Premium Edition with Wallpaper Support
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Icons from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useConnectionPanel } from '../context/ConnectionPanelContext';
import Container from '../components/ui/Container';
import Footer from '../components/layout/Footer';
import './AuthHomePage.css';

const AuthHomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openPanel } = useConnectionPanel();
  const [showMoreFeatures, setShowMoreFeatures] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [availableFeatures, setAvailableFeatures] = useState([]);
  const [activeFeatures, setActiveFeatures] = useState([]);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [showWallpaperModal, setShowWallpaperModal] = useState(false);
  const [wallpaperSettings, setWallpaperSettings] = useState({
    url: '',
    brightness: 0.6,
    blur: 0,
    overlay: 'linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 100%)'
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [longPressTimer, setLongPressTimer] = useState(null);
  
  // Predefined wallpapers
  const wallpapers = [
    { id: 1, name: 'macOS Default', url: 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?w=1920&h=1080&fit=crop', gradient: 'linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 100%)' },
    { id: 2, name: 'iOS Sunset', url: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=1920&h=1080&fit=crop', gradient: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 100%)' },
    { id: 3, name: 'Abstract Ocean', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&h=1080&fit=crop', gradient: 'linear-gradient(135deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 100%)' },
    { id: 4, name: 'Mountain Peak', url: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1920&h=1080&fit=crop', gradient: 'linear-gradient(135deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.45) 100%)' },
    { id: 5, name: 'Night City', url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920&h=1080&fit=crop', gradient: 'linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 100%)' },
    { id: 6, name: 'Forest Dreams', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&h=1080&fit=crop', gradient: 'linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 100%)' },
  ];

  // Helper function to safely render icons
  const renderIcon = (iconName, size = 24, className = '') => {
    if (!iconName || !Icons[iconName]) {
      console.warn(`Icon not found: ${iconName}`);
      return null;
    }
    const IconComponent = Icons[iconName];
    return React.createElement(IconComponent, { size: size, className: className });
  };

  // All available features with enhanced details
  const allFeaturesList = [
    {
      id: 'profile',
      iconName: 'FaUser',
      title: 'Profile Center',
      description: 'View and manage your personal information, track your progress, and customize your experience',
      detailedDescription: 'Complete profile management with achievement tracking, stats, and personalized settings',
      path: '/profile',
      color: '#3b82f6',
      category: 'personal',
      defaultActive: true,
      isPanel: false,
      badge: 'Essential'
    },
    {
      id: 'chat',
      iconName: 'FaComments',
      title: 'Trading Chat',
      description: 'Connect with traders, join discussions, and share real-time market insights',
      detailedDescription: 'Real-time messaging with professional traders, group chats, and direct messaging',
      path: '/chat',
      color: '#10b981',
      category: 'social',
      defaultActive: true,
      isPanel: false,
      badge: 'Popular'
    },
    {
      id: 'library',
      iconName: 'FaBookOpen',
      title: 'Resource Library',
      description: 'Access premium trading books, research materials, and educational content',
      detailedDescription: 'Curated library of 500+ trading resources, video tutorials, and expert guides',
      path: '/education',
      color: '#8b5cf6',
      category: 'education',
      defaultActive: true,
      isPanel: false,
      badge: 'Premium'
    },
    {
      id: 'academy',
      iconName: 'FaGraduationCap',
      title: 'Trading Academy',
      description: 'Structured courses from beginner to expert with certification',
      detailedDescription: 'Professional courses, live webinars, quizzes, and certification programs',
      path: '/education',
      color: '#f59e0b',
      category: 'education',
      defaultActive: true,
      isPanel: false,
      badge: 'New'
    },
    {
      id: 'office',
      iconName: 'FaLaptopCode',
      title: 'Trading Office',
      description: 'Advanced trading journal, performance analytics, and strategy backtesting',
      detailedDescription: 'Complete trading workspace with journal, analytics, and automated reporting',
      path: '/dashboard',
      color: '#ef4444',
      category: 'tools',
      defaultActive: true,
      isPanel: false,
      badge: 'Pro'
    },
    {
      id: 'tools',
      iconName: 'FaToolbox',
      title: 'Tool Suite',
      description: 'Advanced trading tools, indicators, and automated strategies',
      detailedDescription: '50+ professional tools including scanners, calculators, and strategy builders',
      path: '/tools',
      color: '#ec489a',
      category: 'tools',
      defaultActive: true,
      isPanel: false,
      badge: 'Essential'
    },
    {
      id: 'settings',
      iconName: 'FaCog',
      title: 'Preferences',
      description: 'Customize your experience, notification settings, and appearance',
      detailedDescription: 'Full customization of layout, themes, notifications, and privacy settings',
      path: '/profile/settings',
      color: '#6b7280',
      category: 'personal',
      defaultActive: true,
      isPanel: false
    },
    {
      id: 'dashboard',
      iconName: 'FaTachometerAlt',
      title: 'Analytics Hub',
      description: 'Real-time portfolio tracking, performance metrics, and advanced analytics',
      detailedDescription: 'Interactive dashboards with customizable widgets and real-time data',
      path: '/dashboard',
      color: '#14b8a6',
      category: 'analytics',
      defaultActive: false,
      isPanel: false,
      badge: 'New'
    },
    {
      id: 'cashier',
      iconName: 'FaDollarSign',
      title: 'Cashier',
      description: 'Manage deposits, withdrawals, and transaction history securely',
      detailedDescription: 'Secure payment processing, instant deposits, and withdrawal management',
      path: '/cashier',
      color: '#f59e0b',
      category: 'finance',
      defaultActive: false,
      isPanel: false,
      badge: 'Secure'
    },
    {
      id: 'subscription',
      iconName: 'FaCreditCard',
      title: 'Subscription Hub',
      description: 'Manage your plan, billing, and subscription benefits',
      detailedDescription: 'Flexible plans, payment methods, and subscription management',
      path: '/subscription',
      color: '#8b5cf6',
      category: 'finance',
      defaultActive: false,
      isPanel: false
    },
    {
      id: 'charts',
      iconName: 'FaChartBar',
      title: 'Advanced Charts',
      description: 'Professional charting tools with 100+ indicators',
      detailedDescription: 'Real-time charts, technical indicators, drawing tools, and pattern recognition',
      path: '/charts',
      color: '#3b82f6',
      category: 'analytics',
      defaultActive: false,
      isPanel: false,
      badge: 'Popular'
    },
    {
      id: 'news_feed',
      iconName: 'FaRss',
      title: 'Market News',
      description: 'Latest market news, analysis, and economic updates',
      detailedDescription: 'Real-time news feed, economic calendar, and market analysis',
      path: '/news',
      color: '#10b981',
      category: 'information',
      defaultActive: false,
      isPanel: false
    },
    {
      id: 'friends',
      iconName: 'FaUserFriends',
      title: 'Trading Network',
      description: 'Connect, follow, and collaborate with other traders',
      detailedDescription: 'Social network for traders, leaderboards, and collaborative features',
      path: '/friends',
      color: '#ec489a',
      category: 'social',
      defaultActive: false,
      isPanel: true,
      panelTab: 'followers',
      badge: 'Social'
    },
    {
      id: 'videos',
      iconName: 'FaFilm',
      title: 'Video Library',
      description: 'Trading tutorials, market analysis, and expert interviews',
      detailedDescription: '500+ video tutorials, live trading sessions, and expert interviews',
      path: '/videos',
      color: '#ef4444',
      category: 'education',
      defaultActive: false,
      isPanel: false,
      badge: 'Popular'
    },
    {
      id: 'signals',
      iconName: 'FaBell',
      title: 'Trading Signals',
      description: 'AI-powered trading signals and alerts',
      detailedDescription: 'Real-time trading signals, alerts, and automated notifications',
      path: '/signals',
      color: '#f59e0b',
      category: 'analytics',
      defaultActive: false,
      isPanel: false,
      badge: 'AI'
    },
    {
      id: 'copy_trading',
      iconName: 'FaCopy',
      title: 'Copy Trading',
      description: 'Copy successful traders automatically',
      detailedDescription: 'Follow and copy professional traders with risk management',
      path: '/copy-trading',
      color: '#8b5cf6',
      category: 'social',
      defaultActive: false,
      isPanel: false,
      badge: 'New'
    }
  ];

  // Enhanced advanced tools with more details
  const advancedTools = [
    {
      id: 'scanner',
      iconName: 'FaChartLine',
      title: 'Market Scanner Pro',
      description: 'AI-powered market scanning for high-probability setups across all markets',
      detailedDescription: 'Real-time scanning, pattern recognition, and instant alerts',
      color: '#3b82f6'
    },
    {
      id: 'ai_assistant',
      iconName: 'FaRobot',
      title: 'AI Trading Assistant',
      description: '24/7 intelligent trading assistant with real-time insights and recommendations',
      detailedDescription: 'Natural language processing, market analysis, and trade suggestions',
      color: '#10b981'
    },
    {
      id: 'live_trading',
      iconName: 'FaVideo',
      title: 'Live Trading Room',
      description: 'Watch professional traders analyze and execute trades in real-time',
      detailedDescription: 'Live streams, chat integration, and trade alerts',
      color: '#ef4444'
    },
    {
      id: 'podcasts',
      iconName: 'FaPodcast',
      title: 'Trading Podcasts',
      description: 'Expert interviews, market analysis, and trading psychology discussions',
      detailedDescription: 'Weekly podcasts, guest experts, and downloadable episodes',
      color: '#8b5cf6'
    },
    {
      id: 'news',
      iconName: 'FaNewspaper',
      title: 'News Aggregator',
      description: 'Real-time news from 100+ sources with sentiment analysis',
      detailedDescription: 'Customizable feed, sentiment scoring, and breaking news alerts',
      color: '#f59e0b'
    },
    {
      id: 'analytics',
      iconName: 'FaChartPie',
      title: 'Portfolio Analytics',
      description: 'Advanced portfolio performance metrics and risk analysis',
      detailedDescription: 'Performance attribution, risk metrics, and optimization tools',
      color: '#ec489a'
    },
    {
      id: 'calendar',
      iconName: 'FaCalendarAlt',
      title: 'Economic Calendar',
      description: 'Earnings reports, economic events, and data releases',
      detailedDescription: 'Interactive calendar, impact ratings, and custom alerts',
      color: '#14b8a6'
    },
    {
      id: 'global_markets',
      iconName: 'FaGlobe',
      title: 'Global Markets',
      description: 'Stocks, forex, crypto, commodities, and indices data',
      detailedDescription: 'Real-time quotes, historical data, and market heatmaps',
      color: '#6b7280'
    },
    {
      id: 'risk_mgmt',
      iconName: 'FaShieldAlt',
      title: 'Risk Management Suite',
      description: 'Advanced risk analysis, position sizing, and portfolio protection',
      detailedDescription: 'Value at Risk, stress testing, and automated risk controls',
      color: '#10b981'
    },
    {
      id: 'cloud_sync',
      iconName: 'FaCloudUploadAlt',
      title: 'Cloud Sync',
      description: 'Sync your data, settings, and preferences across all devices',
      detailedDescription: 'Real-time synchronization, backup, and multi-device support',
      color: '#3b82f6'
    },
    {
      id: 'backtesting',
      iconName: 'FaHistory',
      title: 'Strategy Backtester',
      description: 'Test and optimize trading strategies with historical data',
      detailedDescription: 'Advanced backtesting engine, optimization tools, and performance metrics',
      color: '#f59e0b'
    },
    {
      id: 'api_access',
      iconName: 'FaCode',
      title: 'API Access',
      description: 'Connect your own tools and algorithms via REST API',
      detailedDescription: 'Comprehensive API documentation, webhooks, and SDKs',
      color: '#8b5cf6'
    }
  ];

  // Load user's custom layout from localStorage
  useEffect(() => {
    const savedLayout = localStorage.getItem(`user_layout_${user?.id || 'default'}`);
    if (savedLayout) {
      try {
        const parsed = JSON.parse(savedLayout);
        const validatedFeatures = parsed.map(savedFeature => {
          const originalFeature = allFeaturesList.find(f => f.id === savedFeature.id);
          return originalFeature || savedFeature;
        });
        setActiveFeatures(validatedFeatures);
      } catch (e) {
        console.error('Error parsing saved layout:', e);
        const defaultActive = allFeaturesList.filter(f => f.defaultActive);
        setActiveFeatures(defaultActive);
      }
    } else {
      const defaultActive = allFeaturesList.filter(f => f.defaultActive);
      setActiveFeatures(defaultActive);
    }
    
    // Load wallpaper settings
    const savedWallpaper = localStorage.getItem('wallpaper_settings');
    if (savedWallpaper) {
      try {
        const parsed = JSON.parse(savedWallpaper);
        setWallpaperSettings(parsed);
        applyWallpaperSettings(parsed);
      } catch (e) {
        console.error('Error loading wallpaper:', e);
      }
    }
  }, [user?.id]);

  // Update available features when active features change
  useEffect(() => {
    const activeIds = activeFeatures.map(f => f.id);
    setAvailableFeatures(allFeaturesList.filter(f => !activeIds.includes(f.id)));
  }, [activeFeatures]);

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Apply wallpaper settings to CSS variables
  const applyWallpaperSettings = (settings) => {
    document.documentElement.style.setProperty('--wallpaper-url', `url(${settings.url})`);
    document.documentElement.style.setProperty('--wallpaper-brightness', settings.brightness);
    document.documentElement.style.setProperty('--wallpaper-blur', `${settings.blur}px`);
    document.documentElement.style.setProperty('--wallpaper-overlay', settings.overlay);
  };

  const saveLayout = () => {
    const layoutToSave = activeFeatures.map(feature => ({
      id: feature.id,
      iconName: feature.iconName,
      title: feature.title,
      description: feature.description,
      path: feature.path,
      color: feature.color,
      category: feature.category,
      defaultActive: feature.defaultActive,
      isPanel: feature.isPanel,
      panelTab: feature.panelTab,
      badge: feature.badge
    }));
    localStorage.setItem(`user_layout_${user?.id || 'default'}`, JSON.stringify(layoutToSave));
    setIsEditing(false);
    setShowAddPanel(false);
  };

  const cancelEditing = () => {
    const savedLayout = localStorage.getItem(`user_layout_${user?.id || 'default'}`);
    if (savedLayout) {
      try {
        const parsed = JSON.parse(savedLayout);
        const validatedFeatures = parsed.map(savedFeature => {
          const originalFeature = allFeaturesList.find(f => f.id === savedFeature.id);
          return originalFeature || savedFeature;
        });
        setActiveFeatures(validatedFeatures);
      } catch (e) {
        const defaultActive = allFeaturesList.filter(f => f.defaultActive);
        setActiveFeatures(defaultActive);
      }
    } else {
      const defaultActive = allFeaturesList.filter(f => f.defaultActive);
      setActiveFeatures(defaultActive);
    }
    setIsEditing(false);
    setShowAddPanel(false);
  };

  const addFeature = (feature) => {
    setActiveFeatures([...activeFeatures, feature]);
  };

  const removeFeature = (featureId) => {
    setActiveFeatures(activeFeatures.filter(f => f.id !== featureId));
  };

  const moveFeature = (index, direction) => {
    const newFeatures = [...activeFeatures];
    if (direction === 'up' && index > 0) {
      [newFeatures[index], newFeatures[index - 1]] = [newFeatures[index - 1], newFeatures[index]];
    } else if (direction === 'down' && index < newFeatures.length - 1) {
      [newFeatures[index], newFeatures[index + 1]] = [newFeatures[index + 1], newFeatures[index]];
    }
    setActiveFeatures(newFeatures);
  };

  const handleCardClick = (feature) => {
    if (isEditing) return;
    
    if (feature.isPanel) {
      openPanel(feature.panelTab || 'followers');
    } else {
      navigate(feature.path);
    }
  };

  const handleWallpaperChange = (wallpaper) => {
    const newSettings = {
      ...wallpaperSettings,
      url: wallpaper.url,
      overlay: wallpaper.gradient
    };
    setWallpaperSettings(newSettings);
    applyWallpaperSettings(newSettings);
    localStorage.setItem('wallpaper_settings', JSON.stringify(newSettings));
    setShowWallpaperModal(false);
  };

  const updateWallpaperSetting = (key, value) => {
    const newSettings = { ...wallpaperSettings, [key]: value };
    setWallpaperSettings(newSettings);
    applyWallpaperSettings(newSettings);
    localStorage.setItem('wallpaper_settings', JSON.stringify(newSettings));
  };

  // Mobile long press handler
  const handleTouchStart = (feature) => {
    if (!isMobile || isEditing) return;
    const timer = setTimeout(() => {
      setIsEditing(true);
    }, 500);
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  return (
    <div className={`auth-homepage ${isMobile ? 'mobile-mode' : 'desktop-mode'}`}>
      {/* Wallpaper Controls */}
      <div className="wallpaper-controls">
        <button 
          className="wallpaper-btn"
          onClick={() => setShowWallpaperModal(true)}
          title="Change Wallpaper"
        >
          {renderIcon('FaImage', 18)}
        </button>
        <button 
          className="wallpaper-btn"
          onClick={() => updateWallpaperSetting('brightness', Math.min(1, wallpaperSettings.brightness + 0.1))}
          title="Increase Brightness"
        >
          {renderIcon('FaSun', 16)}
        </button>
        <button 
          className="wallpaper-btn"
          onClick={() => updateWallpaperSetting('brightness', Math.max(0.3, wallpaperSettings.brightness - 0.1))}
          title="Decrease Brightness"
        >
          {renderIcon('FaMoon', 14)}
        </button>
      </div>

      {/* Wallpaper Modal */}
      {showWallpaperModal && (
        <div className="wallpaper-modal" onClick={() => setShowWallpaperModal(false)}>
          <div className="wallpaper-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="wallpaper-modal-header">
              <h3>Choose Wallpaper</h3>
              <button className="close-modal" onClick={() => setShowWallpaperModal(false)}>
                {renderIcon('FaTimes', 20)}
              </button>
            </div>
            <div className="wallpaper-grid">
              {wallpapers.map(wallpaper => (
                <div
                  key={wallpaper.id}
                  className={`wallpaper-option ${wallpaperSettings.url === wallpaper.url ? 'selected' : ''}`}
                  style={{ backgroundImage: `url(${wallpaper.url})` }}
                  onClick={() => handleWallpaperChange(wallpaper)}
                />
              ))}
            </div>
            <div className="wallpaper-settings">
              <div className="wallpaper-setting">
                <label>Brightness</label>
                <input
                  type="range"
                  min="0.3"
                  max="1"
                  step="0.01"
                  value={wallpaperSettings.brightness}
                  onChange={(e) => updateWallpaperSetting('brightness', parseFloat(e.target.value))}
                />
              </div>
              <div className="wallpaper-setting">
                <label>Blur Effect</label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={wallpaperSettings.blur}
                  onChange={(e) => updateWallpaperSetting('blur', parseInt(e.target.value))}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="auth-main-content">
        {/* Customize Panel */}
        {!isEditing && (
          <div className="customize-bar">
            <Container>
              <button 
                className="customize-btn"
                onClick={() => setIsEditing(true)}
              >
                {renderIcon('FaEdit', 16)} Customize Dashboard
              </button>
            </Container>
          </div>
        )}

        {/* Edit Mode Controls */}
        {isEditing && (
          <div className="edit-mode-bar">
            <Container>
              <div className="edit-controls">
                <span className="edit-title">
                  {renderIcon('FaEdit', 16)} Editing Mode - Customize your experience
                </span>
                <div className="edit-buttons">
                  <button 
                    className="edit-btn add-btn"
                    onClick={() => setShowAddPanel(!showAddPanel)}
                  >
                    {renderIcon('FaPlus', 14)} Add Features
                  </button>
                  <button 
                    className="edit-btn save-btn"
                    onClick={saveLayout}
                  >
                    {renderIcon('FaSave', 14)} Save Layout
                  </button>
                  <button 
                    className="edit-btn cancel-btn"
                    onClick={cancelEditing}
                  >
                    {renderIcon('FaTimes', 14)} Cancel
                  </button>
                </div>
              </div>
            </Container>
          </div>
        )}

        {/* Add Features Panel */}
        {showAddPanel && isEditing && (
          <div className="add-features-panel">
            <Container>
              <h3>Add New Features to Your Dashboard</h3>
              <div className="available-features-grid">
                {availableFeatures.map((feature) => (
                  <div 
                    key={feature.id}
                    className="available-feature-card"
                    onClick={() => addFeature(feature)}
                  >
                    <div className="available-icon" style={{ color: feature.color }}>
                      {renderIcon(feature.iconName, 32)}
                    </div>
                    <div className="available-info">
                      <h4>{feature.title}</h4>
                      <p>{feature.description}</p>
                    </div>
                    <button className="add-feature-btn">
                      {renderIcon('FaPlus', 16)}
                    </button>
                  </div>
                ))}
              </div>
            </Container>
          </div>
        )}

        {/* Welcome Section */}
        <div className="welcome-section">
          <Container>
            <div className="welcome-content">
              <h1 className="welcome-title">
                Welcome back, <span className="user-name">{user?.name || 'Trader'}!</span>
              </h1>
              <p className="welcome-description">
                Your premium trading dashboard is ready. Explore features, track performance, and elevate your trading.
              </p>
            </div>
          </Container>
        </div>

        {/* Main Features Section */}
        <section className="main-features-section">
          <Container>
            {/* Desktop View - Premium Feature Cards */}
            <div className="features-grid desktop-features">
              {activeFeatures.map((feature, index) => (
                <div 
                  key={feature.id}
                  className={`feature-card ${isEditing ? 'editing-mode' : ''} ${feature.isPanel ? 'panel-feature' : ''}`}
                  onClick={() => handleCardClick(feature)}
                >
                  <div className="feature-card-content">
                    {isEditing && (
                      <div className="card-controls">
                        <div className="drag-handle">
                          {renderIcon('FaGripVertical', 14)}
                        </div>
                        <button 
                          className="remove-card-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFeature(feature.id);
                          }}
                        >
                          {renderIcon('FaTrash', 12)}
                        </button>
                        <div className="move-buttons">
                          {index > 0 && (
                            <button 
                              className="move-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveFeature(index, 'up');
                              }}
                            >
                              ↑
                            </button>
                          )}
                          {index < activeFeatures.length - 1 && (
                            <button 
                              className="move-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveFeature(index, 'down');
                              }}
                            >
                              ↓
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    {feature.badge && !isEditing && (
                      <div className="feature-badge">{feature.badge}</div>
                    )}
                    <div 
                      className="feature-icon-wrapper"
                      style={{ background: `linear-gradient(135deg, ${feature.color} 0%, ${feature.color}dd 100%)` }}
                    >
                      {renderIcon(feature.iconName, 36)}
                    </div>
                    <h3 className="feature-title">{feature.title}</h3>
                    <p className="feature-description">{feature.detailedDescription || feature.description}</p>
                    <div className="feature-link">
                      {feature.isPanel ? 'Launch Panel' : 'Access Now'} {renderIcon('FaArrowRight', 12, 'link-icon')}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile View - iOS Home Screen Style */}
            <div className="mobile-features-grid">
              {activeFeatures.map((feature) => (
                <div 
                  key={feature.id}
                  className={`mobile-feature-item ${isEditing ? 'editing-mode' : ''} ${feature.isPanel ? 'panel-feature' : ''}`}
                  onClick={() => handleCardClick(feature)}
                  onTouchStart={() => handleTouchStart(feature)}
                  onTouchEnd={handleTouchEnd}
                >
                  {isEditing && (
                    <button 
                      className="mobile-remove-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFeature(feature.id);
                      }}
                    >
                      {renderIcon('FaTimes', 12)}
                    </button>
                  )}
                  <div 
                    className="mobile-feature-icon"
                    style={{ background: `linear-gradient(135deg, ${feature.color} 0%, ${feature.color}dd 100%)` }}
                  >
                    {renderIcon(feature.iconName, 32)}
                  </div>
                  <span className="mobile-feature-label">{feature.title}</span>
                  {feature.isPanel && (
                    <span className="panel-indicator">Panel</span>
                  )}
                </div>
              ))}
              
              {/* Edit/Customize Button */}
              {isEditing ? (
                <div 
                  className="mobile-feature-item add-more"
                  onClick={() => setShowAddPanel(!showAddPanel)}
                >
                  <div className="mobile-feature-icon add-icon">
                    {renderIcon('FaPlus', 32)}
                  </div>
                  <span className="mobile-feature-label">Add More</span>
                </div>
              ) : (
                <div 
                  className="mobile-feature-item add-more"
                  onClick={() => setIsEditing(true)}
                >
                  <div className="mobile-feature-icon add-icon">
                    {renderIcon('FaEdit', 32)}
                  </div>
                  <span className="mobile-feature-label">Customize</span>
                </div>
              )}
            </div>
          </Container>
        </section>

        {/* Advanced Trading Tools Section */}
        <section className="advanced-tools-section">
          <Container>
            <div className="section-header">
              <h2 className="section-title">Advanced Trading Suite</h2>
              <p className="section-subtitle">Professional-grade tools to elevate your trading strategy</p>
            </div>
            
            <div className="tools-grid">
              {(showMoreFeatures ? advancedTools : advancedTools.slice(0, 6)).map((tool) => (
                <div key={tool.id} className="tool-card">
                  <div className="tool-icon" style={{ color: tool.color }}>
                    {renderIcon(tool.iconName, 36)}
                  </div>
                  <div className="tool-content">
                    <h4>{tool.title}</h4>
                    <p>{tool.detailedDescription || tool.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {!showMoreFeatures && advancedTools.length > 6 && (
              <div className="show-more-container">
                <button 
                  className="show-more-btn"
                  onClick={() => setShowMoreFeatures(true)}
                >
                  {renderIcon('FaPlus', 14)} Explore All Tools {renderIcon('FaArrowRight', 12)}
                </button>
              </div>
            )}
          </Container>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AuthHomePage;