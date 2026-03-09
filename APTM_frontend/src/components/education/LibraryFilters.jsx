// components/education/LibraryFilters.jsx
import React from 'react';
import { FaSearch, FaTimes, FaFilter, FaStar, FaSort } from 'react-icons/fa';
import { libraryTypes, librarySortOptions } from '../../data/mockLibrary.jsx';
import { debounce } from '../../utils/educationHelpers';
import '../../styles/education/LibraryFilters.css';

const LibraryFilters = ({ 
  filters, 
  onFilterChange, 
  onClearFilters, 
  totalCount, 
  originalCount,
  compact = false 
}) => {
  const { searchTerm, filterType, sortBy, onlyFeatured } = filters;

  const handleSearchChange = debounce((value) => {
    onFilterChange('searchTerm', value);
  }, 300);

  const hasActiveFilters = searchTerm || filterType !== 'all' || onlyFeatured;

  if (compact) {
    return (
      <div className="library-filters-compact">
        <div className="lib-filters-main">
          <div className="lib-filters-left">
            {/* Compact Search Bar */}
            <div className="lib-search">
              <FaSearch className="lib-search__icon" />
              <input
                type="text"
                className="lib-search__input"
                placeholder="Search library resources..."
                defaultValue={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                aria-label="Search library"
              />
              {searchTerm && (
                <button 
                  className="lib-search__clear"
                  onClick={() => onFilterChange('searchTerm', '')}
                  aria-label="Clear search"
                >
                  <FaTimes />
                </button>
              )}
            </div>

            {/* Compact Filter Buttons */}
            <div className="lib-filter-buttons">
              {/* Type Filter Dropdown */}
              <div className="lib-filter-dropdown">
                <select 
                  className="lib-filter-select"
                  value={filterType}
                  onChange={(e) => onFilterChange('filterType', e.target.value)}
                >
                  {libraryTypes.map(type => (
                    <option key={type} value={type}>
                      {type === 'all' ? 'All Types' : type}
                    </option>
                  ))}
                </select>
                <FaFilter className="lib-filter-icon" />
              </div>

              {/* Sort Dropdown */}
              <div className="lib-filter-dropdown">
                <select 
                  className="lib-filter-select"
                  value={sortBy}
                  onChange={(e) => onFilterChange('sortBy', e.target.value)}
                >
                  {librarySortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <FaSort className="lib-filter-icon" />
              </div>

              {/* Featured Toggle */}
              <button
                className={`lib-featured-btn ${onlyFeatured ? 'lib-featured-btn--active' : ''}`}
                onClick={() => onFilterChange('onlyFeatured', !onlyFeatured)}
                title="Featured only"
              >
                <FaStar />
              </button>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button 
                  className="lib-clear-btn"
                  onClick={onClearFilters}
                  title="Clear all filters"
                >
                  <FaTimes />
                </button>
              )}
            </div>

            {/* Results Count */}
            {hasActiveFilters && totalCount !== originalCount && (
              <div className="lib-results">
                <span className="lib-results-count">
                  {totalCount} of {originalCount}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Non-compact version
  return (
    <div className="lib-controls">
      {/* Search */}
      <div className="lib-search-full">
        <FaSearch className="lib-search-full__icon" />
        <input
          type="text"
          className="lib-search-full__input"
          placeholder="Search library resources..."
          defaultValue={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          aria-label="Search library"
        />
        {searchTerm && (
          <button 
            className="lib-search__clear"
            onClick={() => onFilterChange('searchTerm', '')}
            aria-label="Clear search"
          >
            <FaTimes />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="lib-filters-full">
        {/* Type Filter */}
        <div className="lib-filter-group">
          <label className="lib-filter-group__label">
            <FaFilter style={{ marginRight: '8px' }} />
            Filter by Type
          </label>
          <div className="lib-filter-buttons-full">
            {libraryTypes.map(type => (
              <button
                key={type}
                className={`lib-filter-btn ${filterType === type ? 'lib-filter-btn--active' : ''}`}
                onClick={() => onFilterChange('filterType', type)}
              >
                {type === 'all' ? 'All Types' : type}
              </button>
            ))}
          </div>
        </div>

        {/* Sort */}
        <div className="lib-filter-group">
          <label className="lib-filter-group__label">Sort By</label>
          <div className="lib-sort">
            <select 
              className="lib-sort__select"
              value={sortBy}
              onChange={(e) => onFilterChange('sortBy', e.target.value)}
            >
              {librarySortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FaStar className="lib-sort__icon" />
          </div>
        </div>

        {/* Featured Filter */}
        <div className="lib-filter-group">
          <label className="lib-filter-group__label">Show Only</label>
          <button
            className={`lib-filter-btn ${onlyFeatured ? 'lib-filter-btn--active' : ''}`}
            onClick={() => onFilterChange('onlyFeatured', !onlyFeatured)}
          >
            ⭐ Featured
          </button>
        </div>
      </div>

      {/* Active Filters & Results */}
      {(hasActiveFilters || totalCount !== originalCount) && (
        <div className="lib-active-filters">
          <span className="lib-results-count-full">
            Showing {totalCount} of {originalCount} resources
          </span>
          
          {hasActiveFilters && (
            <button 
              className="lib-clear-filters-full"
              onClick={onClearFilters}
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default LibraryFilters;