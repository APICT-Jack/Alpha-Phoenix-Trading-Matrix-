// ProfileHeader.jsx - UPDATED WITH CLOUDINARY SUPPORT
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './UserProfileView.module.css';
import { 
  FaMapMarkerAlt, 
  FaCalendarAlt, 
  FaBriefcase, 
  FaCamera,
  FaEdit,
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
  FaInstagram
} from 'react-icons/fa';

// ============================================
// Helper functions with Cloudinary support
// ============================================

// Check if URL is from Cloudinary
const isCloudinaryUrl = (url) => {
  return url && (url.includes('cloudinary') || url.includes('res.cloudinary.com'));
};

// Get optimized Cloudinary URL for avatar
const getOptimizedAvatarUrl = (url) => {
  if (!url || !isCloudinaryUrl(url)) return url;
  
  // Avatar optimization: 96x96, face focus, auto quality
  const transformations = [
    'w_96',
    'h_96',
    'c_fill',
    'g_face',
    'q_auto',
    'f_auto'
  ];
  
  return url.replace('/upload/', `/upload/${transformations.join(',')}/`);
};

// Get optimized Cloudinary URL for banner
const getOptimizedBannerUrl = (url) => {
  if (!url || !isCloudinaryUrl(url)) return url;
  
  // Banner optimization: 1500x500, auto quality, auto format
  const transformations = [
    'w_1500',
    'h_500',
    'c_fill',
    'q_auto',
    'f_auto'
  ];
  
  return url.replace('/upload/', `/upload/${transformations.join(',')}/`);
};

// Get avatar initial
const getAvatarInitial = (user) => {
  if (!user) return 'U';
  if (user.name) return user.name.charAt(0).toUpperCase();
  if (user.firstName) return user.firstName.charAt(0).toUpperCase();
  if (user.username) return user.username.charAt(0).toUpperCase();
  if (user.displayName) return user.displayName.charAt(0).toUpperCase();
  if (user.email) return user.email.charAt(0).toUpperCase();
  return 'U';
};

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

