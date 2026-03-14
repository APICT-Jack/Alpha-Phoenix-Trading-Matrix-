// UserProfileSettings.jsx - COMPLETE FIXED VERSION
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import styles from './UserProfileSettings.module.css';

// Constants for API URLs
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

// Helper function to format image URLs
const formatImageUrl = (imagePath, type = 'avatar') => {
  if (!imagePath) return null;
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If it's a data URL, return as is
  if (imagePath.startsWith('data:')) {
    return imagePath;
  }
  
  // Extract just the filename if it contains path
  let cleanPath = imagePath;
  if (imagePath.includes('/')) {
    cleanPath = imagePath.split('/').pop();
  }
  
  const folders = {
    avatar: 'avatars',
    banner: 'banners',
    addressProof: 'address-proofs'
  };
  
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
  const [addressProofPreview, setAddressProofPreview] = useState(null);
  const [connectedAccounts, setConnectedAccounts] = useState([]);

  // Complete form state including all profile and settings fields
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    username: '',
    bio: '',
    phone: '',
    country: '',
    timezone: 'UTC',
    dateOfBirth: '',
    gender: '',
    
    // Banner Image
    bannerImage: '',
    
    // Trading Profile
    tradingExperience: 'beginner',
    preferredMarkets: [],
    riskAppetite: 'medium',
    
    // Trading Platform Connections
    tradingPlatforms: {
      mt4: { connected: false, accountId: '', broker: '', server: '' },
      mt5: { connected: false, accountId: '', broker: '', server: '' },
      tradingview: { connected: false, username: '', accountType: '' }
    },
    
    // Synthetic Indices
    syntheticIndices: [],
    
    // Interests & Skills
    interests: [],
    skills: [],
    
    // New skill form
    newSkill: { name: '', level: 'beginner', category: 'technical' },
    
    // Identification
    idNumber: '',
    
    // Privacy Settings
    privacy: {
      profileVisibility: 'public',
      showTradingStats: true,
      showPortfolioValue: false,
      showOnlineStatus: true,
      allowMessages: 'everyone',
      showDateOfBirth: false,
      showGender: false,
      showAddress: false,
      searchEngineIndexing: true
    },
    
    // Address Information
    address: {
      streetAddress: '',
      town: '',
      city: '',
      province: '',
      postCode: ''
    },
    
    // Address Proof
    addressProof: {
      documentUrl: '',
      documentType: '',
      verified: false,
      uploadedAt: null
    },
    
    // Social Links
    socialLinks: {
      twitter: '',
      linkedin: '',
      website: '',
      github: '',
      whatsapp: '',
      facebook: ''
    },

    // Notification Settings
    notifications: {
      email: {
        marketing: true,
        security: true,
        tradingSignals: true,
        communityUpdates: false
      },
      push: {
        priceAlerts: true,
        signalExecutions: true,
        chatMessages: true,
        systemMaintenance: true
      },
      inApp: {
        newFollowers: true,
        postInteractions: true,
        achievementUnlocks: true
      }
    },

    // Trading Settings
    trading: {
      defaultChartType: 'candlestick',
      defaultTimeframe: '1h',
      theme: 'dark',
      soundEnabled: true,
      autoRefresh: true,
      defaultOrderSize: 0.01,
      riskPerTrade: 1
    },

    // Security Settings
    security: {
      twoFactorEnabled: false,
      loginAlerts: true,
      sessionTimeout: 60,
      allowedIPs: [],
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    },

    // Data & Backup Settings
    data: {
      autoBackup: false,
      backupFrequency: 'weekly',
      exportFormat: 'csv',
      retainDataFor: 24
    }
  });

  // Validation rules
  const validationRules = {
    firstName: { required: true, minLength: 2, maxLength: 50 },
    lastName: { required: true, minLength: 2, maxLength: 50 },
    username: { required: true, minLength: 3, maxLength: 30, pattern: /^[a-zA-Z0-9_]+$/ },
    phone: { pattern: /^\+?[\d\s-()]{10,}$/ },
    bio: { maxLength: 500 },
    idNumber: { minLength: 5, maxLength: 50 },
    dateOfBirth: { validate: (value) => !value || new Date(value) < new Date() },
    'socialLinks.twitter': { pattern: /^$|^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+$/ },
    'socialLinks.linkedin': { pattern: /^$|^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+$/ },
    'socialLinks.website': { pattern: /^$|^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}/ },
    'socialLinks.github': { pattern: /^$|^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9-]+$/ },
    'socialLinks.whatsapp': { pattern: /^$|^\+?[\d\s-()]{10,}$/ },
    'socialLinks.facebook': { pattern: /^$|^(https?:\/\/)?(www\.)?facebook\.com\/[a-zA-Z0-9.]+$/ },
    'address.postCode': { pattern: /^[a-zA-Z0-9\s-]*$/ },
    'trading.defaultOrderSize': { min: 0.001, max: 1000 },
    'trading.riskPerTrade': { min: 0.1, max: 100 },
    'security.sessionTimeout': { min: 5, max: 1440 },
    'security.newPassword': { validate: (value) => !value || value.length >= 8 },
    'security.confirmPassword': { validate: (value, form) => 
      !form.security.newPassword || value === form.security.newPassword 
    }
  };

  // Load user profile data
  useEffect(() => {
    if (user) {
      loadCompleteProfile();
    }
  }, [user]);

  // Load connected trading accounts
  const loadTradingAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/trading/accounts`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setConnectedAccounts(result.accounts || []);
        }
      }
    } catch (error) {
      console.error('Error loading trading accounts:', error);
    }
  };

  const loadCompleteProfile = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/profile/complete`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load profile: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.user) {
        const { user: userData } = result;
        const profile = userData.profile || {};
        const settings = userData.settings || {};

        const loadedData = {
          firstName: profile.firstName || userData.name?.split(' ')[0] || '',
          lastName: profile.lastName || userData.name?.split(' ').slice(1).join(' ') || '',
          username: userData.username || '',
          bio: profile.bio || '',
          phone: profile.phone || '',
          country: profile.country || '',
          timezone: profile.timezone || 'UTC',
          dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '',
          gender: profile.gender || '',
          
          // Banner image - store only filename
          bannerImage: profile.bannerImage || '',
          
          tradingExperience: profile.tradingExperience || 'beginner',
          preferredMarkets: profile.preferredMarkets || [],
          riskAppetite: profile.riskAppetite || 'medium',
          
          tradingPlatforms: profile.tradingPlatforms || formData.tradingPlatforms,
          
          syntheticIndices: profile.syntheticIndices || [],
          
          interests: profile.interests || [],
          skills: profile.skills || [],
          newSkill: { name: '', level: 'beginner', category: 'technical' },
          
          idNumber: profile.idNumber || '',
          
          privacy: {
            profileVisibility: profile.privacy?.profileVisibility || 'public',
            showTradingStats: profile.privacy?.showTradingStats ?? true,
            showPortfolioValue: profile.privacy?.showPortfolioValue ?? false,
            showOnlineStatus: profile.privacy?.showOnlineStatus ?? true,
            allowMessages: profile.privacy?.allowMessages || 'everyone',
            showDateOfBirth: profile.privacy?.showDateOfBirth ?? false,
            showGender: profile.privacy?.showGender ?? false,
            showAddress: profile.privacy?.showAddress ?? false,
            searchEngineIndexing: profile.privacy?.searchEngineIndexing ?? true
          },
          
          address: profile.address || {
            streetAddress: '', town: '', city: '', province: '', postCode: ''
          },
          
          addressProof: profile.addressProof || formData.addressProof,
          
          socialLinks: {
            twitter: profile.socialLinks?.twitter || '',
            linkedin: profile.socialLinks?.linkedin || '',
            website: profile.socialLinks?.website || '',
            github: profile.socialLinks?.github || '',
            whatsapp: profile.socialLinks?.whatsapp || '',
            facebook: profile.socialLinks?.facebook || ''
          },

          notifications: settings.notifications || formData.notifications,
          trading: settings.trading || formData.trading,
          security: settings.security || formData.security,
          data: settings.data || formData.data
        };

        setFormData(loadedData);
        
        // Load connected accounts
        await loadTradingAccounts();
        
        setMessage('Profile loaded successfully');
        setTimeout(() => setMessage(''), 3000);
      } else {
        throw new Error(result.message || 'Failed to load profile data');
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

    if (rules.required && (!value || value.toString().trim() === '')) {
      return 'This field is required';
    }

    if (rules.minLength && value && value.length < rules.minLength) {
      return `Must be at least ${rules.minLength} characters`;
    }

    if (rules.maxLength && value && value.length > rules.maxLength) {
      return `Must be less than ${rules.maxLength} characters`;
    }

    if (rules.pattern && value && value.toString().trim() !== '' && !rules.pattern.test(value)) {
      return 'Invalid format';
    }

    if (rules.min !== undefined && value && parseFloat(value) < rules.min) {
      return `Must be at least ${rules.min}`;
    }

    if (rules.max !== undefined && value && parseFloat(value) > rules.max) {
      return `Must be less than ${rules.max}`;
    }

    if (rules.validate) {
      const isValid = rules.validate(value, formData);
      if (!isValid) {
        return 'Invalid value';
      }
    }

    return null;
  };

  const validateForm = () => {
    const errors = {};

    // Validate main fields
    Object.keys(validationRules).forEach(field => {
      const value = field.includes('.') 
        ? field.split('.').reduce((obj, key) => obj?.[key], formData)
        : formData[field];
      
      const error = validateField(field, value);
      if (error) {
        errors[field] = error;
      }
    });

    // Custom validation for date of birth
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const minDate = new Date();
      minDate.setFullYear(today.getFullYear() - 150);
      
      if (birthDate > today) {
        errors.dateOfBirth = 'Date of birth cannot be in the future';
      } else if (birthDate < minDate) {
        errors.dateOfBirth = 'Please enter a valid date of birth';
      }
      
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 13) {
        errors.dateOfBirth = 'You must be at least 13 years old';
      }
    }

    // Validate password match
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
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }

    if (name.includes('.')) {
      const path = name.split('.');
      setFormData(prev => {
        const newData = { ...prev };
        let current = newData;
        
        for (let i = 0; i < path.length - 1; i++) {
          current = current[path[i]];
        }
        
        const lastKey = path[path.length - 1];
        current[lastKey] = type === 'checkbox' ? checked : 
                          type === 'number' ? parseFloat(value) : value;
        
        return newData;
      });

      // Validate nested field
      const error = validateField(name, type === 'checkbox' ? checked : value);
      if (error) {
        setValidationErrors(prev => ({
          ...prev,
          [name]: error
        }));
      }
    } else if (type === 'checkbox') {
      const { value: checkboxValue } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: checked 
          ? [...(prev[name] || []), checkboxValue]
          : (prev[name] || []).filter(item => item !== checkboxValue)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) : value
      }));

      const error = validateField(name, value);
      if (error) {
        setValidationErrors(prev => ({
          ...prev,
          [name]: error
        }));
      }
    }
  };

  const handleSkillInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      newSkill: {
        ...prev.newSkill,
        [name]: value
      }
    }));
  };

  const handleAddSkill = () => {
    if (!formData.newSkill.name.trim()) {
      setError('Please enter a skill name');
      return;
    }

    setFormData(prev => ({
      ...prev,
      skills: [...prev.skills, { ...prev.newSkill }],
      newSkill: { name: '', level: 'beginner', category: 'technical' }
    }));
    setMessage('Skill added successfully');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleRemoveSkill = (index) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const handlePlatformConnect = async (platform) => {
    try {
      setUploading({ type: 'platform', status: true });
      setError('');
      
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/profile/connect/platform`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          platform,
          accountId: formData.tradingPlatforms[platform]?.accountId || '',
          broker: formData.tradingPlatforms[platform]?.broker || '',
          server: formData.tradingPlatforms[platform]?.server || ''
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMessage(`${platform.toUpperCase()} account connected successfully!`);
        
        setFormData(prev => ({
          ...prev,
          tradingPlatforms: {
            ...prev.tradingPlatforms,
            [platform]: {
              ...prev.tradingPlatforms[platform],
              connected: true
            }
          }
        }));
        
        await loadTradingAccounts();
        setTimeout(() => setMessage(''), 5000);
      } else {
        throw new Error(result.message || `Failed to connect ${platform} account`);
      }
    } catch (error) {
      console.error(`Error connecting ${platform}:`, error);
      setError(error.message || `Failed to connect ${platform} account`);
    } finally {
      setUploading({ type: '', status: false });
    }
  };

  const handlePlatformDisconnect = async (platform, accountId) => {
    if (!window.confirm(`Are you sure you want to disconnect this ${platform.toUpperCase()} account?`)) {
      return;
    }
    
    try {
      setUploading({ type: 'platform', status: true });
      setError('');
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/profile/disconnect/${accountId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMessage(`${platform.toUpperCase()} account disconnected successfully!`);
        
        setFormData(prev => ({
          ...prev,
          tradingPlatforms: {
            ...prev.tradingPlatforms,
            [platform]: {
              ...prev.tradingPlatforms[platform],
              connected: false,
              accountId: '',
              broker: '',
              server: ''
            }
          }
        }));
        
        await loadTradingAccounts();
        setTimeout(() => setMessage(''), 5000);
      } else {
        throw new Error(result.message || `Failed to disconnect ${platform} account`);
      }
    } catch (error) {
      console.error(`Error disconnecting ${platform}:`, error);
      setError(error.message || `Failed to disconnect ${platform} account`);
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
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: uploadFormData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setMessage('Banner updated successfully!');
        
        const reader = new FileReader();
        reader.onloadend = () => {
          setBannerPreview(reader.result);
        };
        reader.readAsDataURL(file);
        
        // Store only the filename
        setFormData(prev => ({
          ...prev,
          bannerImage: result.bannerImage || ''
        }));

        setTimeout(() => setMessage(''), 5000);
      } else {
        throw new Error(result.message || 'Failed to upload banner');
      }
    } catch (error) {
      console.error('Error uploading banner:', error);
      setError(error.message || 'Failed to upload banner. Please try again.');
    } finally {
      setUploading({ type: '', status: false });
      e.target.value = '';
    }
  };

  const handleAddressProofUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File size too large. Maximum size is 5MB.');
      return;
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a PDF, JPG, or PNG file.');
      return;
    }

    try {
      setUploading({ type: 'addressProof', status: true });
      setError('');

      const token = localStorage.getItem('token');
      const uploadFormData = new FormData();
      uploadFormData.append('addressProof', file);
      uploadFormData.append('documentType', 'proof_of_residence');

      const response = await fetch(`${API_URL}/profile/address-proof`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: uploadFormData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setMessage('Address proof uploaded successfully! It will be verified shortly.');
        
        const reader = new FileReader();
        reader.onloadend = () => {
          setAddressProofPreview(reader.result);
        };
        reader.readAsDataURL(file);
        
        setFormData(prev => ({
          ...prev,
          addressProof: {
            documentUrl: result.documentUrl || '',
            documentType: result.documentType || '',
            verified: false,
            uploadedAt: new Date()
          }
        }));

        setTimeout(() => setMessage(''), 5000);
      } else {
        throw new Error(result.message || 'Failed to upload address proof');
      }
    } catch (error) {
      console.error('Error uploading address proof:', error);
      setError(error.message || 'Failed to upload address proof. Please try again.');
    } finally {
      setUploading({ type: '', status: false });
      e.target.value = '';
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
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
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
          security: {
            ...prev.security,
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          }
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
        timezone: formData.timezone,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        bannerImage: formData.bannerImage,
        tradingExperience: formData.tradingExperience,
        preferredMarkets: formData.preferredMarkets,
        syntheticIndices: formData.syntheticIndices,
        riskAppetite: formData.riskAppetite,
        interests: formData.interests,
        skills: formData.skills,
        idNumber: formData.idNumber,
        privacy: formData.privacy,
        address: formData.address,
        addressProof: formData.addressProof,
        socialLinks: formData.socialLinks,
        tradingPlatforms: formData.tradingPlatforms,
        notifications: formData.notifications,
        trading: formData.trading,
        security: formData.security,
        data: formData.data
      };

      const response = await fetch(`${API_URL}/profile/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();
      
      if (result.success) {
        setMessage('Profile and settings updated successfully!');
        
        if (result.data?.user) {
          updateUser(result.data.user);
        }
        
        if (refreshUserData) {
          await refreshUserData();
        }
        
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
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: uploadFormData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setMessage('Avatar updated successfully!');
        
        if (result.user && updateUser) {
          updateUser(result.user);
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          setAvatarPreview(reader.result);
        };
        reader.readAsDataURL(file);
        
        if (refreshUserData) {
          await refreshUserData();
        }

        setTimeout(() => setMessage(''), 5000);
      } else {
        throw new Error(result.message || 'Failed to upload avatar');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setError(error.message || 'Failed to upload avatar. Please try again.');
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
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (result.success) {
        setMessage('Avatar removed successfully!');
        
        if (updateUser) {
          updateUser(prev => ({
            ...prev,
            avatar: null,
            avatarInitial: result.avatarInitial || 'U'
          }));
        }

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

  const handleRemoveBanner = async () => {
    try {
      setUploading({ type: 'banner', status: true });
      setError('');

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/profile/banner`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
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

  const handleBack = () => {
    navigate(-1);
  };

  // Options data
  const tradingExperienceOptions = [
    { value: 'beginner', label: 'Beginner (0-1 years)' },
    { value: 'intermediate', label: 'Intermediate (1-3 years)' },
    { value: 'advanced', label: 'Advanced (3-5 years)' },
    { value: 'expert', label: 'Expert (5+ years)' }
  ];

  const marketOptions = [
    { value: 'forex', label: 'Forex' },
    { value: 'crypto', label: 'Cryptocurrency' },
    { value: 'stocks', label: 'Stocks' },
    { value: 'commodities', label: 'Commodities' },
    { value: 'indices', label: 'Indices' }
  ];

  const syntheticIndicesOptions = [
    { value: 'synthetic_boom_1000', label: 'Boom 1000 Index' },
    { value: 'synthetic_crash_1000', label: 'Crash 1000 Index' },
    { value: 'synthetic_volatility_10', label: 'Volatility 10 Index' },
    { value: 'synthetic_volatility_25', label: 'Volatility 25 Index' },
    { value: 'synthetic_volatility_50', label: 'Volatility 50 Index' },
    { value: 'synthetic_volatility_75', label: 'Volatility 75 Index' },
    { value: 'synthetic_volatility_100', label: 'Volatility 100 Index' },
    { value: 'synthetic_jump_10', label: 'Jump 10 Index' },
    { value: 'synthetic_jump_25', label: 'Jump 25 Index' },
    { value: 'synthetic_jump_50', label: 'Jump 50 Index' },
    { value: 'synthetic_jump_75', label: 'Jump 75 Index' },
    { value: 'synthetic_jump_100', label: 'Jump 100 Index' }
  ];

  const riskAppetiteOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' }
  ];

  const interestOptions = [
    { value: 'trading', label: 'Trading' },
    { value: 'investing', label: 'Investing' },
    { value: 'analysis', label: 'Market Analysis' },
    { value: 'programming', label: 'Programming' },
    { value: 'data-science', label: 'Data Science' },
    { value: 'blockchain', label: 'Blockchain' },
    { value: 'mentoring', label: 'Mentoring' }
  ];

  const skillLevelOptions = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'expert', label: 'Expert' }
  ];

  const skillCategoryOptions = [
    { value: 'technical', label: 'Technical Skills' },
    { value: 'trading', label: 'Trading Skills' },
    { value: 'analytical', label: 'Analytical Skills' },
    { value: 'soft_skills', label: 'Soft Skills' },
    { value: 'language', label: 'Languages' },
    { value: 'other', label: 'Other' }
  ];

  const genderOptions = [
    { value: '', label: 'Prefer not to say' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'non-binary', label: 'Non-binary' },
    { value: 'other', label: 'Other' }
  ];

  const countryOptions = [
    { value: '', label: 'Select Country' },
    { value: 'US', label: 'United States' },
    { value: 'CA', label: 'Canada' },
    { value: 'GB', label: 'United Kingdom' },
    { value: 'AU', label: 'Australia' },
    { value: 'DE', label: 'Germany' },
    { value: 'FR', label: 'France' },
    { value: 'JP', label: 'Japan' },
    { value: 'IN', label: 'India' },
    { value: 'BR', label: 'Brazil' }
  ];

  const timezoneOptions = [
    { value: 'UTC', label: 'UTC' },
    { value: 'EST', label: 'Eastern Time (EST)' },
    { value: 'PST', label: 'Pacific Time (PST)' },
    { value: 'CET', label: 'Central European Time (CET)' },
    { value: 'GMT', label: 'Greenwich Mean Time (GMT)' }
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
    { value: 'line', label: 'Line' },
    { value: 'bar', label: 'Bar' },
    { value: 'heikin_ashi', label: 'Heikin Ashi' }
  ];

  const timeframeOptions = [
    { value: '1m', label: '1 Minute' },
    { value: '5m', label: '5 Minutes' },
    { value: '15m', label: '15 Minutes' },
    { value: '1h', label: '1 Hour' },
    { value: '4h', label: '4 Hours' },
    { value: '1d', label: '1 Day' },
    { value: '1w', label: '1 Week' }
  ];

  const themeOptions = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'auto', label: 'Auto' }
  ];

  const backupFrequencyOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' }
  ];

  const exportFormatOptions = [
    { value: 'csv', label: 'CSV' },
    { value: 'json', label: 'JSON' },
    { value: 'excel', label: 'Excel' }
  ];

  const addressProofOptions = [
    { value: 'utility_bill', label: 'Utility Bill (Electricity, Water, Gas)' },
    { value: 'bank_statement', label: 'Bank Statement' },
    { value: 'government_letter', label: 'Government Letter' },
    { value: 'tax_document', label: 'Tax Document' },
    { value: 'lease_agreement', label: 'Lease Agreement' },
    { value: 'drivers_license', label: "Driver's License" },
    { value: 'id_card', label: 'National ID Card' }
  ];

  const getLevelBadgeColor = (level) => {
    switch(level) {
      case 'beginner': return '#10b981';
      case 'intermediate': return '#3b82f6';
      case 'advanced': return '#8b5cf6';
      case 'expert': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getLevelLabel = (level) => {
    switch(level) {
      case 'beginner': return 'Beginner';
      case 'intermediate': return 'Intermediate';
      case 'advanced': return 'Advanced';
      case 'expert': return 'Expert';
      default: return level;
    }
  };

  const getCategoryLabel = (category) => {
    return skillCategoryOptions.find(opt => opt.value === category)?.label || category;
  };

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
      {/* Header Section */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <button 
            onClick={handleBack}
            className={styles.backButton}
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back
          </button>
          
          <div className={styles.headerActions}>
            <button 
              onClick={handleResetForm}
              className={styles.resetButton}
              type="button"
              disabled={saving}
            >
              Reset Changes
            </button>
            <button 
              onClick={loadCompleteProfile}
              className={styles.refreshButton}
              type="button"
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        <h1 className={styles.title}>Profile & Settings</h1>
        <p className={styles.subtitle}>Manage your account information, preferences, and settings</p>
      </div>

      {/* Messages */}
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
        {/* Sidebar Navigation */}
        <div className={styles.settingsSidebar}>
          <div className={styles.sidebarSection}>
            <h3>Profile</h3>
            <button 
              className={`${styles.sidebarTab} ${activeTab === 'personal' ? styles.active : ''}`}
              onClick={() => handleTabChange('personal')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Personal Info
            </button>
            
            <button 
              className={`${styles.sidebarTab} ${activeTab === 'trading' ? styles.active : ''}`}
              onClick={() => handleTabChange('trading')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
              Trading Profile
            </button>
            
            <button 
              className={`${styles.sidebarTab} ${activeTab === 'interests' ? styles.active : ''}`}
              onClick={() => handleTabChange('interests')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
              </svg>
              Skills & Interests
            </button>
            
            <button 
              className={`${styles.sidebarTab} ${activeTab === 'address' ? styles.active : ''}`}
              onClick={() => handleTabChange('address')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              Address & Verification
            </button>
            
            <button 
              className={`${styles.sidebarTab} ${activeTab === 'social' ? styles.active : ''}`}
              onClick={() => handleTabChange('social')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
              </svg>
              Social Links
            </button>
          </div>

          <div className={styles.sidebarSection}>
            <h3>Settings</h3>
            <button 
              className={`${styles.sidebarTab} ${activeTab === 'notifications' ? styles.active : ''}`}
              onClick={() => handleTabChange('notifications')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              Notifications
            </button>

            <button 
              className={`${styles.sidebarTab} ${activeTab === 'trading-settings' ? styles.active : ''}`}
              onClick={() => handleTabChange('trading-settings')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
              Trading Settings
            </button>

            <button 
              className={`${styles.sidebarTab} ${activeTab === 'security' ? styles.active : ''}`}
              onClick={() => handleTabChange('security')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              Security
            </button>

            <button 
              className={`${styles.sidebarTab} ${activeTab === 'privacy' ? styles.active : ''}`}
              onClick={() => handleTabChange('privacy')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              Privacy
            </button>

            <button 
              className={`${styles.sidebarTab} ${activeTab === 'data' ? styles.active : ''}`}
              onClick={() => handleTabChange('data')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
              Data & Backup
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className={styles.settingsContent}>
          <form onSubmit={handleSubmit} className={styles.settingsForm}>
            {/* Avatar & Banner Section */}
            <div className={styles.profileMediaSection}>
              {/* Banner Section */}
              <div className={styles.bannerSection}>
                <div className={styles.bannerContainer}>
                  {bannerPreview ? (
                    <img src={bannerPreview} alt="Banner Preview" className={styles.bannerImage} />
                  ) : formData.bannerImage ? (
                    <img 
                      src={formatImageUrl(formData.bannerImage, 'banner')}
                      alt="Profile Banner"
                      className={styles.bannerImage}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentNode.querySelector('.bannerFallback')?.classList.remove('hidden');
                      }}
                    />
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
                    <div className={styles.bannerOverlay}>
                      <div className={styles.bannerSpinner}></div>
                    </div>
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
                    <input
                      id="banner-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleBannerUpload}
                      className={styles.bannerInput}
                      disabled={uploading.status}
                    />
                  </label>
                  
                  {(formData.bannerImage || bannerPreview) && (
                    <button 
                      type="button"
                      onClick={handleRemoveBanner}
                      className={styles.removeBannerBtn}
                      disabled={uploading.status}
                    >
                      Remove Banner
                    </button>
                  )}
                </div>
              </div>

              {/* Avatar Section */}
              <div className={styles.avatarSection}>
                <div className={styles.avatarContainer}>
                  <div className={styles.avatarWrapper}>
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Preview" className={styles.avatar} />
                    ) : user?.avatar ? (
                      <img 
                        src={formatImageUrl(user.avatar, 'avatar')} 
                        alt="Profile" 
                        className={styles.avatar}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentNode.querySelector('.avatarFallback')?.classList.remove('hidden');
                        }}
                      />
                    ) : (
                      <div className={styles.avatarPlaceholder}>
                        {user?.avatarInitial || 'U'}
                      </div>
                    )}
                    
                    {(uploading.type === 'avatar' && uploading.status) && (
                      <div className={styles.avatarOverlay}>
                        <div className={styles.avatarSpinner}></div>
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.avatarActions}>
                    <label htmlFor="avatar-upload" className={styles.avatarUploadBtn}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                        <circle cx="12" cy="13" r="4"></circle>
                      </svg>
                      {uploading.type === 'avatar' && uploading.status ? 'Uploading...' : 'Change Photo'}
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className={styles.avatarInput}
                        disabled={uploading.status}
                      />
                    </label>
                    
                    {user?.avatar && (
                      <button 
                        type="button"
                        onClick={handleRemoveAvatar}
                        className={styles.removeAvatarBtn}
                        disabled={uploading.status}
                      >
                        Remove
                      </button>
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
                    <label htmlFor="firstName">
                      First Name *
                      {validationErrors.firstName && (
                        <span className={styles.errorText}> - {validationErrors.firstName}</span>
                      )}
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className={validationErrors.firstName ? styles.error : ''}
                      placeholder="Enter your first name"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="lastName">
                      Last Name *
                      {validationErrors.lastName && (
                        <span className={styles.errorText}> - {validationErrors.lastName}</span>
                      )}
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className={validationErrors.lastName ? styles.error : ''}
                      placeholder="Enter your last name"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="username">
                      Username *
                      {validationErrors.username && (
                        <span className={styles.errorText}> - {validationErrors.username}</span>
                      )}
                    </label>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      value={formData.username}
                      onChange={handleInputChange}
                      required
                      className={validationErrors.username ? styles.error : ''}
                      placeholder="Choose a username"
                    />
                    <small className={styles.helpText}>Only letters, numbers, and underscores allowed</small>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="email">Email</label>
                    <input
                      id="email"
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className={styles.disabled}
                    />
                    <small className={styles.helpText}>Email cannot be changed. Contact support if needed.</small>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="phone">
                      Phone Number
                      {validationErrors.phone && (
                        <span className={styles.errorText}> - {validationErrors.phone}</span>
                      )}
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={validationErrors.phone ? styles.error : ''}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="country">Country</label>
                    <select
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className={styles.select}
                    >
                      {countryOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="timezone">Timezone</label>
                    <select
                      id="timezone"
                      name="timezone"
                      value={formData.timezone}
                      onChange={handleInputChange}
                      className={styles.select}
                    >
                      {timezoneOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="dateOfBirth">
                      Date of Birth
                      {validationErrors.dateOfBirth && (
                        <span className={styles.errorText}> - {validationErrors.dateOfBirth}</span>
                      )}
                    </label>
                    <input
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className={validationErrors.dateOfBirth ? styles.error : ''}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="gender">Gender</label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className={styles.select}
                    >
                      {genderOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="bio">
                    Bio
                    {validationErrors.bio && (
                      <span className={styles.errorText}> - {validationErrors.bio}</span>
                    )}
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    className={validationErrors.bio ? styles.error : ''}
                    placeholder="Tell us about yourself, your trading experience, and your goals..."
                    rows="4"
                    maxLength="500"
                  />
                  <div className={styles.textareaInfo}>
                    <small className={styles.helpText}>{formData.bio.length}/500 characters</small>
                    <small className={styles.helpText}>This will be visible on your public profile</small>
                  </div>
                </div>
              </div>
            )}

            {/* Trading Profile Tab */}
            {activeTab === 'trading' && (
              <div className={styles.tabContent}>
                <h2>Trading Profile</h2>
                <p>Configure your trading experience, platform connections, and market preferences.</p>
                
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label htmlFor="tradingExperience">Trading Experience</label>
                    <select
                      id="tradingExperience"
                      name="tradingExperience"
                      value={formData.tradingExperience}
                      onChange={handleInputChange}
                      className={styles.select}
                    >
                      {tradingExperienceOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <small className={styles.helpText}>Helps us customize your experience</small>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="riskAppetite">Risk Appetite</label>
                    <select
                      id="riskAppetite"
                      name="riskAppetite"
                      value={formData.riskAppetite}
                      onChange={handleInputChange}
                      className={styles.select}
                    >
                      {riskAppetiteOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <small className={styles.helpText}>Your preferred risk level for trading</small>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="idNumber">
                      ID Number
                      {validationErrors.idNumber && (
                        <span className={styles.errorText}> - {validationErrors.idNumber}</span>
                      )}
                    </label>
                    <input
                      id="idNumber"
                      name="idNumber"
                      type="text"
                      value={formData.idNumber}
                      onChange={handleInputChange}
                      className={validationErrors.idNumber ? styles.error : ''}
                      placeholder="Enter your government ID number"
                    />
                    <small className={styles.helpText}>For verification purposes only</small>
                  </div>
                </div>

                {/* Trading Platform Connections */}
                <div className={styles.settingsSection}>
                  <h3>Trading Platform Connections</h3>
                  <p>Connect your trading accounts to sync data and track performance.</p>
                  
                  {/* Connected Accounts Display */}
                  {connectedAccounts.length > 0 && (
                    <div className={styles.connectedAccounts}>
                      <h4>Connected Accounts</h4>
                      <div className={styles.accountsList}>
                        {connectedAccounts.map((account, index) => (
                          <div key={index} className={styles.accountCard}>
                            <div className={styles.accountInfo}>
                              <div className={styles.accountHeader}>
                                <span className={styles.accountPlatform}>
                                  {account.platform.toUpperCase()}
                                </span>
                                <span 
                                  className={`${styles.accountStatus} ${
                                    account.connectionStatus === 'connected' ? styles.connected : 
                                    account.connectionStatus === 'pending' ? styles.pending : styles.disconnected
                                  }`}
                                >
                                  {account.connectionStatus}
                                </span>
                              </div>
                              <div className={styles.accountDetails}>
                                <div className={styles.accountField}>
                                  <span className={styles.fieldLabel}>Account:</span>
                                  <span className={styles.fieldValue}>{account.accountNumber}</span>
                                </div>
                                {account.broker && (
                                  <div className={styles.accountField}>
                                    <span className={styles.fieldLabel}>Broker:</span>
                                    <span className={styles.fieldValue}>{account.broker}</span>
                                  </div>
                                )}
                                {account.lastSync && (
                                  <div className={styles.accountField}>
                                    <span className={styles.fieldLabel}>Last Sync:</span>
                                    <span className={styles.fieldValue}>
                                      {new Date(account.lastSync).toLocaleDateString()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className={styles.accountActions}>
                              <button
                                type="button"
                                onClick={() => handlePlatformDisconnect(account.platform, account._id)}
                                className={styles.disconnectBtn}
                                disabled={uploading.status}
                              >
                                Disconnect
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Platform Connection Forms */}
                  <div className={styles.platformConnections}>
                    {/* MT4 Connection */}
                    <div className={styles.platformConnection}>
                      <div className={styles.platformHeader}>
                        <div className={styles.platformTitle}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                            <line x1="12" y1="22.08" x2="12" y2="12"/>
                          </svg>
                          <span>MetaTrader 4</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handlePlatformConnect('mt4')}
                          className={`${styles.connectBtn} ${
                            formData.tradingPlatforms.mt4.connected ? styles.connected : ''
                          }`}
                          disabled={uploading.status || formData.tradingPlatforms.mt4.connected}
                        >
                          {formData.tradingPlatforms.mt4.connected ? 'Connected' : 'Connect MT4'}
                        </button>
                      </div>
                      
                      {!formData.tradingPlatforms.mt4.connected && (
                        <div className={styles.platformForm}>
                          <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                              <label htmlFor="mt4AccountId">Account ID</label>
                              <input
                                id="mt4AccountId"
                                type="text"
                                value={formData.tradingPlatforms.mt4.accountId}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  tradingPlatforms: {
                                    ...prev.tradingPlatforms,
                                    mt4: { ...prev.tradingPlatforms.mt4, accountId: e.target.value }
                                  }
                                }))}
                                placeholder="Enter your MT4 account number"
                              />
                            </div>
                            <div className={styles.formGroup}>
                              <label htmlFor="mt4Broker">Broker</label>
                              <input
                                id="mt4Broker"
                                type="text"
                                value={formData.tradingPlatforms.mt4.broker}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  tradingPlatforms: {
                                    ...prev.tradingPlatforms,
                                    mt4: { ...prev.tradingPlatforms.mt4, broker: e.target.value }
                                  }
                                }))}
                                placeholder="Your broker name"
                              />
                            </div>
                            <div className={styles.formGroup}>
                              <label htmlFor="mt4Server">Server</label>
                              <input
                                id="mt4Server"
                                type="text"
                                value={formData.tradingPlatforms.mt4.server}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  tradingPlatforms: {
                                    ...prev.tradingPlatforms,
                                    mt4: { ...prev.tradingPlatforms.mt4, server: e.target.value }
                                  }
                                }))}
                                placeholder="Server address"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* MT5 Connection */}
                    <div className={styles.platformConnection}>
                      <div className={styles.platformHeader}>
                        <div className={styles.platformTitle}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                            <path d="M12 22V12"/>
                          </svg>
                          <span>MetaTrader 5</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handlePlatformConnect('mt5')}
                          className={`${styles.connectBtn} ${
                            formData.tradingPlatforms.mt5.connected ? styles.connected : ''
                          }`}
                          disabled={uploading.status || formData.tradingPlatforms.mt5.connected}
                        >
                          {formData.tradingPlatforms.mt5.connected ? 'Connected' : 'Connect MT5'}
                        </button>
                      </div>
                      
                      {!formData.tradingPlatforms.mt5.connected && (
                        <div className={styles.platformForm}>
                          <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                              <label htmlFor="mt5AccountId">Account ID</label>
                              <input
                                id="mt5AccountId"
                                type="text"
                                value={formData.tradingPlatforms.mt5.accountId}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  tradingPlatforms: {
                                    ...prev.tradingPlatforms,
                                    mt5: { ...prev.tradingPlatforms.mt5, accountId: e.target.value }
                                  }
                                }))}
                                placeholder="Enter your MT5 account number"
                              />
                            </div>
                            <div className={styles.formGroup}>
                              <label htmlFor="mt5Broker">Broker</label>
                              <input
                                id="mt5Broker"
                                type="text"
                                value={formData.tradingPlatforms.mt5.broker}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  tradingPlatforms: {
                                    ...prev.tradingPlatforms,
                                    mt5: { ...prev.tradingPlatforms.mt5, broker: e.target.value }
                                  }
                                }))}
                                placeholder="Your broker name"
                              />
                            </div>
                            <div className={styles.formGroup}>
                              <label htmlFor="mt5Server">Server</label>
                              <input
                                id="mt5Server"
                                type="text"
                                value={formData.tradingPlatforms.mt5.server}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  tradingPlatforms: {
                                    ...prev.tradingPlatforms,
                                    mt5: { ...prev.tradingPlatforms.mt5, server: e.target.value }
                                  }
                                }))}
                                placeholder="Server address"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* TradingView Connection */}
                    <div className={styles.platformConnection}>
                      <div className={styles.platformHeader}>
                        <div className={styles.platformTitle}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M2 12L7 2L12 12L17 2L22 12"/>
                          </svg>
                          <span>TradingView</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handlePlatformConnect('tradingview')}
                          className={`${styles.connectBtn} ${
                            formData.tradingPlatforms.tradingview.connected ? styles.connected : ''
                          }`}
                          disabled={uploading.status || formData.tradingPlatforms.tradingview.connected}
                        >
                          {formData.tradingPlatforms.tradingview.connected ? 'Connected' : 'Connect TradingView'}
                        </button>
                      </div>
                      
                      {!formData.tradingPlatforms.tradingview.connected && (
                        <div className={styles.platformForm}>
                          <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                              <label htmlFor="tradingviewUsername">Username</label>
                              <input
                                id="tradingviewUsername"
                                type="text"
                                value={formData.tradingPlatforms.tradingview.username}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  tradingPlatforms: {
                                    ...prev.tradingPlatforms,
                                    tradingview: { ...prev.tradingPlatforms.tradingview, username: e.target.value }
                                  }
                                }))}
                                placeholder="Your TradingView username"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Market Preferences */}
                <div className={styles.settingsSection}>
                  <h3>Market Preferences</h3>
                  
                  <div className={styles.formGroup}>
                    <label>Preferred Markets</label>
                    <p className={styles.fieldDescription}>Select the markets you're interested in trading:</p>
                    <div className={styles.checkboxGrid}>
                      {marketOptions.map(option => (
                        <label key={option.value} className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            name="preferredMarkets"
                            value={option.value}
                            checked={formData.preferredMarkets.includes(option.value)}
                            onChange={handleInputChange}
                            className={styles.checkbox}
                          />
                          <span className={styles.checkboxCustom}></span>
                          {option.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Synthetic Indices */}
                  <div className={styles.formGroup}>
                    <label>Synthetic Indices</label>
                    <p className={styles.fieldDescription}>Select synthetic indices you want to trade:</p>
                    <div className={styles.checkboxGrid}>
                      {syntheticIndicesOptions.map(option => (
                        <label key={option.value} className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            name="syntheticIndices"
                            value={option.value}
                            checked={formData.syntheticIndices.includes(option.value)}
                            onChange={handleInputChange}
                            className={styles.checkbox}
                          />
                          <span className={styles.checkboxCustom}></span>
                          {option.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Skills & Interests Tab */}
            {activeTab === 'interests' && (
              <div className={styles.tabContent}>
                <h2>Skills & Interests</h2>
                <p>Tell us about your skills and areas of interest.</p>
                
                {/* Interests Section */}
                <div className={styles.settingsSection}>
                  <h3>Areas of Interest</h3>
                  <p className={styles.fieldDescription}>Select topics that interest you:</p>
                  <div className={styles.checkboxGrid}>
                    {interestOptions.map(option => (
                      <label key={option.value} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          name="interests"
                          value={option.value}
                          checked={formData.interests.includes(option.value)}
                          onChange={handleInputChange}
                          className={styles.checkbox}
                        />
                        <span className={styles.checkboxCustom}></span>
                        {option.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Skills Management Section */}
                <div className={styles.settingsSection}>
                  <h3>Skills with Levels</h3>
                  <p className={styles.fieldDescription}>Add your skills and specify your proficiency level:</p>
                  
                  {/* Current Skills */}
                  {formData.skills.length > 0 && (
                    <div className={styles.skillsList}>
                      <h4>Your Skills</h4>
                      <div className={styles.skillsGrid}>
                        {formData.skills.map((skill, index) => (
                          <div key={index} className={styles.skillCard}>
                            <div className={styles.skillInfo}>
                              <div className={styles.skillHeader}>
                                <span className={styles.skillName}>{skill.name}</span>
                                <span 
                                  className={styles.skillLevel}
                                  style={{ backgroundColor: getLevelBadgeColor(skill.level) }}
                                >
                                  {getLevelLabel(skill.level)}
                                </span>
                              </div>
                              <div className={styles.skillCategory}>
                                {getCategoryLabel(skill.category)}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveSkill(index)}
                              className={styles.removeSkillBtn}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Add New Skill Form */}
                  <div className={styles.addSkillForm}>
                    <h4>Add New Skill</h4>
                    <div className={styles.formGrid}>
                      <div className={styles.formGroup}>
                        <label htmlFor="newSkillName">Skill Name</label>
                        <input
                          id="newSkillName"
                          name="name"
                          type="text"
                          value={formData.newSkill.name}
                          onChange={handleSkillInputChange}
                          placeholder="e.g., Technical Analysis, Python, Risk Management"
                        />
                      </div>
                      
                      <div className={styles.formGroup}>
                        <label htmlFor="newSkillLevel">Proficiency Level</label>
                        <select
                          id="newSkillLevel"
                          name="level"
                          value={formData.newSkill.level}
                          onChange={handleSkillInputChange}
                          className={styles.select}
                        >
                          {skillLevelOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className={styles.formGroup}>
                        <label htmlFor="newSkillCategory">Category</label>
                        <select
                          id="newSkillCategory"
                          name="category"
                          value={formData.newSkill.category}
                          onChange={handleSkillInputChange}
                          className={styles.select}
                        >
                          {skillCategoryOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className={styles.formGroup}>
                        <label>&nbsp;</label>
                        <button
                          type="button"
                          onClick={handleAddSkill}
                          className={styles.addSkillBtn}
                        >
                          Add Skill
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Address & Verification Tab */}
            {activeTab === 'address' && (
              <div className={styles.tabContent}>
                <h2>Address & Verification</h2>
                <p>Your physical address for verification and communication.</p>
                
                {/* Address Information */}
                <div className={styles.settingsSection}>
                  <h3>Address Information</h3>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label htmlFor="address.streetAddress">Street Address</label>
                      <input
                        id="address.streetAddress"
                        name="address.streetAddress"
                        type="text"
                        value={formData.address.streetAddress}
                        onChange={handleInputChange}
                        placeholder="Enter street address"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="address.town">Town</label>
                      <input
                        id="address.town"
                        name="address.town"
                        type="text"
                        value={formData.address.town}
                        onChange={handleInputChange}
                        placeholder="Enter town"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="address.city">City</label>
                      <input
                        id="address.city"
                        name="address.city"
                        type="text"
                        value={formData.address.city}
                        onChange={handleInputChange}
                        placeholder="Enter city"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="address.province">Province/State</label>
                      <input
                        id="address.province"
                        name="address.province"
                        type="text"
                        value={formData.address.province}
                        onChange={handleInputChange}
                        placeholder="Enter province or state"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="address.postCode">
                        Postal Code
                        {validationErrors['address.postCode'] && (
                          <span className={styles.errorText}> - {validationErrors['address.postCode']}</span>
                        )}
                      </label>
                      <input
                        id="address.postCode"
                        name="address.postCode"
                        type="text"
                        value={formData.address.postCode}
                        onChange={handleInputChange}
                        className={validationErrors['address.postCode'] ? styles.error : ''}
                        placeholder="Enter postal code"
                      />
                    </div>
                  </div>
                </div>

                {/* Address Proof Upload */}
                <div className={styles.settingsSection}>
                  <h3>Address Verification</h3>
                  <p>Upload a document to verify your address (utility bill, bank statement, etc.)</p>
                  
                  {/* Current Address Proof Status */}
                  {formData.addressProof.documentUrl && (
                    <div className={styles.addressProofStatus}>
                      <div className={styles.proofCard}>
                        <div className={styles.proofHeader}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                            <polyline points="10 9 9 9 8 9"/>
                          </svg>
                          <div className={styles.proofInfo}>
                            <span className={styles.proofType}>
                              {addressProofOptions.find(opt => opt.value === formData.addressProof.documentType)?.label || 'Address Proof'}
                            </span>
                            <span className={`${styles.proofStatus} ${
                              formData.addressProof.verified ? styles.verified : styles.pending
                            }`}>
                              {formData.addressProof.verified ? 'Verified' : 'Pending Verification'}
                            </span>
                          </div>
                        </div>
                        {formData.addressProof.uploadedAt && (
                          <div className={styles.proofDate}>
                            Uploaded: {new Date(formData.addressProof.uploadedAt).toLocaleDateString()}
                          </div>
                        )}
                        {addressProofPreview && (
                          <div className={styles.proofPreview}>
                            <img src={addressProofPreview} alt="Address Proof Preview" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Address Proof Upload */}
                  <div className={styles.addressProofUpload}>
                    <div className={styles.uploadArea}>
                      <label htmlFor="address-proof-upload" className={styles.uploadLabel}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="17 8 12 3 7 8"/>
                          <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                        <div className={styles.uploadText}>
                          <h4>Upload Address Proof</h4>
                          <p>Upload a PDF, JPG, or PNG file (max 5MB)</p>
                          <p>Accepted: Utility bills, bank statements, government letters</p>
                        </div>
                      </label>
                      <input
                        id="address-proof-upload"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleAddressProofUpload}
                        className={styles.uploadInput}
                        disabled={uploading.status}
                      />
                    </div>
                    
                    {uploading.type === 'addressProof' && uploading.status && (
                      <div className={styles.uploadProgress}>
                        <div className={styles.progressBar}>
                          <div className={styles.progressFill}></div>
                        </div>
                        <span>Uploading...</span>
                      </div>
                    )}
                    
                    <div className={styles.uploadHelp}>
                      <small className={styles.helpText}>
                        Your document must clearly show your name and address. 
                        It will be verified within 24-48 hours.
                      </small>
                    </div>
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
                  <div className={styles.formGroup}>
                    <label htmlFor="socialLinks.twitter">
                      Twitter
                      {validationErrors['socialLinks.twitter'] && (
                        <span className={styles.errorText}> - {validationErrors['socialLinks.twitter']}</span>
                      )}
                    </label>
                    <input
                      id="socialLinks.twitter"
                      name="socialLinks.twitter"
                      type="url"
                      value={formData.socialLinks.twitter}
                      onChange={handleInputChange}
                      className={validationErrors['socialLinks.twitter'] ? styles.error : ''}
                      placeholder="https://twitter.com/username"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="socialLinks.linkedin">
                      LinkedIn
                      {validationErrors['socialLinks.linkedin'] && (
                        <span className={styles.errorText}> - {validationErrors['socialLinks.linkedin']}</span>
                      )}
                    </label>
                    <input
                      id="socialLinks.linkedin"
                      name="socialLinks.linkedin"
                      type="url"
                      value={formData.socialLinks.linkedin}
                      onChange={handleInputChange}
                      className={validationErrors['socialLinks.linkedin'] ? styles.error : ''}
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="socialLinks.github">
                      GitHub
                      {validationErrors['socialLinks.github'] && (
                        <span className={styles.errorText}> - {validationErrors['socialLinks.github']}</span>
                      )}
                    </label>
                    <input
                      id="socialLinks.github"
                      name="socialLinks.github"
                      type="url"
                      value={formData.socialLinks.github}
                      onChange={handleInputChange}
                      className={validationErrors['socialLinks.github'] ? styles.error : ''}
                      placeholder="https://github.com/username"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="socialLinks.website">
                      Website
                      {validationErrors['socialLinks.website'] && (
                        <span className={styles.errorText}> - {validationErrors['socialLinks.website']}</span>
                      )}
                    </label>
                    <input
                      id="socialLinks.website"
                      name="socialLinks.website"
                      type="url"
                      value={formData.socialLinks.website}
                      onChange={handleInputChange}
                      className={validationErrors['socialLinks.website'] ? styles.error : ''}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>

                  {/* WhatsApp Field */}
                  <div className={styles.formGroup}>
                    <label htmlFor="socialLinks.whatsapp">
                      WhatsApp
                      {validationErrors['socialLinks.whatsapp'] && (
                        <span className={styles.errorText}> - {validationErrors['socialLinks.whatsapp']}</span>
                      )}
                    </label>
                    <input
                      id="socialLinks.whatsapp"
                      name="socialLinks.whatsapp"
                      type="tel"
                      value={formData.socialLinks.whatsapp}
                      onChange={handleInputChange}
                      className={validationErrors['socialLinks.whatsapp'] ? styles.error : ''}
                      placeholder="+1234567890"
                    />
                    <small className={styles.helpText}>Your WhatsApp number for community chats</small>
                  </div>

                  {/* Facebook Field */}
                  <div className={styles.formGroup}>
                    <label htmlFor="socialLinks.facebook">
                      Facebook
                      {validationErrors['socialLinks.facebook'] && (
                        <span className={styles.errorText}> - {validationErrors['socialLinks.facebook']}</span>
                      )}
                    </label>
                    <input
                      id="socialLinks.facebook"
                      name="socialLinks.facebook"
                      type="url"
                      value={formData.socialLinks.facebook}
                      onChange={handleInputChange}
                      className={validationErrors['socialLinks.facebook'] ? styles.error : ''}
                      placeholder="https://facebook.com/username"
                    />
                    <small className={styles.helpText}>Your Facebook profile URL</small>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className={styles.tabContent}>
                <h2>Notification Preferences</h2>
                <p>Choose how you want to receive notifications.</p>
                
                <div className={styles.settingsSection}>
                  <h3>Email Notifications</h3>
                  <div className={styles.checkboxGroup}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="notifications.email.marketing"
                        checked={formData.notifications.email.marketing}
                        onChange={handleInputChange}
                        className={styles.checkbox}
                      />
                      <span className={styles.checkboxCustom}></span>
                      Marketing Emails
                    </label>
                    
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="notifications.email.security"
                        checked={formData.notifications.email.security}
                        onChange={handleInputChange}
                        className={styles.checkbox}
                      />
                      <span className={styles.checkboxCustom}></span>
                      Security Alerts
                    </label>
                    
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="notifications.email.tradingSignals"
                        checked={formData.notifications.email.tradingSignals}
                        onChange={handleInputChange}
                        className={styles.checkbox}
                      />
                      <span className={styles.checkboxCustom}></span>
                      Trading Signals
                    </label>
                    
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="notifications.email.communityUpdates"
                        checked={formData.notifications.email.communityUpdates}
                        onChange={handleInputChange}
                        className={styles.checkbox}
                      />
                      <span className={styles.checkboxCustom}></span>
                      Community Updates
                    </label>
                  </div>
                </div>

                <div className={styles.settingsSection}>
                  <h3>Push Notifications</h3>
                  <div className={styles.checkboxGroup}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="notifications.push.priceAlerts"
                        checked={formData.notifications.push.priceAlerts}
                        onChange={handleInputChange}
                        className={styles.checkbox}
                      />
                      <span className={styles.checkboxCustom}></span>
                      Price Alerts
                    </label>
                    
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="notifications.push.signalExecutions"
                        checked={formData.notifications.push.signalExecutions}
                        onChange={handleInputChange}
                        className={styles.checkbox}
                      />
                      <span className={styles.checkboxCustom}></span>
                      Signal Executions
                    </label>
                    
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="notifications.push.chatMessages"
                        checked={formData.notifications.push.chatMessages}
                        onChange={handleInputChange}
                        className={styles.checkbox}
                      />
                      <span className={styles.checkboxCustom}></span>
                      Chat Messages
                    </label>
                    
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="notifications.push.systemMaintenance"
                        checked={formData.notifications.push.systemMaintenance}
                        onChange={handleInputChange}
                        className={styles.checkbox}
                      />
                      <span className={styles.checkboxCustom}></span>
                      System Maintenance
                    </label>
                  </div>
                </div>

                <div className={styles.settingsSection}>
                  <h3>In-App Notifications</h3>
                  <div className={styles.checkboxGroup}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="notifications.inApp.newFollowers"
                        checked={formData.notifications.inApp.newFollowers}
                        onChange={handleInputChange}
                        className={styles.checkbox}
                      />
                      <span className={styles.checkboxCustom}></span>
                      New Followers
                    </label>
                    
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="notifications.inApp.postInteractions"
                        checked={formData.notifications.inApp.postInteractions}
                        onChange={handleInputChange}
                        className={styles.checkbox}
                      />
                      <span className={styles.checkboxCustom}></span>
                      Post Interactions
                    </label>
                    
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="notifications.inApp.achievementUnlocks"
                        checked={formData.notifications.inApp.achievementUnlocks}
                        onChange={handleInputChange}
                        className={styles.checkbox}
                      />
                      <span className={styles.checkboxCustom}></span>
                      Achievement Unlocks
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Trading Settings Tab */}
            {activeTab === 'trading-settings' && (
              <div className={styles.tabContent}>
                <h2>Trading Settings</h2>
                <p>Configure your trading interface and preferences.</p>
                
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label htmlFor="trading.defaultChartType">Default Chart Type</label>
                    <select
                      id="trading.defaultChartType"
                      name="trading.defaultChartType"
                      value={formData.trading.defaultChartType}
                      onChange={handleInputChange}
                      className={styles.select}
                    >
                      {chartTypeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="trading.defaultTimeframe">Default Timeframe</label>
                    <select
                      id="trading.defaultTimeframe"
                      name="trading.defaultTimeframe"
                      value={formData.trading.defaultTimeframe}
                      onChange={handleInputChange}
                      className={styles.select}
                    >
                      {timeframeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="trading.theme">Theme</label>
                    <select
                      id="trading.theme"
                      name="trading.theme"
                      value={formData.trading.theme}
                      onChange={handleInputChange}
                      className={styles.select}
                    >
                      {themeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="trading.defaultOrderSize">
                      Default Order Size
                      {validationErrors['trading.defaultOrderSize'] && (
                        <span className={styles.errorText}> - {validationErrors['trading.defaultOrderSize']}</span>
                      )}
                    </label>
                    <input
                      id="trading.defaultOrderSize"
                      name="trading.defaultOrderSize"
                      type="number"
                      step="0.001"
                      min="0.001"
                      max="1000"
                      value={formData.trading.defaultOrderSize}
                      onChange={handleInputChange}
                      className={validationErrors['trading.defaultOrderSize'] ? styles.error : ''}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="trading.riskPerTrade">
                      Risk Per Trade (%)
                      {validationErrors['trading.riskPerTrade'] && (
                        <span className={styles.errorText}> - {validationErrors['trading.riskPerTrade']}</span>
                      )}
                    </label>
                    <input
                      id="trading.riskPerTrade"
                      name="trading.riskPerTrade"
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="100"
                      value={formData.trading.riskPerTrade}
                      onChange={handleInputChange}
                      className={validationErrors['trading.riskPerTrade'] ? styles.error : ''}
                    />
                  </div>
                </div>

                <div className={styles.settingsSection}>
                  <h3>Trading Preferences</h3>
                  <div className={styles.checkboxGroup}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="trading.soundEnabled"
                        checked={formData.trading.soundEnabled}
                        onChange={handleInputChange}
                        className={styles.checkbox}
                      />
                      <span className={styles.checkboxCustom}></span>
                      Enable Sound Effects
                    </label>
                    
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="trading.autoRefresh"
                        checked={formData.trading.autoRefresh}
                        onChange={handleInputChange}
                        className={styles.checkbox}
                      />
                      <span className={styles.checkboxCustom}></span>
                      Auto-Refresh Charts
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className={styles.tabContent}>
                <h2>Security Settings</h2>
                <p>Manage your account security and update credentials.</p>
                
                {/* Password Update Section */}
                <div className={styles.settingsSection}>
                  <h3>Update Credentials</h3>
                  
                  {/* Username Update */}
                  <div className={styles.formGroup}>
                    <label htmlFor="username">Username</label>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      value={formData.username}
                      onChange={handleInputChange}
                      className={validationErrors.username ? styles.error : ''}
                      placeholder="Enter new username"
                    />
                    <small className={styles.helpText}>
                      {validationErrors.username && 
                        <span className={styles.errorText}>{validationErrors.username}</span>
                      }
                    </small>
                  </div>
                  
                  {/* Password Update Form */}
                  <div className={styles.formGroup}>
                    <label htmlFor="security.currentPassword">Current Password</label>
                    <input
                      id="security.currentPassword"
                      name="security.currentPassword"
                      type="password"
                      value={formData.security.currentPassword}
                      onChange={handleInputChange}
                      placeholder="Enter current password"
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="security.newPassword">
                      New Password
                      {validationErrors['security.newPassword'] && (
                        <span className={styles.errorText}> - {validationErrors['security.newPassword']}</span>
                      )}
                    </label>
                    <input
                      id="security.newPassword"
                      name="security.newPassword"
                      type="password"
                      value={formData.security.newPassword}
                      onChange={handleInputChange}
                      placeholder="Enter new password"
                    />
                    <small className={styles.helpText}>Minimum 8 characters with letters and numbers</small>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="security.confirmPassword">
                      Confirm New Password
                      {validationErrors['security.confirmPassword'] && (
                        <span className={styles.errorText}> - {validationErrors['security.confirmPassword']}</span>
                      )}
                    </label>
                    <input
                      id="security.confirmPassword"
                      name="security.confirmPassword"
                      type="password"
                      value={formData.security.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm new password"
                    />
                  </div>
                  
                  <button 
                    type="button" 
                    className={styles.primaryBtn}
                    onClick={handlePasswordUpdate}
                    style={{ marginTop: '1rem' }}
                    disabled={saving}
                  >
                    {saving ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
                
                {/* Security Settings Section */}
                <div className={styles.settingsSection}>
                  <h3>Security Features</h3>
                  <div className={styles.checkboxGroup}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="security.twoFactorEnabled"
                        checked={formData.security.twoFactorEnabled}
                        onChange={handleInputChange}
                        className={styles.checkbox}
                      />
                      <span className={styles.checkboxCustom}></span>
                      Enable Two-Factor Authentication
                    </label>
                    
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="security.loginAlerts"
                        checked={formData.security.loginAlerts}
                        onChange={handleInputChange}
                        className={styles.checkbox}
                      />
                      <span className={styles.checkboxCustom}></span>
                      Login Alerts
                    </label>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="security.sessionTimeout">
                      Session Timeout (minutes)
                      {validationErrors['security.sessionTimeout'] && (
                        <span className={styles.errorText}> - {validationErrors['security.sessionTimeout']}</span>
                      )}
                    </label>
                    <input
                      id="security.sessionTimeout"
                      name="security.sessionTimeout"
                      type="number"
                      min="5"
                      max="1440"
                      value={formData.security.sessionTimeout}
                      onChange={handleInputChange}
                      className={validationErrors['security.sessionTimeout'] ? styles.error : ''}
                    />
                    <small className={styles.helpText}>Automatically log out after inactivity</small>
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className={styles.tabContent}>
                <h2>Privacy Settings</h2>
                <p>Control your privacy settings and profile visibility.</p>
                
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label htmlFor="privacy.profileVisibility">Profile Visibility</label>
                    <select
                      id="privacy.profileVisibility"
                      name="privacy.profileVisibility"
                      value={formData.privacy.profileVisibility}
                      onChange={handleInputChange}
                      className={styles.select}
                    >
                      {privacyOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="privacy.allowMessages">Who Can Message Me</label>
                    <select
                      id="privacy.allowMessages"
                      name="privacy.allowMessages"
                      value={formData.privacy.allowMessages}
                      onChange={handleInputChange}
                      className={styles.select}
                    >
                      {messageOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.settingsSection}>
                  <h3>Display Preferences</h3>
                  <div className={styles.checkboxGroup}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="privacy.showTradingStats"
                        checked={formData.privacy.showTradingStats}
                        onChange={handleInputChange}
                        className={styles.checkbox}
                      />
                      <span className={styles.checkboxCustom}></span>
                      Show Trading Statistics
                    </label>
                    
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="privacy.showPortfolioValue"
                        checked={formData.privacy.showPortfolioValue}
                        onChange={handleInputChange}
                        className={styles.checkbox}
                      />
                      <span className={styles.checkboxCustom}></span>
                      Show Portfolio Value
                    </label>
                    
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="privacy.showOnlineStatus"
                        checked={formData.privacy.showOnlineStatus}
                        onChange={handleInputChange}
                        className={styles.checkbox}
                      />
                      <span className={styles.checkboxCustom}></span>
                      Show Online Status
                    </label>
                    
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="privacy.showDateOfBirth"
                        checked={formData.privacy.showDateOfBirth}
                        onChange={handleInputChange}
                        className={styles.checkbox}
                      />
                      <span className={styles.checkboxCustom}></span>
                      Show Date of Birth
                    </label>
                    
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="privacy.showGender"
                        checked={formData.privacy.showGender}
                        onChange={handleInputChange}
                        className={styles.checkbox}
                      />
                      <span className={styles.checkboxCustom}></span>
                      Show Gender
                    </label>
                    
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="privacy.showAddress"
                        checked={formData.privacy.showAddress}
                        onChange={handleInputChange}
                        className={styles.checkbox}
                      />
                      <span className={styles.checkboxCustom}></span>
                      Show Address
                    </label>
                    
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="privacy.searchEngineIndexing"
                        checked={formData.privacy.searchEngineIndexing}
                        onChange={handleInputChange}
                        className={styles.checkbox}
                      />
                      <span className={styles.checkboxCustom}></span>
                      Allow Search Engine Indexing
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Data & Backup Tab */}
            {activeTab === 'data' && (
              <div className={styles.tabContent}>
                <h2>Data & Backup Settings</h2>
                <p>Manage your data export and backup preferences.</p>
                
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label htmlFor="data.backupFrequency">Backup Frequency</label>
                    <select
                      id="data.backupFrequency"
                      name="data.backupFrequency"
                      value={formData.data.backupFrequency}
                      onChange={handleInputChange}
                      className={styles.select}
                    >
                      {backupFrequencyOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="data.exportFormat">Export Format</label>
                    <select
                      id="data.exportFormat"
                      name="data.exportFormat"
                      value={formData.data.exportFormat}
                      onChange={handleInputChange}
                      className={styles.select}
                    >
                      {exportFormatOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="data.retainDataFor">Retain Data For (months)</label>
                    <input
                      id="data.retainDataFor"
                      name="data.retainDataFor"
                      type="number"
                      min="1"
                      max="120"
                      value={formData.data.retainDataFor}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className={styles.settingsSection}>
                  <h3>Data Management</h3>
                  <div className={styles.checkboxGroup}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="data.autoBackup"
                        checked={formData.data.autoBackup}
                        onChange={handleInputChange}
                        className={styles.checkbox}
                      />
                      <span className={styles.checkboxCustom}></span>
                      Automatic Data Backup
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Section */}
            <div className={styles.formActions}>
              <div className={styles.actionsInfo}>
                {Object.keys(validationErrors).length > 0 && (
                  <div className={styles.validationSummary}>
                    <strong>Please fix {Object.keys(validationErrors).length} error(s) before saving:</strong>
                    <ul>
                      {Object.entries(validationErrors).slice(0, 3).map(([field, error]) => (
                        <li key={field}>• {field}: {error}</li>
                      ))}
                      {Object.keys(validationErrors).length > 3 && (
                        <li>... and {Object.keys(validationErrors).length - 3} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
              
              <div className={styles.actionButtons}>
                <button 
                  type="button"
                  onClick={handleResetForm}
                  className={styles.secondaryBtn}
                  disabled={saving}
                >
                  Reset Changes
                </button>
                
                <button 
                  type="submit" 
                  disabled={saving || Object.keys(validationErrors).length > 0}
                  className={styles.primaryBtn}
                >
                  {saving ? (
                    <>
                      <div className={styles.buttonSpinner}></div>
                      Saving Changes...
                    </>
                  ) : (
                    'Save All Changes'
                  )}
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