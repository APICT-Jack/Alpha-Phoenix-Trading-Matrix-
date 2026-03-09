// TabsNavigation.jsx - FIXED WITH STICKY POSITIONING
import React from 'react';
import styles from './UserProfileView.module.css';
import { 
  FaNewspaper, 
  FaUser, 
  FaImages, 
  FaComments, 
  FaChartLine 
} from 'react-icons/fa';

const TabsNavigation = ({ activeTab, onTabChange, tabsConfig }) => {
  const tabs = [
    { id: 'timeline', label: 'Timeline', icon: FaNewspaper, count: tabsConfig.postsCount },
    { id: 'overview', label: 'Overview', icon: FaUser, count: null },
    { id: 'gallery', label: 'Gallery', icon: FaImages, count: tabsConfig.galleryItems },
    { id: 'chat-rooms', label: 'Chat Rooms', icon: FaComments, count: tabsConfig.chatRooms },
    { id: 'charts', label: 'Charts', icon: FaChartLine, count: tabsConfig.charts },
    { id: 'news', label: 'News', icon: FaNewspaper, count: tabsConfig.news }
  ];

  return (
    <div className={styles.tabsContainer}>
      {tabs.map(tab => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            <Icon className={styles.tabIcon} />
            <span>{tab.label}</span>
            {tab.count > 0 && <span className={styles.tabCount}>{tab.count}</span>}
          </button>
        );
      })}
    </div>
  );
};

export default TabsNavigation;