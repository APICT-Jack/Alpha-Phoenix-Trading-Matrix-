// src/api/auth.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    // Try to get error message from response
    let errorMessage = `HTTP error! status: ${response.status}`;
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // If response is not JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }
    
    throw new Error(errorMessage);
  }
  
  return response.json();
};

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

export const checkAuth = async () => {
  try {
    console.log('🔐 Checking authentication...');
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.log('❌ No token found in localStorage');
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/auth/check`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    console.log('📥 Auth check response status:', response.status);
    const result = await handleResponse(response);
    console.log('✅ Auth check successful:', result);
    return result;
  } catch (error) {
    console.error('💥 Auth check failed:', error);
    
    // Clear invalid token
    if (error.message.includes('401') || error.message.includes('Not authenticated')) {
      localStorage.removeItem('token');
    }
    
    throw error;
  }
};

export const signIn = async (email, password) => {
  try {
    console.log('🔐 Attempting login for:', email);
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    console.log('📥 Login response status:', response.status);
    const result = await handleResponse(response);
    console.log('✅ Login API response:', result);
    
    // Store token if present in response
    if (result.token) {
      localStorage.setItem('token', result.token);
      console.log('🔑 Token stored in localStorage');
    }
    
    return result;
  } catch (error) {
    console.error('💥 Login failed:', error);
    throw error;
  }
};

export const signUp = async (name, email, password, username = '') => {
  try {
    console.log('📝 Attempting signup for:', email);
    
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password, username }),
    });

    console.log('📥 Signup response status:', response.status);
    const result = await handleResponse(response);
    console.log('✅ Signup API response:', result);
    
    return result;
  } catch (error) {
    console.error('💥 Signup failed:', error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    console.log('👋 Attempting logout...');
    const token = localStorage.getItem('token');
    
    if (token) {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      console.log('📥 Logout response status:', response.status);
      await handleResponse(response);
    }
    
    // Always clear local token regardless of API call result
    localStorage.removeItem('token');
    console.log('🔑 Token removed from localStorage');
    
    return true;
  } catch (error) {
    console.error('💥 Logout failed:', error);
    
    // Still clear token even if API call fails
    localStorage.removeItem('token');
    throw error;
  }
};

// Additional auth-related functions
export const verifyOTP = async (email, otpCode) => {
  try {
    console.log('🔢 Verifying OTP for:', email);
    
    const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otpCode }),
    });

    console.log('📥 OTP verification response status:', response.status);
    const result = await handleResponse(response);
    console.log('✅ OTP verification response:', result);
    
    return result;
  } catch (error) {
    console.error('💥 OTP verification failed:', error);
    throw error;
  }
};

export const resendOTP = async (email) => {
  try {
    console.log('🔄 Resending OTP for:', email);
    
    const response = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    console.log('📥 Resend OTP response status:', response.status);
    const result = await handleResponse(response);
    console.log('✅ Resend OTP response:', result);
    
    return result;
  } catch (error) {
    console.error('💥 Resend OTP failed:', error);
    throw error;
  }
};

// Token management utilities
export const getToken = () => {
  return localStorage.getItem('token');
};

export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token;
};

export const clearAuth = () => {
  localStorage.removeItem('token');
  console.log('🧹 Auth data cleared');
};