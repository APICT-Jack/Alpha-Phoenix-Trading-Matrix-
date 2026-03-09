import React from 'react';
import { useState } from 'react';
import { 
  FaChartLine, FaChess, FaPalette, FaCode, 
  FaDownload, FaStar, FaComment, FaInfoCircle,
  FaSearch, FaSlidersH, FaChessKnight, FaChartPie, FaRobot, FaTimes
} from 'react-icons/fa';
import DetailsCard from './DetailsCard';
import '../../styles/DetailsCardStyle.css';

// Complete library data structure
const LIBRARY_DATA = {
  indicators: [
    {
      id: 1,
      title: "Phoenix Momentum Indicator",
      description: "Advanced momentum detection with early trend reversal signals",
      category: "Trend Analysis",
      version: "v3.2.1",
      stats: { downloads: 3842, rating: 4.9, comments: 128 },
      featured: true,
      icon: <FaChartLine />
    },
    {
      id: 2,
      title: "ATR Channel Scanner",
      description: "Identifies optimal entry points based on volatility-adjusted channels",
      category: "Volatility",
      version: "v2.0.3",
      stats: { downloads: 2156, rating: 4.7, comments: 87 },
      featured: false,
      icon: <FaChartLine />
    }
  ],
  strategies: [
    {
      id: 3,
      title: "Breakout Momentum Strategy",
      description: "Identify and trade breakouts with volume confirmation",
      category: "Trend Following",
      version: "v2.1.0",
      stats: { downloads: 1842, rating: 4.7, comments: 56 },
      featured: false,
      icon: <FaChess />
    },
    {
      id: 4,
      title: "Bollinger Bounce System",
      description: "Profitable mean reversion strategy using Bollinger Bands",
      category: "Mean Reversion",
      version: "v1.5.2",
      stats: { downloads: 1245, rating: 4.5, comments: 42 },
      featured: false,
      icon: <FaChessKnight />
    }
  ],
  templates: [
    {
      id: 5,
      title: "Advanced Trading Dashboard",
      description: "Complete trading workspace with multiple chart layouts",
      category: "Dashboard",
      version: "v1.5.2",
      stats: { downloads: 2451, rating: 4.8, comments: 124 },
      featured: true,
      icon: <FaPalette />
    },
    {
      id: 6,
      title: "Multi-Timeframe Analysis Template",
      description: "Pre-configured workspace for analyzing multiple timeframes",
      category: "Analysis",
      version: "v2.0.0",
      stats: { downloads: 1876, rating: 4.6, comments: 93 },
      featured: true,
      icon: <FaChartPie />
    }
  ],
  scripts: [
    {
      id: 7,
      title: "Auto Risk Management",
      description: "Automatically calculates position size based on account balance",
      category: "Automation",
      version: "v3.0.1",
      stats: { downloads: 3127, rating: 4.9, comments: 87 },
      featured: false,
      icon: <FaCode />
    },
    {
      id: 8,
      title: "Trend Following EA",
      description: "Automated trading system that follows strong trends",
      category: "Trading Bot",
      version: "v1.8.3",
      stats: { downloads: 2543, rating: 4.8, comments: 112 },
      featured: true,
      icon: <FaRobot />
    }
  ]
};

const TABS = [
  { id: 'indicators', label: 'Indicators', icon: <FaChartLine /> },
  { id: 'strategies', label: 'Strategies', icon: <FaChess /> },
  { id: 'templates', label: 'Templates', icon: <FaPalette /> },
  { id: 'scripts', label: 'Scripts', icon: <FaCode /> }
];

export default function Library() {
  const [activeTab, setActiveTab] = useState('indicators');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResource, setSelectedResource] = useState(null);

  const filteredResources = LIBRARY_DATA[activeTab].filter(resource =>
    resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section className="library-section section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Trading Library</h2>
          <div className="section-actions">
            <div className="search-container">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search indicators, strategies..." 
                aria-label="Search library"
              />
              <button className="search-btn" aria-label="Search">
                <FaSearch />
              </button>
            </div>
            <button className="filter-btn">
              <FaSlidersH /> Filters
            </button>
          </div>
        </div>
        
        <div className="library-tabs">
          <div className="tabs-nav">
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
          
          <div className="tabs-content">
            {filteredResources.length === 0 ? (
              <div className="empty-state">
                <p>No resources found matching your search</p>
                <button 
                  onClick={() => setSearchQuery('')}
                  className="clear-search-btn"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="resources-grid">
                {filteredResources.map(resource => (
                  <div 
                    key={resource.id} 
                    className={`resource-card card ${resource.featured ? 'featured' : ''}`}
                  >
                    <div className="resource-header">
                      <div className="resource-icon">{resource.icon}</div>
                      <div className="resource-meta">
                        <span className="resource-category">{resource.category}</span>
                        <span className="resource-version">{resource.version}</span>
                      </div>
                    </div>
                    <h3 className="resource-title">{resource.title}</h3>
                    <p className="resource-desc">{resource.description}</p>
                    <div className="resource-stats">
                      <div className="stat">
                        <FaDownload /> {resource.stats.downloads.toLocaleString()}
                      </div>
                      <div className="stat">
                        <FaStar /> {resource.stats.rating}
                      </div>
                      <div className="stat">
                        <FaComment /> {resource.stats.comments}
                      </div>
                    </div>
                    <div className="resource-footer">
                      <button className="resource-btn primary">
                        <FaDownload /> Download
                      </button>
                      <button 
                        className="resource-btn secondary"
                        onClick={() => setSelectedResource(resource)}
                      >
                        <FaInfoCircle /> Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {selectedResource && (
        <div className="modal-overlay active">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="resource-icon-large">{selectedResource.icon}</div>
              <div>
                <h3>{selectedResource.title}</h3>
                <div className="resource-meta">
                  <span className="resource-category">{selectedResource.category}</span>
                  <span className="resource-version">{selectedResource.version}</span>
                </div>
              </div>
              <button 
                className="close-btn" 
                onClick={() => setSelectedResource(null)} 
                aria-label="Close modal"
              >
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <div className="description-section">
                <h4>Description</h4>
                <p>{selectedResource.description}</p>
              </div>

              <div className="stats-section">
                <h4>Statistics</h4>
                <div className="stats-grid">
                  <div className="stat-item">
                    <FaDownload /> Downloads: {selectedResource.stats.downloads.toLocaleString()}
                  </div>
                  <div className="stat-item">
                    <FaStar /> Rating: {selectedResource.stats.rating}
                  </div>
                  <div className="stat-item">
                    <FaComment /> Comments: {selectedResource.stats.comments}
                  </div>
                </div>
              </div>

              <div className="features-section">
                <h4>Key Features</h4>
                <ul>
                  <li>Advanced trend detection algorithms</li>
                  <li>Customizable parameters for different trading styles</li>
                  <li>Multi-timeframe compatibility</li>
                  <li>Visual alerts and notifications</li>
                </ul>
              </div>

              <div className="screenshots-section">
                <h4>Screenshots</h4>
                <div className="screenshots-grid">
                  <div className="screenshot-placeholder">Screenshot 1</div>
                  <div className="screenshot-placeholder">Screenshot 2</div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="download-btn primary">
                <FaDownload /> Download Now
              </button>
              <button 
                className="download-btn secondary" 
                onClick={() => setSelectedResource(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}