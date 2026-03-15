/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import ConnectionPanel from './ConnectionPanel';
import { io } from 'socket.io-client';
import ChartTab from './ChartTab';
// Import components
import AvatarModal from './AvatarModal';
import TabsNavigation from './TabsNavigation';
import CreatePost from './CreatePost';
import PostComponent from './PostComponent';
import OverviewTab from './OverviewTab';
import GalleryComponent from './GalleryComponent';
// In UserProfileView.jsx, add this import with the other component imports
import ProfileHeader from './ProfileHeader';  // Add this line

// Import utilities - SAME as ConnectionPanel
import { formatAvatarUrl, formatBannerUrl, getAvatarInitial, hasValidAvatar, hasValidBanner } from '../../utils/avatarUtils';
import { experienceLevels } from './profileConstants';

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
  FaRetweet
} from 'react-icons/fa';

// Constants for API URLs
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 
                 import.meta.env.VITE_BASE_URL || 
                 (import.meta.env.PROD ? window.location.origin : 'http://localhost:5000');
const SOCKET_URL = BASE_URL;

// Socket connection for online status
let socket;

const UserProfileView = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { darkMode } = useTheme();

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

  // Initialize socket connection for online status
  useEffect(() => {
    if (currentUser) {
      socket = io(SOCKET_URL, {
        query: { userId: currentUser.id },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5
      });

      // Listen for all online users
      socket.on('users:online', (users) => {
        console.log('📊 Online users received:', users);
        setOnlineUsers(users);
      });

      // Listen for user coming online
      socket.on('user:online', (data) => {
        console.log('🟢 User online:', data);
        setOnlineUsers(prev => ({ 
          ...prev, 
          [data.userId]: { online: true, userData: data.userData } 
        }));
      });

      // Listen for user going offline
      socket.on('user:offline', (data) => {
        console.log('🔴 User offline:', data);
        setOnlineUsers(prev => {
          const newState = { ...prev };
          delete newState[data.userId];
          return newState;
        });
      });

      // Request specific user status when profile loads
      socket.on('connect', () => {
        console.log('✅ Socket connected');
        if (profileUser?.id) {
          socket.emit('user:status', { targetUserId: profileUser.id });
        }
      });

      return () => {
        if (socket) {
          socket.off('users:online');
          socket.off('user:online');
          socket.off('user:offline');
          socket.disconnect();
        }
      };
    }
  }, [currentUser, profileUser?.id]);

  // Update online status for current profile user
  useEffect(() => {
    if (profileUser?.id && socket?.connected) {
      socket.emit('user:status', { targetUserId: profileUser.id });
      const isOnline = onlineUsers[profileUser.id]?.online || false;
      setIsUserOnline(isOnline);
    }
  }, [profileUser, onlineUsers]);

  // Format user data consistently - LIKE ConnectionPanel's formatUserForDisplay
  const formatUserData = useCallback((userData, isPublic = false) => {
    if (!userData) return null;
    
    console.log('👤 Formatting user data:', { userData, isPublic });
    
    // Handle different API response structures
    let user = userData;
    
    if (userData.profile && !userData.id && !userData._id) {
      user = {
        ...userData,
        ...userData.profile
      };
    }
    
    if (userData.user) {
      user = {
        ...userData.user,
        ...userData
      };
    }
    
    // Extract ID
    const userId = user.id || user._id || user.userId || (userData.data?.id);
    
    // Extract name
    let name = user.name || user.fullName || user.displayName || 'Unknown User';
    
    // Extract username
    let username = user.username || user.userName || 'user';
    
    // Extract email
    let email = user.email;
    
    // Extract avatar - like ConnectionPanel
    let avatarData = null;
    if (user.avatar) avatarData = user.avatar;
    else if (user.avatarUrl) avatarData = user.avatarUrl;
    else if (user.profile?.avatar) avatarData = user.profile.avatar;
    
    if (avatarData && typeof avatarData === 'object') {
      avatarData = avatarData.url || avatarData.avatarUrl || null;
    }
    
    // Extract banner
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
    
    // Extract bio
    let bio = user.bio || user.about || user.profile?.bio || '';
    
    // Extract location
    let location = user.location || user.country || user.profile?.country || 'Not specified';
    
    // Extract join date
    let joinDate = user.joinDate || user.createdAt || user.profile?.stats?.joinDate || new Date().toISOString();
    
    // Extract trading experience
    let tradingExperience = user.tradingExperience || user.profile?.tradingExperience || 'beginner';
    
    // EXTRACT SOCIAL LINKS
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
    
    // Extract stats
    const followers = user.followers || 
                     user.stats?.followers || 
                     user.profile?.followers || 
                     user.followersCount || 0;
    
    const following = user.following || 
                     user.stats?.following || 
                     user.profile?.following || 
                     user.followingCount || 0;
    
    const postsCount = user.postsCount || 
                      user.stats?.posts || 
                      user.profile?.postsCount || 0;
    
    const totalTrades = user.tradesCompleted || 
                       user.stats?.tradesCompleted || 
                       user.profile?.tradesCompleted || 0;
    
    const winRate = user.successRate || 
                   user.stats?.successRate || 
                   user.profile?.successRate || 0;
    
    const lastActive = user.lastActive || 
                      user.stats?.lastActive || 
                      user.profile?.lastActive || 
                      new Date().toISOString();
    
    // Format URLs ONCE - like ConnectionPanel does
    const formattedAvatar = formatAvatarUrl(avatarData);
    const formattedBanner = formatBannerUrl(bannerData);
    
    // Return fully formatted user object
    const formattedUser = {
      id: userId,
      _id: userId,
      name: name,
      username: username,
      email: email,
      // Store formatted URLs directly
      avatar: formattedAvatar,
      avatarInitial: avatarInitial,
      hasAvatar: hasValidAvatar(avatarData),
      banner: formattedBanner,
      hasBanner: hasValidBanner(bannerData),
      bio: bio,
      location: location,
      joinDate: joinDate,
      tradingExperience: tradingExperience,
      
      // SOCIAL LINKS
      socialLinks: socialLinks,
      
      // Stats at root level
      followers: followers,
      following: following,
      postsCount: postsCount,
      
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

    console.log('✅ Formatted user:', {
      id: formattedUser.id,
      name: formattedUser.name,
      avatar: formattedUser.avatar,
      banner: formattedUser.banner,
      hasBanner: formattedUser.hasBanner,
      socialLinks: Object.keys(formattedUser.socialLinks).filter(k => formattedUser.socialLinks[k]),
      stats: formattedUser.stats
    });
    
    return formattedUser;
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
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
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
        
        // Fallback to auth endpoint if public fails
        if (!userData) {
          try {
            const authResponse = await fetch(`${API_URL}/users/${targetUserId}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
              },
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
        
        // Check follow status for other users
        if (!isOwnProfile && targetUserId && currentUser) {
          try {
            const followResponse = await fetch(`${API_URL}/friends/status/${targetUserId}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
              },
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
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('📊 Posts response:', result);
        
        if (result.success) {
          let postsArray = [];
          if (result.posts) {
            postsArray = result.posts;
          } else if (result.data && result.data.posts) {
            postsArray = result.data.posts;
          } else if (Array.isArray(result)) {
            postsArray = result;
          }
          
          console.log('✅ Setting posts:', postsArray.length);
          setPosts(postsArray);
        } else {
          console.warn('⚠️ Posts fetch unsuccessful:', result);
          setPosts([]);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Posts fetch failed:', response.status, errorData);
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
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
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
      console.log('📝 Creating post with data:', postData);
      
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
        console.log('✅ Post created:', result);
        
        if (result.success) {
          setPosts(prev => [result.post, ...prev]);
          
          setProfileUser(prev => ({
            ...prev,
            profile: {
              ...prev.profile,
              postsCount: (prev.profile.postsCount || 0) + 1
            },
            postsCount: (prev.postsCount || 0) + 1
          }));
          
          return result;
        }
      } else {
        const error = await response.json();
        console.error('❌ Post creation failed:', error);
        throw new Error(error.message || 'Failed to create post');
      }
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
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setPosts(prev => prev.map(post => 
            post._id === postId 
              ? { ...post, likes: result.likes, isLiked: result.isLiked } 
              : post
          ));
        }
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  }, []);

  const handleLikePost = useCallback(async (postId) => {
    return await likePost(postId);
  }, [likePost]);

  // Comment on post
  const commentOnPost = useCallback(async (postId, comment) => {
    try {
      console.log('💬 Adding comment:', { postId, comment });
      
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
        console.log('✅ Comment added:', result);
        
        if (result.success) {
          setPosts(prev => prev.map(post => 
            post._id === postId 
              ? { ...post, comments: [...(post.comments || []), result.comment] } 
              : post
          ));
          return result.comment;
        }
      } else {
        const errorData = await response.json();
        console.error('❌ Comment failed:', errorData);
        throw new Error(errorData.message || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Error commenting on post:', error);
      throw error;
    }
  }, []);

  const handleCommentOnPost = useCallback(async (postId, comment) => {
    return await commentOnPost(postId, comment);
  }, [commentOnPost]);

  // Reply to comment
  const handleReplyToComment = useCallback(async (postId, commentId, replyText, parentReplyId = null) => {
    try {
      console.log('💬 Adding reply:', { postId, commentId, replyText, parentReplyId });
      
      const response = await fetch(`${API_URL}/posts/${postId}/comments/${commentId}/replies`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content: replyText,
          parentReplyId: parentReplyId 
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Reply added:', result);
        
        if (result.success) {
          setPosts(prevPosts => prevPosts.map(post => {
            if (post._id === postId) {
              return {
                ...post,
                comments: post.comments?.map(comment => {
                  if (comment._id === commentId) {
                    return {
                      ...comment,
                      replies: [...(comment.replies || []), result.reply]
                    };
                  }
                  return comment;
                })
              };
            }
            return post;
          }));
          
          return result.reply;
        }
      } else {
        const errorData = await response.json();
        console.error('❌ Reply failed:', errorData);
        throw new Error(errorData.message || 'Failed to add reply');
      }
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
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setPosts(prev => prev.map(post => {
            if (post._id === postId) {
              return {
                ...post,
                comments: post.comments?.map(comment => {
                  if (comment._id === commentId) {
                    return {
                      ...comment,
                      likes: result.likes,
                      _doc: { ...comment._doc, isLiked: result.isLiked }
                    };
                  }
                  return comment;
                })
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
      const response = await fetch(
        `${API_URL}/posts/${postId}/comments/${commentId}/replies/${replyId}/like`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setPosts(prev => prev.map(post => {
            if (post._id === postId) {
              return {
                ...post,
                comments: post.comments?.map(comment => {
                  if (comment._id === commentId) {
                    return {
                      ...comment,
                      replies: comment.replies?.map(reply => {
                        if (reply._id === replyId) {
                          return {
                            ...reply,
                            likes: result.likes,
                            isLiked: result.isLiked
                          };
                        }
                        return reply;
                      })
                    };
                  }
                  return comment;
                })
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
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
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
      console.log('🔄 Reposting:', repostData);
      
      const response = await fetch(`${API_URL}/posts/${repostData.originalPostId}/repost`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: repostData.content,
          visibility: repostData.visibility
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Repost created:', result);
        
        if (result.success) {
          if (isOwnProfile) {
            setPosts(prev => [result.repost, ...prev]);
          }
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
        setSavedPosts(prev => 
          shouldSave 
            ? [...prev, postId]
            : prev.filter(id => id !== postId)
        );
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
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setPosts(prev => prev.filter(post => post._id !== postId));
          setProfileUser(prev => ({
            ...prev,
            profile: {
              ...prev.profile,
              postsCount: Math.max(0, (prev.profile.postsCount || 0) - 1)
            },
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
    
    files.forEach(file => {
      if (file instanceof File || file instanceof Blob) {
        formData.append('galleryFiles', file);
        console.log(`📎 Appending file: ${file.name} (${file.type}, ${file.size} bytes)`);
      } else {
        console.error('❌ Invalid file object:', file);
      }
    });
    
    if (folderId) {
      formData.append('folderId', folderId);
    }
    
    if (description) {
      formData.append('description', description);
    }

    try {
      const response = await fetch(`${API_URL}/gallery/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const data = await response.json();
      console.log('📥 Upload response:', data);

      if (response.ok && data.success) {
        await fetchUserGallery(profileUser.id);
        return data;
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('❌ Error uploading to gallery:', error);
      throw error;
    }
  }, [profileUser?.id, fetchUserGallery]);

  // Create gallery folder
  const createGalleryFolder = useCallback(async (name) => {
    try {
      const response = await fetch(`${API_URL}/gallery/folders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          fetchUserGallery(profileUser.id);
        }
      }
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  }, [profileUser?.id, fetchUserGallery]);

  // Delete gallery folder
  const deleteGalleryFolder = useCallback(async (folderId) => {
    try {
      const response = await fetch(`${API_URL}/gallery/folders/${folderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          fetchUserGallery(profileUser.id);
        }
      }
    } catch (error) {
      console.error('Error deleting folder:', error);
    }
  }, [profileUser?.id, fetchUserGallery]);

  // Delete gallery item
  const deleteGalleryItem = useCallback(async (itemId) => {
    try {
      const response = await fetch(`${API_URL}/gallery/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          fetchUserGallery(profileUser.id);
        }
      }
    } catch (error) {
      console.error('Error deleting gallery item:', error);
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
            profile: {
              ...prev.profile,
              followers: isFollowing ? (prev.profile.followers - 1) : (prev.profile.followers + 1)
            },
            stats: {
              ...prev.stats,
              followers: isFollowing ? (prev.stats.followers - 1) : (prev.stats.followers + 1)
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
    }
  }, [targetUserId, profileUser, isFollowing]);

  // Handle message
  const handleMessage = useCallback(() => {
    if (profileUser?.id) {
      navigate(`/chat/${profileUser.id}`);
    }
  }, [navigate, profileUser?.id]);

  // Handle edit profile
  const handleEditProfile = useCallback(() => {
    navigate('/profile/settings');
  }, [navigate]);

  // Handle edit banner
  const handleEditBanner = useCallback(() => {
    navigate('/profile/settings', { state: { activeTab: 'personal' } });
  }, [navigate]);

  // Handle stat click
  const handleStatClick = useCallback((statType) => {
    if (!profileUser?.id) return;
    
    switch(statType) {
      case 'followers':
        navigate(`/profile/${profileUser.id}/followers`);
        break;
      case 'following':
        navigate(`/profile/${profileUser.id}/following`);
        break;
      case 'trades':
        navigate(`/profile/${profileUser.id}/trades`);
        break;
      default:
        break;
    }
  }, [navigate, profileUser?.id]);

  // Open modal
  const openModal = useCallback(() => {
    if (profileUser?.avatar) {
      setIsModalOpen(true);
    }
  }, [profileUser?.avatar]);

  // Close modal
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // Delete comment
  const handleDeleteComment = useCallback(async (postId, commentId) => {
    try {
      const response = await fetch(`${API_URL}/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setPosts(prev => prev.map(post => {
            if (post._id === postId) {
              return {
                ...post,
                comments: post.comments?.filter(c => c._id !== commentId)
              };
            }
            return post;
          }));
        }
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  }, []);

  // Delete reply
  const handleReplyDelete = useCallback(async (postId, commentId, replyId) => {
    try {
      const response = await fetch(
        `${API_URL}/posts/${postId}/comments/${commentId}/replies/${replyId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setPosts(prev => prev.map(post => {
            if (post._id === postId) {
              return {
                ...post,
                comments: post.comments?.map(comment => {
                  if (comment._id === commentId) {
                    return {
                      ...comment,
                      replies: comment.replies?.filter(r => r._id !== replyId)
                    };
                  }
                  return comment;
                })
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

      if (response.ok) {
        const result = await response.json();
        console.log('Post reported:', result);
      }
    } catch (error) {
      console.error('Error reporting post:', error);
    }
  }, []);

  // Handle social link click
  const handleSocialLinkClick = useCallback((url) => {
    if (url) {
      let fullUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        if (url.includes('whatsapp.com') || url.startsWith('+')) {
          if (url.startsWith('+')) {
            fullUrl = `https://wa.me/${url.replace(/\D/g, '')}`;
          } else {
            fullUrl = `https://${url}`;
          }
        } else {
          fullUrl = `https://${url}`;
        }
      }
      window.open(fullUrl, '_blank', 'noopener,noreferrer');
    }
  }, []);

  // Handle go home
  const handleGoHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // Handle go back
  const handleGoBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);
  
  // Effects
  useEffect(() => {
    if (targetUserId) {
      fetchUserProfile(targetUserId);
    } else {
      setLoading(false);
      setError('Please log in to view profiles');
    }
  }, [targetUserId, fetchUserProfile]);

  useEffect(() => {
    if (profileUser) {
      fetchUserPosts(profileUser.id);
      fetchUserGallery(profileUser.id);
    }
  }, [profileUser, fetchUserPosts, fetchUserGallery]);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 100;
      setIsScrolled(scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Tab content rendering
  const renderTimelineTab = () => (
    <div className={styles.timelineTab}>
      {isOwnProfile && (
        <CreatePost
          profileUser={profileUser}
          onCreatePost={createPost}
        />
      )}
      
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
            {isOwnProfile && (
              <p>Share your first post above!</p>
            )}
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
      <h3>{message}</h3>
      <div className={styles.noData}>
        {React.createElement(icon, { size: 48 })}
        <p>{message} feature coming soon</p>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch(activeTab) {
      case 'timeline':
        return renderTimelineTab();
      case 'overview':
        return <OverviewTab profileUser={profileUser} posts={posts} onStatClick={handleStatClick} />;
      case 'gallery':
        return renderGalleryTab();
      case 'chat-rooms':
        return renderPlaceholderTab(FaComments, 'Active Chat Rooms');
      case 'charts':
        return (
        <ChartTab 
          currentUserId={currentUser?._id || currentUser?.id}
          profileUserId={profileUser?.id}
          isOwnProfile={isOwnProfile}
        />
      );
      case 'news':
        return renderPlaceholderTab(FaNewspaper, 'Market News & Reports');
      default:
        return renderTimelineTab();
    }
  };

  // Tabs configuration
  const tabsConfig = {
    postsCount: profileUser?.profile?.postsCount || profileUser?.postsCount || 0,
    galleryItems: gallery.folders.reduce((total, folder) => total + (folder.items?.length || 0), 0),
    chatRooms: profileUser?.stats?.chatRooms || 0,
    charts: profileUser?.stats?.charts || 0,
    news: profileUser?.stats?.news || 0
  };

  // Filter social links that have values
  const getActiveSocialLinks = useCallback(() => {
    if (!profileUser?.socialLinks) return [];
    
    return Object.entries(profileUser.socialLinks)
      .filter(([key, value]) => value && value.trim() !== '' && socialIcons[key])
      .map(([key, value]) => ({
        platform: key,
        url: value,
        icon: socialIcons[key]
      }));
  }, [profileUser?.socialLinks]);

  // Loading state
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  // Error state
  if (error || !profileUser) {
    return (
      <div className={styles.errorContainer}>
        <h2>Profile Not Found</h2>
        <p>{error || "The user profile you're looking for doesn't exist."}</p>
        <div className={styles.errorActions}>
          <button onClick={handleGoBack} className={styles.backButton}>
            <FaArrowLeft /> Go Back
          </button>
          <button onClick={handleGoHome} className={styles.homeButton}>
            <FaHome /> Go Home
          </button>
        </div>
      </div>
    );
  }

  const activeSocialLinks = getActiveSocialLinks();

  console.log('🎯 FINAL RENDER VALUES:', {
    profileUser: {
      id: profileUser.id,
      name: profileUser.name,
      avatar: profileUser.avatar,
      banner: profileUser.banner,
      hasBanner: profileUser.hasBanner
    },
    avatarError,
    bannerError
  });

  return (
    <div className={`${styles.profileContainer} ${darkMode ? styles.dark : styles.light}`}>
      <AvatarModal
        isOpen={isModalOpen}
        onClose={closeModal}
        avatarUrl={profileUser.avatar}
        avatarInitial={profileUser.avatarInitial}
      />

      <ConnectionPanel />

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
        </div>

        {/* Profile Header - Pass the already formatted URLs */}
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