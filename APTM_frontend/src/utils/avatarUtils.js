// utils/avatarUtils.js - COMPLETE FIXED VERSION

/**
 * Get the correct base URL based on environment
 */
const getBaseUrl = () => {
  console.log('🔍 getBaseUrl called:', {
    mode: import.meta.env.MODE,
    prod: import.meta.env.PROD,
    dev: import.meta.env.DEV,
    viteApiUrl: import.meta.env.VITE_API_URL,
    origin: window.location.origin,
    hostname: window.location.hostname
  });

  // Method 1: Use VITE_API_URL if available (for both dev and prod)
  if (import.meta.env.VITE_API_URL) {
    const baseUrl = import.meta.env.VITE_API_URL.replace('/api', '');
    console.log('✅ Using VITE_API_URL:', baseUrl);
    return baseUrl;
  }

  // Method 2: Check if we're on Render domain
  if (window.location.hostname.includes('onrender.com')) {
    console.log('✅ Detected Render domain, using:', window.location.origin);
    return window.location.origin;
  }

  // Method 3: Use window.location.origin in production
  if (import.meta.env.PROD) {
    console.log('✅ Production mode, using:', window.location.origin);
    return window.location.origin;
  }

  // Method 4: Check hostname for localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('✅ Using localhost:', 'http://localhost:5000');
    return 'http://localhost:5000';
  }

  // Final fallback
  console.log('⚠️ Using fallback URL: http://localhost:5000');
  return 'http://localhost:5000';
};

/**
 * Format avatar URL to ensure it's properly constructed
 * @param {string|object} avatarData - Raw avatar path/URL or object containing avatar data
 * @returns {string|null} - Formatted avatar URL or null
 */
export const formatAvatarUrl = (avatarData) => {
  // If it's null, undefined, or empty string, return null silently
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

    console.log('🎨 Formatting avatar URL from:', avatarPath);

    // If it's a data URL (base64), return as is
    if (avatarPath.startsWith('data:')) {
      console.log('✅ Avatar is data URL');
      return avatarPath;
    }

    // CRITICAL FIX: If it's already a full URL with localhost and we're in production, fix it
    if (avatarPath.includes('localhost') && (import.meta.env.PROD || window.location.hostname.includes('onrender.com'))) {
      console.log('⚠️ Found localhost URL in production, fixing...');
      const filename = avatarPath.split('/').pop();
      const baseUrl = getBaseUrl();
      const fixedUrl = `${baseUrl}/uploads/avatars/${filename}`;
      console.log('✅ Fixed avatar URL:', fixedUrl);
      return fixedUrl;
    }

    // If it's already a full URL (not localhost), return as is
    if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
      console.log('✅ Avatar is already a full URL:', avatarPath);
      return avatarPath;
    }

    const baseUrl = getBaseUrl();

    // Handle /uploads paths
    if (avatarPath.startsWith('/uploads/')) {
      const fullUrl = `${baseUrl}${avatarPath}`;
      console.log('✅ Formatted avatar (path):', fullUrl);
      return fullUrl;
    }

    // Handle uploads paths without leading slash
    if (avatarPath.startsWith('uploads/')) {
      const fullUrl = `${baseUrl}/${avatarPath}`;
      console.log('✅ Formatted avatar (uploads):', fullUrl);
      return fullUrl;
    }

    // If it contains avatar- (likely a filename)
    if (avatarPath.includes('avatar-')) {
      const fullUrl = `${baseUrl}/uploads/avatars/${avatarPath}`;
      console.log('✅ Formatted avatar (filename):', fullUrl);
      return fullUrl;
    }

    // Default case - try to construct a path
    const fullUrl = `${baseUrl}/uploads/avatars/${avatarPath}`;
    console.log('✅ Formatted avatar (default):', fullUrl);
    return fullUrl;

  } catch (error) {
    console.error('❌ Error formatting avatar URL:', error);
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

    console.log('🎨 Formatting banner URL from:', bannerPath);

    if (bannerPath.startsWith('data:')) {
      console.log('✅ Banner is data URL');
      return bannerPath;
    }

    // CRITICAL FIX: If it's already a full URL with localhost and we're in production, fix it
    if (bannerPath.includes('localhost') && (import.meta.env.PROD || window.location.hostname.includes('onrender.com'))) {
      console.log('⚠️ Found localhost URL in production, fixing...');
      const filename = bannerPath.split('/').pop();
      const baseUrl = getBaseUrl();
      const fixedUrl = `${baseUrl}/uploads/banners/${filename}`;
      console.log('✅ Fixed banner URL:', fixedUrl);
      return fixedUrl;
    }

    if (bannerPath.startsWith('http://') || bannerPath.startsWith('https://')) {
      console.log('✅ Banner is already a full URL:', bannerPath);
      return bannerPath;
    }

    const baseUrl = getBaseUrl();

    if (bannerPath.startsWith('/uploads/banners/')) {
      const fullUrl = `${baseUrl}${bannerPath}`;
      console.log('✅ Formatted banner (path):', fullUrl);
      return fullUrl;
    }

    if (bannerPath.startsWith('uploads/banners/')) {
      const fullUrl = `${baseUrl}/${bannerPath}`;
      console.log('✅ Formatted banner (uploads):', fullUrl);
      return fullUrl;
    }

    if (bannerPath.includes('banner-')) {
      const fullUrl = `${baseUrl}/uploads/banners/${bannerPath}`;
      console.log('✅ Formatted banner (filename):', fullUrl);
      return fullUrl;
    }

    const fullUrl = `${baseUrl}/uploads/banners/${bannerPath}`;
    console.log('✅ Formatted banner (default):', fullUrl);
    return fullUrl;

  } catch (error) {
    console.error('❌ Error formatting banner URL:', error);
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

// Default export for convenience
export default {
  formatAvatarUrl,
  formatBannerUrl,
  getAvatarInitial,
  hasValidAvatar,
  hasValidBanner,
  getAvatarColor,
  getAvatarProps,
  getBannerProps
};