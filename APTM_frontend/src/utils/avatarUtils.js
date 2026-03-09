// utils/avatarUtils.js

export const formatAvatarUrl = (avatarData) => {
  if (!avatarData) {
    console.log('❌ No avatar data provided');
    return null;
  }

  console.log('🖼️ Raw avatar data in formatAvatarUrl:', avatarData);
  console.log('🖼️ Avatar data type:', typeof avatarData);

  try {
    // Extract the avatar path from different possible formats
    let avatarPath;

    if (typeof avatarData === 'string') {
      // Old format: avatar is a direct string path
      avatarPath = avatarData;
      console.log('📝 Using string avatar path:', avatarPath);
    } else if (avatarData && typeof avatarData === 'object') {
      // New format: avatar is an object with url property
      avatarPath = avatarData.url || avatarData.path || avatarData.avatarUrl || null;
      console.log('📝 Using object avatar path:', avatarPath);
    } else {
      console.error('❌ Unexpected avatar data format:', typeof avatarData, avatarData);
      return null;
    }

    // Check if we have a valid path
    if (!avatarPath) {
      console.log('❌ No avatar path found in data');
      return null;
    }

    // Ensure avatarPath is a string before using string methods
    if (typeof avatarPath !== 'string') {
      console.error('❌ Avatar path is not a string:', typeof avatarPath, avatarPath);
      return null;
    }

    console.log('🔗 Final avatar path to format:', avatarPath);

    // If it's already a full URL, return as is
    if (avatarPath.startsWith('http')) {
      console.log('🌐 Already full URL, returning as is');
      return avatarPath;
    }

    // If it starts with /uploads, prepend the base URL
    if (avatarPath.startsWith('/uploads')) {
      const url = `http://localhost:5000${avatarPath}`;
      console.log('🔗 Formatted uploads URL:', url);
      return url;
    }

    // If it's just a filename, construct the full path
    if (avatarPath.includes('avatar-')) {
      const url = `http://localhost:5000/uploads/avatars/${avatarPath}`;
      console.log('🔗 Formatted filename URL:', url);
      return url;
    }

    // Default case - assume it's a relative path
    const url = `http://localhost:5000${avatarPath}`;
    console.log('🔗 Default formatted URL:', url);
    return url;

  } catch (error) {
    console.error('💥 Error in formatAvatarUrl:', error);
    return null;
  }
};

export const getAvatarInitial = (user) => {
  if (user?.name) return user.name.charAt(0).toUpperCase();
  if (user?.username) return user.username.charAt(0).toUpperCase();
  if (user?.email) return user.email.charAt(0).toUpperCase();
  return 'U';
};

export const hasValidAvatar = (avatarData) => {
  if (!avatarData) return false;
  
  try {
    // Extract the actual path from the data
    let avatarPath;
    
    if (typeof avatarData === 'string') {
      avatarPath = avatarData;
    } else if (avatarData && typeof avatarData === 'object') {
      avatarPath = avatarData.url || avatarData.path || avatarData.avatarUrl;
    }
    
    // Check if we have a valid path
    if (!avatarPath || typeof avatarPath !== 'string') {
      return false;
    }
    
    // Check if it's a data URL (base64)
    if (avatarPath.startsWith('data:')) return true;
    
    // Check if it's a URL
    if (avatarPath.startsWith('http')) return true;
    
    // Check if it's a local file path
    if (avatarPath.includes('/') || avatarPath.includes('\\') || avatarPath.includes('avatar-')) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking avatar validity:', error);
    return false;
  }
};
// In avatarUtils.js, add:

export const formatBannerUrl = (bannerData) => {
  if (!bannerData) return null;
  
  if (typeof bannerData === 'string') {
    if (bannerData.startsWith('http')) {
      return bannerData;
    }
    // Handle local file paths
    if (bannerData.startsWith('/uploads/banners/')) {
      return `http://localhost:5000${bannerData}`;
    }
    if (bannerData.includes('banners/')) {
      return `http://localhost:5000/uploads/${bannerData}`;
    }
    return `http://localhost:5000/uploads/banners/${bannerData}`;
  }
  
  return null;
};