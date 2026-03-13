// utils/avatarUtils.js

const BASE_URL = process.env.REACT_APP_API_URL || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000');

/**
 * Format avatar URL to ensure it's properly constructed
 * @param {string|object} avatarData - Raw avatar path/URL or object containing avatar data
 * @returns {string|null} - Formatted avatar URL or null
 */
export const formatAvatarUrl = (avatarData) => {
  // If it's null, undefined, or empty string, return null silently (no console.error)
  if (!avatarData || avatarData === 'null' || avatarData === 'undefined') {
    return null;
  }

  try {
    // Extract the avatar path from different possible formats
    let avatarPath;

    if (typeof avatarData === 'string') {
      avatarPath = avatarData;
    } else if (avatarData && typeof avatarData === 'object') {
      avatarPath = avatarData.url || avatarData.path || avatarData.avatarUrl || null;
    } else {
      return null;
    }

    // Check if we have a valid path
    if (!avatarPath || avatarPath === 'null' || avatarPath === 'undefined') {
      return null;
    }

    // Ensure avatarPath is a string
    if (typeof avatarPath !== 'string') {
      return null;
    }

    // If it's already a full URL, return as is
    if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
      return avatarPath;
    }

    // If it's a data URL (base64), return as is
    if (avatarPath.startsWith('data:')) {
      return avatarPath;
    }

    // Handle /uploads paths
    if (avatarPath.startsWith('/uploads/')) {
      return `${BASE_URL}${avatarPath}`;
    }

    // Handle uploads paths without leading slash
    if (avatarPath.startsWith('uploads/')) {
      return `${BASE_URL}/${avatarPath}`;
    }

    // If it contains avatar- (likely a filename)
    if (avatarPath.includes('avatar-')) {
      return `${BASE_URL}/uploads/avatars/${avatarPath}`;
    }

    // Default case - try to construct a path
    return `${BASE_URL}/uploads/avatars/${avatarPath}`;

  } catch (error) {
    // Silent fail - just return null
    return null;
  }
};

/**
 * Format banner URL to ensure it's properly constructed
 * @param {string|object} bannerData - Raw banner path/URL or object containing banner data
 * @returns {string|null} - Formatted banner URL or null
 */
export const formatBannerUrl = (bannerData) => {
  if (!bannerData || bannerData === 'null' || bannerData === 'undefined') {
    return null;
  }

  try {
    let bannerPath;

    if (typeof bannerData === 'string') {
      bannerPath = bannerData;
    } else if (bannerData && typeof bannerData === 'object') {
      bannerPath = bannerData.url || bannerData.path || bannerData.bannerUrl || null;
    } else {
      return null;
    }

    if (!bannerPath || bannerPath === 'null' || bannerPath === 'undefined') {
      return null;
    }

    if (typeof bannerPath !== 'string') {
      return null;
    }

    if (bannerPath.startsWith('http://') || bannerPath.startsWith('https://')) {
      return bannerPath;
    }

    if (bannerPath.startsWith('data:')) {
      return bannerPath;
    }

    if (bannerPath.startsWith('/uploads/banners/')) {
      return `${BASE_URL}${bannerPath}`;
    }

    if (bannerPath.startsWith('uploads/banners/')) {
      return `${BASE_URL}/${bannerPath}`;
    }

    if (bannerPath.includes('banner-')) {
      return `${BASE_URL}/uploads/banners/${bannerPath}`;
    }

    return `${BASE_URL}/uploads/banners/${bannerPath}`;

  } catch (error) {
    return null;
  }
};

/**
 * Get avatar initial from user data
 * @param {Object} user - User object
 * @returns {string} - Initial character
 */
export const getAvatarInitial = (user) => {
  if (!user) return 'U';
  
  // Try to get the best available name
  const name = user.name || user.username || user.email || '';
  
  if (name && typeof name === 'string' && name.length > 0) {
    return name.charAt(0).toUpperCase();
  }
  
  return 'U';
};

