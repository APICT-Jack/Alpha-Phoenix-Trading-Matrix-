// src/pages/AuthHomePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaUser, FaComments, FaBookOpen, FaGraduationCap, 
  FaLaptopCode, FaToolbox, FaCog, FaPlus, 
  FaChartLine, FaRobot, FaVideo, FaPodcast, 
  FaNewspaper, FaChartPie, FaCalendarAlt, FaGlobe,
  FaShieldAlt, FaCloudUploadAlt, FaArrowRight, FaTachometerAlt,
  FaDollarSign, FaCreditCard, FaChartBar, FaRss, FaUserFriends,
  FaFilm, FaTrash, FaEdit, FaGripVertical, FaSave, FaTimes
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import Container from '../components/ui/Container';
import Footer from '../components/layout/Footer';
import './AuthHomePage.css';

const AuthHomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showMoreFeatures, setShowMoreFeatures] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [availableFeatures, setAvailableFeatures] = useState([]);
  const [activeFeatures, setActiveFeatures] = useState([]);
  const [showAddPanel, setShowAddPanel] = useState(false);

  // Advanced tools array
  const advancedTools = [
    {
      id: 'scanner',
      icon: FaChartLine,
      title: 'Market Scanner',
      description: 'AI-powered market scanning for high-probability setups',
      color: '#3b82f6'
    },
    {
      id: 'ai_assistant',
      icon: FaRobot,
      title: 'AI Assistant',
      description: '24/7 trading assistant with real-time insights',
      color: '#10b981'
    },
    {
      id: 'live_trading',
      icon: FaVideo,
      title: 'Live Trading',
      description: 'Watch professional traders analyze markets',
      color: '#ef4444'
    },
    {
      id: 'podcasts',
      icon: FaPodcast,
      title: 'Trading Podcasts',
      description: 'Expert interviews and market analysis',
      color: '#8b5cf6'
    },
    {
      id: 'news',
      icon: FaNewspaper,
      title: 'Market News',
      description: 'Real-time news and economic calendar',
      color: '#f59e0b'
    },
    {
      id: 'analytics',
      icon: FaChartPie,
      title: 'Portfolio Analytics',
      description: 'Advanced portfolio performance metrics',
      color: '#ec489a'
    },
    {
      id: 'calendar',
      icon: FaCalendarAlt,
      title: 'Trading Calendar',
      description: 'Earnings reports and economic events',
      color: '#14b8a6'
    },
    {
      id: 'global_markets',
      icon: FaGlobe,
      title: 'Global Markets',
      description: 'Stocks, forex, crypto, and commodities',
      color: '#6b7280'
    },
    {
      id: 'risk_mgmt',
      icon: FaShieldAlt,
      title: 'Risk Management',
      description: 'Advanced risk analysis and position sizing',
      color: '#10b981'
    },
    {
      id: 'cloud_sync',
      icon: FaCloudUploadAlt,
      title: 'Cloud Sync',
      description: 'Sync your data across all devices',
      color: '#3b82f6'
    }
  ];

  // Helper function to render icons safely
  const renderIcon = (IconComponent, size = 24) => {
    if (!IconComponent) return null;
    return React.createElement(IconComponent, { size: size });
  };

  // All available features
  const allFeaturesList = [
    {
      id: 'profile',
      icon: FaUser,
      title: 'Profile',
      description: 'View and manage your personal information',
      path: '/profile',
      color: '#3b82f6',
      category: 'personal',
      defaultActive: true
    },
    {
      id: 'chat',
      icon: FaComments,
      title: 'Chat',
      description: 'Connect with traders and join discussions',
      path: '/chat',
      color: '#10b981',
      category: 'social',
      defaultActive: true
    },
    {
      id: 'library',
      icon: FaBookOpen,
      title: 'Library',
      description: 'Access trading books and research materials',
      path: '/education',
      color: '#8b5cf6',
      category: 'education',
      defaultActive: true
    },
    {
      id: 'academy',
      icon: FaGraduationCap,
      title: 'Academy',
      description: 'Structured courses from beginner to expert',
      path: '/education',
      color: '#f59e0b',
      category: 'education',
      defaultActive: true
    },
    {
      id: 'office',
      icon: FaLaptopCode,
      title: 'Office',
      description: 'Trading journal and performance analytics',
      path: '/dashboard',
      color: '#ef4444',
      category: 'tools',
      defaultActive: true
    },
    {
      id: 'tools',
      icon: FaToolbox,
      title: 'Tools',
      description: 'Advanced trading tools and indicators',
      path: '/tools',
      color: '#ec489a',
      category: 'tools',
      defaultActive: true
    },
    {
      id: 'settings',
      icon: FaCog,
      title: 'Settings',
      description: 'Customize your experience',
      path: '/profile/settings',
      color: '#6b7280',
      category: 'personal',
      defaultActive: true
    },
    {
      id: 'dashboard',
      icon: FaTachometerAlt,
      title: 'Dashboard',
      description: 'Real-time portfolio tracking and analytics',
      path: '/dashboard',
      color: '#14b8a6',
      category: 'analytics',
      defaultActive: false
    },
    {
      id: 'cashier',
      icon: FaDollarSign,
      title: 'Cashier',
      description: 'Manage deposits, withdrawals, and transactions',
      path: '/cashier',
      color: '#f59e0b',
      category: 'finance',
      defaultActive: false
    },
    {
      id: 'subscription',
      icon: FaCreditCard,
      title: 'Subscription',
      description: 'Manage your plan and billing',
      path: '/subscription',
      color: '#8b5cf6',
      category: 'finance',
      defaultActive: false
    },
    {
      id: 'charts',
      icon: FaChartBar,
      title: 'Charts',
      description: 'Advanced charting tools and technical analysis',
      path: '/charts',
      color: '#3b82f6',
      category: 'analytics',
      defaultActive: false
    },
    {
      id: 'news_feed',
      icon: FaRss,
      title: 'News',
      description: 'Latest market news and updates',
      path: '/news',
      color: '#10b981',
      category: 'information',
      defaultActive: false
    },
    {
      id: 'friends',
      icon: FaUserFriends,
      title: 'Friends',
      description: 'Connect and follow other traders',
      path: '/friends',
      color: '#ec489a',
      category: 'social',
      defaultActive: false
    },
    {
      id: 'videos',
      icon: FaFilm,
      title: 'Videos',
      description: 'Trading tutorials and market analysis videos',
      path: '/videos',
      color: '#ef4444',
      category: 'education',
      defaultActive: false
    }
  ];

  // Load user's custom layout from localStorage
  useEffect(() => {
    const savedLayout = localStorage.getItem(`user_layout_${user?.id || 'default'}`);
    if (savedLayout) {
      try {
        const parsed = JSON.parse(savedLayout);
        setActiveFeatures(parsed);
      } catch (e) {
        console.error('Error parsing saved layout:', e);
        const defaultActive = allFeaturesList.filter(f => f.defaultActive);
        setActiveFeatures(defaultActive);
      }
    } else {
      const defaultActive = allFeaturesList.filter(f => f.defaultActive);
      setActiveFeatures(defaultActive);
    }
  }, [user?.id]);

  // Update available features when active features change
  useEffect(() => {
    const activeIds = activeFeatures.map(f => f.id);
    setAvailableFeatures(allFeaturesList.filter(f => !activeIds.includes(f.id)));
  }, [activeFeatures]);

  const saveLayout = () => {
    localStorage.setItem(`user_layout_${user?.id || 'default'}`, JSON.stringify(activeFeatures));
    setIsEditing(false);
    setShowAddPanel(false);
  };

  const cancelEditing = () => {
    const savedLayout = localStorage.getItem(`user_layout_${user?.id || 'default'}`);
    if (savedLayout) {
      try {
        setActiveFeatures(JSON.parse(savedLayout));
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

  const handleCardClick = (path) => {
    if (!isEditing) {
      navigate(path);
    }
  };

  return (
    <div className="auth-homepage">
      <main className="auth-main-content">
        {/* Customize Panel */}
        {!isEditing && (
          <div className="customize-bar">
            <Container>
              <button 
                className="customize-btn"
                onClick={() => setIsEditing(true)}
              >
                <FaEdit /> Customize Dashboard
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
                  <FaEdit /> Editing Mode - Add, remove or reorder features
                </span>
                <div className="edit-buttons">
                  <button 
                    className="edit-btn add-btn"
                    onClick={() => setShowAddPanel(!showAddPanel)}
                  >
                    <FaPlus /> Add Features
                  </button>
                  <button 
                    className="edit-btn save-btn"
                    onClick={saveLayout}
                  >
                    <FaSave /> Save Changes
                  </button>
                  <button 
                    className="edit-btn cancel-btn"
                    onClick={cancelEditing}
                  >
                    <FaTimes /> Cancel
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
                  <div 
                    key={feature.id}
                    className="available-feature-card"
                    onClick={() => addFeature(feature)}
                  >
                    <div className="available-icon" style={{ color: feature.color }}>
                      {React.createElement(feature.icon, { size: 28 })}
                    </div>
                    <div className="available-info">
                      <h4>{feature.title}</h4>
                      <p>{feature.description}</p>
                    </div>
                    <button className="add-feature-btn">
                      <FaPlus />
                    </button>
                  </div>
                ))}
              </div>
            </Container>
          </div>
        )}

        {/* Main Features Section */}
        <section className="main-features-section">
          <Container>
            {/* Desktop View - Feature Cards */}
            <div className="features-grid desktop-features">
              {activeFeatures.map((feature, index) => (
                <div 
                  key={feature.id}
                  className={`feature-card ${isEditing ? 'editing-mode' : ''}`}
                  onClick={() => handleCardClick(feature.path)}
                >
                  <div className="feature-card-content">
                    {isEditing && (
                      <div className="card-controls">
                        <div className="drag-handle">
                          <FaGripVertical />
                        </div>
                        <button 
                          className="remove-card-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFeature(feature.id);
                          }}
                        >
                          <FaTrash />
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
                    <div 
                      className="feature-icon-wrapper"
                      style={{ background: `linear-gradient(135deg, ${feature.color} 0%, ${feature.color}dd 100%)` }}
                    >
                      {React.createElement(feature.icon, { size: 28 })}
                    </div>
                    <h3 className="feature-title">{feature.title}</h3>
                    <p className="feature-description">{feature.description}</p>
                    <div className="feature-link">
                      Access <FaArrowRight className="link-icon" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile View - Large Icons with Labels */}
            <div className="mobile-features-grid">
              {activeFeatures.map((feature) => (
                <div 
                  key={feature.id}
                  className={`mobile-feature-item ${isEditing ? 'editing-mode' : ''}`}
                  onClick={() => handleCardClick(feature.path)}
                >
                  {isEditing && (
                    <button 
                      className="mobile-remove-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFeature(feature.id);
                      }}
                    >
                      <FaTrash />
                    </button>
                  )}
                  <div 
                    className="mobile-feature-icon"
                    style={{ background: `linear-gradient(135deg, ${feature.color} 0%, ${feature.color}dd 100%)` }}
                  >
                    {React.createElement(feature.icon, { size: 32 })}
                  </div>
                  <span className="mobile-feature-label">{feature.title}</span>
                </div>
              ))}
              
              {/* Add More Button */}
              {isEditing ? (
                <div 
                  className="mobile-feature-item add-more"
                  onClick={() => setShowAddPanel(!showAddPanel)}
                >
                  <div className="mobile-feature-icon add-icon">
                    <FaPlus />
                  </div>
                  <span className="mobile-feature-label">Add</span>
                </div>
              ) : (
                <div 
                  className="mobile-feature-item add-more"
                  onClick={() => setIsEditing(true)}
                >
                  <div className="mobile-feature-icon add-icon">
                    <FaEdit />
                  </div>
                  <span className="mobile-feature-label">Edit</span>
                </div>
              )}
            </div>
          </Container>
        </section>

        {/* Advanced Trading Tools Section */}
        <section className="advanced-tools-section">
          <Container>
            <div className="section-header">
              <h2 className="section-title">Advanced Trading Tools</h2>
              <p className="section-subtitle">Professional-grade features to elevate your trading</p>
            </div>
            
            <div className="tools-grid">
              {(showMoreFeatures ? advancedTools : advancedTools.slice(0, 6)).map((tool) => (
                <div key={tool.id} className="tool-card">
                  <div className="tool-icon" style={{ color: tool.color }}>
                    {React.createElement(tool.icon, { size: 28 })}
                  </div>
                  <div className="tool-content">
                    <h4>{tool.title}</h4>
                    <p>{tool.description}</p>
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
                  <FaPlus /> Show More Tools <FaArrowRight />
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