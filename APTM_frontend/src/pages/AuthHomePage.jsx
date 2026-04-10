// src/pages/AuthHomePage.jsx - Premium Edition with Activity Feed
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
  const [activeActivityTab, setActiveActivityTab] = useState('all');
  const [wallpaperSettings, setWallpaperSettings] = useState({
    url: '',
    brightness: 0.6,
    blur: 0,
    opacity: 0.8,
    overlay: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 100%)'
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Sample activity data
  const activities = {
    news: [
      { id: 1, type: 'news', title: 'Fed Announces Rate Decision', description: 'Interest rates remain unchanged at 5.25%', time: '2 hours ago', icon: 'FaNewspaper', color: '#3b82f6' },
      { id: 2, type: 'news', title: 'Bitcoin Surpasses $50,000', description: 'Cryptocurrency market sees major rally', time: '5 hours ago', icon: 'FaBitcoin', color: '#f59e0b' },
      { id: 3, type: 'news', title: 'Oil Prices Drop 5%', description: 'Supply concerns ease as production increases', time: '1 day ago', icon: 'FaOilCan', color: '#10b981' }
    ],
    trades: [
      { id: 4, type: 'trade', title: 'AAPL +2.5%', description: 'Apple stock hits new all-time high', time: '1 hour ago', icon: 'FaChartLine', color: '#34c759' },
      { id: 5, type: 'trade', title: 'TSLA -1.2%', description: 'Tesla shares dip after earnings report', time: '3 hours ago', icon: 'FaChartLine', color: '#ff3b30' },
      { id: 6, type: 'trade', title: 'Volume Alert: NVDA', description: 'Unusual options activity detected', time: '6 hours ago', icon: 'FaBell', color: '#f59e0b' }
    ],
    signals: [
      { id: 7, type: 'signal', title: 'Buy Signal: EUR/USD', description: 'Bullish divergence detected on 4H chart', time: '30 minutes ago', icon: 'FaSignal', color: '#34c759' },
      { id: 8, type: 'signal', title: 'Take Profit: BTC/USD', description: 'Target reached at $52,000', time: '2 hours ago', icon: 'FaDollarSign', color: '#34c759' },
      { id: 9, type: 'signal', title: 'Stop Loss Triggered', description: 'GBP/JPY hits stop loss at 188.50', time: '4 hours ago', icon: 'FaStop', color: '#ff3b30' }
    ]
  };

  const getAllActivities = () => {
    return [...activities.news, ...activities.trades, ...activities.signals].sort((a, b) => {
      const timeA = parseInt(a.time) || 0;
      const timeB = parseInt(b.time) || 0;
      return timeA - timeB;
    });
  };

  const getFilteredActivities = () => {
    if (activeActivityTab === 'all') return getAllActivities();
    if (activeActivityTab === 'news') return activities.news;
    if (activeActivityTab === 'trades') return activities.trades;
    if (activeActivityTab === 'signals') return activities.signals;
    return getAllActivities();
  };

  // Predefined wallpapers with theme support
  const wallpapers = [
    { id: 1, name: 'macOS Default', url: 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?w=1920&h=1080&fit=crop', gradient: 'linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 100%)' },
    { id: 2, name: 'iOS Sunset', url: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=1920&h=1080&fit=crop', gradient: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 100%)' },
    { id: 3, name: 'Abstract Ocean', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&h=1080&fit=crop', gradient: 'linear-gradient(135deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 100%)' },
    { id: 4, name: 'Mountain Peak', url: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1920&h=1080&fit=crop', gradient: 'linear-gradient(135deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.45) 100%)' },
    { id: 5, name: 'Night City', url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920&h=1080&fit=crop', gradient: 'linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 100%)' },
    { id: 6, name: 'Forest Dreams', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&h=1080&fit=crop', gradient: 'linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 100%)' }
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

  // All available features (same as before but with glass styling)
  const allFeaturesList = [
    {
      id: 'profile',
      iconName: 'FaUser',
      title: 'Profile Center',
      description: 'View and manage your personal information, track your progress',
      detailedDescription: 'Complete profile management with achievement tracking and stats',
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
      description: 'Connect with traders and join real-time discussions',
      detailedDescription: 'Real-time messaging with professional traders',
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
      description: 'Access premium trading books and research',
      detailedDescription: 'Curated library of 500+ trading resources',
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
      description: 'Structured courses from beginner to expert',
      detailedDescription: 'Professional courses and certification programs',
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
      description: 'Advanced trading journal and analytics',
      detailedDescription: 'Complete trading workspace with analytics',
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
      description: 'Advanced trading tools and indicators',
      detailedDescription: '50+ professional trading tools',
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
      description: 'Customize your experience and settings',
      detailedDescription: 'Full customization of layout and themes',
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
      description: 'Real-time portfolio tracking and analytics',
      detailedDescription: 'Interactive dashboards with real-time data',
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
      description: 'Manage deposits, withdrawals, and transactions',
      detailedDescription: 'Secure payment processing',
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
      description: 'Manage your plan and billing',
      detailedDescription: 'Flexible plans and subscription management',
      path: '/subscription',
      color: '#8b5cf6',
      category: 'finance',
      defaultActive: false,
      isPanel: false
    },
    {
      id: 'friends',
      iconName: 'FaUserFriends',
      title: 'Trading Network',
      description: 'Connect and collaborate with other traders',
      detailedDescription: 'Social network for traders',
      path: '/friends',
      color: '#ec489a',
      category: 'social',
      defaultActive: false,
      isPanel: true,
      panelTab: 'followers',
      badge: 'Social'
    }
  ];

  // Advanced tools
  const advancedTools = [
    {
      id: 'scanner',
      iconName: 'FaChartLine',
      title: 'Market Scanner Pro',
      description: 'AI-powered market scanning for high-probability setups',
      color: '#3b82f6'
    },
    {
      id: 'ai_assistant',
      iconName: 'FaRobot',
      title: 'AI Trading Assistant',
      description: '24/7 intelligent assistant with real-time insights',
      color: '#10b981'
    },
    {
      id: 'live_trading',
      iconName: 'FaVideo',
      title: 'Live Trading Room',
      description: 'Watch professional traders in real-time',
      color: '#ef4444'
    },
    {
      id: 'podcasts',
      iconName: 'FaPodcast',
      title: 'Trading Podcasts',
      description: 'Expert interviews and market analysis',
      color: '#8b5cf6'
    },
    {
      id: 'news',
      iconName: 'FaNewspaper',
      title: 'News Aggregator',
      description: 'Real-time news from 100+ sources',
      color: '#f59e0b'
    },
    {
      id: 'analytics',
      iconName: 'FaChartPie',
      title: 'Portfolio Analytics',
      description: 'Advanced performance metrics and risk analysis',
      color: '#ec489a'
    },
    {
      id: 'calendar',
      iconName: 'FaCalendarAlt',
      title: 'Economic Calendar',
      description: 'Earnings reports and economic events',
      color: '#14b8a6'
    },
    {
      id: 'global_markets',
      iconName: 'FaGlobe',
      title: 'Global Markets',
      description: 'Stocks, forex, crypto, and commodities',
      color: '#6b7280'
    },
    {
      id: 'risk_mgmt',
      iconName: 'FaShieldAlt',
      title: 'Risk Management Suite',
      description: 'Advanced risk analysis and position sizing',
      color: '#10b981'
    },
    {
      id: 'cloud_sync',
      iconName: 'FaCloudUploadAlt',
      title: 'Cloud Sync',
      description: 'Sync your data across all devices',
      color: '#3b82f6'
    }
  ];

  // Load saved layout
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

  useEffect(() => {
    const activeIds = activeFeatures.map(f => f.id);
    setAvailableFeatures(allFeaturesList.filter(f => !activeIds.includes(f.id)));
  }, [activeFeatures]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const applyWallpaperSettings = (settings) => {
    document.documentElement.style.setProperty('--wallpaper-url', `url(${settings.url})`);
    document.documentElement.style.setProperty('--wallpaper-brightness', settings.brightness);
    document.documentElement.style.setProperty('--wallpaper-blur', `${settings.blur}px`);
    document.documentElement.style.setProperty('--wallpaper-opacity', settings.opacity);
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

  const handleActivityClick = (activity) => {
    if (activity.type === 'news') {
      navigate('/news');
    } else if (activity.type === 'trades') {
      navigate('/dashboard');
    } else if (activity.type === 'signals') {
      navigate('/tools');
    }
  };

  return (
    <div className={`auth-homepage ${isMobile ? 'mobile-mode' : 'desktop-mode'}`}>
      {/* Wallpaper Controls */}
      <div className="wallpaper-controls">
        <button className="wallpaper-btn" onClick={() => setShowWallpaperModal(true)}>
          {renderIcon('FaImage', 18)}
        </button>
        <button className="wallpaper-btn" onClick={() => updateWallpaperSetting('brightness', Math.min(1, wallpaperSettings.brightness + 0.1))}>
          {renderIcon('FaSun', 16)}
        </button>
        <button className="wallpaper-btn" onClick={() => updateWallpaperSetting('brightness', Math.max(0.3, wallpaperSettings.brightness - 0.1))}>
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
                <input type="range" min="0.3" max="1" step="0.01" value={wallpaperSettings.brightness} onChange={(e) => updateWallpaperSetting('brightness', parseFloat(e.target.value))} />
              </div>
              <div className="wallpaper-setting">
                <label>Blur Effect</label>
                <input type="range" min="0" max="20" step="1" value={wallpaperSettings.blur} onChange={(e) => updateWallpaperSetting('blur', parseInt(e.target.value))} />
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
              <button className="customize-btn" onClick={() => setIsEditing(true)}>
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
                <span className="edit-title">{renderIcon('FaEdit', 16)} Editing Mode - Customize your experience</span>
                <div className="edit-buttons">
                  <button className="edit-btn add-btn" onClick={() => setShowAddPanel(!showAddPanel)}>
                    {renderIcon('FaPlus', 14)} Add Features
                  </button>
                  <button className="edit-btn save-btn" onClick={saveLayout}>
                    {renderIcon('FaSave', 14)} Save Layout
                  </button>
                  <button className="edit-btn cancel-btn" onClick={cancelEditing}>
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
              <h3>Add New Features</h3>
              <div className="available-features-grid">
                {availableFeatures.map((feature) => (
                  <div key={feature.id} className="available-feature-card" onClick={() => addFeature(feature)}>
                    <div className="available-icon" style={{ color: feature.color }}>
                      {renderIcon(feature.iconName, 32)}
                    </div>
                    <div className="available-info">
                      <h4>{feature.title}</h4>
                      <p>{feature.description}</p>
                    </div>
                    <button className="add-feature-btn">{renderIcon('FaPlus', 16)}</button>
                  </div>
                ))}
              </div>
            </Container>
          </div>
        )}

        {/* Hero Welcome Section */}
        <div className="welcome-section">
          <Container>
            <div className="welcome-content">
              <h1 className="welcome-title">
                Welcome back, <span className="user-name">{user?.name || 'Trader'}</span>
              </h1>
              <p className="welcome-description">
                Your premium trading dashboard is ready. Track performance, discover insights, and elevate your trading.
              </p>
            </div>
          </Container>
        </div>

        {/* Recent Activity Section - NEW */}
        <div className="recent-activity-section">
          <Container>
            <div className="activity-container">
              <div className="section-header">
                <h2>Recent Activity</h2>
                <div className="activity-tabs">
                  <button className={`activity-tab ${activeActivityTab === 'all' ? 'active' : ''}`} onClick={() => setActiveActivityTab('all')}>All</button>
                  <button className={`activity-tab ${activeActivityTab === 'news' ? 'active' : ''}`} onClick={() => setActiveActivityTab('news')}>News</button>
                  <button className={`activity-tab ${activeActivityTab === 'trades' ? 'active' : ''}`} onClick={() => setActiveActivityTab('trades')}>Trades</button>
                  <button className={`activity-tab ${activeActivityTab === 'signals' ? 'active' : ''}`} onClick={() => setActiveActivityTab('signals')}>Signals</button>
                </div>
              </div>
              <div className="activity-list">
                {getFilteredActivities().map((activity) => (
                  <div key={activity.id} className="activity-item" onClick={() => handleActivityClick(activity)}>
                    <div className="activity-icon" style={{ background: `linear-gradient(135deg, ${activity.color} 0%, ${activity.color}dd 100%)` }}>
                      {renderIcon(activity.icon, 24)}
                    </div>
                    <div className="activity-content">
                      <div className="activity-title">{activity.title}</div>
                      <div className="activity-description">{activity.description}</div>
                    </div>
                    <div className="activity-time">{activity.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </div>

        {/* Main Features Section */}
        <section className="main-features-section">
          <Container>
            {/* Desktop View */}
            <div className="features-grid desktop-features">
              {activeFeatures.map((feature, index) => (
                <div key={feature.id} className={`feature-card ${isEditing ? 'editing-mode' : ''} ${feature.isPanel ? 'panel-feature' : ''}`} onClick={() => handleCardClick(feature)}>
                  <div className="feature-card-content">
                    {isEditing && (
                      <div className="card-controls">
                        <button className="remove-card-btn" onClick={(e) => { e.stopPropagation(); removeFeature(feature.id); }}>
                          {renderIcon('FaTrash', 12)}
                        </button>
                        <div className="move-buttons">
                          {index > 0 && <button className="move-btn" onClick={(e) => { e.stopPropagation(); moveFeature(index, 'up'); }}>↑</button>}
                          {index < activeFeatures.length - 1 && <button className="move-btn" onClick={(e) => { e.stopPropagation(); moveFeature(index, 'down'); }}>↓</button>}
                        </div>
                      </div>
                    )}
                    {feature.badge && !isEditing && <div className="feature-badge">{feature.badge}</div>}
                    <div className="feature-icon-wrapper">
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

            {/* Mobile View */}
            <div className="mobile-features-grid">
              {activeFeatures.map((feature) => (
                <div key={feature.id} className={`mobile-feature-item ${isEditing ? 'editing-mode' : ''} ${feature.isPanel ? 'panel-feature' : ''}`} onClick={() => handleCardClick(feature)}>
                  {isEditing && (
                    <button className="mobile-remove-btn" onClick={(e) => { e.stopPropagation(); removeFeature(feature.id); }}>
                      {renderIcon('FaTimes', 12)}
                    </button>
                  )}
                  <div className="mobile-feature-icon">
                    {renderIcon(feature.iconName, 32)}
                  </div>
                  <span className="mobile-feature-label">{feature.title}</span>
                  {feature.isPanel && <span className="panel-indicator">Panel</span>}
                </div>
              ))}
              {isEditing ? (
                <div className="mobile-feature-item add-more" onClick={() => setShowAddPanel(!showAddPanel)}>
                  <div className="mobile-feature-icon add-icon">{renderIcon('FaPlus', 32)}</div>
                  <span className="mobile-feature-label">Add More</span>
                </div>
              ) : (
                <div className="mobile-feature-item add-more" onClick={() => setIsEditing(true)}>
                  <div className="mobile-feature-icon add-icon">{renderIcon('FaEdit', 32)}</div>
                  <span className="mobile-feature-label">Customize</span>
                </div>
              )}
            </div>
          </Container>
        </section>

        {/* Advanced Tools Section */}
        <section className="advanced-tools-section">
          <Container>
            <div className="section-header">
              <h2 className="section-title">Advanced Trading Suite</h2>
              <p className="section-subtitle">Professional-grade tools to elevate your strategy</p>
            </div>
            <div className="tools-grid">
              {(showMoreFeatures ? advancedTools : advancedTools.slice(0, 6)).map((tool) => (
                <div key={tool.id} className="tool-card">
                  <div className="tool-icon" style={{ color: tool.color }}>{renderIcon(tool.iconName, 36)}</div>
                  <div className="tool-content">
                    <h4>{tool.title}</h4>
                    <p>{tool.description}</p>
                  </div>
                </div>
              ))}
            </div>
            {!showMoreFeatures && advancedTools.length > 6 && (
              <div className="show-more-container">
                <button className="show-more-btn" onClick={() => setShowMoreFeatures(true)}>
                  {renderIcon('FaPlus', 14)} Explore All Tools {renderIcon('FaArrowRight', 12)}
                </button>
              </div>
            )}
          </Container>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AuthHomePage;