/**
 * Check if user has a valid avatar
 * @param {string|object} avatarData - Avatar data to check
 * @returns {boolean} - Whether avatar exists and is valid
 */
export const hasValidAvatar = (avatarData) => {
  if (!avatarData || avatarData === 'null' || avatarData === 'undefined') {
    return false;
  }
  
  try {
    let avatarPath;
    
    if (typeof avatarData === 'string') {
      avatarPath = avatarData;
    } else if (avatarData && typeof avatarData === 'object') {
      avatarPath = avatarData.url || avatarData.path || avatarData.avatarUrl;
    }
    
    if (!avatarPath || avatarPath === 'null' || avatarPath === 'undefined') {
      return false;
    }
    
    if (typeof avatarPath !== 'string') {
      return false;
    }
    
    // Check if it's a data URL (base64)
    if (avatarPath.startsWith('data:')) return true;
    
    // Check if it's a URL
    if (avatarPath.startsWith('http')) return true;
    
    // Check if it's a local file path
    if (avatarPath.includes('/') || avatarPath.includes('\\')) {
      return true;
    }
    
    // Check if it looks like a filename
    if (avatarPath.includes('avatar-') || avatarPath.length > 0) {
      return true;
    }
    
    return false;
    
  } catch (error) {
    return false;
  }
};

/**
 * Check if user has a valid banner
 * @param {string|object} bannerData - Banner data to check
 * @returns {boolean} - Whether banner exists and is valid
 */
export const hasValidBanner = (bannerData) => {
  if (!bannerData || bannerData === 'null' || bannerData === 'undefined') {
    return false;
  }
  
  try {
    let bannerPath;
    
    if (typeof bannerData === 'string') {
      bannerPath = bannerData;
    } else if (bannerData && typeof bannerData === 'object') {
      bannerPath = bannerData.url || bannerData.path || bannerData.bannerUrl;
    }
    
    if (!bannerPath || bannerPath === 'null' || bannerPath === 'undefined') {
      return false;
    }
    
    if (typeof bannerPath !== 'string') {
      return false;
    }
    
    if (bannerPath.startsWith('data:')) return true;
    if (bannerPath.startsWith('http')) return true;
    if (bannerPath.includes('/uploads/banners/')) return true;
    if (bannerPath.includes('banner-')) return true;
    
    return bannerPath.length > 0;
    
  } catch (error) {
    return false;
  }
};

// Default avatar colors for initials
const AVATAR_COLORS = [
  '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', 
  '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50', 
  '#8BC34A', '#CDDC39', '#FFC107', '#FF9800', '#FF5722'
];

/**
 * Get consistent color based on string (user id or name)
 * @param {string} str - String to generate color from
 * @returns {string} - Color hex code
 */
export const getAvatarColor = (str) => {
  if (!str) return AVATAR_COLORS[0];
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

/**
 * Get avatar props for a user
 * @param {Object} user - User object
 * @returns {Object} - Avatar props (src, initial, color, hasImage)
 */
export const getAvatarProps = (user) => {
  if (!user) {
    return {
      src: null,
      initial: 'U',
      color: AVATAR_COLORS[0],
      hasImage: false
    };
  }
  
  const userId = user.id || user._id || user.userId || '';
  const initial = getAvatarInitial(user);
  const color = getAvatarColor(userId || user.name || user.email || '');
  const src = hasValidAvatar(user.avatar) ? formatAvatarUrl(user.avatar) : null;
  
  return {
    src,
    initial,
    color,
    hasImage: !!src
  };
};

/**
 * Get banner props for a user
 * @param {Object} user - User object
 * @returns {Object} - Banner props (src, hasImage)
 */
export const getBannerProps = (user) => {
  if (!user) {
    return {
      src: null,
      hasImage: false
    };
  }
  
  const src = hasValidBanner(user.banner) ? formatBannerUrl(user.banner) : null;
  
  return {
    src,
    hasImage: !!src
  };
};