const ProfileHeader = ({
  profileUser,
  isOwnProfile,
  isFollowing,
  onFollow,
  onMessage,
  onEditProfile,
  onAvatarClick,
  onStatClick,
  bannerUrl,
  hasBanner
}) => {
  const navigate = useNavigate();
  const [avatarError, setAvatarError] = useState(false);
  const [bannerError, setBannerError] = useState(false);

  const handleSocialLinkClick = (url) => {
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
  };

  const getActiveSocialLinks = () => {
    if (!profileUser?.socialLinks) return [];
    
    const socialLinks = profileUser.socialLinks || profileUser.profile?.socialLinks || {};
    
    return Object.entries(socialLinks)
      .filter(([key, value]) => value && value.trim() !== '' && socialIcons[key])
      .map(([key, value]) => ({
        platform: key,
        url: value,
        icon: socialIcons[key]
      }));
  };

  const activeSocialLinks = getActiveSocialLinks();

  const getPostsCount = () => {
    return profileUser?.postsCount || 
           profileUser?.profile?.postsCount || 
           profileUser?.stats?.posts || 
           profileUser?.stats?.postsCount || 
           0;
  };

  const getFollowersCount = () => {
    return profileUser?.followers || 
           profileUser?.profile?.followers || 
           profileUser?.stats?.followers || 
           0;
  };

  const getFollowingCount = () => {
    return profileUser?.following || 
           profileUser?.profile?.following || 
           profileUser?.stats?.following || 
           0;
  };

  const getTradesCount = () => {
    return profileUser?.profile?.totalTrades || 
           profileUser?.stats?.tradesCompleted || 
           0;
  };

  const getWinRate = () => {
    return profileUser?.profile?.winRate || 
           profileUser?.stats?.successRate || 
           '0';
  };

  // ============================================
  // Process avatar and banner URLs with Cloudinary optimization
  // ============================================
  
  // Get raw avatar URL from profile
  const rawAvatar = profileUser?.avatar;
  
  // Apply Cloudinary optimization if applicable
  let optimizedAvatar = null;
  if (rawAvatar && !avatarError) {
    if (isCloudinaryUrl(rawAvatar)) {
      optimizedAvatar = getOptimizedAvatarUrl(rawAvatar);
      console.log(`☁️ Using Cloudinary avatar: ${optimizedAvatar}`);
    } else {
      optimizedAvatar = rawAvatar;
    }
  }
  
  // Get raw banner URL
  const rawBanner = bannerUrl || profileUser?.banner;
  
  // Apply Cloudinary optimization if applicable
  let optimizedBanner = null;
  if ((hasBanner || rawBanner) && !bannerError) {
    if (rawBanner && isCloudinaryUrl(rawBanner)) {
      optimizedBanner = getOptimizedBannerUrl(rawBanner);
      console.log(`☁️ Using Cloudinary banner: ${optimizedBanner}`);
    } else {
      optimizedBanner = rawBanner;
    }
  }

  return (
    <div className={styles.profileHeader}>
      {/* Banner Section */}
      <div className={styles.bannerSection}>
        <div className={styles.bannerWrapper}>
          {(hasBanner || optimizedBanner) && !bannerError ? (
            <img 
              src={optimizedBanner} 
              alt={`${profileUser?.name || 'User'}'s banner`}
              className={styles.bannerImage}
              onError={() => {
                console.log('❌ Banner failed to load:', optimizedBanner);
                setBannerError(true);
              }}
              onLoad={() => console.log('✅ Banner loaded successfully')}
              loading="lazy"
            />
          ) : (
            <div className={styles.bannerPlaceholder}>
              {profileUser?.name || 'User'}'s Banner
            </div>
          )}
        </div>
        
        {/* Edit Banner Button */}
        {isOwnProfile && (
          <div className={styles.bannerEditOverlay}>
            <button 
              className={styles.editBannerBtn} 
              onClick={() => navigate('/profile/settings', { state: { activeTab: 'personal' } })}
              title="Change banner"
            >
              <FaCamera size={14} />
              <span>Edit Banner</span>
            </button>
          </div>
        )}
      </div>

      {/* Avatar Section */}
      <div className={styles.avatarContainer}>
        <div className={styles.avatarWrapper} onClick={onAvatarClick}>
          {optimizedAvatar && !avatarError ? (
            <img 
              src={optimizedAvatar} 
              alt={profileUser?.name || 'User'}
              className={styles.avatarImage}
              onError={() => {
                console.log('❌ Avatar failed to load:', optimizedAvatar);
                setAvatarError(true);
              }}
              onLoad={() => console.log('✅ Avatar loaded successfully')}
              loading="lazy"
            />
          ) : (
            <div className={styles.avatarInitial}>
              {profileUser?.avatarInitial || getAvatarInitial(profileUser) || 'U'}
            </div>
          )}
        </div>
      </div>

      {/* Header Content */}
      <div className={styles.headerContent}>
        <div className={styles.userInfoSection}>
          <div className={styles.userNameRow}>
            <h1 className={styles.userName}>{profileUser?.name || 'Unknown User'}</h1>
            <p className={styles.userUsername}>@{profileUser?.username || 'username'}</p>
          </div>
          
          {profileUser?.bio && (
            <p className={styles.userBio}>{profileUser.bio}</p>
          )}

          {/* User Details */}
          <div className={styles.userDetails}>
            {profileUser?.location && profileUser.location !== 'Not specified' && (
              <div className={styles.detailItem}>
                <FaMapMarkerAlt className={styles.detailIcon} />
                <span>{profileUser.location}</span>
              </div>
            )}
            
            {profileUser?.joinDate && (
              <div className={styles.detailItem}>
                <FaCalendarAlt className={styles.detailIcon} />
                <span>Joined {new Date(profileUser.joinDate).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
            )}
            
            {profileUser?.tradingExperience && (
              <div className={styles.detailItem}>
                <FaBriefcase className={styles.detailIcon} />
                <span>{profileUser.tradingExperience.charAt(0).toUpperCase() + profileUser.tradingExperience.slice(1)} Trader</span>
              </div>
            )}
          </div>

          {/* SOCIAL LINKS */}
          {activeSocialLinks.length > 0 && (
            <div className={styles.socialLinksContainer}>
              <h4 className={styles.socialLinksTitle}>Connect with {profileUser?.name}</h4>
              <div className={styles.socialLinks}>
                {activeSocialLinks.map(({ platform, url, icon: Icon }) => (
                  <button
                    key={platform}
                    className={`${styles.socialLink} ${styles[platform]}`}
                    onClick={() => handleSocialLinkClick(url)}
                    title={`${platform}: ${url}`}
                  >
                    <Icon size={18} />
                    <span className={styles.socialPlatformName}>{platform}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className={styles.userStats}>
            <div 
              className={styles.statItem} 
              onClick={() => onStatClick?.('followers')}
            >
              <span className={styles.statValue}>
                {getFollowersCount().toLocaleString()}
              </span>
              <span className={styles.statLabel}>Followers</span>
            </div>
            
            <div 
              className={styles.statItem} 
              onClick={() => onStatClick?.('following')}
            >
              <span className={styles.statValue}>
                {getFollowingCount().toLocaleString()}
              </span>
              <span className={styles.statLabel}>Following</span>
            </div>
            
            <div 
              className={styles.statItem} 
              onClick={() => onStatClick?.('trades')}
            >
              <span className={styles.statValue}>
                {getTradesCount().toLocaleString()}
              </span>
              <span className={styles.statLabel}>Trades</span>
            </div>
            
            <div className={styles.statItem}>
              <span className={styles.statValue}>
                {getWinRate()}%
              </span>
              <span className={styles.statLabel}>Win Rate</span>
            </div>
            
            <div className={styles.statItem}>
              <span className={styles.statValue}>
                {getPostsCount().toLocaleString()}
              </span>
              <span className={styles.statLabel}>Posts</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            {!isOwnProfile ? (
              <>
                <button 
                  className={`${styles.actionBtn} ${styles.primary}`}
                  onClick={onFollow}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
                
                <button 
                  className={`${styles.actionBtn} ${styles.secondary}`}
                  onClick={onMessage}
                >
                  Message
                </button>
              </>
            ) : (
              <button 
                className={`${styles.actionBtn} ${styles.primary}`}
                onClick={onEditProfile}
              >
                <FaEdit />
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;