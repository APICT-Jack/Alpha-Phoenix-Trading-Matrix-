// educationHelpers.js - Consolidated with proper error handling

// Format numbers with K/M/B suffixes - SAFE VERSION
export const formatCount = (count) => {
  // Handle undefined, null, or invalid numbers
  if (count === undefined || count === null || isNaN(count)) {
    return '0';
  }
  
  // Convert to number if it's a string
  const numCount = Number(count);
  
  if (isNaN(numCount)) {
    return '0';
  }
  
  if (numCount >= 1000000000) {
    return (numCount / 1000000000).toFixed(1) + 'B';
  }
  if (numCount >= 1000000) {
    return (numCount / 1000000).toFixed(1) + 'M';
  }
  if (numCount >= 1000) {
    return (numCount / 1000).toFixed(1) + 'K';
  }
  
  // Return as string for consistency
  return numCount.toString();
};

// Safe number formatting with fallback
export const safeFormatCount = (count, fallback = '0') => {
  try {
    return formatCount(count);
  } catch (error) {
    console.warn('Error formatting count:', error);
    return fallback;
  }
};

export const formatDate = (dateString) => {
  try {
    if (!dateString) return 'Unknown date';
    
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.warn('Error formatting date:', error);
    return 'Invalid date';
  }
};

export const formatRelativeTime = (dateString) => {
  try {
    if (!dateString) return 'Unknown time';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return formatDate(dateString);
  } catch (error) {
    console.warn('Error formatting relative time:', error);
    return 'Unknown time';
  }
};

export const filterAcademies = (academies, filters) => {
  try {
    if (!academies || !Array.isArray(academies)) {
      return [];
    }

    const { searchTerm, filterType, sortBy, onlyFeatured } = filters || {};
    
    let results = [...academies];

    // Filter by type
    if (filterType && filterType !== "all") {
      const normalized = filterType.trim().toLowerCase();
      results = results.filter((a) => {
        const typeLower = (a.type || "").toLowerCase();
        if (normalized === "market trading") return typeLower.includes("trading");
        if (normalized === "coding for market trading tools") return typeLower.includes("coding");
        if (normalized === "investment") return typeLower.includes("investment");
        if (normalized === "market research") return typeLower.includes("research");
        if (normalized === "full stack") return typeLower.includes("full stack");
        return typeLower === normalized;
      });
    }

    // Filter by search term
    if (searchTerm && searchTerm.trim().length > 0) {
      const s = searchTerm.toLowerCase();
      results = results.filter(
        (a) =>
          (a.name && a.name.toLowerCase().includes(s)) ||
          (a.title && a.title.toLowerCase().includes(s)) ||
          (a.bio && a.bio.toLowerCase().includes(s)) ||
          (a.tags && Array.isArray(a.tags) && a.tags.some(tag => tag.toLowerCase().includes(s)))
      );
    }

    // Filter featured only
    if (onlyFeatured) {
      results = results.filter(a => a.isFeatured);
    }

    // Sort results
    switch (sortBy) {
      case "rating":
        results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "followers":
        results.sort((a, b) => (b.followers || 0) - (a.followers || 0));
        break;
      case "newest":
        results.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        break;
      case "name":
        results.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      default:
        break;
    }

    return results;
  } catch (error) {
    console.error('Error filtering academies:', error);
    return [];
  }
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Generate consistent color based on academy name
export const generateAcademyColor = (name) => {
  try {
    const colors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)'
    ];
    
    const nameHash = (name || '').split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0) || 0;
    
    return colors[Math.abs(nameHash) % colors.length];
  } catch (error) {
    console.warn('Error generating academy color:', error);
    return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  }
};

// Get initials from name
export const getInitials = (name) => {
  try {
    if (!name) return '??';
    
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  } catch (error) {
    console.warn('Error getting initials:', error);
    return '??';
  }
};

