// src/pages/AuthHomePage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaUser, FaComments, FaBookOpen, FaGraduationCap, 
  FaLaptopCode, FaToolbox, FaCog, FaPlus, 
  FaChartLine, FaRobot, FaVideo, FaPodcast, 
  FaNewspaper, FaChartPie, FaCalendarAlt, FaGlobe,
  FaShieldAlt, FaCloudUploadAlt, FaArrowRight
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import Container from '../components/ui/Container';
import Footer from '../components/layout/Footer';
import ThemeToggle from '../components/ui/ThemeToggle';
import FloatingAssistant from '../components/ui/FloatingAssistant';
import './AuthHomePage.css';

const AuthHomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showMoreFeatures, setShowMoreFeatures] = useState(false);

  // Main features for authenticated users
  const mainFeatures = [
    {
      id: 'profile',
      icon: <FaUser />,
      title: 'Profile',
      description: 'View and manage your personal information',
      path: '/profile',
      color: '#3b82f6',
      mobileIcon: true
    },
    {
      id: 'chat',
      icon: <FaComments />,
      title: 'Chat',
      description: 'Connect with traders and join discussions',
      path: '/chat',
      color: '#10b981',
      mobileIcon: true
    },
    {
      id: 'library',
      icon: <FaBookOpen />,
      title: 'Library',
      description: 'Access trading books and research materials',
      path: '/education',
      color: '#8b5cf6',
      mobileIcon: true
    },
    {
      id: 'academy',
      icon: <FaGraduationCap />,
      title: 'Academy',
      description: 'Structured courses from beginner to expert',
      path: '/education',
      color: '#f59e0b',
      mobileIcon: true
    },
    {
      id: 'office',
      icon: <FaLaptopCode />,
      title: 'Office',
      description: 'Trading journal and performance analytics',
      path: '/dashboard',
      color: '#ef4444',
      mobileIcon: true
    },
    {
      id: 'tools',
      icon: <FaToolbox />,
      title: 'Tools',
      description: 'Advanced trading tools and indicators',
      path: '/tools',
      color: '#ec489a',
      mobileIcon: true
    },
    {
      id: 'settings',
      icon: <FaCog />,
      title: 'Settings',
      description: 'Customize your experience',
      path: '/profile/settings',
      color: '#6b7280',
      mobileIcon: true
    }
  ];

  // Additional advanced tools
  const advancedTools = [
    {
      icon: <FaChartLine />,
      title: 'Market Scanner',
      description: 'AI-powered market scanning for high-probability setups',
      color: '#3b82f6'
    },
    {
      icon: <FaRobot />,
      title: 'AI Assistant',
      description: '24/7 trading assistant with real-time insights',
      color: '#10b981'
    },
    {
      icon: <FaVideo />,
      title: 'Live Trading',
      description: 'Watch professional traders analyze markets',
      color: '#ef4444'
    },
    {
      icon: <FaPodcast />,
      title: 'Trading Podcasts',
      description: 'Expert interviews and market analysis',
      color: '#8b5cf6'
    },
    {
      icon: <FaNewspaper />,
      title: 'Market News',
      description: 'Real-time news and economic calendar',
      color: '#f59e0b'
    },
    {
      icon: <FaChartPie />,
      title: 'Portfolio Analytics',
      description: 'Advanced portfolio performance metrics',
      color: '#ec489a'
    },
    {
      icon: <FaCalendarAlt />,
      title: 'Trading Calendar',
      description: 'Earnings reports and economic events',
      color: '#14b8a6'
    },
    {
      icon: <FaGlobe />,
      title: 'Global Markets',
      description: 'Stocks, forex, crypto, and commodities',
      color: '#6b7280'
    },
    {
      icon: <FaShieldAlt />,
      title: 'Risk Management',
      description: 'Advanced risk analysis and position sizing',
      color: '#10b981'
    },
    {
      icon: <FaCloudUploadAlt />,
      title: 'Cloud Sync',
      description: 'Sync your data across all devices',
      color: '#3b82f6'
    }
  ];

  const handleCardClick = (path) => {
    navigate(path);
  };

  return (
    <div className="auth-homepage">
      <main className="auth-main-content">
        {/* Welcome Section */}
        <section className="welcome-section">
          <Container>
            <div className="welcome-content">
              <h1 className="welcome-title">
                Welcome back, <span className="user-name">{user?.name || 'Trader'}!</span>
              </h1>
              <p className="welcome-description">
                Ready to continue your trading journey? Access your tools, connect with the community, and track your progress.
              </p>
            </div>
          </Container>
        </section>

        {/* Main Features Section */}
        <section className="main-features-section">
          <Container>
            <div className="section-header">
              <h2 className="section-title">Your Trading Hub</h2>
              <p className="section-subtitle">Quick access to all your essential tools and resources</p>
            </div>

            {/* Desktop View - Feature Cards */}
            <div className="features-grid desktop-features">
              {mainFeatures.map((feature) => (
                <div 
                  key={feature.id}
                  className="feature-card"
                  onClick={() => handleCardClick(feature.path)}
                >
                  <div className="feature-card-content">
                    <div 
                      className="feature-icon-wrapper"
                      style={{ background: `linear-gradient(135deg, ${feature.color} 0%, ${feature.color}dd 100%)` }}
                    >
                      {feature.icon}
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
              {mainFeatures.map((feature) => (
                <div 
                  key={feature.id}
                  className="mobile-feature-item"
                  onClick={() => handleCardClick(feature.path)}
                >
                  <div 
                    className="mobile-feature-icon"
                    style={{ background: `linear-gradient(135deg, ${feature.color} 0%, ${feature.color}dd 100%)` }}
                  >
                    {feature.icon}
                  </div>
                  <span className="mobile-feature-label">{feature.title}</span>
                </div>
              ))}
              
              {/* Add More Button */}
              <div 
                className="mobile-feature-item add-more"
                onClick={() => setShowMoreFeatures(!showMoreFeatures)}
              >
                <div className="mobile-feature-icon add-icon">
                  <FaPlus />
                </div>
                <span className="mobile-feature-label">More</span>
              </div>
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
              {(showMoreFeatures ? advancedTools : advancedTools.slice(0, 6)).map((tool, index) => (
                <div key={index} className="tool-card">
                  <div className="tool-icon" style={{ color: tool.color }}>
                    {tool.icon}
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

      {/* Floating Buttons */}
      <div className="floating-buttons">
        <ThemeToggle />
        <FloatingAssistant />
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AuthHomePage;