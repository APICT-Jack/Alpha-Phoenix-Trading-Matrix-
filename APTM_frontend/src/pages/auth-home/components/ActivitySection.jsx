// src/pages/auth-home/components/ActivitySection.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Icons from 'react-icons/fa';
import './ActivitySection.css';

const ActivitySection = ({ currentUser, onlineUsers, isMobile = false }) => {
  const navigate = useNavigate();
  const [activeActivityTab, setActiveActivityTab] = useState('all');
  const [activities, setActivities] = useState({ all: [], trades: [], chats: [], updates: [] });
  const [trendingUsers, setTrendingUsers] = useState([]);
  const [chatRooms, setChatRooms] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
  const API_BASE = `${API_URL}/api`;

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  });

  const apiFetch = useCallback(async (endpoint, options = {}) => {
    const url = `${API_BASE}${endpoint}`;
    const config = { headers: getAuthHeaders(), ...options };
    const response = await fetch(url, config);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }, []);

  const fetchTrending = useCallback(async () => {
    try {
      const [usersRes, chatRes] = await Promise.all([
        apiFetch('/users/suggestions?limit=10').catch(() => ({ success: true, users: [] })),
        apiFetch('/chat/rooms').catch(() => ({ success: true, rooms: [] }))
      ]);
      if (usersRes.success) setTrendingUsers(usersRes.users || []);
      if (chatRes.success) setChatRooms(chatRes.rooms || []);
    } catch (error) {
      console.error('Error fetching trending:', error);
    }
  }, [apiFetch]);

  const buildActivities = useCallback((posts, chats) => {
    const allActivities = [];
    
    // Post activities (simulated for now)
    for (let i = 0; i < 5; i++) {
      allActivities.push({
        id: `post-${i}`,
        type: 'post',
        user: ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'][i],
        userId: `user-${i}`,
        action: 'posted a new analysis',
        content: 'Check out my latest market analysis...',
        time: new Date(Date.now() - i * 3600000).toISOString(),
        likes: Math.floor(Math.random() * 50)
      });
    }

    // Chat activities
    (chats || []).slice(0, 5).forEach(chat => {
      allActivities.push({
        id: `chat-${chat.id || chat._id}`,
        type: 'chat',
        user: chat.title || 'Chat Room',
        roomId: chat.id || chat._id,
        action: 'new messages',
        content: chat.lastMessage || 'Tap to join the conversation',
        time: chat.lastActivity || chat.updatedAt || new Date().toISOString(),
        unread: chat.unreadCount > 0,
        memberCount: chat.memberCount || 0
      });
    });

    allActivities.sort((a, b) => new Date(b.time) - new Date(a.time));

    setActivities({
      all: allActivities,
      trades: allActivities.filter(a => a.type === 'post').slice(0, 5),
      chats: allActivities.filter(a => a.type === 'chat'),
      updates: trendingUsers.slice(0, 5).map(user => ({
        id: user.id || user._id,
        type: 'follow_suggestion',
        user: user.name,
        userId: user.id || user._id,
        action: 'suggested to follow',
        time: new Date().toISOString()
      }))
    });
  }, [trendingUsers]);

  useEffect(() => {
    fetchTrending();
  }, [fetchTrending]);

  useEffect(() => {
    if (chatRooms.length > 0) {
      buildActivities([], chatRooms);
    }
  }, [chatRooms, buildActivities]);

  const handleFollowToggle = async (userId, currentStatus, e) => {
    if (e) e.stopPropagation();
    try {
      const endpoint = currentStatus ? '/follow/unfollow' : '/follow/follow';
      await apiFetch(`${endpoint}/${userId}`, { method: 'POST' });
      setTrendingUsers(prev => prev.map(u => (u.id || u._id) === userId ? { ...u, isFollowing: !currentStatus } : u));
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const handleActivityClick = (activity) => {
    if (activity.postId) navigate(`/post/${activity.postId}`);
    else if (activity.roomId) navigate(`/chat/room/${activity.roomId}`);
    else if (activity.userId) navigate(`/profile/${activity.userId}`);
  };

  const renderIcon = (name, size = 16) => {
    const Icon = Icons[name];
    return Icon ? <Icon size={size} /> : null;
  };

  const formatTime = (time) => {
    if (!time) return '';
    const date = new Date(time);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d`;
    return date.toLocaleDateString();
  };

  const tabs = [
    { id: 'all', label: 'All', icon: 'FaGlobe' },
    { id: 'chats', label: 'Chats', icon: 'FaComments' },
    { id: 'trades', label: 'Trades', icon: 'FaChartLine' },
    { id: 'updates', label: 'Updates', icon: 'FaBell' }
  ];

  const currentActivities = activities[activeActivityTab] || [];

  return (
    <aside className={`activity-section ${isMobile ? 'mobile' : ''}`}>
      {/* Activity Panel */}
      <div className="activity-panel">
        <div className="panel-header">
          <h3>Recent Activity</h3>
        </div>
        <div className="activity-tabs">
          {tabs.map(tab => (
            <button 
              key={tab.id} 
              className={`activity-tab ${activeActivityTab === tab.id ? 'active' : ''}`} 
              onClick={() => setActiveActivityTab(tab.id)}
            >
              {renderIcon(tab.icon, 11)}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        <div className="activity-list">
          {currentActivities.length > 0 ? (
            currentActivities.slice(0, isMobile ? 15 : 8).map(activity => (
              <div key={activity.id} className="activity-item" onClick={() => handleActivityClick(activity)}>
                <div className={`activity-dot ${activity.type}`} />
                <div className="activity-content">
                  <div className="activity-title">
                    <span className="activity-user">{activity.user}</span>
                    <span className="activity-action">{activity.action || activity.content}</span>
                  </div>
                  <div className="activity-meta">
                    <span className="activity-time">{formatTime(activity.time)}</span>
                    {activity.unread && <span className="unread-badge">New</span>}
                    {activity.likes > 0 && <span className="activity-likes">❤️ {activity.likes}</span>}
                    {activity.memberCount > 0 && <span className="activity-members">👥 {activity.memberCount}</span>}
                  </div>
                </div>
                {!isMobile && <div className="activity-arrow">{renderIcon('FaChevronRight', 10)}</div>}
              </div>
            ))
          ) : (
            <div className="no-activity">
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </div>

      {/* Trending Chat Rooms - Desktop only */}
      {!isMobile && chatRooms.length > 0 && (
        <div className="trending-panel">
          <div className="panel-header">
            <h3>Active Chat Rooms</h3>
          </div>
          <div className="chat-rooms-list">
            {chatRooms.slice(0, 5).map(room => (
              <div key={room.id || room._id} className="chat-room-item" onClick={() => navigate(`/chat/room/${room.id || room._id}`)}>
                <div className="room-icon">
                  {room.type === 'private' ? renderIcon('FaLock', 10) : renderIcon('FaHashtag', 10)}
                </div>
                <div className="room-info">
                  <span className="room-name">{room.title}</span>
                  <span className="room-meta">
                    {room.onlineCount || 0} online · {room.memberCount || 0} members
                  </span>
                </div>
                {room.unreadCount > 0 && <span className="room-unread">{room.unreadCount}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Who to Follow - Desktop only */}
      {!isMobile && trendingUsers.length > 0 && (
        <div className="trending-panel">
          <div className="panel-header">
            <h3>Who to Follow</h3>
          </div>
          <div className="follow-list">
            {trendingUsers.slice(0, 5).map(user => {
              const userId = user.id || user._id;
              return (
                <div key={userId} className="follow-item" onClick={() => navigate(`/profile/${userId}`)}>
                  <div className="follow-avatar">{user.name?.charAt(0)?.toUpperCase() || 'U'}</div>
                  <div className="follow-info">
                    <span className="follow-name">{user.name}</span>
                    <span className="follow-username">@{user.username}</span>
                  </div>
                  {currentUser && userId !== currentUser.id && (
                    <button className={`follow-sm-btn ${user.isFollowing ? 'following' : ''}`} 
                            onClick={(e) => handleFollowToggle(userId, user.isFollowing, e)}>
                      {user.isFollowing ? '✓' : '+'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
};

export default ActivitySection;