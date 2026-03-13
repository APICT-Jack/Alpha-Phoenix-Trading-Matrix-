// components/CreatePost.jsx - COMPLETE UPDATED VERSION WITH CHART SUPPORT
import React, { useState, useRef, useCallback, useEffect } from 'react';
import AvatarWithFallback from './AvatarWithFallback';
import ChartWidget from './ChartWidget';
import styles from './styles/CreatePost.module.css';
import { 
  FaImage, 
  FaVideo, 
  FaFileAlt, 
  FaMapMarkerAlt, 
  FaUserTag,
  FaGlobe,
  FaUserFriends,
  FaLock,
  FaTimes,
  FaSpinner,
  FaSmile,
  FaPollH,
  FaCalendarAlt,
  FaCheckCircle,
  FaExclamationCircle,
  FaPlus,
  FaTrash,
  FaChartLine,
  FaChartBar,
  FaChartArea,
  FaUndo,
  FaCheck
} from 'react-icons/fa';

import EmojiPicker from 'emoji-picker-react';

// Simple notification service
const notificationService = {
  showSuccess: (title, message) => {
    console.log(`✅ ${title}: ${message}`);
  },
  showError: (title, message) => {
    console.error(`❌ ${title}: ${message}`);
  },
  showWarning: (title, message) => {
    console.warn(`⚠️ ${title}: ${message}`);
  },
  showInfo: (title, message) => {
    console.log(`ℹ️ ${title}: ${message}`);
  }
};

