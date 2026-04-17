// TabsNavigation.jsx - Premium macOS/iOS + Twitter Style
import React, { useRef, useEffect, useState } from 'react';
import { 
  FaHome, 
  FaImages, 
  FaChartLine, 
  FaComments, 
  FaNewspaper,
  FaUserCircle,
  FaStar,
  FaClock
} from 'react-icons/fa';
import styles from './UserProfileView.module.css';

const TabsNavigation = ({ activeTab, onTabChange, tabsConfig }) => {
  const tabsRef = useRef(null);
  const [hasScroll, setHasScroll] = useState({ left: false, right: false });

  const tabs = [
    { id: 'timeline', label: 'Posts', icon: FaHome, count: tabsConfig.postsCount },
    { id: 'overview', label: 'Overview', icon: FaUserCircle, count: null },
    { id: 'gallery', label: 'Gallery', icon: FaImages, count: tabsConfig.galleryItems },
    { id: 'chat-rooms', label: 'Rooms', icon: FaComments, count: tabsConfig.chatRooms },
    { id: 'charts', label: 'Charts', icon: FaChartLine, count: tabsConfig.charts },
    { id: 'news', label: 'News', icon: FaNewspaper, count: tabsConfig.news }
  ].filter(tab => {
    if (tab.id === 'gallery' && tabsConfig.galleryItems === 0) return true;
    if (tab.id === 'chat-rooms' && tabsConfig.chatRooms === 0) return true;
    if (tab.id === 'charts' && tabsConfig.charts === 0) return true;
    return true;
  });

  const checkScroll = () => {
    if (tabsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
      setHasScroll({
        left: scrollLeft > 0,
        right: scrollLeft + clientWidth < scrollWidth - 5
      });
    }
  };

  useEffect(() => {
    const tabsElement = tabsRef.current;
    if (tabsElement) {
      tabsElement.addEventListener('scroll', checkScroll);
      checkScroll();
      return () => tabsElement.removeEventListener('scroll', checkScroll);
    }
  }, []);

  return (
    <div className={styles.tabsContainer}>
      <div 
        className={`${styles.tabs} ${hasScroll.left ? styles.hasScrollLeft : ''} ${hasScroll.right ? styles.hasScrollRight : ''}`}
        ref={tabsRef}
      >
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const showCount = tab.count !== null && tab.count > 0;
          
          return (
            <button
              key={tab.id}
              className={`${styles.tab} ${isActive ? styles.active : ''}`}
              onClick={() => onTabChange(tab.id)}
              data-tab={tab.id}
            >
              <Icon className={styles.tabIcon} />
              <span className={styles.tabText}>{tab.label}</span>
              {showCount && (
                <span className={styles.tabCount}>
                  {tab.count > 99 ? '99+' : tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TabsNavigation;