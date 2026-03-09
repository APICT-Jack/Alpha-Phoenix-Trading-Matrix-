import { useState, useEffect, useCallback } from 'react';
import { mockAcademies } from '../data/mockAcademies';
import { filterAcademies } from '../utils/educationHelpers';

export const useAcademies = () => {
  const [academies, setAcademies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [filters, setFilters] = useState({
    searchTerm: "",
    filterType: "all",
    sortBy: "rating",
    onlyFeatured: false,
  });

  // Load academies
  useEffect(() => {
    const loadAcademies = async () => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        setAcademies(mockAcademies);
        setError(null);
      } catch (err) {
        setError("Failed to load academies");
        console.error("Error loading academies:", err);
      } finally {
        setLoading(false);
      }
    };

    loadAcademies();
  }, []);

  // Filtered academies
  const filteredAcademies = filterAcademies(academies, filters);

  // Update filters
  const updateFilter = useCallback((filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      searchTerm: "",
      filterType: "all",
      sortBy: "rating",
      onlyFeatured: false,
    });
  }, []);

  const getAcademyById = useCallback((id) => {
    return academies.find(academy => academy.id === parseInt(id));
  }, [academies]);

  return {
    academies: filteredAcademies,
    allAcademies: academies,
    loading,
    error,
    filters,
    updateFilter,
    clearFilters,
    getAcademyById,
    totalCount: filteredAcademies.length,
    originalCount: academies.length,
  };
};