const CreatePost = ({ 
  profileUser, 
  onCreatePost, 
  onPostCreated,
  autoFocus = false,
  placeholder = "What's on your mind?",
  maxLength = 2000,
  allowedMediaTypes = ['image/*', 'video/*', '.pdf', '.doc', '.docx'],
  maxMediaSize = 100 * 1024 * 1024,
  maxMediaCount = 10
}) => {
  // ============ STATE MANAGEMENT ============
  
  // Post content
  const [newPostContent, setNewPostContent] = useState('');
  
  // Media
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadErrors, setUploadErrors] = useState({});
  
  // Post settings
  const [visibility, setVisibility] = useState('public');
  const [location, setLocation] = useState(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [locations, setLocations] = useState([]);
  const [searchingLocation, setSearchingLocation] = useState(false);
  
  // Mentions - FIXED
  const [mentions, setMentions] = useState([]);
  const [showMentionInput, setShowMentionInput] = useState(false);
  const [mentionText, setMentionText] = useState('');
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  
  // Chart state - NEW
  const [showChartCreator, setShowChartCreator] = useState(false);
  const [chartData, setChartData] = useState({
    symbol: 'BTCUSDT',
    interval: '30',
    theme: 'dark',
    indicators: [],
    hideToolbar: false,
    hideSideToolbar: false
  });
  const [chartPreview, setChartPreview] = useState(null);
  
  // Chart type options
  const chartSymbols = [
    { value: 'BTCUSDT', label: 'BTC/USDT' },
    { value: 'ETHUSDT', label: 'ETH/USDT' },
    { value: 'BNBUSDT', label: 'BNB/USDT' },
    { value: 'SOLUSDT', label: 'SOL/USDT' },
    { value: 'ADAUSDT', label: 'ADA/USDT' },
    { value: 'DOTUSDT', label: 'DOT/USDT' },
    { value: 'LINKUSDT', label: 'LINK/USDT' },
    { value: 'AVAXUSDT', label: 'AVAX/USDT' },
    { value: 'MATICUSDT', label: 'MATIC/USDT' },
    { value: 'UNIUSDT', label: 'UNI/USDT' }
  ];

  const chartIntervals = [
    { value: '1', label: '1m' },
    { value: '5', label: '5m' },
    { value: '15', label: '15m' },
    { value: '30', label: '30m' },
    { value: '60', label: '1h' },
    { value: '240', label: '4h' },
    { value: 'D', label: '1d' },
    { value: 'W', label: '1w' },
    { value: 'M', label: '1M' }
  ];
  
  // Poll state
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollData, setPollData] = useState({
    question: '',
    options: ['', ''],
    multipleChoice: false,
    endsIn: 86400000
  });
  
  // Schedule
  const [scheduledDate, setScheduledDate] = useState(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  
  // UI states
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  
  // Refs
  const fileInputRef = useRef(null);
  const mentionInputRef = useRef(null);
  const contentInputRef = useRef(null);
  const locationInputRef = useRef(null);
  const scheduleTimeoutRef = useRef(null);
  const mentionTimeoutRef = useRef(null);
  
  // ============ EFFECTS ============
  
  // Auto-save draft
  useEffect(() => {
    if (scheduleTimeoutRef.current) {
      clearTimeout(scheduleTimeoutRef.current);
    }
    
    if (newPostContent || mediaFiles.length > 0 || chartPreview) {
      scheduleTimeoutRef.current = setTimeout(() => {
        saveDraft();
      }, 3000);
    }
    
    return () => {
      if (scheduleTimeoutRef.current) {
        clearTimeout(scheduleTimeoutRef.current);
      }
    };
  }, [newPostContent, mediaFiles, chartPreview, visibility, location, mentions, pollData, showPollCreator]);
  
  // Load draft on mount
  useEffect(() => {
    loadDraft();
    
    if (autoFocus && contentInputRef.current) {
      contentInputRef.current.focus();
    }
  }, [autoFocus]);
  
  // Cleanup mention timeout
  useEffect(() => {
    return () => {
      if (mentionTimeoutRef.current) {
        clearTimeout(mentionTimeoutRef.current);
      }
    };
  }, []);
  
  // ============ CALLBACKS ============
  
  const saveDraft = useCallback(() => {
    try {
      const draft = {
        content: newPostContent,
        mediaPreviews: mediaPreviews.filter(p => p.url && p.url.startsWith('data:')),
        visibility,
        location,
        mentions,
        chartData: showChartCreator ? chartData : null,
        chartPreview: chartPreview,
        pollData: showPollCreator ? pollData : null,
        scheduledDate,
        timestamp: Date.now()
      };
      
      localStorage.setItem('postDraft', JSON.stringify(draft));
      setDraftSaved(true);
      
      setTimeout(() => setDraftSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }, [newPostContent, mediaPreviews, visibility, location, mentions, showChartCreator, chartData, chartPreview, showPollCreator, pollData, scheduledDate]);
  
  const loadDraft = useCallback(() => {
    try {
      const savedDraft = localStorage.getItem('postDraft');
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        
        if (Date.now() - draft.timestamp < 24 * 60 * 60 * 1000) {
          setNewPostContent(draft.content || '');
          setVisibility(draft.visibility || 'public');
          setLocation(draft.location || null);
          setMentions(draft.mentions || []);
          setScheduledDate(draft.scheduledDate || null);
          
          if (draft.chartData) {
            setShowChartCreator(true);
            setChartData(draft.chartData);
            setChartPreview(draft.chartPreview);
          }
          
          if (draft.pollData) {
            setShowPollCreator(true);
            setPollData(draft.pollData);
          }
          
          notificationService.showInfo('Draft loaded', 'Your previous draft has been restored');
        } else {
          localStorage.removeItem('postDraft');
        }
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
  }, []);
  
  const clearDraft = useCallback(() => {
    localStorage.removeItem('postDraft');
    setDraftSaved(false);
  }, []);
  
  const validateFile = useCallback((file) => {
    const errors = [];
    
    const isValidType = file.type.startsWith('image/') || 
                       file.type.startsWith('video/') || 
                       file.type === 'application/pdf' ||
                       file.type === 'application/msword' ||
                       file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    
    if (!isValidType) {
      errors.push(`${file.name} is not a supported file type`);
    }
    
    if (file.size > maxMediaSize) {
      errors.push(`${file.name} exceeds ${maxMediaSize / (1024 * 1024)}MB limit`);
    }
    
    return errors;
  }, [maxMediaSize]);
  
  const handleFileSelect = useCallback((e) => {
    const files = Array.from(e.target.files);
    const newErrors = {};
    const validFiles = [];
    
    files.forEach((file, index) => {
      const errors = validateFile(file);
      if (errors.length > 0) {
        newErrors[index] = errors;
      } else {
        validFiles.push(file);
      }
    });
    
    setUploadErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      notificationService.showError('Upload Errors', 'Some files could not be added');
    }
    
    if (validFiles.length === 0) return;
    
    if (validFiles.length + mediaFiles.length > maxMediaCount) {
      notificationService.showWarning(
        'Too Many Files', 
        `Maximum ${maxMediaCount} files allowed. Only the first ${maxMediaCount - mediaFiles.length} will be added.`
      );
      
      const availableSlots = maxMediaCount - mediaFiles.length;
      validFiles.splice(availableSlots);
    }
    
    setMediaFiles(prev => [...prev, ...validFiles]);
    
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreviews(prev => [...prev, {
          url: reader.result,
          type: file.type.split('/')[0],
          name: file.name,
          size: file.size,
          mimeType: file.type,
          id: Date.now() + Math.random()
        }]);
      };
      reader.readAsDataURL(file);
    });
    
    e.target.value = '';
  }, [mediaFiles.length, maxMediaCount, validateFile]);
  
  const removeMedia = useCallback((index) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[index];
      return newProgress;
    });
    setUploadErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[index];
      return newErrors;
    });
  }, []);
  
  // FIXED: Mention functions with proper debouncing
  const searchUsers = useCallback(async (query) => {
    if (query.length < 2) {
      setSuggestedUsers([]);
      return;
    }
    
    setSearchingUsers(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}/api/users/search?q=${encodeURIComponent(query)}&limit=5`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to search users');
      
      const data = await response.json();
      setSuggestedUsers(data.users || []);
    } catch (error) {
      console.error('Failed to search users:', error);
      setSuggestedUsers([]);
    } finally {
      setSearchingUsers(false);
    }
  }, []);
  
  const handleMentionInputChange = useCallback((e) => {
    const value = e.target.value;
    setMentionText(value);
    
    // Clear previous timeout
    if (mentionTimeoutRef.current) {
      clearTimeout(mentionTimeoutRef.current);
    }
    
    // Debounce search
    mentionTimeoutRef.current = setTimeout(() => {
      searchUsers(value);
    }, 300);
  }, [searchUsers]);
  
  const addMention = useCallback((user) => {
    if (!user || !user._id) return;
    
    // Add to mentions array
    if (!mentions.some(id => id === user._id)) {
      setMentions(prev => [...prev, user._id]);
    }
    
    // Replace the @mention text in content
    const mentionRegex = new RegExp(`@${mentionText}$`);
    if (mentionRegex.test(newPostContent)) {
      const newContent = newPostContent.replace(mentionRegex, `@${user.username} `);
      setNewPostContent(newContent);
    } else {
      setNewPostContent(prev => prev + `@${user.username} `);
    }
    
    // Close mention input
    setShowMentionInput(false);
    setMentionText('');
    setSuggestedUsers([]);
    
    // Focus back on content input
    contentInputRef.current?.focus();
  }, [mentions, mentionText, newPostContent]);
  
  const handleContentChange = useCallback((e) => {
    const value = e.target.value;
    setNewPostContent(value);
    
    // Check for @ symbol to show mention input
    const lastChar = value[value.length - 1];
    if (lastChar === '@') {
      setShowMentionInput(true);
      setMentionText('');
      // Focus mention input after a short delay
      setTimeout(() => {
        mentionInputRef.current?.focus();
      }, 100);
    }
  }, []);
  
  // Chart functions
  const handleChartSymbolChange = useCallback((symbol) => {
    setChartData(prev => ({ ...prev, symbol }));
  }, []);
  
  const handleChartIntervalChange = useCallback((interval) => {
    setChartData(prev => ({ ...prev, interval }));
  }, []);
  
  const addChartToPost = useCallback(() => {
    setChartPreview({
      type: 'chart',
      chartData: chartData
    });
    setShowChartCreator(false);
    notificationService.showSuccess('Chart Added', 'Chart has been added to your post');
  }, [chartData]);
  
  const removeChart = useCallback(() => {
    setChartPreview(null);
    setShowChartCreator(false);
    setChartData({
      symbol: 'BTCUSDT',
      interval: '30',
      theme: 'dark',
      indicators: [],
      hideToolbar: false,
      hideSideToolbar: false
    });
  }, []);
  
  const searchLocations = useCallback(async (query) => {
    if (!query.trim()) {
      setLocations([]);
      return;
    }
    
    setSearchingLocation(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      );
      const data = await response.json();
      
      setLocations(data.map(place => ({
        name: place.display_name,
        coordinates: [parseFloat(place.lon), parseFloat(place.lat)],
        placeId: place.place_id,
        type: place.type
      })));
    } catch (error) {
      console.error('Failed to search locations:', error);
      notificationService.showError('Location Search Failed', 'Could not find locations');
    } finally {
      setSearchingLocation(false);
    }
  }, []);
  
  const selectLocation = useCallback((location) => {
    setLocation(location);
    setShowLocationPicker(false);
    setLocations([]);
  }, []);
  
  // Poll functions
  const handlePollOptionChange = useCallback((index, value) => {
    setPollData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  }, []);
  
  const addPollOption = useCallback(() => {
    setPollData(prev => {
      if (prev.options.length >= 10) return prev;
      return {
        ...prev,
        options: [...prev.options, '']
      };
    });
  }, []);
  
  const removePollOption = useCallback((index) => {
    setPollData(prev => {
      if (prev.options.length <= 2) return prev;
      const newOptions = prev.options.filter((_, i) => i !== index);
      return {
        ...prev,
        options: newOptions
      };
    });
  }, []);
  
  const resetPoll = useCallback(() => {
    setPollData({
      question: '',
      options: ['', ''],
      multipleChoice: false,
      endsIn: 86400000
    });
    setShowPollCreator(false);
  }, []);
  
  const handleScheduleChange = useCallback((date, time) => {
    if (date && time) {
      const scheduledDateTime = new Date(`${date}T${time}`);
      
      if (scheduledDateTime <= new Date()) {
        notificationService.showError('Invalid Schedule', 'Schedule time must be in the future');
        return;
      }
      
      setScheduledDate(scheduledDateTime.toISOString());
    } else {
      setScheduledDate(null);
    }
  }, []);
  
  const onEmojiClick = useCallback((emojiData) => {
    setNewPostContent(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
    contentInputRef.current?.focus();
  }, []);
  
  const validatePost = useCallback(() => {
    const errors = [];
    
    if (!newPostContent.trim() && mediaFiles.length === 0 && !showPollCreator && !chartPreview) {
      errors.push('Post must have content, media, a poll, or a chart');
    }
    
    if (newPostContent.length > maxLength) {
      errors.push(`Post content exceeds ${maxLength} characters`);
    }
    
    if (showPollCreator) {
      if (!pollData.question.trim()) {
        errors.push('Poll must have a question');
      }
      
      const validOptions = pollData.options.filter(opt => opt.trim() !== '');
      if (validOptions.length < 2) {
        errors.push('Poll must have at least 2 options');
      }
      
      if (validOptions.some(opt => opt.length > 100)) {
        errors.push('Poll options cannot exceed 100 characters');
      }
    }
    
    if (scheduledDate) {
      const scheduledTime = new Date(scheduledDate);
      if (scheduledTime <= new Date()) {
        errors.push('Schedule time must be in the future');
      }
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  }, [newPostContent, mediaFiles.length, showPollCreator, pollData, scheduledDate, maxLength, chartPreview]);
  
  // Main post creation handler with chart support
  const handleCreatePost = useCallback(async () => {
    if (!validatePost() || isSubmitting) return;
    
    setIsSubmitting(true);
    setUploading(true);
    
    try {
      const formData = new FormData();
      
      // Add text fields
      const contentValue = newPostContent.trim() || '';
      formData.append('content', contentValue);
      formData.append('visibility', visibility);
      
      // Add location if exists
      if (location) {
        formData.append('location', JSON.stringify(location));
      }
      
      // Add mentions if any
      if (mentions.length > 0) {
        mentions.forEach(mention => {
          if (mention && mention !== 'undefined' && mention !== 'null' && mention.trim() !== '') {
            formData.append('mentions', mention);
          }
        });
      }
      
      // Add scheduled date if exists
      if (scheduledDate) {
        formData.append('scheduledFor', scheduledDate);
      }
      
      // Add media files
      if (mediaFiles.length > 0) {
        mediaFiles.forEach(file => {
          formData.append('media', file);
        });
      }
      
      // Add chart if exists
      if (chartPreview) {
        const chartJson = JSON.stringify({
          symbol: chartData.symbol,
          interval: chartData.interval,
          theme: chartData.theme,
          indicators: chartData.indicators,
          hideToolbar: chartData.hideToolbar,
          hideSideToolbar: chartData.hideSideToolbar
        });
        formData.append('chart', chartJson);
      }
      
      // Add poll data if present
      if (showPollCreator) {
        const validOptions = pollData.options
          .filter(opt => opt && opt.trim() !== '')
          .map(opt => opt.trim());
        
        if (pollData.question.trim() && validOptions.length >= 2) {
          const pollObject = {
            question: pollData.question.trim(),
            options: validOptions,
            multipleChoice: pollData.multipleChoice,
            endsIn: pollData.endsIn
          };
          
          formData.append('poll', JSON.stringify(pollObject));
        }
      }
      
      // Log FormData contents for debugging
      console.log('📦 FormData contents:');
      for (let [key, value] of formData.entries()) {
        if (key === 'media') {
          console.log(`  ${key}: File - ${value.name} (${value.size} bytes)`);
        } else if (key === 'poll' || key === 'chart') {
          console.log(`  ${key}: ${value}`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }
      
      // Make API call
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}/api/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Server response:', errorData);
        throw new Error(errorData.message || 'Failed to create post');
      }
      
      const result = await response.json();
      console.log('✅ Post created successfully:', result);
      
      // Handle success
      setSubmitSuccess(true);
      clearDraft();
      
      // Reset form
      setNewPostContent('');
      setMediaFiles([]);
      setMediaPreviews([]);
      setVisibility('public');
      setLocation(null);
      setMentions([]);
      resetPoll();
      removeChart();
      setScheduledDate(null);
      setShowScheduler(false);
      setUploadProgress({});
      setValidationErrors([]);
      
      notificationService.showSuccess(
        'Success',
        scheduledDate ? 'Your post has been scheduled' : 'Your post has been published'
      );
      
      if (onPostCreated) {
        onPostCreated(result.post || result);
      }
      
    } catch (error) {
      console.error('Failed to create post:', error);
      notificationService.showError('Failed to Create Post', error.message || 'Unknown error occurred');
    } finally {
      setIsSubmitting(false);
      setUploading(false);
      setSubmitSuccess(false);
    }
  }, [
    newPostContent, mediaFiles, visibility, location, mentions, 
    scheduledDate, showPollCreator, pollData, chartPreview, chartData,
    validatePost, isSubmitting, onPostCreated, clearDraft, resetPoll, removeChart
  ]);
  
  const getVisibilityIcon = useCallback(() => {
    switch(visibility) {
      case 'public':
        return <FaGlobe />;
      case 'followers_only':
        return <FaUserFriends />;
      case 'private':
        return <FaLock />;
      default:
        return <FaGlobe />;
    }
  }, [visibility]);
  
  // ============ RENDER FUNCTIONS ============
  
  const renderChartCreator = () => (
    <div className={styles.chartCreator}>
      <div className={styles.chartHeader}>
        <h4>Add Trading Chart</h4>
        <button 
          className={styles.closeChartBtn}
          onClick={removeChart}
          disabled={isSubmitting}
          type="button"
        >
          <FaTimes />
        </button>
      </div>
      
      <div className={styles.chartControls}>
        <div className={styles.chartSettings}>
          <div className={styles.chartSettingGroup}>
            <label>Symbol</label>
            <select
              value={chartData.symbol}
              onChange={(e) => handleChartSymbolChange(e.target.value)}
              className={styles.chartSelect}
              disabled={isSubmitting}
            >
              {chartSymbols.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className={styles.chartSettingGroup}>
            <label>Interval</label>
            <select
              value={chartData.interval}
              onChange={(e) => handleChartIntervalChange(e.target.value)}
              className={styles.chartSelect}
              disabled={isSubmitting}
            >
              {chartIntervals.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className={styles.chartPreview}>
          <ChartWidget 
            chartData={chartData}
            isExpanded={false}
          />
        </div>
        
        <div className={styles.chartActions}>
          <button
            className={styles.addChartBtn}
            onClick={addChartToPost}
            disabled={isSubmitting}
            type="button"
          >
            <FaChartLine /> Add Chart to Post
          </button>
        </div>
      </div>
    </div>
  );
  
  const renderMediaPreviews = () => (
    <div className={styles.mediaPreviews}>
      {mediaPreviews.map((preview, index) => (
        <div key={preview.id || index} className={styles.mediaPreviewItem}>
          {preview.type === 'image' ? (
            <img src={preview.url} alt={`Preview ${index}`} />
          ) : preview.type === 'video' ? (
            <video src={preview.url} controls />
          ) : (
            <div className={styles.documentPreview}>
              <FaFileAlt />
              <span>{preview.name}</span>
            </div>
          )}
          
          {uploadProgress[index] !== undefined && uploadProgress[index] < 100 && (
            <div className={styles.uploadProgress}>
              <div 
                className={styles.progressBar}
                style={{ width: `${uploadProgress[index]}%` }}
              />
              <span>{uploadProgress[index]}%</span>
            </div>
          )}
          
          {uploadErrors[index] && (
            <div className={styles.uploadError}>
              <FaExclamationCircle />
              <div className={styles.errorTooltip}>
                {uploadErrors[index].map((err, i) => (
                  <div key={i}>{err}</div>
                ))}
              </div>
            </div>
          )}
          
          <button 
            className={styles.removeMediaBtn}
            onClick={() => removeMedia(index)}
            disabled={isSubmitting}
          >
            <FaTimes />
          </button>
        </div>
      ))}
      
      {chartPreview && (
        <div className={styles.chartPreviewItem}>
          <ChartWidget 
            chartData={chartPreview.chartData}
            isExpanded={false}
          />
          <button 
            className={styles.removeChartBtn}
            onClick={removeChart}
            disabled={isSubmitting}
          >
            <FaTimes />
          </button>
        </div>
      )}
    </div>
  );
  
  const renderLocationPicker = () => (
    <div className={styles.locationPicker}>
      <div className={styles.locationSearch}>
        <input
          ref={locationInputRef}
          type="text"
          placeholder="Search for a location..."
          onChange={(e) => searchLocations(e.target.value)}
          autoFocus
          disabled={isSubmitting}
        />
        {searchingLocation && <FaSpinner className={styles.spinning} />}
      </div>
      
      {locations.length > 0 && (
        <div className={styles.locationResults}>
          {locations.map((loc, index) => (
            <div 
              key={loc.placeId || index}
              className={styles.locationResult}
              onClick={() => selectLocation(loc)}
            >
              <FaMapMarkerAlt />
              <div>
                <div className={styles.locationName}>{loc.name}</div>
                <div className={styles.locationType}>{loc.type}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
  
  const renderMentionInput = () => (
    <div className={styles.mentionInput}>
      <div className={styles.mentionInputWrapper}>
        <span>@</span>
        <input
          ref={mentionInputRef}
          type="text"
          placeholder="Search users..."
          value={mentionText}
          onChange={handleMentionInputChange}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setShowMentionInput(false);
              setMentionText('');
              setSuggestedUsers([]);
              contentInputRef.current?.focus();
            }
          }}
          disabled={isSubmitting}
        />
        {searchingUsers && <FaSpinner className={styles.spinning} />}
      </div>
      
      {suggestedUsers.length > 0 && (
        <div className={styles.userSuggestions}>
          {suggestedUsers.map(user => (
            <div 
              key={user._id}
              className={styles.userSuggestion}
              onClick={() => addMention(user)}
            >
              <AvatarWithFallback user={user} size="small" />
              <div>
                <strong>{user.name}</strong>
                <span>@{user.username}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {mentionText.length >= 2 && suggestedUsers.length === 0 && !searchingUsers && (
        <div className={styles.noUsersFound}>
          No users found matching "{mentionText}"
        </div>
      )}
    </div>
  );
  
  const renderScheduler = () => (
    <div className={styles.scheduler}>
      <div className={styles.schedulerInputs}>
        <input
          type="date"
          value={scheduleDate}
          onChange={(e) => {
            setScheduleDate(e.target.value);
            handleScheduleChange(e.target.value, scheduleTime);
          }}
          min={new Date().toISOString().split('T')[0]}
          disabled={isSubmitting}
        />
        <input
          type="time"
          value={scheduleTime}
          onChange={(e) => {
            setScheduleTime(e.target.value);
            handleScheduleChange(scheduleDate, e.target.value);
          }}
          disabled={isSubmitting}
        />
      </div>
      <p className={styles.schedulerNote}>
        Posts can be scheduled up to 30 days in advance
      </p>
    </div>
  );
  
  const renderPollCreator = () => (
    <div className={styles.pollCreator}>
      <div className={styles.pollHeader}>
        <h4>Create a Poll</h4>
        <button 
          className={styles.closePollBtn}
          onClick={resetPoll}
          disabled={isSubmitting}
          type="button"
        >
          <FaTimes />
        </button>
      </div>
      
      <div className={styles.pollQuestionContainer}>
        <input
          type="text"
          placeholder="Ask a question..."
          value={pollData.question}
          onChange={(e) => setPollData(prev => ({ ...prev, question: e.target.value }))}
          className={styles.pollQuestion}
          maxLength={200}
          disabled={isSubmitting}
        />
        <span className={styles.pollQuestionCounter}>
          {pollData.question.length}/200
        </span>
      </div>
      
      <div className={styles.pollOptions}>
        {pollData.options.map((option, index) => (
          <div key={index} className={styles.pollOption}>
            <input
              type="text"
              placeholder={`Option ${index + 1}`}
              value={option}
              onChange={(e) => handlePollOptionChange(index, e.target.value)}
              maxLength={100}
              disabled={isSubmitting}
            />
            {pollData.options.length > 2 && (
              <button 
                className={styles.removeOptionBtn}
                onClick={() => removePollOption(index)}
                disabled={isSubmitting}
                title="Remove option"
                type="button"
              >
                <FaTrash />
              </button>
            )}
            {index < 2 && (
              <span className={styles.requiredOption}>Required</span>
            )}
          </div>
        ))}
      </div>
      
      {pollData.options.length < 10 && (
        <button 
          className={styles.addPollOption}
          onClick={addPollOption}
          disabled={isSubmitting}
          type="button"
        >
          <FaPlus /> Add Option
        </button>
      )}
      
      <div className={styles.pollSettings}>
        <label className={styles.pollCheckbox}>
          <input
            type="checkbox"
            checked={pollData.multipleChoice}
            onChange={(e) => setPollData(prev => ({ ...prev, multipleChoice: e.target.checked }))}
            disabled={isSubmitting}
          />
          Allow multiple choices
        </label>
        
        <select
          value={pollData.endsIn}
          onChange={(e) => setPollData(prev => ({ ...prev, endsIn: parseInt(e.target.value) }))}
          disabled={isSubmitting}
          className={styles.pollDuration}
        >
          <option value={86400000}>24 hours</option>
          <option value={172800000}>48 hours</option>
          <option value={604800000}>7 days</option>
          <option value={1209600000}>14 days</option>
          <option value={2592000000}>30 days</option>
        </select>
      </div>
    </div>
  );
  
  const renderValidationErrors = () => {
    if (validationErrors.length === 0) return null;
    
    return (
      <div className={styles.validationErrors}>
        {validationErrors.map((error, index) => (
          <div key={index} className={styles.validationError}>
            <FaExclamationCircle />
            <span>{error}</span>
          </div>
        ))}
      </div>
    );
  };
  
  // ============ MAIN RENDER ============
  return (
    <div className={styles.createPostCard}>
      {draftSaved && (
        <div className={styles.draftSaved}>
          <FaCheckCircle /> Draft saved
        </div>
      )}
      
      <div className={styles.createPostHeader}>
        <AvatarWithFallback
          user={profileUser}
          className={styles.postAvatar}
          size="medium"
        />
        <div className={styles.createPostInputWrapper}>
          <textarea
            ref={contentInputRef}
            placeholder={placeholder}
            value={newPostContent}
            onChange={handleContentChange}
            className={styles.postTextarea}
            rows={3}
            maxLength={maxLength}
            disabled={isSubmitting}
          />
          
          <div className={`${styles.characterCounter} ${
            newPostContent.length > maxLength * 0.9 ? styles.warning : ''
          } ${newPostContent.length >= maxLength ? styles.error : ''}`}>
            {newPostContent.length}/{maxLength}
          </div>
        </div>
      </div>
      
      {(mediaPreviews.length > 0 || chartPreview) && renderMediaPreviews()}
      
      {location && (
        <div className={styles.locationDisplay}>
          <FaMapMarkerAlt />
          <span>{location.name}</span>
          <button onClick={() => setLocation(null)} disabled={isSubmitting}>
            <FaTimes />
          </button>
        </div>
      )}
      
      {scheduledDate && (
        <div className={styles.scheduledDisplay}>
          <FaCalendarAlt />
          <span>Scheduled for: {new Date(scheduledDate).toLocaleString()}</span>
          <button onClick={() => setScheduledDate(null)} disabled={isSubmitting}>
            <FaTimes />
          </button>
        </div>
      )}
      
      {showChartCreator && !chartPreview && renderChartCreator()}
      
      {showPollCreator && !chartPreview && renderPollCreator()}
      
      {showLocationPicker && (
        <div className={styles.locationPickerModal}>
          <div className={styles.locationPickerHeader}>
            <h4>Add Location</h4>
            <button onClick={() => setShowLocationPicker(false)}>
              <FaTimes />
            </button>
          </div>
          {renderLocationPicker()}
        </div>
      )}
      
      {showMentionInput && renderMentionInput()}
      
      {showEmojiPicker && (
        <div className={styles.emojiPicker}>
          <EmojiPicker onEmojiClick={onEmojiClick} />
        </div>
      )}
      
      {showScheduler && (
        <div className={styles.schedulerModal}>
          <div className={styles.schedulerHeader}>
            <h4>Schedule Post</h4>
            <button onClick={() => setShowScheduler(false)}>
              <FaTimes />
            </button>
          </div>
          {renderScheduler()}
        </div>
      )}
      
      {renderValidationErrors()}
      
      <div className={styles.createPostActions}>
        <div className={styles.mediaButtons}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            accept={allowedMediaTypes.join(',')}
            className={styles.fileInput}
            disabled={isSubmitting}
          />
          
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={styles.mediaButton}
            title="Add photos/videos"
            disabled={isSubmitting}
          >
            <FaImage />
          </button>
          
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={styles.mediaButton}
            title="Add video"
            disabled={isSubmitting}
          >
            <FaVideo />
          </button>
          
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={styles.mediaButton}
            title="Add document"
            disabled={isSubmitting}
          >
            <FaFileAlt />
          </button>
          
          <button 
            type="button"
            onClick={() => setShowLocationPicker(!showLocationPicker)}
            className={`${styles.mediaButton} ${location ? styles.active : ''}`}
            title="Add location"
            disabled={isSubmitting}
          >
            <FaMapMarkerAlt />
          </button>
          
          <button 
            type="button"
            onClick={() => {
              setShowMentionInput(!showMentionInput);
              setMentionText('');
            }}
            className={styles.mediaButton}
            title="Mention someone"
            disabled={isSubmitting}
          >
            <FaUserTag />
          </button>
          
          {/* Chart button */}
          <button 
            type="button"
            onClick={() => {
              if (chartPreview) {
                removeChart();
              } else {
                setShowChartCreator(!showChartCreator);
                setShowPollCreator(false);
              }
            }}
            className={`${styles.mediaButton} ${showChartCreator || chartPreview ? styles.active : ''}`}
            title="Add chart"
            disabled={isSubmitting}
          >
            <FaChartLine />
          </button>
          
          <button 
            type="button"
            onClick={() => {
              if (showPollCreator) {
                resetPoll();
              } else {
                setShowPollCreator(true);
                setShowChartCreator(false);
              }
            }}
            className={`${styles.mediaButton} ${showPollCreator ? styles.active : ''}`}
            title="Add poll"
            disabled={isSubmitting}
          >
            <FaPollH />
          </button>
          
          <button 
            type="button"
            onClick={() => setShowScheduler(!showScheduler)}
            className={`${styles.mediaButton} ${scheduledDate ? styles.active : ''}`}
            title="Schedule post"
            disabled={isSubmitting}
          >
            <FaCalendarAlt />
          </button>
          
          <button 
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`${styles.mediaButton} ${showEmojiPicker ? styles.active : ''}`}
            title="Add emoji"
            disabled={isSubmitting}
          >
            <FaSmile />
          </button>
        </div>
        
        <div className={styles.postActions}>
          <div className={styles.visibilitySelector}>
            <button 
              className={styles.visibilityButton}
              title="Change visibility"
              disabled={isSubmitting}
            >
              {getVisibilityIcon()}
              <span>{visibility.replace('_', ' ')}</span>
            </button>
            
            <div className={styles.visibilityMenu}>
              <button onClick={() => setVisibility('public')} disabled={isSubmitting}>
                <FaGlobe /> Public
              </button>
              <button onClick={() => setVisibility('followers_only')} disabled={isSubmitting}>
                <FaUserFriends /> Followers only
              </button>
              <button onClick={() => setVisibility('private')} disabled={isSubmitting}>
                <FaLock /> Private
              </button>
            </div>
          </div>
          
          <button 
            onClick={handleCreatePost}
            disabled={(!newPostContent.trim() && mediaFiles.length === 0 && !showPollCreator && !chartPreview) || uploading || isSubmitting}
            className={styles.postButton}
          >
            {uploading || isSubmitting ? (
              <>
                <FaSpinner className={styles.spinning} />
                {scheduledDate ? 'Scheduling...' : 'Posting...'}
              </>
            ) : scheduledDate ? (
              'Schedule'
            ) : (
              'Post'
            )}
          </button>
        </div>
      </div>
      
      {mentions.length > 0 && (
        <div className={styles.mentionsList}>
          <span>Mentioning: </span>
          {mentions.map((mentionId, index) => (
            <span key={mentionId} className={styles.mentionTag}>
              @user{index + 1}
              <button onClick={() => setMentions(prev => prev.filter(id => id !== mentionId))}>
                <FaTimes />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default CreatePost;