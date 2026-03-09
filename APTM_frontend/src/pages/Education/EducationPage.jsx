
/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { 
  FaGraduationCap, 
  FaLightbulb, 
  FaExclamationTriangle,
  FaBars,
  FaTh,
  FaList,
  FaBook,
  FaUser,
  FaBuilding,
  FaPalette,
  FaTools,
  FaComments,
  FaHome,
  FaDownload,
  FaStar,
  FaComment,
  FaInfoCircle,
  FaTimes
} from 'react-icons/fa';

import { useAcademies } from '../../hooks/useAcademies';
import { useEducation } from '../../context/EducationContext';
import NavigationPanel from '../../components/layout/NavigationPanel';
import SearchFilters from '../../components/education/SearchFilters';
import LibraryFilters from '../../components/education/LibraryFilters';
import AcademyCard from '../../components/education/AcademyCard';
import AcademyModal from '../../components/education/AcademyModal';
import { LIBRARY_DATA, libraryTypes, librarySortOptions } from '../../data/mockLibrary';
import '../../styles/education/EducationPage.css';
import Footer from '../../components/layout/Footer.jsx';
import ThemeToggle from '../../components/ui/ThemeToggle.jsx';
import '../../styles/education/EducationLibraryCard.css';

// Simple LibraryCard component
const LibraryCard = ({ resource, onClick, variant = 'default', size = 'default', layout = 'vertical', showStats = true, interactive = true }) => {
  const handleClick = () => {
    if (interactive && onClick) {
      onClick(resource);
    }
  };

  const cardClass = `edu-card ${variant === 'premium' ? 'edu-card--premium' : ''} ${size === 'compact' ? 'edu-card--compact' : ''} ${layout === 'horizontal' ? 'edu-card--horizontal' : ''} ${interactive ? 'edu-card--interactive' : ''}`;

  return (
    <div className={cardClass} onClick={handleClick}>
      <div className="edu-card__header">
        <div className="edu-card__avatar">
          <div className="edu-card__avatar-container">
            <div className="resource-icon">
              {resource.icon}
            </div>
          </div>
        </div>
        <div className="edu-card__info">
          <div className="edu-card__title-wrapper">
            <h3 className="edu-card__title">{resource.title}</h3>
            {resource.featured && (
              <span className="edu-card__premium-tag">Featured</span>
            )}
          </div>
          <p className="edu-card__subtitle">{resource.category}</p>
          <div className="edu-card__additional-info">
            <span>{resource.version}</span>
          </div>
        </div>
      </div>

      <div className="edu-card__bio-container">
        <p className="edu-card__bio">{resource.description}</p>
      </div>

      {showStats && (
        <div className="edu-card__stats">
          <div className="edu-card__stat">
            <FaDownload className="edu-card__stat-icon" />
            <span className="edu-card__stat-value">{resource.stats.downloads.toLocaleString()}</span>
            <span className="edu-card__stat-label">Downloads</span>
          </div>
          <div className="edu-card__stat">
            <FaStar className="edu-card__stat-icon" />
            <span className="edu-card__stat-value">{resource.stats.rating}</span>
            <span className="edu-card__stat-label">Rating</span>
          </div>
          <div className="edu-card__stat">
            <FaComment className="edu-card__stat-icon" />
            <span className="edu-card__stat-value">{resource.stats.comments}</span>
            <span className="edu-card__stat-label">Comments</span>
          </div>
        </div>
      )}

      <div className="edu-card__actions">
        <button className="edu-subscribe-btn">
          <FaDownload className="edu-subscribe-btn__icon" />
          <span className="edu-subscribe-btn__text">Download</span>
        </button>
        <button className="edu-favorite-btn">
          <FaInfoCircle className="edu-favorite-btn__icon" />
        </button>
      </div>
    </div>
  );
};

