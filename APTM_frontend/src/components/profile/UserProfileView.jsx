/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import ConnectionPanel from './ConnectionPanel';
import ChartTab from './ChartTab';
// Import components
import AvatarModal from './AvatarModal';
import TabsNavigation from './TabsNavigation';
import CreatePost from './CreatePost';
import PostComponent from './PostComponent';
import OverviewTab from './OverviewTab';
import GalleryComponent from './GalleryComponent';
import ProfileHeader from './ProfileHeader';

// Import utilities
import { formatAvatarUrl, formatBannerUrl, getAvatarInitial, hasValidAvatar, hasValidBanner } from '../../utils/avatarUtils';
import { experienceLevels } from './profileConstants';

// Import services
import { userStatusService } from '../../services/userStatusService';

// Import styles
import styles from './UserProfileView.module.css';

// Import icons
import { 
  FaComments, 
  FaChartLine, 
  FaNewspaper, 
  FaArrowLeft, 
  FaCamera, 
  FaEdit,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaBriefcase,
  FaTwitter,
  FaLinkedin,
  FaGithub,
  FaGlobe,
  FaWhatsapp,
  FaFacebook,
  FaDiscord,
  FaTelegram,
  FaReddit,
  FaYoutube,
  FaInstagram,
  FaHeart,
  FaRegHeart,
  FaBookmark,
  FaRegBookmark,
  FaHome,
  FaRetweet,
  FaWifi,
  FaExclamationCircle,
  FaPlug,
  FaSignal,
  FaChevronLeft,
  FaChevronRight,
  FaUserPlus,
  FaUserCheck,
  FaComments as FaMessage
} from 'react-icons/fa';

// Constants for API URLs
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 
                 import.meta.env.VITE_BASE_URL || 
                 (import.meta.env.PROD ? window.location.origin : 'http://localhost:5000');

// Wallpaper settings key
const WALLPAPER_SETTINGS_KEY = 'profile_wallpaper_settings';

