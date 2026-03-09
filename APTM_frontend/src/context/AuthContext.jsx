import { useState, useEffect, createContext, useContext } from 'react';
import { signIn as signInAPI, signOut as signOutAPI } from '../api/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verify authentication on app load
  useEffect(() => {
    verifyAuth();
  }, []);

  // Helper function to format avatar URL (handles both string and object formats)
  const formatAvatarUrl = (avatarData) => {
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
        avatarPath = avatarData.url || avatarData.path || null;
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

  // Helper function to generate initial
  const generateInitial = (name) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  // Helper to format user data consistently
  const formatUserData = (userData) => {
    return {
      ...userData,
      avatar: formatAvatarUrl(userData.avatar),
      avatarInitial: userData.avatarInitial || generateInitial(userData.name || userData.email)
    };
  };

  const verifyAuth = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔐 Checking authentication status...');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
        console.log('❌ No token found');
        return;
      }

      const response = await fetch('http://localhost:5000/api/profile/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Profile API response:', result);
        
        if (result.success && result.user) {
          const userData = formatUserData(result.user);
          
          setUser(userData);
          setIsAuthenticated(true);
          console.log('🎉 User is authenticated:', userData.email);
          console.log('🖼️ User avatar after verifyAuth:', userData.avatar);
        } else {
          setUser(null);
          setIsAuthenticated(false);
          console.log('❌ User is not authenticated - no user data');
        }
      } else {
        console.log('❌ Invalid token - clearing localStorage');
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('💥 Auth check failed:', error);
      setError(error.message);
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔐 Attempting sign in for:', email);
      
      const result = await signInAPI(email, password);
      console.log('✅ Sign in API response:', result);
      
      if (result.success && result.user && result.token) {
        localStorage.setItem('token', result.token);
        
        const userData = formatUserData(result.user);
        
        setUser(userData);
        setIsAuthenticated(true);
        setError(null);
        
        console.log('🎉 Sign in successful');
        console.log('🖼️ User avatar after signin:', userData.avatar);
        return { success: true, user: userData };
      } else {
        const errorMessage = result?.message || 'Sign in failed';
        setError(errorMessage);
        console.log('❌ Sign in failed:', errorMessage);
        return { success: false, message: errorMessage };
      }
    } catch (error) {
      console.error('💥 Sign in error:', error);
      setError(error.message);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔐 Attempting Google sign in...');
      
      const width = 500;
      const height = 600;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;
      
      const popup = window.open(
        'http://localhost:5000/api/auth/google',
        'Google Sign In',
        `width=${width},height=${height},top=${top},left=${left}`
      );

      return new Promise((resolve, reject) => {
        const handleMessage = (event) => {
          if (event.origin !== 'http://localhost:5000') {
            return;
          }

          const { success, user, token, error: authError } = event.data;
          
          if (success && user && token) {
            localStorage.setItem('token', token);
            
            const userData = formatUserData(user);
            
            setUser(userData);
            setIsAuthenticated(true);
            setError(null);
            
            console.log('🎉 Google sign in successful');
            console.log('🖼️ User avatar after Google signin:', userData.avatar);
            popup.close();
            window.removeEventListener('message', handleMessage);
            resolve({ success: true, user: userData });
          } else if (authError) {
            setError(authError);
            console.log('❌ Google sign in failed:', authError);
            popup.close();
            window.removeEventListener('message', handleMessage);
            resolve({ success: false, message: authError });
          }
        };

        window.addEventListener('message', handleMessage);

        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
          const errorMsg = 'Popup blocked. Please allow popups for this site.';
          setError(errorMsg);
          reject(new Error(errorMsg));
          return;
        }

        const popupCheck = setInterval(() => {
          if (popup.closed) {
            clearInterval(popupCheck);
            window.removeEventListener('message', handleMessage);
            const errorMsg = 'Google sign in was cancelled.';
            setError(errorMsg);
            resolve({ success: false, message: errorMsg });
          }
        }, 500);
      });
    } catch (error) {
      console.error('💥 Google sign in error:', error);
      const errorMessage = error.message || 'Google sign in failed. Please try again.';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (name, email, password, username = '') => {
    try {
      setLoading(true);
      setError(null);
      console.log('📝 Attempting sign up for:', email);
      
      const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, username }),
      });

      const result = await response.json();
      console.log('✅ Sign up API response:', result);
      
      if (result.success) {
        setError(null);
        console.log('🎉 Sign up successful - please check email for verification');
        return { success: true, message: result.message };
      } else {
        const errorMessage = result?.message || 'Sign up failed';
        setError(errorMessage);
        console.log('❌ Sign up failed:', errorMessage);
        return { success: false, message: errorMessage };
      }
    } catch (error) {
      console.error('💥 Sign up error:', error);
      const errorMessage = error.message || 'Network error during sign up';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signUpWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔐 Attempting Google sign up...');
      
      const result = await signInWithGoogle();
      
      if (result.success) {
        console.log('🎉 Google sign up successful');
        return { success: true, user: result.user };
      } else {
        console.log('❌ Google sign up failed:', result.message);
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('💥 Google sign up error:', error);
      const errorMessage = error.message || 'Google sign up failed. Please try again.';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      console.log('👋 Signing out...');
      
      await signOutAPI();
    } catch (error) {
      console.error('💥 Sign out error:', error);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      console.log('✅ User signed out');
    }
  };

  const clearError = () => {
    setError(null);
  };

  // Update user data (useful for profile updates)
  const updateUser = (updatedData) => {
    setUser(prev => {
      const newUser = {
        ...prev,
        ...updatedData,
        avatar: updatedData.avatar ? formatAvatarUrl(updatedData.avatar) : prev?.avatar
      };
      console.log('🔄 User data updated:', newUser);
      return newUser;
    });
  };

  // Update user avatar specifically
  const updateUserAvatar = (avatarUrl, avatarInitial) => {
    setUser(prev => {
      const newUser = {
        ...prev,
        avatar: formatAvatarUrl(avatarUrl),
        avatarInitial: avatarInitial || prev?.avatarInitial
      };
      console.log('🖼️ Avatar updated in context:', newUser.avatar);
      return newUser;
    });
  };

  // Refresh user data from server
  const refreshUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('❌ No token for refresh');
        return;
      }

      const response = await fetch('http://localhost:5000/api/profile/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.user) {
          const userData = formatUserData(result.user);
          setUser(userData);
          console.log('🔄 User data refreshed from server');
          console.log('🖼️ Refreshed avatar:', userData.avatar);
        }
      }
    } catch (error) {
      console.error('💥 Error refreshing user data:', error);
    }
  };

  // Force re-authentication (useful after profile updates)
  const reauthenticate = async () => {
    await verifyAuth();
  };

  // Check if user has specific role or permission
  const hasRole = (role) => {
    return user?.role === role;
  };

  // Check if user profile is complete
  const isProfileComplete = () => {
    if (!user) return false;
    
    const profile = user.profile || {};
    const requiredFields = [
      profile.firstName,
      profile.lastName,
      profile.phone,
      profile.country,
      profile.tradingExperience
    ];

    return requiredFields.every(field => field && field !== '');
  };

  // Get user display name with fallbacks
  const getDisplayName = () => {
    if (!user) return '';
    return user.name || user.username || user.email?.split('@')[0] || 'User';
  };

  // Get user avatar URL with proper formatting
  const getAvatarUrl = () => {
    if (!user?.avatar) return null;
    return formatAvatarUrl(user.avatar);
  };

  // Provide all the values
  const value = {
    // State
    user,
    isAuthenticated,
    loading,
    error,
    
    // Core Authentication Methods
    signIn,
    signInWithGoogle,
    signUp,
    signUpWithGoogle,
    signOut,
    verifyAuth,
    clearError,
    
    // User Data Management
    updateUser,
    updateUserAvatar,
    refreshUserData,
    reauthenticate,
    
    // Utility Methods
    hasRole,
    isProfileComplete,
    getDisplayName,
    getAvatarUrl,
    
    // Setters (use sparingly)
    setUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};