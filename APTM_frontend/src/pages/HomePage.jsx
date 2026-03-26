// src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaChartLine, FaGraduationCap, FaComments, FaToolbox, 
  FaTachometerAlt, FaCog, FaPlus, FaRobot, FaBookOpen, 
  FaUsers, FaChartBar, FaCalendarAlt, FaGlobe, FaBell,
  FaShieldAlt, FaCloudUploadAlt, FaDownload, FaShareAlt,
  FaStar, FaFire, FaRocket, FaRegLightbulb, FaHandHoldingUsd,
  FaVideo, FaPodcast, FaNewspaper, FaUserTie, FaChartPie,
  FaAward, FaTrophy, FaCertificate, FaLaptopCode, FaMobileAlt,
  FaDatabase, FaLock, FaKey, FaSync, FaArrowRight
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import Container from '../components/ui/Container';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [hoveredCard, setHoveredCard] = useState(null);
  const [activeTab, setActiveTab] = useState('features');
  const [stats, setStats] = useState({
    users: 0,
    courses: 0,
    trades: 0,
    countries: 0
  });

  // Animate stats on load
  useEffect(() => {
    const targetStats = {
      users: 15723,
      courses: 48,
      trades: 1250000,
      countries: 89
    };

    const duration = 2000;
    const steps = 60;
    const increment = {
      users: targetStats.users / steps,
      courses: targetStats.courses / steps,
      trades: targetStats.trades / steps,
      countries: targetStats.countries / steps
    };

    let current = { users: 0, courses: 0, trades: 0, countries: 0 };
    let step = 0;

    const interval = setInterval(() => {
      step++;
      if (step >= steps) {
        setStats(targetStats);
        clearInterval(interval);
      } else {
        current = {
          users: Math.min(current.users + increment.users, targetStats.users),
          courses: Math.min(current.courses + increment.courses, targetStats.courses),
          trades: Math.min(current.trades + increment.trades, targetStats.trades),
          countries: Math.min(current.countries + increment.countries, targetStats.countries)
        };
        setStats({ ...current });
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, []);

  // Main navigation features
  const mainFeatures = [
    {
      id: 'profile',
      icon: <FaUserTie />,
      title: 'Profile',
      description: 'Manage your personal information, trading preferences, and account settings',
      path: '/profile',
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
      badge: null,
      category: 'personal'
    },
    {
      id: 'chat',
      icon: <FaComments />,
      title: 'Chat & Community',
      description: 'Connect with traders worldwide, join group discussions, and get real-time market insights',
      path: '/chat',
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      badge: 'LIVE',
      category: 'social'
    },
    {
      id: 'library',
      icon: <FaBookOpen />,
      title: 'Library',
      description: 'Access our extensive collection of trading books, research papers, and market analysis',
      path: '/education',
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
      badge: '2000+',
      category: 'education'
    },
    {
      id: 'academy',
      icon: <FaGraduationCap />,
      title: 'Academy',
      description: 'Structured courses from beginner to expert with certifications and practical exercises',
      path: '/education',
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      badge: 'NEW',
      category: 'education'
    },
    {
      id: 'office',
      icon: <FaLaptopCode />,
      title: 'Office Suite',
      description: 'Trading journal, performance analytics, and professional tools for serious traders',
      path: '/dashboard',
      color: '#ef4444',
      gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      badge: 'PRO',
      category: 'tools'
    },
    {
      id: 'tools',
      icon: <FaToolbox />,
      title: 'Advanced Tools',
      description: 'Technical indicators, charting tools, scanners, and automated trading systems',
      path: '/tools',
      color: '#ec489a',
      gradient: 'linear-gradient(135deg, #ec489a 0%, #db2777 100%)',
      badge: '24/7',
      category: 'tools'
    },
    {
      id: 'dashboard',
      icon: <FaTachometerAlt />,
      title: 'Dashboard',
      description: 'Real-time portfolio tracking, performance metrics, and personalized insights',
      path: '/dashboard',
      color: '#14b8a6',
      gradient: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
      badge: null,
      category: 'analytics'
    },
    {
      id: 'settings',
      icon: <FaCog />,
      title: 'Settings',
      description: 'Customize your experience, security preferences, and notification settings',
      path: '/profile/settings',
      color: '#6b7280',
      gradient: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
      badge: null,
      category: 'personal'
    }
  ];

  // Additional features (show more)
  const additionalFeatures = [
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

  // Community features
  const communityFeatures = [
    {
      icon: <FaUsers />,
      title: 'Trading Groups',
      description: 'Join specialized trading communities',
      stat: '156 Groups'
    },
    {
      icon: <FaTrophy />,
      title: 'Tournaments',
      description: 'Compete in monthly trading challenges',
      stat: '$50K Prize Pool'
    },
    {
      icon: <FaAward />,
      title: 'Leaderboards',
      description: 'See top performers and learn from them',
      stat: 'Daily Rankings'
    },
    {
      icon: <FaStar />,
      title: 'Mentorship',
      description: 'Get guidance from expert traders',
      stat: '50+ Mentors'
    }
  ];

  const handleCardClick = (path) => {
    if (path === '/tools') {
      // Navigate to tools page
      navigate('/tools');
    } else {
      navigate(path);
    }
  };

  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero-section">
        <Container>
          <div className="hero-content">
            <div className="hero-badge">
              <FaFire className="badge-icon" />
              <span>Trusted by 15,000+ Traders Worldwide</span>
            </div>
            <h1 className="hero-title">
              Trade Smarter with{' '}
              <span className="gradient-text">Alpha Phoenix</span>
            </h1>
            <p className="hero-description">
              Join the next generation of traders with AI-powered insights, 
              comprehensive education, and a thriving community. Transform 
              your trading journey today.
            </p>
            <div className="hero-buttons">
              {!isAuthenticated ? (
                <>
                  <button 
                    className="btn-primary"
                    onClick={() => navigate('/signup')}
                  >
                    Start Trading Free
                    <FaArrowRight />
                  </button>
                  <button 
                    className="btn-secondary"
                    onClick={() => navigate('/login')}
                  >
                    Sign In
                  </button>
                </>
              ) : (
                <>
                  <button 
                    className="btn-primary"
                    onClick={() => navigate('/dashboard')}
                  >
                    Go to Dashboard
                    <FaArrowRight />
                  </button>
                  <button 
                    className="btn-secondary"
                    onClick={() => navigate('/chat')}
                  >
                    Join Community
                    <FaUsers />
                  </button>
                </>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <Container>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">{Math.floor(stats.users).toLocaleString()}+</div>
              <div className="stat-label">Active Traders</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.courses}+</div>
              <div className="stat-label">Expert Courses</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">${(stats.trades / 1000000).toFixed(1)}M+</div>
              <div className="stat-label">Daily Volume</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.countries}+</div>
              <div className="stat-label">Countries</div>
            </div>
          </div>
        </Container>
      </section>

      {/* Main Features Section */}
      <section className="features-section">
        <Container>
          <div className="section-header">
            <h2 className="section-title">
              Everything You Need to Succeed
            </h2>
            <p className="section-subtitle">
              Comprehensive tools and resources for traders at every level
            </p>
            <div className="feature-tabs">
              <button 
                className={`tab-btn ${activeTab === 'features' ? 'active' : ''}`}
                onClick={() => setActiveTab('features')}
              >
                <FaRocket /> All Features
              </button>
              <button 
                className={`tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
                onClick={() => setActiveTab('personal')}
              >
                <FaUserTie /> Personal
              </button>
              <button 
                className={`tab-btn ${activeTab === 'social' ? 'active' : ''}`}
                onClick={() => setActiveTab('social')}
              >
                <FaUsers /> Social
              </button>
              <button 
                className={`tab-btn ${activeTab === 'education' ? 'active' : ''}`}
                onClick={() => setActiveTab('education')}
              >
                <FaGraduationCap /> Education
              </button>
              <button 
                className={`tab-btn ${activeTab === 'tools' ? 'active' : ''}`}
                onClick={() => setActiveTab('tools')}
              >
                <FaToolbox /> Tools
              </button>
              <button 
                className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
                onClick={() => setActiveTab('analytics')}
              >
                <FaChartLine /> Analytics
              </button>
            </div>
          </div>

          <div className="features-grid">
            {mainFeatures
              .filter(feature => activeTab === 'features' || feature.category === activeTab)
              .map((feature, index) => (
                <div 
                  key={feature.id}
                  className={`feature-card ${hoveredCard === feature.id ? 'hovered' : ''}`}
                  onMouseEnter={() => setHoveredCard(feature.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => handleCardClick(feature.path)}
                >
                  <div className="feature-card-inner">
                    <div 
                      className="feature-icon-wrapper"
                      style={{ background: feature.gradient }}
                    >
                      {feature.icon}
                    </div>
                    <div className="feature-content">
                      <h3 className="feature-title">
                        {feature.title}
                        {feature.badge && (
                          <span className="feature-badge">{feature.badge}</span>
                        )}
                      </h3>
                      <p className="feature-description">{feature.description}</p>
                      <div className="feature-link">
                        Explore Now
                        <FaArrowRight className="link-icon" />
                      </div>
                    </div>
                    <div className="feature-glow" style={{ background: feature.color }} />
                  </div>
                </div>
              ))}
          </div>

          {/* Show More Features Button */}
          <div className="show-more-container">
            <button 
              className="show-more-btn"
              onClick={() => setActiveTab(activeTab === 'features' ? 'tools' : 'features')}
            >
              <FaPlus /> 
              {activeTab === 'features' ? 'Explore More Features' : 'Show All Features'}
              <FaArrowRight />
            </button>
          </div>
        </Container>
      </section>

      {/* Additional Features Grid */}
      <section className="additional-features">
        <Container>
          <div className="section-header">
            <h2 className="section-title">
              Advanced Trading Tools
            </h2>
            <p className="section-subtitle">
              Professional-grade features to elevate your trading
            </p>
          </div>
          <div className="additional-grid">
            {additionalFeatures.map((feature, index) => (
              <div key={index} className="additional-card">
                <div 
                  className="additional-icon"
                  style={{ color: feature.color }}
                >
                  {feature.icon}
                </div>
                <div className="additional-content">
                  <h4>{feature.title}</h4>
                  <p>{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Community Section */}
      <section className="community-highlight">
        <Container>
          <div className="community-grid">
            <div className="community-info">
              <h2 className="section-title">Join Our Thriving Community</h2>
              <p className="section-subtitle">
                Connect with over 15,000 traders, share insights, and grow together
              </p>
              <div className="community-stats">
                <div className="community-stat">
                  <div className="stat-value">15,723+</div>
                  <div className="stat-label">Active Members</div>
                </div>
                <div className="community-stat">
                  <div className="stat-value">1.2M+</div>
                  <div className="stat-label">Messages Sent</div>
                </div>
                <div className="community-stat">
                  <div className="stat-value">50+</div>
                  <div className="stat-label">Expert Mentors</div>
                </div>
              </div>
              <button 
                className="btn-primary"
                onClick={() => navigate('/chat')}
              >
                Join Community Now
                <FaArrowRight />
              </button>
            </div>
            <div className="community-features-grid">
              {communityFeatures.map((feature, index) => (
                <div key={index} className="community-feature-card">
                  <div className="community-feature-icon">{feature.icon}</div>
                  <h4>{feature.title}</h4>
                  <p>{feature.description}</p>
                  <span className="feature-stat">{feature.stat}</span>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <Container>
          <div className="cta-content">
            <h2>Ready to Transform Your Trading?</h2>
            <p>
              Join Alpha Phoenix today and get access to premium tools, 
              expert education, and a supportive community.
            </p>
            <button 
              className="btn-primary cta-btn"
              onClick={() => navigate('/signup')}
            >
              Start Your Journey Free
              <FaRocket />
            </button>
          </div>
        </Container>
      </section>
    </div>
  );
};

export default HomePage;