const EducationPage = () => {
  const { 
    academies, 
    loading, 
    error, 
    filters, 
    updateFilter, 
    clearFilters,
    totalCount,
    originalCount 
  } = useAcademies();

  const { favorites, recentViews } = useEducation();
  const [selectedAcademy, setSelectedAcademy] = useState(null);
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);
  const [activeNav, setActiveNav] = useState('Academies');
  const [viewMode, setViewMode] = useState('grid');
  
  // Library states - using proper filter structure
  const [libraryFilters, setLibraryFilters] = useState({
    searchTerm: '',
    filterType: 'all',
    sortBy: 'popular',
    onlyFeatured: false
  });
  const [selectedResource, setSelectedResource] = useState(null);

  const handleCardClick = (academy) => {
    setSelectedAcademy(academy);
  };

  const handleResourceClick = (resource) => {
    setSelectedResource(resource);
  };

  const handleModalClose = () => {
    setSelectedAcademy(null);
  };

  const handleResourceModalClose = () => {
    setSelectedResource(null);
  };

  const handleNavClick = (navItem) => {
    setActiveNav(navItem);
  };

  const toggleViewMode = () => {
    setViewMode(prevMode => prevMode === 'grid' ? 'list' : 'grid');
  };

  const updateLibraryFilter = (key, value) => {
    setLibraryFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearLibraryFilters = () => {
    setLibraryFilters({
      searchTerm: '',
      filterType: 'all',
      sortBy: 'popular',
      onlyFeatured: false
    });
  };

  // Get all library resources for display
// Replace these two functions in your component:

// Get all library resources with their category types
const getAllLibraryResources = () => {
  const allResources = [];
  
  // Add all indicators with category type
  LIBRARY_DATA.indicators.forEach(resource => {
    allResources.push({
      ...resource,
      categoryType: 'indicators'
    });
  });
  
  // Add all strategies with category type
  LIBRARY_DATA.strategies.forEach(resource => {
    allResources.push({
      ...resource,
      categoryType: 'strategies'
    });
  });
  
  // Add all templates with category type
  LIBRARY_DATA.templates.forEach(resource => {
    allResources.push({
      ...resource,
      categoryType: 'templates'
    });
  });
  
  // Add all scripts with category type
  LIBRARY_DATA.scripts.forEach(resource => {
    allResources.push({
      ...resource,
      categoryType: 'scripts'
    });
  });
  
  // Add all systems with category type
  LIBRARY_DATA.systems.forEach(resource => {
    allResources.push({
      ...resource,
      categoryType: 'systems'
    });
  });
  
  // Add all tools with category type
  LIBRARY_DATA.tools.forEach(resource => {
    allResources.push({
      ...resource,
      categoryType: 'tools'
    });
  });
  
  return allResources;
};

// Filter library resources based on ALL filters
const filteredLibraryResources = getAllLibraryResources().filter(resource => {
  // Search filter
  const matchesSearch = libraryFilters.searchTerm === '' || 
    resource.title.toLowerCase().includes(libraryFilters.searchTerm.toLowerCase()) ||
    resource.description.toLowerCase().includes(libraryFilters.searchTerm.toLowerCase()) ||
    resource.category.toLowerCase().includes(libraryFilters.searchTerm.toLowerCase());
  
  // Type filter - NOW THIS WILL WORK!
  const matchesType = libraryFilters.filterType === 'all' || 
    resource.categoryType === libraryFilters.filterType;
  
  // Featured filter
  const matchesFeatured = !libraryFilters.onlyFeatured || resource.featured;
  
  return matchesSearch && matchesType && matchesFeatured;
});

  // Duplicate filteredLibraryResources removed — the variable is declared once above using categoryType

  // Render different content based on active navigation
  const renderContent = () => {
    switch (activeNav) {
      case 'Home':
        return (
          <div className="education-section-content">
            <div className="education-section-header">
              <FaHome className="section-icon" />
              <h2>Welcome Home</h2>
              <p>Your personalized dashboard and learning hub</p>
            </div>
            <div className="education-cards-grid">
              <div className="education-welcome-card">
                <h3>Welcome Back!</h3>
                <p>Continue your learning journey or explore new academies.</p>
              </div>
            </div>
          </div>
        );

      case 'Academies':
        return (
          <div className="education-section-content">
            {academies.length > 0 ? (
              <div className="education-academies-content">
                {viewMode === 'grid' ? (
                  <div className="education-grid">
                    {academies.map(academy => (
                      <AcademyCard
                        key={academy.id}
                        academy={academy}
                        onClick={handleCardClick}
                        variant={academy.isPremium ? 'premium' : 'default'}
                        size="default"
                        layout="vertical"
                        showStats={true}
                        interactive={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="education-list">
                    {academies.map(academy => (
                      <AcademyCard
                        key={academy.id}
                        academy={academy}
                        onClick={handleCardClick}
                        variant={academy.isPremium ? 'premium' : 'default'}
                        size="compact"
                        layout="horizontal"
                        showStats={false}
                        interactive={true}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="education-empty-state">
                <div className="education-empty-state-icon">🔍</div>
                <div className="education-empty-state-title">No academies found</div>
                <p className="education-empty-state-message">
                  Try adjusting your search terms or filters to find what you're looking for.
                </p>
                <button 
                  className="education-btn education-btn--primary"
                  onClick={clearFilters}
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        );

      case 'Library':
        return (
          <div className="education-section-content">
            {filteredLibraryResources.length > 0 ? (
              <div className="education-academies-content">
                {viewMode === 'grid' ? (
                  <div className="education-grid">
                    {filteredLibraryResources.map(resource => (
                      <LibraryCard
                        key={resource.id}
                        resource={resource}
                        onClick={handleResourceClick}
                        variant={resource.featured ? 'premium' : 'default'}
                        size="default"
                        layout="vertical"
                        showStats={true}
                        interactive={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="education-list">
                    {filteredLibraryResources.map(resource => (
                      <LibraryCard
                        key={resource.id}
                        resource={resource}
                        onClick={handleResourceClick}
                        variant={resource.featured ? 'premium' : 'default'}
                        size="compact"
                        layout="horizontal"
                        showStats={false}
                        interactive={true}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="education-empty-state">
                <div className="education-empty-state-icon">🔍</div>
                <div className="education-empty-state-title">No resources found</div>
                <p className="education-empty-state-message">
                  Try adjusting your search terms or filters to find what you're looking for.
                </p>
                <button 
                  className="education-btn education-btn--primary"
                  onClick={clearLibraryFilters}
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        );

      case 'Account':
        return (
          <div className="education-section-content">
            <div className="education-section-header">
              <FaUser className="section-icon" />
              <h2>My Account</h2>
              <p>Manage your profile, settings, and preferences</p>
            </div>
            <div className="education-cards-grid">
              <div className="education-account-card">
                <h3>Profile Settings</h3>
                <p>Update your personal information and preferences.</p>
              </div>
              <div className="education-account-card">
                <h3>Subscription</h3>
                <p>Manage your subscription and billing information.</p>
              </div>
            </div>
          </div>
        );

      case 'Office':
        return (
          <div className="education-section-content">
            <div className="education-section-header">
              <FaBuilding className="section-icon" />
              <h2>Office Suite</h2>
              <p>Professional tools and workspace</p>
            </div>
            <div className="education-cards-grid">
              <div className="education-office-card">
                <h3>Documents</h3>
                <p>Create and manage your professional documents.</p>
              </div>
              <div className="education-office-card">
                <h3>Analytics</h3>
                <p>Track your progress and performance metrics.</p>
              </div>
            </div>
          </div>
        );

      case 'Studio':
        return (
          <div className="education-section-content">
            <div className="education-section-header">
              <FaPalette className="section-icon" />
              <h2>Creative Studio</h2>
              <p>Design, create, and innovate</p>
            </div>
            <div className="education-cards-grid">
              <div className="education-studio-card">
                <h3>Projects</h3>
                <p>Manage your creative projects and works in progress.</p>
              </div>
              <div className="education-studio-card">
                <h3>Assets</h3>
                <p>Your creative resources and design elements.</p>
              </div>
            </div>
          </div>
        );

      case 'Tools':
        return (
          <div className="education-section-content">
            <div className="education-section-header">
              <FaTools className="section-icon" />
              <h2>Development Tools</h2>
              <p>Utilities and resources for developers</p>
            </div>
            <div className="education-cards-grid">
              <div className="education-tools-card">
                <h3>Code Editor</h3>
                <p>Write and test code in various programming languages.</p>
              </div>
              <div className="education-tools-card">
                <h3>API Playground</h3>
                <p>Test and experiment with APIs and endpoints.</p>
              </div>
            </div>
          </div>
        );

      case 'Chat AI':
        return (
          <div className="education-section-content">
            <div className="education-section-header">
              <FaComments className="section-icon" />
              <h2>AI Assistant</h2>
              <p>Get help and answers from our AI assistant</p>
            </div>
            <div className="education-cards-grid">
              <div className="education-chat-card">
                <h3>Start Conversation</h3>
                <p>Ask questions and get instant AI-powered responses.</p>
              </div>
              <div className="education-chat-card">
                <h3>Learning Assistant</h3>
                <p>Get personalized learning recommendations.</p>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="education-section-content">
            <div className="education-empty-state">
              <div className="education-empty-state-icon">🚧</div>
              <div className="education-empty-state-title">Content Coming Soon</div>
              <p className="education-empty-state-message">
                This section is under development and will be available soon.
              </p>
            </div>
          </div>
        );
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="education-page">
        <div className="education-container">
          <div className="education-loading">
            <FaLightbulb size={32} />
            <div>
              <div className="education-loading-title">Loading Academies</div>
              <div className="education-loading-subtitle">Fetching the latest educational content...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="education-page">
        <div className="education-container">
          <div className="education-error">
            <FaExclamationTriangle size={32} />
            <div>
              <div className="education-error-title">Error Loading Academies</div>
              <div className="education-error-message">{error}</div>
              <button 
                onClick={() => window.location.reload()}
                className="education-btn education-btn--primary"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="education-page">
      {/* Single Sticky Header - Combined Search & Navigation */}
      <div className="education-sticky-header">
        <div className="education-sticky-content">
          <div className="education-logo-section">
            <button 
              className="education-nav-toggle"
              onClick={() => setIsNavCollapsed(!isNavCollapsed)}
              aria-label={isNavCollapsed ? 'Expand navigation' : 'Collapse navigation'}
            >
              <FaBars />
            </button>
            <FaGraduationCap className="education-logo-icon" />
            <span className="education-logo-text">{activeNav}</span>
            {activeNav === 'Academies' && totalCount > 0 && (
              <span className="education-count-badge">{totalCount}</span>
            )}
            {activeNav === 'Library' && filteredLibraryResources.length > 0 && (
              <span className="education-count-badge">{filteredLibraryResources.length}</span>
            )}
          </div>
          
          {/* Show Search Filters only for Academies */}
          {activeNav === 'Academies' && (
            <SearchFilters
              filters={filters}
              onFilterChange={updateFilter}
              onClearFilters={clearFilters}
              totalCount={totalCount}
              originalCount={originalCount}
              compact={true}
            />
          )}

          {/* Show Library Filters when in Library */}
          {activeNav === 'Library' && (
            <LibraryFilters
              filters={libraryFilters}
              onFilterChange={updateLibraryFilter}
              onClearFilters={clearLibraryFilters}
              totalCount={filteredLibraryResources.length}
              originalCount={getAllLibraryResources().length}
              compact={true}
            />
          )}

          {/* View Mode Toggle - Show for both Academies and Library */}
          {(activeNav === 'Academies' || activeNav === 'Library') && (
            <div className="education-view-controls">
              <button
                className={`education-view-btn ${viewMode === 'grid' ? 'education-view-btn--active' : ''}`}
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                aria-pressed={viewMode === 'grid'}
              >
                <FaTh />
              </button>
              <button
                className={`education-view-btn ${viewMode === 'list' ? 'education-view-btn--active' : ''}`}
                onClick={() => setViewMode('list')}
                aria-label="List view"
                aria-pressed={viewMode === 'list'}
              >
                <FaList />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Layout */}
      <div className="education-main-layout">
        <NavigationPanel 
          isCollapsed={isNavCollapsed}
          activeNav={activeNav}
          onNavClick={handleNavClick}
          onToggleCollapse={() => setIsNavCollapsed(!isNavCollapsed)}
        />

        <main className="education-content-area">
          <div className="education-scroll-container">
            <div className="education-content-container">
              {renderContent()}
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <Footer />

      {/* Academy Modal */}
      {selectedAcademy && (
        <AcademyModal
          key={selectedAcademy.id}
          academy={selectedAcademy}
          onClose={handleModalClose}
        />
      )}

      {/* Library Resource Modal */}
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
                onClick={handleResourceModalClose} 
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
                onClick={handleResourceModalClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ThemeToggle />
    </div>
  );
};

export default EducationPage;