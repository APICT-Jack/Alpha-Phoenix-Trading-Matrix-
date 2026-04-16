// ProfileHeader.jsx - Premium macOS/iOS Glass Edition
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
  FaInstagram,
  FaUserPlus,
  FaUserCheck,
  FaComments,
  FaChartLine,
  FaTrophy,
  FaHeart
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
  
  const transformations = [
    'w_120',
    'h_120',
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
  
  const transformations = [
    'w_1920',
    'h_400',
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
  hasBanner,
  isOnline,
  lastSeen,
  formatLastSeen
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

  // Process avatar and banner URLs with Cloudinary optimization
  const rawAvatar = profileUser?.avatar;
  
  let optimizedAvatar = null;
  if (rawAvatar && !avatarError) {
    if (isCloudinaryUrl(rawAvatar)) {
      optimizedAvatar = getOptimizedAvatarUrl(rawAvatar);
    } else {
      optimizedAvatar = rawAvatar;
    }
  }
  
  const rawBanner = bannerUrl || profileUser?.banner;
  
  let optimizedBanner = null;
  if ((hasBanner || rawBanner) && !bannerError) {
    if (rawBanner && isCloudinaryUrl(rawBanner)) {
      optimizedBanner = getOptimizedBannerUrl(rawBanner);
    } else {
      optimizedBanner = rawBanner;
    }
  }

  return (
    <div className={styles.profileHeader}>
      {/* Banner Section - Premium Glass */}
      <div className={styles.bannerSection}>
        <div className={styles.bannerWrapper}>
          {(hasBanner || optimizedBanner) && !bannerError ? (
            <>
              <img 
                src={optimizedBanner} 
                alt={`${profileUser?.name || 'User'}'s banner`}
                className={styles.bannerImage}
                onError={() => setBannerError(true)}
                onLoad={() => console.log('✅ Banner loaded')}
                loading="lazy"
              />
              <div className={styles.bannerOverlay}></div>
            </>
          ) : (
            <div className={styles.bannerPlaceholder}>
              <div className={styles.bannerGradient}>
                <FaChartLine className={styles.bannerIcon} />
                <span>{profileUser?.name || 'User'}'s Profile</span>
              </div>
            </div>
          )}
        </div>
        
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

      {/* Avatar Section - Premium Glass */}
      <div className={styles.avatarContainer}>
        <div className={styles.avatarWrapper} onClick={onAvatarClick}>
          {optimizedAvatar && !avatarError ? (
            <img 
              src={optimizedAvatar} 
              alt={profileUser?.name || 'User'}
              className={styles.avatarImage}
              onError={() => setAvatarError(true)}
              onLoad={() => console.log('✅ Avatar loaded')}
              loading="lazy"
            />
          ) : (
            <div className={styles.avatarInitial}>
              {profileUser?.avatarInitial || getAvatarInitial(profileUser) || 'U'}
            </div>
          )}
          {isOnline && <span className={styles.avatarOnlineBadge}></span>}
        </div>
      </div>

      {/* Header Content - Premium Glass */}
      <div className={styles.headerContent}>
        <div className={styles.userInfoSection}>
          <div className={styles.userNameRow}>
            <h1 className={styles.userName}>{profileUser?.name || 'Unknown User'}</h1>
            <p className={styles.userUsername}>@{profileUser?.username || 'username'}</p>
            {isOnline ? (
              <span className={styles.onlineStatusBadge}>
                <span className={styles.onlineDot}></span> Online
              </span>
            ) : (
              lastSeen && (
                <span className={styles.offlineStatusBadge}>
                  Last seen {formatLastSeen?.(lastSeen) || 'recently'}
                </span>
              )
            )}
          </div>
          
          {profileUser?.bio && (
            <p className={styles.userBio}>{profileUser.bio}</p>
          )}

          {/* User Details - Premium Glass Chips */}
          <div className={styles.userDetails}>
            {profileUser?.location && profileUser.location !== 'Not specified' && (
              <div className={styles.detailChip}>
                <FaMapMarkerAlt className={styles.detailIcon} />
                <span>{profileUser.location}</span>
              </div>
            )}
            
            {profileUser?.joinDate && (
              <div className={styles.detailChip}>
                <FaCalendarAlt className={styles.detailIcon} />
                <span>Joined {new Date(profileUser.joinDate).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long'
                })}</span>
              </div>
            )}
            
            {profileUser?.tradingExperience && (
              <div className={`${styles.detailChip} ${styles.experienceChip}`}>
                <FaBriefcase className={styles.detailIcon} />
                <span>{profileUser.tradingExperience.charAt(0).toUpperCase() + profileUser.tradingExperience.slice(1)}</span>
              </div>
            )}
          </div>

          {/* SOCIAL LINKS - Premium Glass */}
          {activeSocialLinks.length > 0 && (
            <div className={styles.socialLinksContainer}>
              <div className={styles.socialLinks}>
                {activeSocialLinks.map(({ platform, url, icon: Icon }) => (
                  <button
                    key={platform}
                    className={`${styles.socialLink} ${styles[platform]}`}
                    onClick={() => handleSocialLinkClick(url)}
                    title={`${platform}: ${url}`}
                  >
                    <Icon size={16} />
                    <span className={styles.socialPlatformName}>{platform}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stats - Premium Glass Cards */}
          <div className={styles.userStats}>
            <div 
              className={styles.statCard} 
              onClick={() => onStatClick?.('followers')}
            >
              <span className={styles.statValue}>{getFollowersCount().toLocaleString()}</span>
              <span className={styles.statLabel}>Followers</span>
              <FaUserPlus className={styles.statIcon} />
            </div>
            
            <div 
              className={styles.statCard} 
              onClick={() => onStatClick?.('following')}
            >
              <span className={styles.statValue}>{getFollowingCount().toLocaleString()}</span>
              <span className={styles.statLabel}>Following</span>
              <FaUserCheck className={styles.statIcon} />
            </div>
            
            <div 
              className={styles.statCard} 
              onClick={() => onStatClick?.('trades')}
            >
              <span className={styles.statValue}>{getTradesCount().toLocaleString()}</span>
              <span className={styles.statLabel}>Trades</span>
              <FaChartLine className={styles.statIcon} />
            </div>
            
            <div className={styles.statCard}>
              <span className={styles.statValue}>{getWinRate()}%</span>
              <span className={styles.statLabel}>Win Rate</span>
              <FaTrophy className={styles.statIcon} />
            </div>
            
            <div className={styles.statCard}>
              <span className={styles.statValue}>{getPostsCount().toLocaleString()}</span>
              <span className={styles.statLabel}>Posts</span>
              <FaHeart className={styles.statIcon} />
            </div>
          </div>

          {/* Action Buttons - Premium Glass */}
          <div className={styles.actionButtons}>
            {!isOwnProfile ? (
              <>
                <button 
                  className={`${styles.actionBtn} ${isFollowing ? styles.following : styles.primary}`}
                  onClick={onFollow}
                >
                  {isFollowing ? (
                    <>
                      <FaUserCheck /> Following
                    </>
                  ) : (
                    <>
                      <FaUserPlus /> Follow
                    </>
                  )}
                </button>
                
                <button 
                  className={styles.actionBtnSecondary}
                  onClick={onMessage}
                >
                  <FaComments /> Message
                </button>
              </>
            ) : (
              <button 
                className={styles.actionBtnPrimary}
                onClick={onEditProfile}
              >
                <FaEdit /> Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;