// Calculate academy level based on various metrics
export const calculateAcademyLevel = (academy) => {
  try {
    if (!academy) {
      return { level: 'Beginner', color: '#6B7280', icon: 'FaMedal' };
    }
    
    const rating = Number(academy.rating) || 0;
    const followers = Number(academy.followers) || 0;
    const coursesCount = Number(academy.coursesCount) || 0;
    const successRate = Number(academy.successRate) || 0;
    
    const score = (rating * 20) + 
                  (followers / 1000) + 
                  (coursesCount * 5) + 
                  (successRate / 2);
    
    if (score > 500) return { level: 'Elite', color: '#FFD700', icon: 'FaCrown' };
    if (score > 300) return { level: 'Advanced', color: '#C0C0C0', icon: 'FaGem' };
    if (score > 150) return { level: 'Intermediate', color: '#CD7F32', icon: 'FaAward' };
    return { level: 'Beginner', color: '#6B7280', icon: 'FaMedal' };
  } catch (error) {
    console.warn('Error calculating academy level:', error);
    return { level: 'Beginner', color: '#6B7280', icon: 'FaMedal' };
  }
};

// Generate shareable academy link
export const generateAcademyLink = (academy) => {
  try {
    if (!academy?.id || !academy?.name) {
      return '/academy/unknown';
    }
    
    const slug = academy.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    
    return `/academy/${slug}-${academy.id}`;
  } catch (error) {
    console.warn('Error generating academy link:', error);
    return '/academy/unknown';
  }
};

// Safe academy data processor
export const processAcademyData = (academy) => {
  try {
    if (!academy) {
      return {
        id: 'unknown',
        name: 'Unknown Academy',
        title: 'Education Platform',
        bio: 'No description available',
        rating: 0,
        followers: 0,
        totalViews: 0,
        profilePic: '',
        isFeatured: false,
        isNew: false,
        isPopular: false,
        isPremium: false,
        isVerified: false,
        status: 'offline',
        category: 'education',
        coursesCount: 0,
        studentsCount: 0,
        successRate: 0,
        joinDate: new Date().toISOString()
      };
    }
    
    return {
      id: academy.id || 'unknown',
      name: academy.name || 'Unknown Academy',
      title: academy.title || 'Education Platform',
      bio: academy.bio || 'No description available',
      rating: Number(academy.rating) || 0,
      followers: Number(academy.followers) || 0,
      totalViews: Number(academy.totalViews) || 0,
      profilePic: academy.profilePic || '',
      isFeatured: Boolean(academy.isFeatured),
      isNew: Boolean(academy.isNew),
      isPopular: Boolean(academy.isPopular),
      isPremium: Boolean(academy.isPremium),
      isVerified: Boolean(academy.isVerified),
      status: academy.status || 'online',
      category: academy.category || 'education',
      coursesCount: Number(academy.coursesCount) || 0,
      studentsCount: Number(academy.studentsCount) || 0,
      successRate: Number(academy.successRate) || 0,
      joinDate: academy.joinDate || new Date().toISOString()
    };
  } catch (error) {
    console.error('Error processing academy data:', error);
    return {
      id: 'error',
      name: 'Error Loading Academy',
      title: 'Please try again',
      bio: 'There was an error loading this academy information.',
      rating: 0,
      followers: 0,
      totalViews: 0,
      profilePic: '',
      isFeatured: false,
      isNew: false,
      isPopular: false,
      isPremium: false,
      isVerified: false,
      status: 'offline',
      category: 'error',
      coursesCount: 0,
      studentsCount: 0,
      successRate: 0,
      joinDate: new Date().toISOString()
    };
  }
};

// Validate academy object
export const isValidAcademy = (academy) => {
  try {
    return academy && academy.id && academy.name;
  // eslint-disable-next-line no-unused-vars
  } catch (error) {
    return false;
  }
};

// Get safe academy value with fallback
export const getAcademyValue = (academy, key, fallback = '') => {
  try {
    if (!academy || academy[key] === undefined || academy[key] === null) {
      return fallback;
    }
    return academy[key];
  // eslint-disable-next-line no-unused-vars
  } catch (error) {
    return fallback;
  }
};

// Enhanced safe number getter for common academy metrics
export const getAcademyNumber = (academy, key, fallback = 0) => {
  try {
    const value = getAcademyValue(academy, key, fallback);
    const numValue = Number(value);
    return isNaN(numValue) ? fallback : numValue;
  // eslint-disable-next-line no-unused-vars
  } catch (error) {
    return fallback;
  }
};