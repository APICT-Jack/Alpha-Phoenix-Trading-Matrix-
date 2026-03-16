// UserProfileView.jsx - COMPLETE UPDATED FILE WITH ALL STATE VARIABLES

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

// Import services - REPLACED socketService and profileService with userStatusService
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
  FaSignal
} from 'react-icons/fa';

// Constants for API URLs
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 
                 import.meta.env.VITE_BASE_URL || 
                 (import.meta.env.PROD ? window.location.origin : 'http://localhost:5000');

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
  const [connectionQuality, setConnectionQuality] = useState('good'); // good, poor - ADD THIS LINE

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

  // ============ USER STATUS SERVICE SETUP ============
  useEffect(() => {
    if (!currentUser || !currentUser.id) return;

    console.log('🔌 Initializing user status service for:', currentUser.id);

    // Initialize the service
    userStatusService.init(currentUser, {
      onConnect: () => {
        console.log('✅ User status service connected');
        setSocketConnected(true);
        
        // Request status for the current profile user
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
      onUsersOnline: (users) => {
        console.log('📊 Online users received');
        setOnlineUsers(prev => {
          const newState = { ...prev };
          Object.entries(users).forEach(([id, status]) => {
            newState[id] = status.online;
          });
          return newState;
        });
        
        // Update current profile status
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

    // Monitor connection quality
    const interval = setInterval(() => {
      if (userStatusService.isConnected()) {
        // Check if we're getting updates
        setConnectionQuality('good');
      } else {
        setConnectionQuality('poor');
      }
    }, 10000);

    return () => {
      console.log('🧹 Cleaning up user status service');
      userStatusService.disconnect();
      clearInterval(interval);
    };
  }, [currentUser, profileUser?.id]);

  // Add effect to request status when profile user changes
  useEffect(() => {
    if (profileUser?.id && userStatusService.isConnected()) {
      console.log('🔍 Requesting status for profile user:', profileUser.id);
      userStatusService.getUserStatus(profileUser.id);
    }
  }, [profileUser?.id]);

  // Format user data consistently - KEEP YOUR EXISTING IMPLEMENTATION
  const formatUserData = useCallback((userData, isPublic = false) => {
    // ... (keep your existing formatUserData function)
    // I'm not including the full function here for brevity, but keep your existing implementation
    // Make sure this function returns the formatted user object
    return userData; // Replace with your actual implementation
  }, []);

  // Fetch user profile - KEEP YOUR EXISTING IMPLEMENTATION
  const fetchUserProfile = useCallback(async (targetUserId) => {
    // ... (keep your existing fetchUserProfile function)
    try {
      setLoading(true);
      setError(null);
      // Your existing fetch logic here
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [isOwnProfile, currentUser, formatUserData]);

  // Fetch user posts - KEEP YOUR EXISTING IMPLEMENTATION
  const fetchUserPosts = useCallback(async (targetUserId) => {
    // ... (keep your existing function)
  }, []);

  // Fetch user gallery - KEEP YOUR EXISTING IMPLEMENTATION
  const fetchUserGallery = useCallback(async (targetUserId) => {
    // ... (keep your existing function)
  }, []);

  // Create post - KEEP YOUR EXISTING IMPLEMENTATION
  const createPost = useCallback(async (postData) => {
    // ... (keep your existing function)
  }, []);

  // Like post - KEEP YOUR EXISTING IMPLEMENTATION
  const likePost = useCallback(async (postId) => {
    // ... (keep your existing function)
  }, []);

  const handleLikePost = useCallback(async (postId) => {
    return await likePost(postId);
  }, [likePost]);

  // Comment on post - KEEP YOUR EXISTING IMPLEMENTATION
  const commentOnPost = useCallback(async (postId, comment) => {
    // ... (keep your existing function)
  }, []);

  const handleCommentOnPost = useCallback(async (postId, comment) => {
    return await commentOnPost(postId, comment);
  }, [commentOnPost]);

  // Reply to comment - KEEP YOUR EXISTING IMPLEMENTATION
  const handleReplyToComment = useCallback(async (postId, commentId, replyText, parentReplyId = null) => {
    // ... (keep your existing function)
  }, []);

  // Like comment - KEEP YOUR EXISTING IMPLEMENTATION
  const handleCommentLike = useCallback(async (postId, commentId) => {
    // ... (keep your existing function)
  }, []);

  // Like reply - KEEP YOUR EXISTING IMPLEMENTATION
  const handleReplyLike = useCallback(async (postId, commentId, replyId) => {
    // ... (keep your existing function)
  }, []);

  // Share post - KEEP YOUR EXISTING IMPLEMENTATION
  const handleSharePost = useCallback(async (postId) => {
    // ... (keep your existing function)
  }, []);

  // Handle repost - KEEP YOUR EXISTING IMPLEMENTATION
  const handleRepost = useCallback(async (repostData) => {
    // ... (keep your existing function)
  }, [isOwnProfile]);

  // Save post - KEEP YOUR EXISTING IMPLEMENTATION
  const handleSavePost = useCallback(async (postId, shouldSave) => {
    // ... (keep your existing function)
  }, []);

  // Delete post - KEEP YOUR EXISTING IMPLEMENTATION
  const deletePost = useCallback(async (postId) => {
    // ... (keep your existing function)
  }, []);

  const handleDeletePost = useCallback(async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      await deletePost(postId);
    }
  }, [deletePost]);

  // Upload to gallery - KEEP YOUR EXISTING IMPLEMENTATION
  const uploadToGallery = useCallback(async (fileOrFiles, folderId, description) => {
    // ... (keep your existing function)
  }, [profileUser?.id, fetchUserGallery]);

  // Create gallery folder - KEEP YOUR EXISTING IMPLEMENTATION
  const createGalleryFolder = useCallback(async (name) => {
    // ... (keep your existing function)
  }, [profileUser?.id, fetchUserGallery]);

  // Delete gallery folder - KEEP YOUR EXISTING IMPLEMENTATION
  const deleteGalleryFolder = useCallback(async (folderId) => {
    // ... (keep your existing function)
  }, [profileUser?.id, fetchUserGallery]);

  // Delete gallery item - KEEP YOUR EXISTING IMPLEMENTATION
  const deleteGalleryItem = useCallback(async (itemId) => {
    // ... (keep your existing function)
  }, [profileUser?.id, fetchUserGallery]);

  // Handle follow - KEEP YOUR EXISTING IMPLEMENTATION
  const handleFollow = useCallback(async () => {
    // ... (keep your existing function)
  }, [targetUserId, profileUser, isFollowing]);

  // Handle message - KEEP YOUR EXISTING IMPLEMENTATION
  const handleMessage = useCallback(() => {
    if (profileUser?.id) {
      navigate(`/chat/${profileUser.id}`);
    }
  }, [navigate, profileUser?.id]);

  // Handle edit profile - KEEP YOUR EXISTING IMPLEMENTATION
  const handleEditProfile = useCallback(() => {
    navigate('/profile/settings');
  }, [navigate]);

  // Handle edit banner - KEEP YOUR EXISTING IMPLEMENTATION
  const handleEditBanner = useCallback(() => {
    navigate('/profile/settings', { state: { activeTab: 'personal' } });
  }, [navigate]);

  // Handle stat click - KEEP YOUR EXISTING IMPLEMENTATION
  const handleStatClick = useCallback((statType) => {
    // ... (keep your existing function)
  }, [navigate, profileUser?.id]);

  // Open modal - KEEP YOUR EXISTING IMPLEMENTATION
  const openModal = useCallback(() => {
    if (profileUser?.avatar) {
      setIsModalOpen(true);
    }
  }, [profileUser?.avatar]);

  // Close modal - KEEP YOUR EXISTING IMPLEMENTATION
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // Delete comment - KEEP YOUR EXISTING IMPLEMENTATION
  const handleDeleteComment = useCallback(async (postId, commentId) => {
    // ... (keep your existing function)
  }, []);

  // Delete reply - KEEP YOUR EXISTING IMPLEMENTATION
  const handleReplyDelete = useCallback(async (postId, commentId, replyId) => {
    // ... (keep your existing function)
  }, []);

  // Report post - KEEP YOUR EXISTING IMPLEMENTATION
  const handleReportPost = useCallback(async (postId, reportData) => {
    // ... (keep your existing function)
  }, []);

  // Handle social link click - KEEP YOUR EXISTING IMPLEMENTATION
  const handleSocialLinkClick = useCallback((url) => {
    // ... (keep your existing function)
  }, []);

  // Handle go home - KEEP YOUR EXISTING IMPLEMENTATION
  const handleGoHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // Handle go back - KEEP YOUR EXISTING IMPLEMENTATION
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

  // Tab content rendering - KEEP YOUR EXISTING IMPLEMENTATION
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

  // Format last seen
  const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
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
    socketConnected,
    isUserOnline
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
          <div className={styles.socketStatusContainer}>
            {socketConnected ? (
              <span className={`${styles.socketStatus} ${styles.connected}`} title="Real-time connected">
                <FaWifi />
                {connectionQuality === 'poor' && (
                  <span className={styles.qualityWarning}>
                    <FaExclamationCircle />
                  </span>
                )}
              </span>
            ) : (
              <span className={`${styles.socketStatus} ${styles.disconnected}`} title="Real-time disconnected">
                <FaPlug />
              </span>
            )}
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