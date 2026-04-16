// ProfileHeader.jsx - UPDATED WITH CLOUDINARY SUPPORT & FULL SCREEN
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
  FaComments
} from 'react-icons/fa';

// Helper functions with Cloudinary support
const isCloudinaryUrl = (url) => {
  return url && (url.includes('cloudinary') || url.includes('res.cloudinary.com'));
};

const getOptimizedAvatarUrl = (url) => {
  if (!url || !isCloudinaryUrl(url)) return url;
  const transformations = ['w_120', 'h_120', 'c_fill', 'g_face', 'q_auto', 'f_auto'];
  return url.replace('/upload/', `/upload/${transformations.join(',')}/`);
};

const getOptimizedBannerUrl = (url) => {
  if (!url || !isCloudinaryUrl(url)) return url;
  const transformations = ['w_1920', 'h_400', 'c_fill', 'q_auto', 'f_auto'];
  return url.replace('/upload/', `/upload/${transformations.join(',')}/`);
};

const getAvatarInitial = (user) => {
  if (!user) return 'U';
  if (user.name) return user.name.charAt(0).toUpperCase();
  if (user.username) return user.username.charAt(0).toUpperCase();
  return 'U';
};

const socialIcons = {
  twitter: FaTwitter, linkedin: FaLinkedin, github: FaGithub,
  website: FaGlobe, whatsapp: FaWhatsapp, facebook: FaFacebook,
  discord: FaDiscord, telegram: FaTelegram, reddit: FaReddit,
  youtube: FaYoutube, instagram: FaInstagram
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
        if (url.startsWith('+')) {
          fullUrl = `https://wa.me/${url.replace(/\D/g, '')}`;
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
      .map(([key, value]) => ({ platform: key, url: value, icon: socialIcons[key] }));
  };

  const activeSocialLinks = getActiveSocialLinks();

  const getPostsCount = () => {
    return profileUser?.postsCount || profileUser?.profile?.postsCount || profileUser?.stats?.posts || 0;
  };

  const getFollowersCount = () => {
    return profileUser?.followers || profileUser?.profile?.followers || profileUser?.stats?.followers || 0;
  };

  const getFollowingCount = () => {
    return profileUser?.following || profileUser?.profile?.following || profileUser?.stats?.following || 0;
  };

  const getTradesCount = () => {
    return profileUser?.profile?.totalTrades || profileUser?.stats?.tradesCompleted || 0;
  };

  const getWinRate = () => {
    return profileUser?.profile?.winRate || profileUser?.stats?.successRate || '0';
  };

  // Process avatar and banner URLs
  const rawAvatar = profileUser?.avatar;
  let optimizedAvatar = null;
  if (rawAvatar && !avatarError) {
    optimizedAvatar = isCloudinaryUrl(rawAvatar) ? getOptimizedAvatarUrl(rawAvatar) : rawAvatar;
  }
  
  const rawBanner = bannerUrl || profileUser?.banner;
  let optimizedBanner = null;
  if ((hasBanner || rawBanner) && !bannerError) {
    optimizedBanner = rawBanner && isCloudinaryUrl(rawBanner) ? getOptimizedBannerUrl(rawBanner) : rawBanner;
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
              onError={() => setBannerError(true)}
              onLoad={() => console.log('✅ Banner loaded')}
              loading="lazy"
            />
          ) : (
            <div className={styles.bannerPlaceholder}>
              {profileUser?.name || 'User'}'s Banner
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

      {/* Avatar Section */}
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
          {isOnline && <span className={styles.avatarOnline + ' ' + styles.online}></span>}
        </div>
      </div>

      {/* Header Content */}
      <div className={styles.headerContent}>
        <div className={styles.userInfoSection}>
          {/* User Name Row */}
          <div className={styles.userNameRow}>
            <h1 className={styles.userName}>{profileUser?.name || 'Unknown User'}</h1>
            <p className={styles.userUsername}>@{profileUser?.username || 'username'}</p>
            {isOnline && (
              <span className={styles.onlineStatusBadge}>
                <span className={styles.onlineDot}></span> Online
              </span>
            )}
          </div>
          
          {/* Bio */}
          {profileUser?.bio && (
            <p className={styles.userBio}>{profileUser.bio}</p>
          )}

          {/* User Details - Glass Chips */}
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
                  month: 'short'
                })}</span>
              </div>
            )}
            {profileUser?.tradingExperience && (
              <div className={styles.detailItem}>
                <FaBriefcase className={styles.detailIcon} />
                <span>{profileUser.tradingExperience.charAt(0).toUpperCase() + profileUser.tradingExperience.slice(1)}</span>
              </div>
            )}
          </div>

          {/* SOCIAL LINKS - Glass */}
          {activeSocialLinks.length > 0 && (
            <div className={styles.socialLinksContainer}>
              <h4 className={styles.socialLinksTitle}>Connect</h4>
              <div className={styles.socialLinks}>
                {activeSocialLinks.map(({ platform, url, icon: Icon }) => (
                  <button
                    key={platform}
                    className={`${styles.socialLink} ${styles[platform]}`}
                    onClick={() => handleSocialLinkClick(url)}
                    title={platform}
                  >
                    <Icon size={14} />
                    <span className={styles.socialPlatformName}>{platform}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stats - Instagram Style Row */}
          <div className={styles.userStats}>
            <div className={styles.statItem} onClick={() => onStatClick?.('followers')}>
              <span className={styles.statValue}>{getFollowersCount().toLocaleString()}</span>
              <span className={styles.statLabel}>followers</span>
            </div>
            <div className={styles.statItem} onClick={() => onStatClick?.('following')}>
              <span className={styles.statValue}>{getFollowingCount().toLocaleString()}</span>
              <span className={styles.statLabel}>following</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{getPostsCount().toLocaleString()}</span>
              <span className={styles.statLabel}>posts</span>
            </div>
          </div>

          {/* Action Buttons - Glass */}
          <div className={styles.actionButtons}>
            {!isOwnProfile ? (
              <>
                <button 
                  className={`${styles.actionBtn} ${isFollowing ? styles.following : styles.primary}`}
                  onClick={onFollow}
                >
                  {isFollowing ? <FaUserCheck size={14} /> : <FaUserPlus size={14} />}
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
                <button 
                  className={`${styles.actionBtn} ${styles.secondary}`}
                  onClick={onMessage}
                >
                  <FaComments size={14} /> Message
                </button>
              </>
            ) : (
              <button 
                className={`${styles.actionBtn} ${styles.primary}`}
                onClick={onEditProfile}
              >
                <FaEdit size={14} /> Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;