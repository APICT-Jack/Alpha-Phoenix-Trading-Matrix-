import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './UserProfileView.module.css';
import { FaArrowLeft } from 'react-icons/fa';

const ProfileNavigation = ({ profileUser, onStatClick }) => {
  const navigate = useNavigate();

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <button 
          onClick={() => navigate(-1)}
          className={styles.backButton}
        >
          <FaArrowLeft /> <span className={styles.backText}>Back</span>
        </button>
        
        <div className={styles.headerInfo}>
          <h2 className={styles.headerName}>{profileUser.name}</h2>
          <p className={styles.headerTitle}>
            {profileUser.interests?.map(badge => badge).join(' • ')}
          </p>
        </div>

        <div className={styles.headerStats}>
          <Link 
            to={`/profile/${profileUser.id}/followers`}
            className={styles.statLink}
          >
            <strong>{profileUser.profile?.followers}</strong>
            <span>Followers</span>
          </Link>
          <Link 
            to={`/profile/${profileUser.id}/following`}
            className={styles.statLink}
          >
            <strong>{profileUser.profile?.following}</strong>
            <span>Following</span>
          </Link>
          <div 
            className={styles.statLink}
            onClick={() => onStatClick('trades')}
            style={{ cursor: 'pointer' }}
          >
            <strong>{profileUser.profile?.totalTrades}</strong>
            <span>Trades</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default ProfileNavigation;