const UserProfileView = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { darkMode } = useTheme();

  // All state variables
  const [profileUser, setProfileUser] = useState(null);
  const [activeTab, setActiveTab] = useState('timeline');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [posts, setPosts] = useState([]);
  const [gallery, setGallery] = useState({ folders: [] });
  const [onlineUsers, setOnlineUsers] = useState({});
  const [isUserOnline, setIsUserOnline] = useState(false);
  const [savedPosts, setSavedPosts] = useState([]);
  const [avatarError, setAvatarError] = useState(false);
  const [bannerError, setBannerError] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  
  // Wallpaper state
  const [wallpaperSettings, setWallpaperSettings] = useState({
    url: '',
    brightness: 0.6,
    blur: 0,
    opacity: 0.8,
    overlay: 'linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 100%)'
  });

  const isOwnProfile = !userId || userId === currentUser?.id;
  const targetUserId = userId || currentUser?.id;

  // Social media icons mapping
  const socialIcons = {
    twitter: FaTwitter,
    linkedin: FaLinkedin,
    github: FaGithub,
    website: FaGlobe,
    whatsapp: FaWhatsapp,
    facebook: FaFacebook,
    discord: FaDiscord,
    telegram: FaTelegram,
    reddit: FaReddit,
    youtube: FaYoutube,
    instagram: FaInstagram
  };

  // ============ WALLPAPER SETUP ============
  useEffect(() => {
    const savedWallpaper = localStorage.getItem(WALLPAPER_SETTINGS_KEY);
    if (savedWallpaper) {
      try {
        const parsed = JSON.parse(savedWallpaper);
        setWallpaperSettings(parsed);
        applyWallpaperSettings(parsed);
      } catch (e) {
        console.error('Error loading wallpaper:', e);
      }
    }
  }, []);

  const applyWallpaperSettings = (settings) => {
    document.documentElement.style.setProperty('--wallpaper-url', `url(${settings.url})`);
    document.documentElement.style.setProperty('--wallpaper-brightness', settings.brightness);
    document.documentElement.style.setProperty('--wallpaper-blur', `${settings.blur}px`);
    document.documentElement.style.setProperty('--wallpaper-opacity', settings.opacity);
    document.documentElement.style.setProperty('--wallpaper-overlay', settings.overlay);
  };

  // ============ PANEL COLLAPSE DETECTION ============
  useEffect(() => {
    const handlePanelStateChange = (event) => {
      setIsPanelCollapsed(event.detail?.collapsed || false);
    };
    
    window.addEventListener('panelStateChange', handlePanelStateChange);
    
    return () => {
      window.removeEventListener('panelStateChange', handlePanelStateChange);
    };
  }, []);

  // ============ STICKY HEADER SCROLL DETECTION ============
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      // Show sticky header after scrolling past 200px
      setShowStickyHeader(scrollPosition > 200);
      setIsScrolled(scrollPosition > 100);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ============ USER STATUS SERVICE SETUP ============
  useEffect(() => {
    if (!currentUser || !currentUser.id) return;

    console.log('🔌 Initializing user status service for:', currentUser.id);

    userStatusService.init(currentUser, {
      onConnect: () => {
        console.log('✅ User status service connected');
        setSocketConnected(true);
        
        if (profileUser?.id) {
          setTimeout(() => {
            userStatusService.getUserStatus(profileUser.id);
          }, 500);
        }
      },
      onDisconnect: () => {
        console.log('❌ User status service disconnected');
        setSocketConnected(false);
      },
      onUserOnline: (data) => {
        console.log('🟢 User online:', data);
        if (data.userId === profileUser?.id) {
          setIsUserOnline(true);
          setLastSeen(null);
        }
        setOnlineUsers(prev => ({ ...prev, [data.userId]: true }));
      },
      onUserOffline: (data) => {
        console.log('🔴 User offline:', data);
        if (data.userId === profileUser?.id) {
          setIsUserOnline(false);
          setLastSeen(data.timestamp || new Date());
        }
        setOnlineUsers(prev => ({ ...prev, [data.userId]: false }));
      },
      onOnlineUsers: (users) => {
        console.log('📊 Online users received');
        setOnlineUsers(users);
        
        if (profileUser?.id && users[profileUser.id]) {
          setIsUserOnline(true);
          setLastSeen(null);
        }
      },
      onUserStatusResponse: (data) => {
        console.log('📡 User status response:', data);
        if (data.userId === profileUser?.id) {
          setIsUserOnline(data.isOnline);
          if (!data.isOnline && data.lastSeen) {
            setLastSeen(data.lastSeen);
          }
        }
      }
    });

    return () => {
      console.log('🧹 Cleaning up user status service');
      userStatusService.disconnect();
    };
  }, [currentUser, profileUser?.id]);

  // Request status when profile changes
  useEffect(() => {
    if (profileUser?.id && userStatusService.isConnected()) {
      console.log('🔍 Requesting status for profile user:', profileUser.id);
      userStatusService.getUserStatus(profileUser.id);
    }
  }, [profileUser?.id]);

  // Format user data consistently
  const formatUserData = useCallback((userData, isPublic = false) => {
    if (!userData) return null;
    
    console.log('👤 Formatting user data:', { userData, isPublic });
    
    let user = userData;
    
    if (userData.profile && !userData.id && !userData._id) {
      user = { ...userData, ...userData.profile };
    }
    
    if (userData.user) {
      user = { ...userData.user, ...userData };
    }
    
    const userId = user.id || user._id || user.userId || (userData.data?.id);
    let name = user.name || user.fullName || user.displayName || 'Unknown User';
    let username = user.username || user.userName || 'user';
    let email = user.email;
    
    let avatarData = null;
    if (user.avatar) avatarData = user.avatar;
    else if (user.avatarUrl) avatarData = user.avatarUrl;
    else if (user.profile?.avatar) avatarData = user.profile.avatar;
    
    if (avatarData && typeof avatarData === 'object') {
      avatarData = avatarData.url || avatarData.avatarUrl || null;
    }
    
    let bannerData = null;
    if (user.bannerImage) bannerData = user.bannerImage;
    else if (user.banner) bannerData = user.banner;
    else if (user.bannerUrl) bannerData = user.bannerUrl;
    else if (user.profile?.bannerImage) bannerData = user.profile.bannerImage;
    else if (user.profile?.banner) bannerData = user.profile.banner;
    else if (user.profile?.bannerUrl) bannerData = user.profile.bannerUrl;
    else if (userData.bannerImage) bannerData = userData.bannerImage;
    
    if (bannerData && typeof bannerData === 'object') {
      bannerData = bannerData.url || bannerData.bannerUrl || null;
    }
    
    const avatarInitial = user.avatarInitial || name?.charAt(0).toUpperCase() || 'U';
    let bio = user.bio || user.about || user.profile?.bio || '';
    let location = user.location || user.country || user.profile?.country || 'Not specified';
    let joinDate = user.joinDate || user.createdAt || user.profile?.stats?.joinDate || new Date().toISOString();
    let tradingExperience = user.tradingExperience || user.profile?.tradingExperience || 'beginner';
    
    let socialLinks = {};
    if (user.socialLinks) socialLinks = { ...user.socialLinks };
    else if (user.profile?.socialLinks) socialLinks = { ...user.profile.socialLinks };
    else if (user.social) socialLinks = { ...user.social };
    else if (userData.socialLinks) socialLinks = { ...userData.socialLinks };
    else if (userData.profile?.socialLinks) socialLinks = { ...userData.profile.socialLinks };
    
    const socialFields = ['twitter', 'linkedin', 'github', 'website', 'whatsapp', 'facebook', 'discord', 'telegram', 'reddit', 'youtube', 'instagram'];
    socialFields.forEach(field => {
      if (!socialLinks[field]) {
        if (user[field]) socialLinks[field] = user[field];
        else if (user.profile?.[field]) socialLinks[field] = user.profile[field];
        else if (userData[field]) socialLinks[field] = userData[field];
      }
    });
    
    const followers = user.followers || user.stats?.followers || user.profile?.followers || user.followersCount || 0;
    const following = user.following || user.stats?.following || user.profile?.following || user.followingCount || 0;
    const postsCount = user.postsCount || user.stats?.posts || user.profile?.postsCount || 0;
    const totalTrades = user.tradesCompleted || user.stats?.tradesCompleted || user.profile?.tradesCompleted || 0;
    const winRate = user.successRate || user.stats?.successRate || user.profile?.successRate || 0;
    const lastActive = user.lastActive || user.stats?.lastActive || user.profile?.lastActive || new Date().toISOString();
    
    const formattedAvatar = formatAvatarUrl(avatarData);
    const formattedBanner = formatBannerUrl(bannerData);
    
    return {
      id: userId,
      _id: userId,
      name: name,
      username: username,
      email: email,
      avatar: formattedAvatar,
      avatarInitial: avatarInitial,
      hasAvatar: hasValidAvatar(avatarData),
      banner: formattedBanner,
      hasBanner: hasValidBanner(bannerData),
      bio: bio,
      location: location,
      joinDate: joinDate,
      tradingExperience: tradingExperience,
      socialLinks: socialLinks,
      followers: followers,
      following: following,
      postsCount: postsCount,
      lastSeen: lastActive,
      profile: {
        experience: tradingExperience,
        followers: followers,
        following: following,
        totalTrades: totalTrades,
        winRate: winRate,
        performance: winRate,
        experienceLevel: experienceLevels[tradingExperience]?.level || 1,
        postsCount: postsCount,
        lastActive: lastActive
      },
      stats: {
        posts: postsCount,
        chatRooms: user.stats?.chatRooms || 0,
        charts: user.stats?.charts || 0,
        news: user.stats?.news || 0,
        followers: followers,
        following: following,
        tradesCompleted: totalTrades,
        successRate: winRate,
        lastActive: lastActive
      }
    };
  }, []);

  // Fetch user profile
  const fetchUserProfile = useCallback(async (targetUserId) => {
    try {
      setLoading(true);
      setError(null);
      setProfileUser(null);
      setAvatarError(false);
      setBannerError(false);

      let userData = null;
      console.log('🔍 Fetching profile for user:', targetUserId, 'isOwnProfile:', isOwnProfile);

      if (isOwnProfile) {
        console.log('📡 Fetching own complete profile...');
        const response = await fetch(`${API_URL}/profile/complete`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ Complete profile response:', result);
          if (result.success && (result.user || result.profile)) {
            userData = formatUserData(result.user || result.profile, false);
          }
        }
      } else {
        console.log('📡 Fetching public profile for user:', targetUserId);
        
        try {
          const publicResponse = await fetch(`${API_URL}/profile/public/${targetUserId}`);
          if (publicResponse.ok) {
            const publicData = await publicResponse.json();
            console.log('✅ Public profile response:', publicData);
            if (publicData.success) {
              userData = formatUserData(publicData.profile || publicData.user || publicData, true);
            }
          }
        } catch (publicError) {
          console.log('Public profile fetch failed:', publicError);
        }
        
        if (!userData) {
          try {
            const authResponse = await fetch(`${API_URL}/users/${targetUserId}`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            });
            if (authResponse.ok) {
              const authData = await authResponse.json();
              console.log('✅ Auth profile response:', authData);
              if (authData.success) {
                userData = formatUserData(authData.user || authData, false);
              }
            }
          } catch (authError) {
            console.log('Auth profile fetch failed:', authError);
          }
        }
      }

      if (userData) {
        console.log('🎯 Setting profile user with data:', {
          id: userData.id,
          name: userData.name,
          avatar: userData.avatar,
          banner: userData.banner,
          hasBanner: userData.hasBanner
        });
        
        setProfileUser(userData);
        
        if (!isOwnProfile && targetUserId && currentUser) {
          try {
            const followResponse = await fetch(`${API_URL}/friends/status/${targetUserId}`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            });
            if (followResponse.ok) {
              const followData = await followResponse.json();
              setIsFollowing(followData.isFollowing || false);
            }
          } catch (followError) {
            console.error('Error checking follow status:', followError);
          }
        }
      } else {
        console.error('❌ No user data found');
        setError('User not found');
      }

      setLoading(false);
    } catch (error) {
      console.error('❌ Error fetching profile data:', error);
      setError('Failed to load user profile');
      setLoading(false);
    }
  }, [isOwnProfile, currentUser, formatUserData]);

  // Fetch user posts
  const fetchUserPosts = useCallback(async (targetUserId) => {
    try {
      console.log('📊 Fetching posts for user:', targetUserId);
      const response = await fetch(`${API_URL}/posts/user/${targetUserId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          let postsArray = [];
          if (result.posts) postsArray = result.posts;
          else if (result.data && result.data.posts) postsArray = result.data.posts;
          else if (Array.isArray(result)) postsArray = result;
          setPosts(postsArray);
        } else {
          setPosts([]);
        }
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error('❌ Error fetching posts:', error);
      setPosts([]);
    }
  }, []);

  // Fetch user gallery
  const fetchUserGallery = useCallback(async (targetUserId) => {
    try {
      const response = await fetch(`${API_URL}/gallery/${targetUserId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setGallery(result.gallery || { folders: [] });
        }
      }
    } catch (error) {
      console.error('❌ Error fetching gallery:', error);
      setGallery({ folders: [] });
    }
  }, []);

  // Create post
  const createPost = useCallback(async (postData) => {
    try {
      const response = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setPosts(prev => [result.post, ...prev]);
          setProfileUser(prev => ({
            ...prev,
            profile: { ...prev.profile, postsCount: (prev.profile.postsCount || 0) + 1 },
            postsCount: (prev.postsCount || 0) + 1
          }));
          return result;
        }
      }
      throw new Error('Failed to create post');
    } catch (error) {
      console.error('❌ Error creating post:', error);
      throw error;
    }
  }, []);

  // Like post
  const likePost = useCallback(async (postId) => {
    try {
      const response = await fetch(`${API_URL}/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setPosts(prev => prev.map(post => 
            post._id === postId ? { ...post, likes: result.likes, isLiked: result.isLiked } : post
          ));
        }
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  }, []);

  const handleLikePost = useCallback(async (postId) => likePost(postId), [likePost]);

  // Comment on post
  const commentOnPost = useCallback(async (postId, comment) => {
    try {
      const response = await fetch(`${API_URL}/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: comment }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setPosts(prev => prev.map(post => 
            post._id === postId ? { ...post, comments: [...(post.comments || []), result.comment] } : post
          ));
          return result.comment;
        }
      }
      throw new Error('Failed to add comment');
    } catch (error) {
      console.error('Error commenting on post:', error);
      throw error;
    }
  }, []);

  const handleCommentOnPost = useCallback(async (postId, comment) => commentOnPost(postId, comment), [commentOnPost]);

  // Reply to comment
  const handleReplyToComment = useCallback(async (postId, commentId, replyText, parentReplyId = null) => {
    try {
      const response = await fetch(`${API_URL}/posts/${postId}/comments/${commentId}/replies`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: replyText, parentReplyId }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setPosts(prevPosts => prevPosts.map(post => {
            if (post._id === postId) {
              return {
                ...post,
                comments: post.comments?.map(comment => 
                  comment._id === commentId ? { ...comment, replies: [...(comment.replies || []), result.reply] } : comment
                )
              };
            }
            return post;
          }));
          return result.reply;
        }
      }
      throw new Error('Failed to add reply');
    } catch (error) {
      console.error('Error replying to comment:', error);
      throw error;
    }
  }, []);

  // Like comment
  const handleCommentLike = useCallback(async (postId, commentId) => {
    try {
      const response = await fetch(`${API_URL}/posts/${postId}/comments/${commentId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setPosts(prev => prev.map(post => {
            if (post._id === postId) {
              return {
                ...post,
                comments: post.comments?.map(comment =>
                  comment._id === commentId ? { ...comment, likes: result.likes, _doc: { ...comment._doc, isLiked: result.isLiked } } : comment
                )
              };
            }
            return post;
          }));
        }
      }
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  }, []);

  // Like reply
  const handleReplyLike = useCallback(async (postId, commentId, replyId) => {
    try {
      const response = await fetch(`${API_URL}/posts/${postId}/comments/${commentId}/replies/${replyId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setPosts(prev => prev.map(post => {
            if (post._id === postId) {
              return {
                ...post,
                comments: post.comments?.map(comment =>
                  comment._id === commentId ? {
                    ...comment,
                    replies: comment.replies?.map(reply =>
                      reply._id === replyId ? { ...reply, likes: result.likes, isLiked: result.isLiked } : reply
                    )
                  } : comment
                )
              };
            }
            return post;
          }));
        }
      }
    } catch (error) {
      console.error('Error liking reply:', error);
    }
  }, []);

  // Share post
  const handleSharePost = useCallback(async (postId) => {
    try {
      const response = await fetch(`${API_URL}/posts/${postId}/share`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (response.ok) {
        const result = await response.json();
        alert('Post shared successfully!');
        return result.data;
      }
    } catch (error) {
      console.error('Error sharing post:', error);
      alert('Failed to share post');
    }
  }, []);

  // Handle repost
  const handleRepost = useCallback(async (repostData) => {
    try {
      const response = await fetch(`${API_URL}/posts/${repostData.originalPostId}/repost`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: repostData.content, visibility: repostData.visibility }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          if (isOwnProfile) setPosts(prev => [result.repost, ...prev]);
          return result.repost;
        }
      }
      throw new Error('Failed to repost');
    } catch (error) {
      console.error('❌ Error reposting:', error);
      throw error;
    }
  }, [isOwnProfile]);

  // Save post
  const handleSavePost = useCallback(async (postId, shouldSave) => {
    try {
      const response = await fetch(`${API_URL}/posts/${postId}/save`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ save: shouldSave }),
      });
      if (response.ok) {
        const result = await response.json();
        setSavedPosts(prev => shouldSave ? [...prev, postId] : prev.filter(id => id !== postId));
        alert(shouldSave ? 'Post saved!' : 'Post removed from saved');
        return result.data;
      }
    } catch (error) {
      console.error('Error saving post:', error);
      alert('Failed to save post');
    }
  }, []);

  // Delete post
  const deletePost = useCallback(async (postId) => {
    try {
      const response = await fetch(`${API_URL}/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setPosts(prev => prev.filter(post => post._id !== postId));
          setProfileUser(prev => ({
            ...prev,
            profile: { ...prev.profile, postsCount: Math.max(0, (prev.profile.postsCount || 0) - 1) },
            postsCount: Math.max(0, (prev.postsCount || 0) - 1)
          }));
        }
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  }, []);

  const handleDeletePost = useCallback(async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      await deletePost(postId);
    }
  }, [deletePost]);

  // Upload to gallery
  const uploadToGallery = useCallback(async (fileOrFiles, folderId, description) => {
    const formData = new FormData();
    const files = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];
    
    if (files.length === 0) throw new Error('No files selected');
    
    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) throw new Error(`File ${file.name} exceeds 50MB limit`);
    }
    
    files.forEach(file => {
      if (file instanceof File || file instanceof Blob) {
        formData.append('galleryFiles', file);
      } else {
        throw new Error(`Invalid file: ${file}`);
      }
    });
    
    if (folderId) formData.append('folderId', folderId);
    if (description) formData.append('description', description);
    
    try {
      const response = await fetch(`${API_URL}/gallery/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });
      
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Server returned invalid response: ${responseText.substring(0, 200)}`);
      }
      
      if (response.ok && data.success) {
        await fetchUserGallery(profileUser.id);
        return data;
      } else {
        throw new Error(data.message || data.error || `Upload failed with status ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error uploading to gallery:', error);
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Network error: Unable to connect to server.');
      }
      throw error;
    }
  }, [profileUser?.id, fetchUserGallery]);

  // Create gallery folder
  const createGalleryFolder = useCallback(async (name) => {
    if (!name || !name.trim()) throw new Error('Folder name is required');
    try {
      const response = await fetch(`${API_URL}/gallery/folders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name.trim() }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        await fetchUserGallery(profileUser.id);
        return result;
      }
      throw new Error(result.message || 'Failed to create folder');
    } catch (error) {
      console.error('❌ Error creating folder:', error);
      throw error;
    }
  }, [profileUser?.id, fetchUserGallery]);

  // Delete gallery folder
  const deleteGalleryFolder = useCallback(async (folderId) => {
    if (!folderId) throw new Error('Folder ID is required');
    try {
      const response = await fetch(`${API_URL}/gallery/folders/${folderId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      const result = await response.json();
      if (response.ok && result.success) {
        await fetchUserGallery(profileUser.id);
        return result;
      }
      throw new Error(result.message || 'Failed to delete folder');
    } catch (error) {
      console.error('❌ Error deleting folder:', error);
      throw error;
    }
  }, [profileUser?.id, fetchUserGallery]);

  // Delete gallery item
  const deleteGalleryItem = useCallback(async (itemId) => {
    if (!itemId) throw new Error('Item ID is required');
    try {
      const response = await fetch(`${API_URL}/gallery/items/${itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      const result = await response.json();
      if (response.ok && result.success) {
        await fetchUserGallery(profileUser.id);
        return result;
      }
      throw new Error(result.message || 'Failed to delete item');
    } catch (error) {
      console.error('❌ Error deleting gallery item:', error);
      throw error;
    }
  }, [profileUser?.id, fetchUserGallery]);

  // Handle follow
  const handleFollow = useCallback(async () => {
    if (!targetUserId || !profileUser) return;
    try {
      const response = await fetch(`${API_URL}/friends/${isFollowing ? 'unfollow' : 'follow'}/${targetUserId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setIsFollowing(!isFollowing);
          setProfileUser(prev => ({
            ...prev,
            followers: isFollowing ? (prev.followers - 1) : (prev.followers + 1),
            profile: { ...prev.profile, followers: isFollowing ? (prev.profile.followers - 1) : (prev.profile.followers + 1) },
            stats: { ...prev.stats, followers: isFollowing ? (prev.stats.followers - 1) : (prev.stats.followers + 1) }
          }));
        }
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
    }
  }, [targetUserId, profileUser, isFollowing]);

  // Handle message
  const handleMessage = useCallback(() => {
    if (profileUser?.id) navigate(`/chat/${profileUser.id}`);
  }, [navigate, profileUser?.id]);

  // Handle edit profile
  const handleEditProfile = useCallback(() => {
    navigate('/profile/settings');
  }, [navigate]);

  // Handle stat click
  const handleStatClick = useCallback((statType) => {
    if (!profileUser?.id) return;
    switch(statType) {
      case 'followers': navigate(`/profile/${profileUser.id}/followers`); break;
      case 'following': navigate(`/profile/${profileUser.id}/following`); break;
      case 'trades': navigate(`/profile/${profileUser.id}/trades`); break;
      default: break;
    }
  }, [navigate, profileUser?.id]);

  // Open/close modal
  const openModal = useCallback(() => {
    if (profileUser?.avatar) setIsModalOpen(true);
  }, [profileUser?.avatar]);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  // Delete comment
  const handleDeleteComment = useCallback(async (postId, commentId) => {
    try {
      const response = await fetch(`${API_URL}/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setPosts(prev => prev.map(post =>
            post._id === postId ? { ...post, comments: post.comments?.filter(c => c._id !== commentId) } : post
          ));
        }
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  }, []);

  // Delete reply
  const handleReplyDelete = useCallback(async (postId, commentId, replyId) => {
    try {
      const response = await fetch(`${API_URL}/posts/${postId}/comments/${commentId}/replies/${replyId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setPosts(prev => prev.map(post => {
            if (post._id === postId) {
              return {
                ...post,
                comments: post.comments?.map(comment =>
                  comment._id === commentId ? { ...comment, replies: comment.replies?.filter(r => r._id !== replyId) } : comment
                )
              };
            }
            return post;
          }));
        }
      }
    } catch (error) {
      console.error('Error deleting reply:', error);
    }
  }, []);

  // Report post
  const handleReportPost = useCallback(async (postId, reportData) => {
    try {
      const response = await fetch(`${API_URL}/posts/${postId}/report`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      });
      if (response.ok) console.log('Post reported');
    } catch (error) {
      console.error('Error reporting post:', error);
    }
  }, []);

  // Handle go home/back
  const handleGoHome = useCallback(() => navigate('/'), [navigate]);
  const handleGoBack = useCallback(() => navigate(-1), [navigate]);
  
  // Effects
  useEffect(() => {
    if (targetUserId) fetchUserProfile(targetUserId);
    else { setLoading(false); setError('Please log in to view profiles'); }
  }, [targetUserId, fetchUserProfile]);

  useEffect(() => {
    if (profileUser) {
      fetchUserPosts(profileUser.id);
      fetchUserGallery(profileUser.id);
    }
  }, [profileUser, fetchUserPosts, fetchUserGallery]);

  // Tab content rendering
  const renderTimelineTab = () => (
    <div className={styles.timelineTab}>
      {isOwnProfile && <CreatePost profileUser={profileUser} onCreatePost={createPost} />}
      <div className={styles.timelinePosts}>
        {posts && posts.length > 0 ? (
          posts.map((singlePost) => (
            <PostComponent
              key={singlePost._id}
              post={singlePost}
              currentUserId={currentUser?._id || currentUser?.id}
              onLike={handleLikePost}
              onComment={commentOnPost}
              onReply={handleReplyToComment}
              onDelete={handleDeletePost}
              onShare={handleSharePost}
              onRepost={handleRepost}
              onSave={handleSavePost}
              onReplyLike={handleReplyLike}
              onReplyDelete={handleReplyDelete}
              onReport={handleReportPost}
              isSaved={savedPosts?.includes(singlePost._id)}
              showActions={true}
              realtimeEnabled={true}
            />
          ))
        ) : (
          <div className={styles.noComments}>
            <p>No posts yet</p>
            {isOwnProfile && <p>Share your first post above!</p>}
          </div>
        )}
      </div>
    </div>
  );

  const renderGalleryTab = () => (
    <GalleryComponent
      gallery={gallery}
      isOwnProfile={isOwnProfile}
      onUpload={uploadToGallery}
      onCreateFolder={createGalleryFolder}
      onDeleteItem={deleteGalleryItem}
      onDeleteFolder={deleteGalleryFolder}
    />
  );

  const renderPlaceholderTab = (icon, message) => (
    <div className={styles.placeholderTab}>
      <div className={styles.noData}>
        {React.createElement(icon, { size: 48 })}
        <p>{message} feature coming soon</p>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch(activeTab) {
      case 'timeline': return renderTimelineTab();
      case 'overview': return <OverviewTab profileUser={profileUser} posts={posts} onStatClick={handleStatClick} />;
      case 'gallery': return renderGalleryTab();
      case 'chat-rooms': return renderPlaceholderTab(FaComments, 'Active Chat Rooms');
      case 'charts': return <ChartTab currentUserId={currentUser?._id || currentUser?.id} profileUserId={profileUser?.id} isOwnProfile={isOwnProfile} />;
      case 'news': return renderPlaceholderTab(FaNewspaper, 'Market News & Reports');
      default: return renderTimelineTab();
    }
  };

  const tabsConfig = {
    postsCount: profileUser?.profile?.postsCount || profileUser?.postsCount || 0,
    galleryItems: gallery.folders.reduce((total, folder) => total + (folder.items?.length || 0), 0),
    chatRooms: profileUser?.stats?.chatRooms || 0,
    charts: profileUser?.stats?.charts || 0,
    news: profileUser?.stats?.news || 0
  };

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMins = Math.floor((now - date) / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    return date.toLocaleDateString();
  };

  // Loading state
  if (loading) {
    return (
      <div className={`${styles.loadingContainer} ${darkMode ? styles.dark : styles.light}`}>
        <div className={styles.spinner}></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  // Error state
  if (error || !profileUser) {
    return (
      <div className={`${styles.errorContainer} ${darkMode ? styles.dark : styles.light}`}>
        <h2>Profile Not Found</h2>
        <p>{error || "The user profile you're looking for doesn't exist."}</p>
        <div className={styles.errorActions}>
          <button onClick={handleGoBack} className={styles.backButton}><FaArrowLeft /> Go Back</button>
          <button onClick={handleGoHome} className={styles.homeButton}><FaHome /> Go Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.profileContainer} ${darkMode ? styles.dark : styles.light} ${isPanelCollapsed ? styles.panelCollapsed : ''}`}>
      <AvatarModal
        isOpen={isModalOpen}
        onClose={closeModal}
        avatarUrl={profileUser.avatar}
        avatarInitial={profileUser.avatarInitial}
      />

      <ConnectionPanel initialTab="followers" />

      <div className={styles.mainContentArea}>
        {/* Navigation Bar */}
        <div className={`${styles.navigationBar} ${isScrolled ? styles.scrolled : ''}`}>
          <button onClick={handleGoBack} className={styles.navButton} title="Go back">
            <FaArrowLeft />
          </button>
          <button onClick={handleGoHome} className={styles.navButton} title="Go home">
            <FaHome />
          </button>
          <div className={styles.navProfileInfo}>
            <span className={styles.navProfileName}>{profileUser.name}</span>
            <span className={styles.navProfileUsername}>@{profileUser.username}</span>
          </div>
          <div className={styles.socketStatus}>
            {socketConnected ? (
              <span className={styles.connected} title="Real-time connected">
                <FaWifi />
              </span>
            ) : (
              <span className={styles.disconnected} title="Real-time disconnected">
                <FaPlug />
              </span>
            )}
          </div>
        </div>

        {/* STICKY HEADER - NEW */}
        <div className={`${styles.stickyHeader} ${showStickyHeader ? styles.visible : ''}`}>
          <div className={styles.stickyHeaderContent}>
            <button className={styles.stickyBackButton} onClick={handleGoBack} title="Go back">
              <FaArrowLeft />
            </button>
            
            <div className={styles.stickyAvatar} onClick={openModal}>
              {profileUser.avatar && !avatarError ? (
                <img src={profileUser.avatar} alt={profileUser.name} />
              ) : (
                <div className={styles.stickyAvatarInitial}>
                  {getAvatarInitial(profileUser)}
                </div>
              )}
            </div>
            
            <div className={styles.stickyUserInfo}>
              <div className={styles.stickyName}>{profileUser.name}</div>
              <div className={styles.stickyUsername}>@{profileUser.username}</div>
            </div>
            
            {isUserOnline && (
              <div className={styles.stickyOnlineIndicator}>
                <span className={styles.stickyOnlineDot}></span>
                <span>Online</span>
              </div>
            )}
            
            <div className={styles.stickyStats}>
              <div className={styles.stickyStat} onClick={() => handleStatClick('followers')}>
                <span className={styles.stickyStatValue}>{profileUser.followers?.toLocaleString() || 0}</span>
                <span className={styles.stickyStatLabel}>followers</span>
              </div>
              <div className={styles.stickyStat} onClick={() => handleStatClick('following')}>
                <span className={styles.stickyStatValue}>{profileUser.following?.toLocaleString() || 0}</span>
                <span className={styles.stickyStatLabel}>following</span>
              </div>
            </div>
            
            <div className={styles.stickyActions}>
              {!isOwnProfile ? (
                <>
                  <button 
                    className={`${styles.stickyFollowBtn} ${isFollowing ? styles.following : ''}`}
                    onClick={handleFollow}
                  >
                    {isFollowing ? <FaUserCheck size={12} /> : <FaUserPlus size={12} />}
                    <span>{isFollowing ? 'Following' : 'Follow'}</span>
                  </button>
                  <button className={styles.stickyMessageBtn} onClick={handleMessage}>
                    <FaMessage size={12} />
                    <span>Message</span>
                  </button>
                </>
              ) : (
                <button className={styles.stickyEditBtn} onClick={handleEditProfile}>
                  <FaEdit size={12} />
                  <span>Edit</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Profile Header */}
        <ProfileHeader
          profileUser={profileUser}
          isOwnProfile={isOwnProfile}
          isFollowing={isFollowing}
          onFollow={handleFollow}
          onMessage={handleMessage}
          onEditProfile={handleEditProfile}
          onAvatarClick={openModal}
          onStatClick={handleStatClick}
          bannerUrl={profileUser.banner}
          hasBanner={profileUser.hasBanner}
          isOnline={isUserOnline}
          lastSeen={lastSeen}
          formatLastSeen={formatLastSeen}
        />

        <main className={styles.mainContent}>
          <TabsNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
            tabsConfig={tabsConfig}
          />

          <div className={styles.tabContent}>
            {renderTabContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserProfileView;