// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { socketService } from '../../services/socketService';
import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';
import styles from './Chat.module.css';

const Chat = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { darkMode } = useTheme();

  const [activeChat, setActiveChat] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [unreadCounts, setUnreadCounts] = useState({});

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Socket event handlers
  const handleOnlineUsers = useCallback((users) => {
    console.log('📊 Chat - Online users received:', users);
    setOnlineUsers(users);
  }, []);

  const handleUserOnline = useCallback(({ userId, userData }) => {
    console.log('🟢 Chat - User online:', userId);
    setOnlineUsers(prev => ({ ...prev, [userId]: { online: true, userData } }));
  }, []);

  const handleUserOffline = useCallback(({ userId }) => {
    console.log('🔴 Chat - User offline:', userId);
    setOnlineUsers(prev => ({ ...prev, [userId]: { online: false } }));
  }, []);

  const handleConversationUnread = useCallback(({ conversationId, unreadCount }) => {
    console.log('📬 Chat - Unread count update:', { conversationId, unreadCount });
    
    setUnreadCounts(prev => ({
      ...prev,
      [conversationId]: unreadCount
    }));
    
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId ? { ...conv, unreadCount } : conv
    ));
  }, []);

  const handleMessageReceive = useCallback((message) => {
    console.log('📨 Chat - Message received:', message);
    
    if (message.conversationId) {
      setConversations(prev => prev.map(conv => {
        if (conv.id === message.conversationId) {
          // Only increment unread count if not currently viewing this conversation
          const shouldIncrement = activeChat?.id !== message.conversationId && 
                                  message.senderId !== currentUser?.id;
          
          const newUnreadCount = shouldIncrement ? (conv.unreadCount || 0) + 1 : conv.unreadCount;
          
          // Update unread counts state
          if (shouldIncrement) {
            setUnreadCounts(prev => ({
              ...prev,
              [message.conversationId]: newUnreadCount
            }));
          }
          
          return {
            ...conv,
            lastMessage: message.text,
            lastMessageTime: message.createdAt,
            unreadCount: newUnreadCount
          };
        }
        return conv;
      }));
    }
  }, [activeChat, currentUser]);

  const handleMessagesRead = useCallback(({ conversationId, readerId, count }) => {
    console.log('📖 Chat - Messages read:', { conversationId, readerId, count });
    
    if (readerId === currentUser?.id) {
      setUnreadCounts(prev => {
        const newState = { ...prev };
        delete newState[conversationId];
        return newState;
      });
      
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
      ));
    }
  }, [currentUser]);

  // Initialize socket and fetch conversations
  useEffect(() => {
    if (!currentUser) return;

    console.log('🔌 Chat - Initializing socket connection');

    // Initialize socket connection
    const token = localStorage.getItem('token');
    socketService.connect(currentUser.id, token);

    // Set up socket listeners
    socketService.on('users:online', handleOnlineUsers);
    socketService.on('user:online', handleUserOnline);
    socketService.on('user:offline', handleUserOffline);
    socketService.on('conversation:unread', handleConversationUnread);
    socketService.on('message:receive', handleMessageReceive);
    socketService.on('messages:read', handleMessagesRead);

    // Request online users
    if (socketService.isConnected()) {
      socketService.getSocket()?.emit('get-online-users');
    }

    // Fetch conversations
    fetchConversations();

    // Cleanup
    return () => {
      console.log('🧹 Chat - Cleaning up socket listeners');
      socketService.off('users:online');
      socketService.off('user:online');
      socketService.off('user:offline');
      socketService.off('conversation:unread');
      socketService.off('message:receive');
      socketService.off('messages:read');
    };
  }, [currentUser]);

  // Update conversations when onlineUsers changes
  useEffect(() => {
    setConversations(prev => prev.map(conv => ({
      ...conv,
      isOnline: onlineUsers[conv.userId]?.online || false
    })));
  }, [onlineUsers]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/chat/conversations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Add online status from socket
          const conversationsWithStatus = (result.conversations || []).map(conv => ({
            ...conv,
            id: conv.id || conv._id,
            isOnline: onlineUsers[conv.userId]?.online || false,
            unreadCount: conv.unreadCount || 0
          }));
          
          console.log('📋 Fetched conversations:', conversationsWithStatus);
          setConversations(conversationsWithStatus);
          
          // Initialize unread counts
          const unreadMap = {};
          conversationsWithStatus.forEach(conv => {
            if (conv.unreadCount > 0) {
              unreadMap[conv.id] = conv.unreadCount;
            }
          });
          setUnreadCounts(unreadMap);
          
          // If chatId is provided, set active chat
          if (chatId && conversationsWithStatus.length > 0) {
            handleSelectChat(chatId);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChat = async (chatOrUserId) => {
    let selectedChat = null;
    
    // Leave current conversation before switching
    if (activeChat?.id && socketService.isConnected()) {
      console.log('👋 Leaving conversation:', activeChat.id);
      socketService.leaveConversation(activeChat.id);
    }
    
    if (typeof chatOrUserId === 'string') {
      // Find in existing conversations
      selectedChat = conversations.find(conv => conv.id === chatOrUserId || conv.userId === chatOrUserId);
      
      if (!selectedChat) {
        // Check if it's a user ID
        selectedChat = await handleUserChat(chatOrUserId);
      }
    } else {
      selectedChat = chatOrUserId;
    }

    if (selectedChat) {
      console.log('💬 Selected chat:', selectedChat);
      
      // Clear unread count for this conversation
      setUnreadCounts(prev => {
        const newState = { ...prev };
        delete newState[selectedChat.id];
        return newState;
      });
      
      setConversations(prev => prev.map(conv => 
        conv.id === selectedChat.id ? { ...conv, unreadCount: 0 } : conv
      ));
      
      setActiveChat(selectedChat);
      
      // Small delay to ensure state is updated
      setTimeout(() => {
        // Join new conversation room for real-time updates
        if (selectedChat.id && socketService.isConnected()) {
          console.log('👋 Joining conversation:', selectedChat.id);
          socketService.joinConversation(selectedChat.id);
          
          // Mark messages as read
          socketService.markMessagesAsRead(selectedChat.id, selectedChat.userId);
        }
      }, 100);

      // On mobile, close sidebar
      if (isMobile) {
        setSidebarOpen(false);
      }

      // Update URL
      navigate(`/chat/${selectedChat.userId}`);
    }
  };

  const handleUserChat = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/chat/conversation/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const newChat = {
            ...result.conversation,
            id: result.conversation.id || result.conversation._id,
            isOnline: onlineUsers[userId]?.online || false,
            unreadCount: 0
          };
          
          console.log('🆕 New chat created:', newChat);
          
          // Add to conversations list if not already there
          setConversations(prev => {
            if (!prev.find(c => c.userId === userId)) {
              return [newChat, ...prev];
            }
            return prev;
          });
          
          return newChat;
        }
      }
    } catch (error) {
      console.error('Error creating user chat:', error);
    }
    return null;
  };

  const handleStartChat = (user) => {
    handleSelectChat(user);
  };

  const handleBackToConversations = () => {
    // Leave current conversation room
    if (activeChat?.id && socketService.isConnected()) {
      console.log('👋 Leaving conversation on back:', activeChat.id);
      socketService.leaveConversation(activeChat.id);
    }
    
    setActiveChat(null);
    navigate('/chat');
    
    // On mobile, open sidebar
    if (isMobile) {
      setSidebarOpen(true);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (loading) {
    return (
      <div className={`${styles.loadingContainer} ${darkMode ? styles.dark : styles.light}`}>
        <div className={styles.spinner}></div>
        <p>Loading chats...</p>
      </div>
    );
  }

  return (
    <div className={`${styles.chatContainer} ${darkMode ? styles.dark : styles.light}`}>
      {/* Sidebar */}
      <div className={`${styles.sidebar} ${sidebarOpen ? styles.open : styles.closed}`}>
        <ChatSidebar
          conversations={conversations}
          activeChat={activeChat}
          onSelectChat={handleSelectChat}
          onStartChat={handleStartChat}
          currentUser={currentUser}
        />
      </div>

      {/* Main Chat Area */}
      <div className={styles.mainArea}>
        {activeChat ? (
          <ChatWindow
            chat={activeChat}
            currentUser={currentUser}
            onBack={handleBackToConversations}
            onToggleSidebar={toggleSidebar}
            socketService={socketService}
            isMobile={isMobile}
          />
        ) : (
          <div className={styles.welcomeScreen}>
            <div className={styles.welcomeContent}>
              <div className={styles.welcomeIcon}>💬</div>
              <h2>Welcome to Chat</h2>
              <p>Select a conversation or start a new chat</p>
              <div className={styles.welcomeFeatures}>
                <div className={styles.feature}>
                  <span className={styles.featureIcon}>🤖</span>
                  <span>AI-powered message suggestions</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.featureIcon}>✨</span>
                  <span>Smart message correction</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.featureIcon}>🔒</span>
                  <span>Real-time encryption</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.featureIcon}>👥</span>
                  <span>Online status indicators</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;