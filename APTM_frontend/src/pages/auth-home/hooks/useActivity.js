// src/pages/auth-home/hooks/useActivity.js
import { useState, useEffect, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
const API_BASE = `${API_URL}/api`;

const getAuthHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json'
});

export const useActivity = (currentUser) => {
  const [activeActivityTab, setActiveActivityTab] = useState('all');
  const [activities, setActivities] = useState({ all: [], trades: [], chats: [], updates: [] });
  const [trendingUsers, setTrendingUsers] = useState([]);
  const [chatRooms, setChatRooms] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);

  const apiFetch = useCallback(async (endpoint, options = {}) => {
    const url = `${API_BASE}${endpoint}`;
    const config = { headers: getAuthHeaders(), ...options };
    const response = await fetch(url, config);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }, []);

  const fetchTrending = useCallback(async () => {
    setActivityLoading(true);
    try {
      const [usersRes, chatRes] = await Promise.all([
        apiFetch('/users/suggestions?limit=10').catch(() => ({ success: true, users: [] })),
        apiFetch('/chat/rooms').catch(() => ({ success: true, rooms: [] }))
      ]);
      if (usersRes.success) setTrendingUsers(usersRes.users || []);
      if (chatRes.success) setChatRooms(chatRes.rooms || []);
    } catch (error) {
      console.error('Error fetching trending:', error);
    } finally {
      setActivityLoading(false);
    }
  }, [apiFetch]);

  const buildActivities = useCallback((posts, chats) => {
    const allActivities = [];
    
    // Post activities (simulated - replace with real data)
    const samplePosts = posts.length > 0 ? posts : [
      { _id: '1', userId: { name: 'TraderAlice' }, content: 'Check out my analysis', createdAt: new Date().toISOString(), likes: [1, 2, 3] },
      { _id: '2', userId: { name: 'MarketPro' }, content: 'BTC breakout incoming', createdAt: new Date(Date.now() - 3600000).toISOString(), likes: [1, 2] },
      { _id: '3', userId: { name: 'CryptoKing' }, content: 'New strategy guide', createdAt: new Date(Date.now() - 7200000).toISOString(), likes: [1] },
    ];
    
    samplePosts.slice(0, 10).forEach(post => {
      allActivities.push({
        id: `post-${post._id}`,
        type: 'post',
        user: post.userId?.name || 'User',
        userId: post.userId?._id || post.userId,
        action: 'posted a new update',
        content: post.content?.substring(0, 60),
        time: post.createdAt,
        postId: post._id,
        likes: post.likes?.length || 0
      });
    });

    // Chat activities
    (chats || []).slice(0, 10).forEach(chat => {
      allActivities.push({
        id: `chat-${chat.id || chat._id}`,
        type: 'chat',
        user: chat.title || 'Chat Room',
        roomId: chat.id || chat._id,
        action: 'chat activity',
        content: chat.lastMessage || 'New messages available',
        time: chat.lastActivity || chat.updatedAt || new Date().toISOString(),
        unread: chat.unreadCount > 0,
        memberCount: chat.memberCount || 0
      });
    });

    // Sort by time (newest first)
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

  const handleFollowToggle = useCallback(async (userId, currentStatus, e) => {
    if (e) e.stopPropagation();
    try {
      const endpoint = currentStatus ? '/follow/unfollow' : '/follow/follow';
      await apiFetch(`${endpoint}/${userId}`, { method: 'POST' });
      setTrendingUsers(prev => prev.map(u => 
        (u.id || u._id) === userId ? { ...u, isFollowing: !currentStatus } : u
      ));
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  }, [apiFetch]);

  const handleActivityClick = useCallback((activity, navigate) => {
    if (activity.postId) navigate(`/post/${activity.postId}`);
    else if (activity.roomId) navigate(`/chat/room/${activity.roomId}`);
    else if (activity.userId) navigate(`/profile/${activity.userId}`);
  }, []);

  const formatTime = useCallback((time) => {
    if (!time) return '';
    const date = new Date(time);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d`;
    return date.toLocaleDateString();
  }, []);

  useEffect(() => {
    fetchTrending();
  }, [fetchTrending]);

  useEffect(() => {
    if (chatRooms.length > 0 || trendingUsers.length > 0) {
      buildActivities([], chatRooms);
    }
  }, [chatRooms, trendingUsers, buildActivities]);

  return {
    // State
    activeActivityTab,
    activities,
    trendingUsers,
    chatRooms,
    activityLoading,
    
    // Actions
    setActiveActivityTab,
    handleFollowToggle,
    handleActivityClick,
    formatTime,
    refreshActivity: fetchTrending
  };
};