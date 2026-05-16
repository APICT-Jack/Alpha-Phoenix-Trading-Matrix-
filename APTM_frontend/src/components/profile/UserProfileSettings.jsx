// UserProfileSettings.jsx - COMPLETE WITH TRADING CONNECTION

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import TradingConnection from './TradingConnection';
import styles from './UserProfileSettings.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const formatImageUrl = (imagePath, type = 'avatar') => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
  if (imagePath.startsWith('data:')) return imagePath;
  
  let cleanPath = imagePath;
  if (imagePath.includes('/')) cleanPath = imagePath.split('/').pop();
  
  const folders = { avatar: 'avatars', banner: 'banners', gallery: 'gallery', post: 'posts' };
  const folder = folders[type] || type;
  return `${BASE_URL}/uploads/${folder}/${cleanPath}`;
};

const UserProfileSettings = () => {
  const { user, updateUser, refreshUserData } = useAuth();
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState({ type: '', status: false });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('personal');
  const [validationErrors, setValidationErrors] = useState({});
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  
  // Trading stats from connection
  const [tradingStats, setTradingStats] = useState(null);
  const [userBadge, setUserBadge] = useState(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    bio: '',
    phone: '',
    country: '',
    bannerImage: '',
    socialLinks: {
      twitter: '', linkedin: '', website: '', github: '', whatsapp: '', facebook: ''
    },
    privacy: {
      profileVisibility: 'public',
      showTradingStats: true,
      showOnlineStatus: true,
      allowMessages: 'everyone',
      searchEngineIndexing: true
    },
    notifications: {
      email: { marketing: true, security: true, tradingSignals: true, communityUpdates: false },
      push: { priceAlerts: true, signalExecutions: true, chatMessages: true, systemMaintenance: true },
      inApp: { newFollowers: true, postInteractions: true, achievementUnlocks: true }
    },
    trading: {
      defaultChartType: 'candlestick',
      defaultTimeframe: '1h',
      theme: 'dark',
      soundEnabled: true,
      autoRefresh: true
    },
    security: {
      twoFactorEnabled: false,
      loginAlerts: true,
      sessionTimeout: 60,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    },
    data: {
      autoBackup: false,
      backupFrequency: 'weekly',
      exportFormat: 'csv',
      retainDataFor: 24
    }
  });

  const validationRules = {
    firstName: { required: true, minLength: 2, maxLength: 50 },
    lastName: { required: true, minLength: 2, maxLength: 50 },
    username: { required: true, minLength: 3, maxLength: 30, pattern: /^[a-zA-Z0-9_]+$/ },
    phone: { pattern: /^\+?[\d\s-()]{10,}$/ },
    bio: { maxLength: 500 },
    'socialLinks.twitter': { pattern: /^$|^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+$/ },
    'socialLinks.linkedin': { pattern: /^$|^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+$/ },
    'socialLinks.website': { pattern: /^$|^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}/ },
    'socialLinks.github': { pattern: /^$|^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9-]+$/ },
    'socialLinks.whatsapp': { pattern: /^$|^\+?[\d\s-()]{10,}$/ },
    'socialLinks.facebook': { pattern: /^$|^(https?:\/\/)?(www\.)?facebook\.com\/[a-zA-Z0-9.]+$/ },
    'security.sessionTimeout': { min: 5, max: 1440 },
    'security.newPassword': { validate: (value) => !value || value.length >= 8 },
    'security.confirmPassword': { validate: (value, form) => !form.security.newPassword || value === form.security.newPassword }
  };

  useEffect(() => {
    if (user) loadCompleteProfile();
  }, [user]);

  const loadCompleteProfile = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/profile/complete`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error(`Failed to load profile: ${response.status}`);
      
      const result = await response.json();
      
      if (result.success && result.user) {
        const { user: userData } = result;
        const profile = userData.profile || {};

        setFormData({
          firstName: profile.firstName || userData.name?.split(' ')[0] || '',
          lastName: profile.lastName || userData.name?.split(' ').slice(1).join(' ') || '',
          username: userData.username || '',
          bio: profile.bio || '',
          phone: profile.phone || '',
          country: profile.country || '',
          bannerImage: profile.bannerImage || '',
          socialLinks: {
            twitter: profile.socialLinks?.twitter || '',
            linkedin: profile.socialLinks?.linkedin || '',
            website: profile.socialLinks?.website || '',
            github: profile.socialLinks?.github || '',
            whatsapp: profile.socialLinks?.whatsapp || '',
            facebook: profile.socialLinks?.facebook || ''
          },
          privacy: {
            profileVisibility: profile.privacy?.profileVisibility || 'public',
            showTradingStats: profile.privacy?.showTradingStats ?? true,
            showOnlineStatus: profile.privacy?.showOnlineStatus ?? true,
            allowMessages: profile.privacy?.allowMessages || 'everyone',
            searchEngineIndexing: profile.privacy?.searchEngineIndexing ?? true
          },
          notifications: userData.settings?.notifications || formData.notifications,
          trading: userData.settings?.trading || formData.trading,
          security: userData.settings?.security || formData.security,
          data: userData.settings?.data || formData.data
        });
        
        if (userData.tradingStats) setTradingStats(userData.tradingStats);
        if (userData.badge) setUserBadge(userData.badge);
        
        setMessage('Profile loaded successfully');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError(error.message || 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const validateField = (name, value) => {
    const rules = validationRules[name];
    if (!rules) return null;

    if (rules.required && (!value || value.toString().trim() === '')) return 'This field is required';
    if (rules.minLength && value && value.length < rules.minLength) return `Must be at least ${rules.minLength} characters`;
    if (rules.maxLength && value && value.length > rules.maxLength) return `Must be less than ${rules.maxLength} characters`;
    if (rules.pattern && value && value.toString().trim() !== '' && !rules.pattern.test(value)) return 'Invalid format';
    if (rules.min !== undefined && value && parseFloat(value) < rules.min) return `Must be at least ${rules.min}`;
    if (rules.max !== undefined && value && parseFloat(value) > rules.max) return `Must be less than ${rules.max}`;
    if (rules.validate) {
      const isValid = rules.validate(value, formData);
      if (!isValid) return 'Invalid value';
    }
    return null;
  };

  const validateForm = () => {
    const errors = {};
    Object.keys(validationRules).forEach(field => {
      const value = field.includes('.') 
        ? field.split('.').reduce((obj, key) => obj?.[key], formData)
        : formData[field];
      const error = validateField(field, value);
      if (error) errors[field] = error;
    });

    if (formData.security.newPassword && formData.security.confirmPassword) {
      if (formData.security.newPassword !== formData.security.confirmPassword) {
        errors['security.confirmPassword'] = 'Passwords do not match';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (validationErrors[name]) setValidationErrors(prev => ({ ...prev, [name]: null }));

    if (name.includes('.')) {
      const path = name.split('.');
      setFormData(prev => {
        const newData = { ...prev };
        let current = newData;
        for (let i = 0; i < path.length - 1; i++) {
          if (!current[path[i]]) current[path[i]] = {};
          current = current[path[i]];
        }
        const lastKey = path[path.length - 1];
        current[lastKey] = type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) : value;
        return newData;
      });
    } else if (type === 'checkbox') {
      const { value: checkboxValue } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: checked ? [...(prev[name] || []), checkboxValue] : (prev[name] || []).filter(item => item !== checkboxValue)
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError('Please fix the validation errors before submitting');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const token = localStorage.getItem('token');
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        bio: formData.bio,
        phone: formData.phone,
        country: formData.country,
        bannerImage: formData.bannerImage,
        socialLinks: formData.socialLinks,
        privacy: formData.privacy,
        notifications: formData.notifications,
        trading: formData.trading,
        security: formData.security,
        data: formData.data
      };

      const response = await fetch(`${API_URL}/profile/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updateData)
      });

      const result = await response.json();
      
      if (result.success) {
        setMessage('Profile updated successfully!');
        if (result.data?.user) updateUser(result.data.user);
        if (refreshUserData) await refreshUserData();
        setTimeout(() => setMessage(''), 5000);
      } else {
        throw new Error(result.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message || 'Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File size too large. Maximum size is 5MB.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    try {
      setUploading({ type: 'avatar', status: true });
      setError('');

      const token = localStorage.getItem('token');
      const uploadFormData = new FormData();
      uploadFormData.append('avatar', file);

      const response = await fetch(`${API_URL}/profile/avatar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: uploadFormData
      });

      const result = await response.json();
      
      if (result.success) {
        setMessage('Avatar updated successfully!');
        if (result.user && updateUser) updateUser(result.user);
        
        const reader = new FileReader();
        reader.onloadend = () => setAvatarPreview(reader.result);
        reader.readAsDataURL(file);
        
        if (refreshUserData) await refreshUserData();
        setTimeout(() => setMessage(''), 5000);
      } else {
        throw new Error(result.message || 'Failed to upload avatar');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setError(error.message || 'Failed to upload avatar');
    } finally {
      setUploading({ type: '', status: false });
      e.target.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setUploading({ type: 'avatar', status: true });
      setError('');

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/profile/avatar`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      
      if (result.success) {
        setMessage('Avatar removed successfully!');
        if (updateUser) updateUser(prev => ({ ...prev, avatar: null, avatarInitial: result.avatarInitial || 'U' }));
        setAvatarPreview(null);
        setTimeout(() => setMessage(''), 5000);
      } else {
        throw new Error(result.message || 'Failed to remove avatar');
      }
    } catch (error) {
      console.error('Error removing avatar:', error);
      setError(error.message || 'Failed to remove avatar');
    } finally {
      setUploading({ type: '', status: false });
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File size too large. Maximum size is 10MB.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    try {
      setUploading({ type: 'banner', status: true });
      setError('');

      const token = localStorage.getItem('token');
      const uploadFormData = new FormData();
      uploadFormData.append('banner', file);

      const response = await fetch(`${API_URL}/profile/banner`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: uploadFormData
      });

      const result = await response.json();
      
      if (result.success) {
        setMessage('Banner updated successfully!');
        const reader = new FileReader();
        reader.onloadend = () => setBannerPreview(reader.result);
        reader.readAsDataURL(file);
        setFormData(prev => ({ ...prev, bannerImage: result.bannerUrl || result.bannerImage || '' }));
        setTimeout(() => setMessage(''), 5000);
      } else {
        throw new Error(result.message || 'Failed to upload banner');
      }
    } catch (error) {
      console.error('Error uploading banner:', error);
      setError(error.message || 'Failed to upload banner');
    } finally {
      setUploading({ type: '', status: false });
      e.target.value = '';
    }
  };

  const handleRemoveBanner = async () => {
    try {
      setUploading({ type: 'banner', status: true });
      setError('');

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/profile/banner`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      
      if (result.success) {
        setMessage('Banner removed successfully!');
        setBannerPreview(null);
        setFormData(prev => ({ ...prev, bannerImage: '' }));
        setTimeout(() => setMessage(''), 5000);
      } else {
        throw new Error(result.message || 'Failed to remove banner');
      }
    } catch (error) {
      console.error('Error removing banner:', error);
      setError(error.message || 'Failed to remove banner');
    } finally {
      setUploading({ type: '', status: false });
    }
  };

  const handlePasswordUpdate = async () => {
    if (!formData.security.currentPassword) {
      setError('Please enter your current password');
      return;
    }
    if (!formData.security.newPassword) {
      setError('Please enter a new password');
      return;
    }
    if (formData.security.newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }
    if (formData.security.newPassword !== formData.security.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      setSaving(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: formData.security.currentPassword,
          newPassword: formData.security.newPassword
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMessage('Password updated successfully!');
        setFormData(prev => ({
          ...prev,
          security: { ...prev.security, currentPassword: '', newPassword: '', confirmPassword: '' }
        }));
        setTimeout(() => setMessage(''), 5000);
      } else {
        throw new Error(result.message || 'Failed to update password');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      setError(error.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  const handleResetForm = () => {
    if (window.confirm('Are you sure you want to reset all changes?')) {
      loadCompleteProfile();
      setValidationErrors({});
      setMessage('Form reset to saved values');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError('');
    setMessage('');
  };

  const handleBack = () => navigate(-1);

  const handleTradingStatsUpdate = (data) => {
    if (data) {
      setTradingStats(data.tradingStats);
      setUserBadge(data.badge);
    }
  };

  // Options arrays
  const countryOptions = [
    { value: '', label: 'Select Country' },
    { value: 'US', label: 'United States' }, { value: 'CA', label: 'Canada' },
    { value: 'GB', label: 'United Kingdom' }, { value: 'AU', label: 'Australia' },
    { value: 'DE', label: 'Germany' }, { value: 'FR', label: 'France' },
    { value: 'JP', label: 'Japan' }, { value: 'IN', label: 'India' }
  ];

  const privacyOptions = [
    { value: 'public', label: 'Public - Anyone can see my profile' },
    { value: 'followers_only', label: 'Followers Only - Only my followers can see my profile' },
    { value: 'private', label: 'Private - Only I can see my profile' }
  ];

  const messageOptions = [
    { value: 'everyone', label: 'Everyone can message me' },
    { value: 'followers_only', label: 'Only followers can message me' },
    { value: 'nobody', label: 'No one can message me' }
  ];

  const chartTypeOptions = [
    { value: 'candlestick', label: 'Candlestick' },
    { value: 'line', label: 'Line' }, { value: 'bar', label: 'Bar' },
    { value: 'heikin_ashi', label: 'Heikin Ashi' }
  ];

  const timeframeOptions = [
    { value: '1m', label: '1 Minute' }, { value: '5m', label: '5 Minutes' },
    { value: '15m', label: '15 Minutes' }, { value: '1h', label: '1 Hour' },
    { value: '4h', label: '4 Hours' }, { value: '1d', label: '1 Day' },
    { value: '1w', label: '1 Week' }
  ];

  const themeOptions = [
    { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' },
    { value: 'auto', label: 'Auto' }
  ];

  const backupFrequencyOptions = [
    { value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' }
  ];

  const exportFormatOptions = [
    { value: 'csv', label: 'CSV' }, { value: 'json', label: 'JSON' },
    { value: 'excel', label: 'Excel' }
  ];

  if (loading && !user) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${darkMode ? styles.dark : styles.light}`}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <button onClick={handleBack} className={styles.backButton} type="button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back
          </button>
          
          <div className={styles.headerActions}>
            <button onClick={handleResetForm} className={styles.resetButton} type="button" disabled={saving}>
              Reset Changes
            </button>
            <button onClick={loadCompleteProfile} className={styles.refreshButton} type="button" disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        <h1 className={styles.title}>Profile & Settings</h1>
        <p className={styles.subtitle}>Manage your account information, preferences, and trading connections</p>
      </div>

      {message && (
        <div className={`${styles.messageBanner} ${styles.success}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22,4 12,14.01 9,11.01"></polyline>
          </svg>
          {message}
          <button onClick={() => setMessage('')} className={styles.closeMessage}>×</button>
        </div>
      )}

      {error && (
        <div className={`${styles.messageBanner} ${styles.error}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {error}
          <button onClick={() => setError('')} className={styles.closeMessage}>×</button>
        </div>
      )}

      <div className={styles.settingsLayout}>
        <div className={styles.settingsSidebar}>
          <div className={styles.sidebarSection}>
            <h3>Profile</h3>
            <button className={`${styles.sidebarTab} ${activeTab === 'personal' ? styles.active : ''}`} onClick={() => handleTabChange('personal')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Personal Info
            </button>
            
            <button className={`${styles.sidebarTab} ${activeTab === 'social' ? styles.active : ''}`} onClick={() => handleTabChange('social')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
              </svg>
              Social Links
            </button>
          </div>

          <div className={styles.sidebarSection}>
            <h3>Trading</h3>
            <button className={`${styles.sidebarTab} ${activeTab === 'trading-connection' ? styles.active : ''}`} onClick={() => handleTabChange('trading-connection')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
              Connect Account
            </button>
            
            <button className={`${styles.sidebarTab} ${activeTab === 'trading-settings' ? styles.active : ''}`} onClick={() => handleTabChange('trading-settings')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
              Trading Settings
            </button>
          </div>

          <div className={styles.sidebarSection}>
            <h3>Settings</h3>
            <button className={`${styles.sidebarTab} ${activeTab === 'notifications' ? styles.active : ''}`} onClick={() => handleTabChange('notifications')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              Notifications
            </button>

            <button className={`${styles.sidebarTab} ${activeTab === 'security' ? styles.active : ''}`} onClick={() => handleTabChange('security')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              Security
            </button>

            <button className={`${styles.sidebarTab} ${activeTab === 'privacy' ? styles.active : ''}`} onClick={() => handleTabChange('privacy')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              Privacy
            </button>

            <button className={`${styles.sidebarTab} ${activeTab === 'data' ? styles.active : ''}`} onClick={() => handleTabChange('data')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
              Data & Backup
            </button>
          </div>
        </div>

        <div className={styles.settingsContent}>
          <form onSubmit={handleSubmit} className={styles.settingsForm}>
            {/* Avatar & Banner Section */}
            <div className={styles.profileMediaSection}>
              <div className={styles.bannerSection}>
                <div className={styles.bannerContainer}>
                  {bannerPreview ? (
                    <img src={bannerPreview} alt="Banner Preview" className={styles.bannerImage} />
                  ) : formData.bannerImage ? (
                    <img src={formatImageUrl(formData.bannerImage, 'banner')} alt="Profile Banner" className={styles.bannerImage} />
                  ) : (
                    <div className={styles.bannerPlaceholder}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                      <p>Upload a banner image</p>
                    </div>
                  )}
                  {(uploading.type === 'banner' && uploading.status) && (
                    <div className={styles.bannerOverlay}><div className={styles.bannerSpinner}></div></div>
                  )}
                </div>
                <div className={styles.bannerActions}>
                  <label htmlFor="banner-upload" className={styles.bannerUploadBtn}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    {uploading.type === 'banner' && uploading.status ? 'Uploading...' : 'Change Banner'}
                    <input id="banner-upload" type="file" accept="image/*" onChange={handleBannerUpload} className={styles.bannerInput} disabled={uploading.status} />
                  </label>
                  {(formData.bannerImage || bannerPreview) && (
                    <button type="button" onClick={handleRemoveBanner} className={styles.removeBannerBtn} disabled={uploading.status}>Remove Banner</button>
                  )}
                </div>
              </div>

              <div className={styles.avatarSection}>
                <div className={styles.avatarContainer}>
                  <div className={styles.avatarWrapper}>
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Preview" className={styles.avatar} />
                    ) : user?.avatar ? (
                      <img src={formatImageUrl(user.avatar, 'avatar')} alt="Profile" className={styles.avatar} />
                    ) : (
                      <div className={styles.avatarPlaceholder}>{user?.avatarInitial || 'U'}</div>
                    )}
                    {(uploading.type === 'avatar' && uploading.status) && (
                      <div className={styles.avatarOverlay}><div className={styles.avatarSpinner}></div></div>
                    )}
                  </div>
                  <div className={styles.avatarActions}>
                    <label htmlFor="avatar-upload" className={styles.avatarUploadBtn}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                        <circle cx="12" cy="13" r="4"></circle>
                      </svg>
                      {uploading.type === 'avatar' && uploading.status ? 'Uploading...' : 'Change Photo'}
                      <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarUpload} className={styles.avatarInput} disabled={uploading.status} />
                    </label>
                    {user?.avatar && (
                      <button type="button" onClick={handleRemoveAvatar} className={styles.removeAvatarBtn} disabled={uploading.status}>Remove</button>
                    )}
                  </div>
                </div>
                <div className={styles.avatarInfo}>
                  <h3>Profile Media</h3>
                  <p>Upload a banner image (recommended: 1500x500) and profile picture. Max file size: 10MB for banner, 5MB for avatar.</p>
                </div>
              </div>
            </div>

            {/* Personal Information Tab */}
            {activeTab === 'personal' && (
              <div className={styles.tabContent}>
                <h2>Personal Information</h2>
                <p>Update your basic personal information and contact details.</p>
                
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>First Name *{validationErrors.firstName && <span className={styles.errorText}> - {validationErrors.firstName}</span>}</label>
                    <input name="firstName" type="text" value={formData.firstName} onChange={handleInputChange} required className={validationErrors.firstName ? styles.error : ''} />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Last Name *{validationErrors.lastName && <span className={styles.errorText}> - {validationErrors.lastName}</span>}</label>
                    <input name="lastName" type="text" value={formData.lastName} onChange={handleInputChange} required className={validationErrors.lastName ? styles.error : ''} />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Username *{validationErrors.username && <span className={styles.errorText}> - {validationErrors.username}</span>}</label>
                    <input name="username" type="text" value={formData.username} onChange={handleInputChange} required className={validationErrors.username ? styles.error : ''} />
                    <small className={styles.helpText}>Only letters, numbers, and underscores allowed</small>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Email</label>
                    <input type="email" value={user?.email || ''} disabled className={styles.disabled} />
                    <small className={styles.helpText}>Email cannot be changed. Contact support if needed.</small>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Phone Number{validationErrors.phone && <span className={styles.errorText}> - {validationErrors.phone}</span>}</label>
                    <input name="phone" type="tel" value={formData.phone} onChange={handleInputChange} className={validationErrors.phone ? styles.error : ''} />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Country</label>
                    <select name="country" value={formData.country} onChange={handleInputChange} className={styles.select}>
                      {countryOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Bio{validationErrors.bio && <span className={styles.errorText}> - {validationErrors.bio}</span>}</label>
                  <textarea name="bio" value={formData.bio} onChange={handleInputChange} rows="4" maxLength="500" />
                  <div className={styles.textareaInfo}>
                    <small>{formData.bio.length}/500 characters</small>
                    <small>This will be visible on your public profile</small>
                  </div>
                </div>
              </div>
            )}

            {/* Social Links Tab */}
            {activeTab === 'social' && (
              <div className={styles.tabContent}>
                <h2>Social Links</h2>
                <p>Connect your social media profiles.</p>
                
                <div className={styles.formGrid}>
                  {['twitter', 'linkedin', 'github', 'website', 'whatsapp', 'facebook'].map(platform => (
                    <div key={platform} className={styles.formGroup}>
                      <label htmlFor={`socialLinks.${platform}`}>
                        {platform.charAt(0).toUpperCase() + platform.slice(1)}
                        {validationErrors[`socialLinks.${platform}`] && <span className={styles.errorText}> - {validationErrors[`socialLinks.${platform}`]}</span>}
                      </label>
                      <input
                        id={`socialLinks.${platform}`}
                        name={`socialLinks.${platform}`}
                        type="url"
                        value={formData.socialLinks[platform]}
                        onChange={handleInputChange}
                        className={validationErrors[`socialLinks.${platform}`] ? styles.error : ''}
                        placeholder={`https://${platform}.com/username`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trading Connection Tab */}
            {activeTab === 'trading-connection' && (
              <div className={styles.tabContent}>
                <h2>Trading Account Connection</h2>
                <p>Connect your MetaTrader accounts to sync trading data and earn badges based on real performance.</p>
                
                {userBadge && userBadge.level !== 'novice' && (
                  <div className={styles.currentBadgeSection}>
                    <h3>Your Current Badge</h3>
                    <div className={styles.currentBadge} style={{ borderColor: userBadge.color }}>
                      <span className={styles.badgeIconLarge}>{userBadge.icon}</span>
                      <div className={styles.badgeInfo}>
                        <div className={styles.badgeTitle}>{userBadge.title}</div>
                        <div className={styles.badgeDescription}>{userBadge.description}</div>
                        <div className={styles.badgeScore}>Score: {userBadge.score}</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {tradingStats && tradingStats.totalTrades > 0 && (
                  <div className={styles.currentStatsSection}>
                    <h3>Your Trading Performance</h3>
                    <div className={styles.statsPreview}>
                      <div className={styles.statPreviewCard}>
                        <span className={styles.statPreviewLabel}>Total Trades</span>
                        <span className={styles.statPreviewValue}>{tradingStats.totalTrades}</span>
                      </div>
                      <div className={styles.statPreviewCard}>
                        <span className={styles.statPreviewLabel}>Win Rate</span>
                        <span className={styles.statPreviewValue}>{tradingStats.winRate}%</span>
                      </div>
                      <div className={styles.statPreviewCard}>
                        <span className={styles.statPreviewLabel}>Profit Factor</span>
                        <span className={styles.statPreviewValue}>{tradingStats.profitFactor}</span>
                      </div>
                      <div className={styles.statPreviewCard}>
                        <span className={styles.statPreviewLabel}>Net Profit</span>
                        <span className={styles.statPreviewValue}>${tradingStats.totalNetProfit?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <TradingConnection onStatsUpdate={handleTradingStatsUpdate} />
              </div>
            )}

            {/* Trading Settings Tab */}
            {activeTab === 'trading-settings' && (
              <div className={styles.tabContent}>
                <h2>Trading Settings</h2>
                <p>Configure your trading interface preferences.</p>
                
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Default Chart Type</label>
                    <select name="trading.defaultChartType" value={formData.trading.defaultChartType} onChange={handleInputChange} className={styles.select}>
                      {chartTypeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Default Timeframe</label>
                    <select name="trading.defaultTimeframe" value={formData.trading.defaultTimeframe} onChange={handleInputChange} className={styles.select}>
                      {timeframeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Chart Theme</label>
                    <select name="trading.theme" value={formData.trading.theme} onChange={handleInputChange} className={styles.select}>
                      {themeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className={styles.settingsSection}>
                  <h3>Preferences</h3>
                  <div className={styles.checkboxGroup}>
                    <label className={styles.checkboxLabel}>
                      <input type="checkbox" name="trading.soundEnabled" checked={formData.trading.soundEnabled} onChange={handleInputChange} />
                      <span className={styles.checkboxCustom}></span> Enable Sound Effects
                    </label>
                    <label className={styles.checkboxLabel}>
                      <input type="checkbox" name="trading.autoRefresh" checked={formData.trading.autoRefresh} onChange={handleInputChange} />
                      <span className={styles.checkboxCustom}></span> Auto-Refresh Charts
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className={styles.tabContent}>
                <h2>Notification Preferences</h2>
                
                <div className={styles.settingsSection}>
                  <h3>Email Notifications</h3>
                  <div className={styles.checkboxGroup}>
                    {['marketing', 'security', 'tradingSignals', 'communityUpdates'].map(type => (
                      <label key={type} className={styles.checkboxLabel}>
                        <input type="checkbox" name={`notifications.email.${type}`} checked={formData.notifications.email[type]} onChange={handleInputChange} />
                        <span className={styles.checkboxCustom}></span> {type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, ' $1')}
                      </label>
                    ))}
                  </div>
                </div>

                <div className={styles.settingsSection}>
                  <h3>Push Notifications</h3>
                  <div className={styles.checkboxGroup}>
                    {['priceAlerts', 'signalExecutions', 'chatMessages', 'systemMaintenance'].map(type => (
                      <label key={type} className={styles.checkboxLabel}>
                        <input type="checkbox" name={`notifications.push.${type}`} checked={formData.notifications.push[type]} onChange={handleInputChange} />
                        <span className={styles.checkboxCustom}></span> {type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, ' $1')}
                      </label>
                    ))}
                  </div>
                </div>

                <div className={styles.settingsSection}>
                  <h3>In-App Notifications</h3>
                  <div className={styles.checkboxGroup}>
                    {['newFollowers', 'postInteractions', 'achievementUnlocks'].map(type => (
                      <label key={type} className={styles.checkboxLabel}>
                        <input type="checkbox" name={`notifications.inApp.${type}`} checked={formData.notifications.inApp[type]} onChange={handleInputChange} />
                        <span className={styles.checkboxCustom}></span> {type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, ' $1')}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className={styles.tabContent}>
                <h2>Security Settings</h2>
                
                <div className={styles.settingsSection}>
                  <h3>Update Password</h3>
                  <div className={styles.formGroup}>
                    <label>Current Password</label>
                    <input name="security.currentPassword" type="password" value={formData.security.currentPassword} onChange={handleInputChange} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>New Password{validationErrors['security.newPassword'] && <span className={styles.errorText}> - {validationErrors['security.newPassword']}</span>}</label>
                    <input name="security.newPassword" type="password" value={formData.security.newPassword} onChange={handleInputChange} />
                    <small className={styles.helpText}>Minimum 8 characters with letters and numbers</small>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Confirm New Password{validationErrors['security.confirmPassword'] && <span className={styles.errorText}> - {validationErrors['security.confirmPassword']}</span>}</label>
                    <input name="security.confirmPassword" type="password" value={formData.security.confirmPassword} onChange={handleInputChange} />
                  </div>
                  <button type="button" className={styles.primaryBtn} onClick={handlePasswordUpdate} disabled={saving}>
                    {saving ? 'Updating...' : 'Update Password'}
                  </button>
                </div>

                <div className={styles.settingsSection}>
                  <h3>Security Features</h3>
                  <div className={styles.checkboxGroup}>
                    <label className={styles.checkboxLabel}>
                      <input type="checkbox" name="security.twoFactorEnabled" checked={formData.security.twoFactorEnabled} onChange={handleInputChange} />
                      <span className={styles.checkboxCustom}></span> Enable Two-Factor Authentication
                    </label>
                    <label className={styles.checkboxLabel}>
                      <input type="checkbox" name="security.loginAlerts" checked={formData.security.loginAlerts} onChange={handleInputChange} />
                      <span className={styles.checkboxCustom}></span> Login Alerts
                    </label>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Session Timeout (minutes){validationErrors['security.sessionTimeout'] && <span className={styles.errorText}> - {validationErrors['security.sessionTimeout']}</span>}</label>
                    <input name="security.sessionTimeout" type="number" min="5" max="1440" value={formData.security.sessionTimeout} onChange={handleInputChange} />
                    <small className={styles.helpText}>Automatically log out after inactivity</small>
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className={styles.tabContent}>
                <h2>Privacy Settings</h2>
                
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Profile Visibility</label>
                    <select name="privacy.profileVisibility" value={formData.privacy.profileVisibility} onChange={handleInputChange} className={styles.select}>
                      {privacyOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Who Can Message Me</label>
                    <select name="privacy.allowMessages" value={formData.privacy.allowMessages} onChange={handleInputChange} className={styles.select}>
                      {messageOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className={styles.settingsSection}>
                  <h3>Display Preferences</h3>
                  <div className={styles.checkboxGroup}>
                    <label className={styles.checkboxLabel}>
                      <input type="checkbox" name="privacy.showTradingStats" checked={formData.privacy.showTradingStats} onChange={handleInputChange} />
                      <span className={styles.checkboxCustom}></span> Show Trading Statistics
                    </label>
                    <label className={styles.checkboxLabel}>
                      <input type="checkbox" name="privacy.showOnlineStatus" checked={formData.privacy.showOnlineStatus} onChange={handleInputChange} />
                      <span className={styles.checkboxCustom}></span> Show Online Status
                    </label>
                    <label className={styles.checkboxLabel}>
                      <input type="checkbox" name="privacy.searchEngineIndexing" checked={formData.privacy.searchEngineIndexing} onChange={handleInputChange} />
                      <span className={styles.checkboxCustom}></span> Allow Search Engine Indexing
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Data & Backup Tab */}
            {activeTab === 'data' && (
              <div className={styles.tabContent}>
                <h2>Data & Backup Settings</h2>
                
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Backup Frequency</label>
                    <select name="data.backupFrequency" value={formData.data.backupFrequency} onChange={handleInputChange} className={styles.select}>
                      {backupFrequencyOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Export Format</label>
                    <select name="data.exportFormat" value={formData.data.exportFormat} onChange={handleInputChange} className={styles.select}>
                      {exportFormatOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Retain Data For (months)</label>
                    <input name="data.retainDataFor" type="number" min="1" max="120" value={formData.data.retainDataFor} onChange={handleInputChange} />
                  </div>
                </div>

                <div className={styles.settingsSection}>
                  <div className={styles.checkboxGroup}>
                    <label className={styles.checkboxLabel}>
                      <input type="checkbox" name="data.autoBackup" checked={formData.data.autoBackup} onChange={handleInputChange} />
                      <span className={styles.checkboxCustom}></span> Automatic Data Backup
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Section */}
            <div className={styles.formActions}>
              {Object.keys(validationErrors).length > 0 && (
                <div className={styles.validationSummary}>
                  <strong>Please fix {Object.keys(validationErrors).length} error(s) before saving:</strong>
                  <ul>
                    {Object.entries(validationErrors).slice(0, 3).map(([field, error]) => (
                      <li key={field}>• {field}: {error}</li>
                    ))}
                    {Object.keys(validationErrors).length > 3 && <li>... and {Object.keys(validationErrors).length - 3} more</li>}
                  </ul>
                </div>
              )}
              
              <div className={styles.actionButtons}>
                <button type="button" onClick={handleResetForm} className={styles.secondaryBtn} disabled={saving}>Reset Changes</button>
                <button type="submit" disabled={saving || Object.keys(validationErrors).length > 0} className={styles.primaryBtn}>
                  {saving ? 'Saving Changes...' : 'Save All Changes'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfileSettings;