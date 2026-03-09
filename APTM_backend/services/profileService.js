// services/profileService.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

class ProfileService {
  constructor() {
    this.token = localStorage.getItem('token');
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Add request interceptor for token refresh
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Get complete profile with settings
  async getCompleteProfile() {
    try {
      const response = await this.client.get('/profile/complete');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to load profile');
    }
  }

  // Update complete profile and settings
  async updateCompleteProfile(profileData) {
    try {
      const response = await this.client.put('/profile/complete', profileData);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to update profile');
    }
  }

  // Upload avatar
  async uploadAvatar(file) {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await axios.post(`${API_BASE_URL}/profile/avatar`, formData, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to upload avatar');
    }
  }

  // Remove avatar
  async removeAvatar() {
    try {
      const response = await this.client.delete('/profile/avatar');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to remove avatar');
    }
  }

  // Get user settings only
  async getUserSettings() {
    try {
      const response = await this.client.get('/profile/settings');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to load settings');
    }
  }

  // Update user settings only
  async updateUserSettings(settings) {
    try {
      const response = await this.client.put('/profile/settings', settings);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to update settings');
    }
  }

  // Handle API errors
  handleError(error, defaultMessage) {
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }
    if (error.message === 'Network Error') {
      return new Error('Network error. Please check your connection.');
    }
    return new Error(defaultMessage);
  }
}

export default new ProfileService();