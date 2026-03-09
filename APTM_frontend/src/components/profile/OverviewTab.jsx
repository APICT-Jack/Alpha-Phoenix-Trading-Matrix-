/* eslint-disable no-unused-vars */
import React from 'react';
import styles from './UserProfileView.module.css';
import { FaRegCheckCircle, FaGlobe, FaUserFriends } from 'react-icons/fa';
import { experienceLevels } from './profileConstants';

const OverviewTab = ({ profileUser, posts, onStatClick }) => {
  const experience = profileUser ? (experienceLevels[profileUser.tradingExperience] || experienceLevels.beginner) : experienceLevels.beginner;

  return (
    <div className={styles.overviewTab}>
      <div className={styles.overviewGrid}>
        <div className={styles.card}>
          <h3>Experience Level</h3>
          <div className={styles.experienceLevel}>
            <div className={styles.levelBar}>
              <div 
                className={styles.levelFill}
                style={{ 
                  width: `${(profileUser.profile?.experienceLevel || 1) / 5 * 100}%`,
                  backgroundColor: experience.color
                }}
              ></div>
            </div>
            <span className={styles.levelText}>
              {experience.label} Trader
            </span>
          </div>
        </div>

        <div className={styles.card}>
          <h3>Trading Statistics</h3>
          <div className={styles.statsGrid}>
            <div 
              className={styles.statCard}
              onClick={() => onStatClick('trades')}
              style={{ cursor: 'pointer' }}
            >
              <span className={styles.statNumber}>{profileUser.profile?.totalTrades || 0}</span>
              <span className={styles.statLabel}>Total Trades</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>{profileUser.profile?.winRate || 0}%</span>
              <span className={styles.statLabel}>Win Rate</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>{profileUser.profile?.performance || 0}%</span>
              <span className={styles.statLabel}>Performance</span>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <h3>Recent Activity</h3>
          <div className={styles.activityList}>
            {posts.slice(0, 3).map((post, _index) => (
              <div key={post._id} className={styles.activityItem}>
                <span className={styles.activityIcon}><FaRegCheckCircle /></span>
                <div className={styles.activityContent}>
                  <p>Posted: {post.content.substring(0, 50)}...</p>
                  <span className={styles.activityTime}>
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
            {posts.length === 0 && (
              <p className={styles.noActivity}>No recent activity</p>
            )}
          </div>
        </div>

        {profileUser.socialLinks && Object.values(profileUser.socialLinks).some(link => link) && (
          <div className={styles.card}>
            <h3>Social Links</h3>
            <div className={styles.socialLinks}>
              {profileUser.socialLinks.website && (
                <a href={profileUser.socialLinks.website} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                  <FaGlobe /> Website
                </a>
              )}
              {profileUser.socialLinks.twitter && (
                <a href={profileUser.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                  <FaUserFriends /> Twitter
                </a>
              )}
              {profileUser.socialLinks.linkedin && (
                <a href={profileUser.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                  <FaUserFriends /> LinkedIn
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OverviewTab;