import React from 'react';
import { FaSearch, FaTimes, FaFilter, FaStar, FaSort } from 'react-icons/fa';
import { academyTypes, sortOptions } from '../../data/mockAcademies';
import { debounce } from '../../utils/educationHelpers';
import '../../styles/education/SearchFilters.css';

const SearchFilters = ({ 
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
    <div className="search-filters-compact">
      <div className="compact-filters-main">
        {/* Left section: Search and filters */}
        <div className="compact-filters-left">
          {/* Compact Search Bar */}
          <div className="compact-search">
            <FaSearch className="compact-search__icon" />
            <input
              type="text"
              className="compact-search__input"
              placeholder="Search academies..."
              defaultValue={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              aria-label="Search academies"
            />
            {searchTerm && (
              <button 
                className="compact-search__clear"
                onClick={() => onFilterChange('searchTerm', '')}
                aria-label="Clear search"
              >
                <FaTimes />
              </button>
            )}
          </div>

          {/* Compact Filter Buttons */}
          <div className="compact-filter-buttons">
            {/* Type Filter Dropdown */}
            <div className="compact-filter-dropdown">
              <select 
                className="compact-filter-select"
                value={filterType}
                onChange={(e) => onFilterChange('filterType', e.target.value)}
              >
                {academyTypes.map(type => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'All Types' : type}
                  </option>
                ))}
              </select>
              <FaFilter className="compact-filter-icon" />
            </div>

            {/* Sort Dropdown */}
            <div className="compact-filter-dropdown">
              <select 
                className="compact-filter-select"
                value={sortBy}
                onChange={(e) => onFilterChange('sortBy', e.target.value)}
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <FaSort className="compact-filter-icon" />
            </div>

            {/* Featured Toggle */}
            <button
              className={`compact-featured-btn ${onlyFeatured ? 'compact-featured-btn--active' : ''}`}
              onClick={() => onFilterChange('onlyFeatured', !onlyFeatured)}
              title="Featured only"
            >
              <FaStar />
            </button>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button 
                className="compact-clear-btn"
                onClick={onClearFilters}
                title="Clear all filters"
              >
                <FaTimes />
              </button>
            )}
          </div>

          {/* Results Count */}
          {hasActiveFilters && totalCount !== originalCount && (
            <div className="compact-results">
              <span className="compact-results-count">
                {totalCount} of {originalCount}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

  // Original layout for non-compact mode (without logo)
  return (
    <div className="edu-controls">
      {/* Search */}
      <div className="edu-search">
        <FaSearch className="edu-search__icon" />
        <input
          type="text"
          className="edu-search__input"
          placeholder="Search academies by name, title, or description..."
          defaultValue={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          aria-label="Search academies"
        />
        {searchTerm && (
          <button 
            className="edu-search__clear"
            onClick={() => onFilterChange('searchTerm', '')}
            aria-label="Clear search"
          >
            <FaTimes />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="edu-filters">
        {/* Type Filter */}
        <div className="edu-filter-group">
          <label className="edu-filter-group__label">
            <FaFilter style={{ marginRight: '8px' }} />
            Filter by Type
          </label>
          <div className="edu-filter-buttons">
            {academyTypes.map(type => (
              <button
                key={type}
                className={`edu-filter-btn ${filterType === type ? 'edu-filter-btn--active' : ''}`}
                onClick={() => onFilterChange('filterType', type)}
              >
                {type === 'all' ? 'All Types' : type}
              </button>
            ))}
          </div>
        </div>

        {/* Sort */}
        <div className="edu-filter-group">
          <label className="edu-filter-group__label">Sort By</label>
          <div className="edu-sort">
            <select 
              className="edu-sort__select"
              value={sortBy}
              onChange={(e) => onFilterChange('sortBy', e.target.value)}
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FaStar className="edu-sort__icon" />
          </div>
        </div>

        {/* Featured Filter */}
        <div className="edu-filter-group">
          <label className="edu-filter-group__label">Show Only</label>
          <button
            className={`edu-filter-btn ${onlyFeatured ? 'edu-filter-btn--active' : ''}`}
            onClick={() => onFilterChange('onlyFeatured', !onlyFeatured)}
          >
            ⭐ Featured
          </button>
        </div>
      </div>

      {/* Active Filters & Results */}
      {(hasActiveFilters || totalCount !== originalCount) && (
        <div className="edu-active-filters">
          <span className="edu-results-count">
            Showing {totalCount} of {originalCount} academies
          </span>
          
          {hasActiveFilters && (
            <button 
              className="edu-clear-filters"
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

export default SearchFilters;