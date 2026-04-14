// Chat.jsx - COMPLETE FIXED VERSION
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { chatService } from '../../services/chatService';
import { socketService } from '../../services/socketService';
import ChatList from './ChatList';
import ChatConversation from './ChatConversation';
import NewChatModal from './NewChatModal';
import { getAvatarColor, getAvatarInitial } from '../../utils/avatarUtils';
import styles from './Chat.module.css';

// Import icons
import {
  FaComments,
  FaSearch,
  FaPlus,
  FaMoon,
  FaSun,
  FaCog,
  FaSpinner,
  FaExclamationTriangle,
  FaWifi,
  FaRegCircle,
  FaSignOutAlt,
  FaUserPlus
} from 'react-icons/fa';

const Chat = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, logout } = useAuth();
  const { darkMode, setDarkMode } = useTheme();

  // State management
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showSidebar, setShowSidebar] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [unreadCounts, setUnreadCounts] = useState({});
  const [retryCount, setRetryCount] = useState(0);
  const [socketError, setSocketError] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  
  const loadingTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);
  const conversationCache = useRef(new Map());

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        setShowSidebar(!activeChat);
      } else {
        setShowSidebar(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeChat]);

  // Deduplicate conversations helper
  const deduplicateConversations = useCallback((convs) => {
    const seen = new Map();
    const unique = [];
    
    for (const conv of convs) {
      const userId = conv.userId;
      if (!seen.has(userId)) {
        seen.set(userId, conv);
        unique.push(conv);
      } else {
        // Keep the one with most recent message
        const existing = seen.get(userId);
        const existingTime = new Date(existing.lastMessageTime).getTime();
        const newTime = new Date(conv.lastMessageTime).getTime();
        if (newTime > existingTime) {
          const index = unique.findIndex(c => c.userId === userId);
          if (index !== -1) unique[index] = conv;
          seen.set(userId, conv);
        }
      }
    }
    
    // Cache for faster access
    unique.forEach(conv => {
      conversationCache.current.set(conv.userId, conv);
    });
    
    return unique;
  }, []);

  // Load conversations function
  const loadConversations = useCallback(async (showLoading = true) => {
    const userId = currentUser?._id || currentUser?.id;
    
    if (!userId) {
      console.log('⚠️ No current user, skipping load');
      if (isMountedRef.current) {
        setLoading(false);
      }
      return;
    }
    
    if (showLoading && isMountedRef.current) {
      setLoading(true);
    }
    
    try {
      console.log('📋 Loading conversations for user:', userId);
      
      const data = await chatService.getConversations();
      console.log('📋 Loaded conversations data:', data?.length || 0, 'conversations');
      
      // Ensure data is an array
      let conversationsArray = [];
      if (Array.isArray(data)) {
        conversationsArray = data;
      } else if (data && data.conversations && Array.isArray(data.conversations)) {
        conversationsArray = data.conversations;
      } else if (data && data.data && Array.isArray(data.data)) {
        conversationsArray = data.data;
      }
      
      // Format conversations for display
      const formattedConversations = conversationsArray.map(conv => ({
        id: conv.id || conv._id,
        _id: conv._id || conv.id,
        userId: conv.userId,
        userName: conv.userName || conv.name || 'User',
        userAvatar: conv.userAvatar || conv.avatar,
        userUsername: conv.userUsername || conv.username,
        lastMessage: conv.lastMessage || '',
        lastMessageText: conv.lastMessageText || conv.lastMessage || '',
        lastMessageTime: conv.lastMessageTime || conv.updatedAt || new Date().toISOString(),
        lastMessageStatus: conv.lastMessageStatus,
        unreadCount: conv.unreadCount || 0,
        isOnline: onlineUsers[conv.userId] || false,
        isTyping: typingUsers[conv.userId] || false,
        typingUser: null
      }));
      
      // Deduplicate by userId
      const uniqueConvs = deduplicateConversations(formattedConversations);
      
      // Sort by lastMessageTime (newest first)
      uniqueConvs.sort((a, b) => {
        const timeA = new Date(a.lastMessageTime).getTime();
        const timeB = new Date(b.lastMessageTime).getTime();
        return timeB - timeA;
      });
      
      if (isMountedRef.current) {
        setConversations(uniqueConvs);
        setError(null);
        
        // Update unread counts
        const counts = {};
        uniqueConvs.forEach(conv => {
          if (conv.unreadCount > 0) {
            counts[conv.id] = conv.unreadCount;
          }
        });
        setUnreadCounts(counts);
        
        // Check if we need to select a chat from URL
        if (chatId && uniqueConvs.length > 0 && !activeChat) {
          const chat = uniqueConvs.find(c => c.userId === chatId);
          if (chat) {
            setActiveChat(chat);
            if (isMobile) setShowSidebar(false);
            
            // Join conversation room
            socketService.joinConversation(chat.id);
          } else {
            // Try to create conversation with this user
            await createChatFromUserId(chatId);
          }
        }
      }
      
    } catch (err) {
      console.error('❌ Error loading conversations:', err);
      if (isMountedRef.current) {
        setError(err.message || 'Failed to load conversations');
        
        // Retry logic with exponential backoff
        if (retryCount < 3) {
          const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
          setTimeout(() => {
            if (isMountedRef.current) {
              setRetryCount(prev => prev + 1);
              loadConversations(true);
            }
          }, delay);
        }
      }
    } finally {
      if (isMountedRef.current && showLoading) {
        setLoading(false);
      }
    }
  }, [currentUser, chatId, activeChat, isMobile, onlineUsers, typingUsers, retryCount, deduplicateConversations]);

  // Function to create chat from user ID
  const createChatFromUserId = useCallback(async (userId) => {
    try {
      console.log('📝 Creating chat with user:', userId);
      const conversation = await chatService.getOrCreateConversation(userId);
      console.log('📝 Created conversation:', conversation);
      
      const formattedConv = {
        id: conversation.id || conversation._id,
        _id: conversation._id || conversation.id,
        userId: conversation.userId,
        userName: conversation.userName || 'User',
        userAvatar: conversation.userAvatar,
        userUsername: conversation.userUsername,
        lastMessage: conversation.lastMessage || '',
        lastMessageTime: conversation.lastMessageTime || new Date().toISOString(),
        unreadCount: conversation.unreadCount || 0,
        isOnline: onlineUsers[conversation.userId] || false,
        isTyping: false
      };
      
      if (isMountedRef.current) {
        setConversations(prev => {
          const exists = prev.some(c => c.userId === userId);
          if (!exists) {
            return [formattedConv, ...prev];
          }
          return prev;
        });
        setActiveChat(formattedConv);
        if (isMobile) setShowSidebar(false);
        
        // Join conversation room
        socketService.joinConversation(formattedConv.id);
      }
      
      return formattedConv;
    } catch (error) {
      console.error('Error creating chat from user ID:', error);
      if (isMountedRef.current) {
        setError('Could not create conversation. Please try again.');
      }
      return null;
    }
  }, [isMobile, onlineUsers]);

  // Update conversation in list
  const updateConversationInList = useCallback((updatedConv) => {
    if (!isMountedRef.current) return;
    
    setConversations(prev => {
      const index = prev.findIndex(c => c.id === updatedConv.id);
      let newConvs;
      if (index >= 0) {
        newConvs = [...prev];
        newConvs[index] = { ...newConvs[index], ...updatedConv };
      } else {
        newConvs = [updatedConv, ...prev];
      }
      // Sort by lastMessageTime
      newConvs.sort((a, b) => {
        const timeA = new Date(a.lastMessageTime).getTime();
        const timeB = new Date(b.lastMessageTime).getTime();
        return timeB - timeA;
      });
      return newConvs;
    });
  }, []);

  // Handle new message
  const handleNewMessage = useCallback((message) => {
    if (!isMountedRef.current) return;
    
    console.log('📨 New message in Chat:', message);
    
    const currentUserId = currentUser?._id || currentUser?.id;
    const isFromCurrentUser = message.senderId === currentUserId;
    
    // Update conversations list
    setConversations(prev => {
      let updated = false;
      const newConvs = prev.map(conv => {
        if (conv.id === message.conversationId) {
          updated = true;
          return {
            ...conv,
            lastMessage: message.text || (message.media?.length > 0 ? '📎 Media' : ''),
            lastMessageText: message.text || (message.media?.length > 0 ? '📎 Media' : ''),
            lastMessageTime: message.createdAt || new Date().toISOString(),
            unreadCount: !isFromCurrentUser
              ? (conv.unreadCount || 0) + 1 
              : conv.unreadCount
          };
        }
        return conv;
      });
      
      // Sort by lastMessageTime
      newConvs.sort((a, b) => {
        const timeA = new Date(a.lastMessageTime).getTime();
        const timeB = new Date(b.lastMessageTime).getTime();
        return timeB - timeA;
      });
      
      // If conversation doesn't exist yet, reload conversations
      if (!updated && !isFromCurrentUser) {
        setTimeout(() => loadConversations(false), 500);
      }
      
      return newConvs;
    });

    // Update unread counts
    if (!isFromCurrentUser) {
      setUnreadCounts(prev => ({
        ...prev,
        [message.conversationId]: (prev[message.conversationId] || 0) + 1
      }));
      
      // Play notification sound if not active chat
      if (activeChat?.id !== message.conversationId) {
        // Optional: play sound or show browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('New Message', {
            body: `${message.sender?.name || 'Someone'} sent you a message`,
            icon: message.sender?.avatar
          });
        }
      }
    }
  }, [currentUser, activeChat, loadConversations]);

  // Handle messages read
  const handleMessagesRead = useCallback(({ conversationId, readerId }) => {
    if (!isMountedRef.current) return;
    
    const currentUserId = currentUser?._id || currentUser?.id;
    
    if (readerId === currentUserId) {
      setUnreadCounts(prev => {
        const newCounts = { ...prev };
        delete newCounts[conversationId];
        return newCounts;
      });

      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );
    }
  }, [currentUser]);

  // Handle typing indicators
  const handleTypingStart = useCallback(({ conversationId, userId, username }) => {
    if (!isMountedRef.current) return;
    
    const currentUserId = currentUser?._id || currentUser?.id;
    
    if (userId !== currentUserId) {
      setTypingUsers(prev => ({ ...prev, [userId]: true }));
      
      setConversations(prev => 
        prev.map(conv => 
          conv.userId === userId
            ? { ...conv, isTyping: true, typingUser: username }
            : conv
        )
      );
      
      // Auto-clear typing after 3 seconds if no stop received
      setTimeout(() => {
        if (isMountedRef.current) {
          handleTypingStop({ conversationId, userId });
        }
      }, 3000);
    }
  }, [currentUser]);

  const handleTypingStop = useCallback(({ conversationId, userId }) => {
    if (!isMountedRef.current) return;
    
    setTypingUsers(prev => ({ ...prev, [userId]: false }));
    
    setConversations(prev => 
      prev.map(conv => 
        conv.userId === userId
          ? { ...conv, isTyping: false, typingUser: null }
          : conv
      )
    );
  }, []);

  // Select chat
  const selectChat = useCallback(async (chat) => {
    console.log('💬 Selecting chat:', chat);
    
    const currentUserId = currentUser?._id || currentUser?.id;
    
    // Clear unread count
    if (unreadCounts[chat.id] > 0) {
      try {
        // Mark as read via REST API
        await chatService.markMessagesAsReadRest(chat.id, chat.userId);
        
        // Also via socket
        socketService.markMessagesAsRead(chat.id, chat.userId);
        
        // Update local state
        setUnreadCounts(prev => {
          const newCounts = { ...prev };
          delete newCounts[chat.id];
          return newCounts;
        });
        
        setConversations(prev => 
          prev.map(conv => 
            conv.id === chat.id ? { ...conv, unreadCount: 0 } : conv
          )
        );
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    }
    
    setActiveChat(chat);
    
    // Join conversation room
    socketService.joinConversation(chat.id);
    
    // Update URL
    navigate(`/chat/${chat.userId}`);
    
    // On mobile, hide sidebar
    if (isMobile) {
      setShowSidebar(false);
    }
  }, [currentUser, unreadCounts, isMobile, navigate]);

  // Create new chat
  const createNewChat = useCallback(async (user) => {
    try {
      console.log('📝 Creating new chat with user:', user);
      const conversation = await chatService.getOrCreateConversation(user.id);
      console.log('📝 New chat conversation:', conversation);
      setShowNewChatModal(false);
      
      const formattedConv = {
        id: conversation.id || conversation._id,
        _id: conversation._id || conversation.id,
        userId: conversation.userId,
        userName: conversation.userName || user.name,
        userAvatar: conversation.userAvatar || user.avatar,
        userUsername: conversation.userUsername || user.username,
        lastMessage: conversation.lastMessage || '',
        lastMessageTime: conversation.lastMessageTime || new Date().toISOString(),
        unreadCount: conversation.unreadCount || 0,
        isOnline: onlineUsers[conversation.userId] || false,
        isTyping: false
      };
      
      setConversations(prev => {
        const exists = prev.some(c => c.userId === user.id);
        if (!exists) {
          return [formattedConv, ...prev];
        }
        return prev;
      });
      
      await selectChat(formattedConv);
    } catch (error) {
      console.error('Error creating chat:', error);
      alert('Failed to create chat. Please try again.');
    }
  }, [onlineUsers, selectChat]);

  // Go back to conversations list (mobile)
  const goBackToList = useCallback(() => {
    setActiveChat(null);
    setShowSidebar(true);
    navigate('/chat');
  }, [navigate]);

  // Retry loading
  const handleRetry = useCallback(() => {
    setRetryCount(0);
    setError(null);
    loadConversations(true);
  }, [loadConversations]);

  // Handle socket connection
  const setupSocketListeners = useCallback(() => {
    const currentUserId = currentUser?._id || currentUser?.id;
    
    if (!currentUserId) return;
    
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.error('❌ No token found for socket connection');
      setConnectionStatus('disconnected');
      setSocketError('Authentication required');
      return;
    }
    
    // Connect socket service
    socketService.connect(currentUserId, token);
    
    // Socket event handlers
    const handleConnect = () => {
      console.log('✅ Socket connected');
      if (isMountedRef.current) {
        setConnectionStatus('connected');
        setSocketError(null);
        // Get online users
        socketService.getOnlineUsers();
      }
    };
    
    const handleDisconnect = (reason) => {
      console.log('❌ Socket disconnected:', reason);
      if (isMountedRef.current) {
        setConnectionStatus('disconnected');
        if (reason === 'io server disconnect') {
          // Reconnect manually
          setTimeout(() => socketService.reconnect(), 1000);
        }
      }
    };
    
    const handleConnectError = (error) => {
      console.error('❌ Socket connection error:', error);
      if (isMountedRef.current) {
        setConnectionStatus('disconnected');
        setSocketError(error.message || 'Connection failed');
      }
    };
    
    const handleUsersOnline = (users) => {
      console.log('📊 Online users:', Object.keys(users).length);
      if (isMountedRef.current) {
        const onlineMap = {};
        Object.entries(users).forEach(([id, data]) => {
          const isOnline = typeof data === 'boolean' ? data : data?.online || false;
          onlineMap[id] = isOnline;
        });
        setOnlineUsers(onlineMap);
        
        // Update conversations online status
        setConversations(prev => prev.map(conv => ({
          ...conv,
          isOnline: onlineMap[conv.userId] || false
        })));
      }
    };
    
    const handleUserOnline = (data) => {
      if (isMountedRef.current) {
        setOnlineUsers(prev => ({ ...prev, [data.userId]: true }));
        setConversations(prev => prev.map(conv => 
          conv.userId === data.userId ? { ...conv, isOnline: true } : conv
        ));
      }
    };
    
    const handleUserOffline = (data) => {
      if (isMountedRef.current) {
        setOnlineUsers(prev => ({ ...prev, [data.userId]: false }));
        setConversations(prev => prev.map(conv => 
          conv.userId === data.userId ? { ...conv, isOnline: false } : conv
        ));
      }
    };
    
    const handleMessageReceive = (message) => {
      handleNewMessage(message);
    };
    
    const handleMessageSent = (message) => {
      console.log('✅ Message sent confirmation:', message);
      // Update conversation with sent message
      updateConversationInList({
        id: message.conversationId,
        lastMessage: message.text || (message.media?.length > 0 ? '📎 Media' : ''),
        lastMessageTime: message.createdAt || new Date().toISOString()
      });
    };
    
    const handleMessagesRead = (data) => {
      handleMessagesRead(data);
    };
    
    const handleTypingStartEvent = (data) => {
      handleTypingStart(data);
    };
    
    const handleTypingStopEvent = (data) => {
      handleTypingStop(data);
    };
    
    // Register all listeners
    socketService.on('connect', handleConnect);
    socketService.on('disconnect', handleDisconnect);
    socketService.on('connect_error', handleConnectError);
    socketService.on('users:online', handleUsersOnline);
    socketService.on('user:online', handleUserOnline);
    socketService.on('user:offline', handleUserOffline);
    socketService.on('message:receive', handleMessageReceive);
    socketService.on('message:sent', handleMessageSent);
    socketService.on('messages:read', handleMessagesRead);
    socketService.on('typing:start', handleTypingStartEvent);
    socketService.on('typing:stop', handleTypingStopEvent);
    
    // Cleanup function
    return () => {
      socketService.off('connect', handleConnect);
      socketService.off('disconnect', handleDisconnect);
      socketService.off('connect_error', handleConnectError);
      socketService.off('users:online', handleUsersOnline);
      socketService.off('user:online', handleUserOnline);
      socketService.off('user:offline', handleUserOffline);
      socketService.off('message:receive', handleMessageReceive);
      socketService.off('message:sent', handleMessageSent);
      socketService.off('messages:read', handleMessagesRead);
      socketService.off('typing:start', handleTypingStartEvent);
      socketService.off('typing:stop', handleTypingStopEvent);
    };
  }, [currentUser, handleNewMessage, handleMessagesRead, handleTypingStart, handleTypingStop, updateConversationInList]);

  // Initialize chat service
  useEffect(() => {
    if (!currentUser) {
      console.log('⚠️ No current user, waiting...');
      if (isMountedRef.current) {
        setLoading(false);
        setConnectionStatus('disconnected');
      }
      return;
    }

    isMountedRef.current = true;
    
    console.log('🔌 Initializing chat for user:', currentUser._id || currentUser.id);
    
    // Ensure user has id property
    const userWithId = {
      ...currentUser,
      id: currentUser._id || currentUser.id,
      _id: currentUser._id || currentUser.id
    };
    
    // Set connection timeout
    loadingTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current && connectionStatus === 'connecting') {
        console.log('⚠️ Socket connection timeout, loading conversations anyway...');
        setConnectionStatus('timeout');
        setSocketError('Connection timeout. Using REST API only.');
        loadConversations(true);
      }
    }, 8000);
    
    // Initialize chat service
    chatService.init(userWithId, {
      onConnect: () => {
        console.log('✅ Chat service connected');
        if (isMountedRef.current) {
          setConnectionStatus('connected');
          setSocketError(null);
          loadConversations(true);
        }
      },
      onConnectError: (error) => {
        console.error('❌ Chat service connection error:', error);
        if (isMountedRef.current) {
          setConnectionStatus('disconnected');
          setSocketError(error.message || 'Connection failed');
          // Still load conversations even if socket fails
          loadConversations(true);
        }
      },
      onDisconnect: (reason) => {
        console.log('❌ Chat service disconnected:', reason);
        if (isMountedRef.current) {
          setConnectionStatus('disconnected');
        }
      },
      onReconnect: () => {
        console.log('🔄 Chat service reconnected');
        if (isMountedRef.current) {
          setConnectionStatus('connected');
          setSocketError(null);
          loadConversations(false);
        }
      },
      onConversationUpdate: (conversation) => {
        updateConversationInList(conversation);
      },
      onNewMessage: (message) => {
        handleNewMessage(message);
      },
      onMessagesRead: ({ conversationId, readerId }) => {
        handleMessagesRead({ conversationId, readerId });
      },
      onTypingStart: (data) => {
        handleTypingStart(data);
      },
      onTypingStop: (data) => {
        handleTypingStop(data);
      },
      onUserOnline: (data) => {
        setOnlineUsers(prev => ({ ...prev, [data.userId]: true }));
        setConversations(prev => prev.map(conv => 
          conv.userId === data.userId ? { ...conv, isOnline: true } : conv
        ));
      },
      onUserOffline: (data) => {
        setOnlineUsers(prev => ({ ...prev, [data.userId]: false }));
        setConversations(prev => prev.map(conv => 
          conv.userId === data.userId ? { ...conv, isOnline: false } : conv
        ));
      },
      onOnlineUsers: (users) => {
        const onlineMap = {};
        Object.entries(users).forEach(([id, data]) => {
          const isOnline = typeof data === 'boolean' ? data : data?.online || false;
          onlineMap[id] = isOnline;
        });
        setOnlineUsers(onlineMap);
      },
      onMessageError: (data) => {
        console.error('❌ Message error:', data);
      }
    });

    // Setup socket service listeners
    const cleanupSocket = setupSocketListeners();
    
    // Load conversations immediately even if socket not connected yet
    loadConversations(true);
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      isMountedRef.current = false;
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
      if (cleanupSocket) cleanupSocket();
      chatService.disconnect();
      socketService.disconnect();
    };
  }, [currentUser, loadConversations, handleNewMessage, handleMessagesRead, handleTypingStart, handleTypingStop, updateConversationInList, setupSocketListeners]);

  // Filter conversations
  const filteredConversations = conversations.filter(conv => 
    conv.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.userUsername?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate total unread
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  // Get connection status display
  const getConnectionStatusDisplay = () => {
    switch(connectionStatus) {
      case 'connected':
        return { text: 'Connected', icon: <FaWifi />, class: styles.connected };
      case 'connecting':
        return { text: 'Connecting...', icon: <FaSpinner className={styles.spinning} />, class: styles.connecting };
      case 'timeout':
        return { text: 'Connection timeout', icon: <FaExclamationTriangle />, class: styles.timeout };
      default:
        return { text: 'Disconnected', icon: <FaRegCircle />, class: styles.disconnected };
    }
  };

  const connectionDisplay = getConnectionStatusDisplay();

  // Show loading state
  if (loading && conversations.length === 0) {
    return (
      <div className={`${styles.chatApp} ${darkMode ? styles.dark : styles.light}`}>
        <div className={styles.loadingContainer}>
          <FaSpinner className={styles.spinner} />
          <p>Loading conversations...</p>
          <small>Connecting to chat server...</small>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && conversations.length === 0) {
    return (
      <div className={`${styles.chatApp} ${darkMode ? styles.dark : styles.light}`}>
        <div className={styles.errorContainer}>
          <FaExclamationTriangle className={styles.errorIcon} />
          <p>{error}</p>
          <button onClick={handleRetry} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.chatApp} ${darkMode ? styles.dark : styles.light}`}>
      {/* Sidebar */}
      <div className={`${styles.sidebar} ${showSidebar ? styles.show : styles.hide}`}>
        {/* Sidebar Header */}
        <div className={styles.sidebarHeader}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              {currentUser?.avatar ? (
                <img src={currentUser.avatar} alt={currentUser.name} />
              ) : (
                <div 
                  className={styles.avatarPlaceholder}
                  style={{ backgroundColor: getAvatarColor(currentUser?.id || currentUser?._id) }}
                >
                  {getAvatarInitial(currentUser)}
                </div>
              )}
            </div>
            <div className={styles.userDetails}>
              <h3>{currentUser?.name || 'User'}</h3>
              <span className={styles.userStatus}>
                <span className={`${styles.statusDot} ${connectionStatus === 'connected' ? styles.online : styles.offline}`}></span>
                {connectionStatus === 'connected' ? 'Online' : 'Connecting...'}
              </span>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button 
              className={styles.iconButton}
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? 'Light mode' : 'Dark mode'}
            >
              {darkMode ? <FaSun /> : <FaMoon />}
            </button>
            <button 
              className={styles.iconButton}
              onClick={logout}
              title="Logout"
            >
              <FaSignOutAlt />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className={styles.searchContainer}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          <button 
            className={styles.newChatButton}
            onClick={() => setShowNewChatModal(true)}
            title="New chat"
          >
            <FaPlus />
          </button>
        </div>

        {/* Connection Status Bar */}
        <div className={`${styles.connectionStatusBar} ${connectionDisplay.class}`}>
          {connectionDisplay.icon}
          <span>{connectionDisplay.text}</span>
          {socketError && (
            <span className={styles.socketErrorHint}> - Using REST API</span>
          )}
        </div>

        {/* Unread Summary */}
        {totalUnread > 0 && (
          <div className={styles.unreadSummary}>
            <span>{totalUnread} unread message{totalUnread !== 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Conversations List */}
        <div className={styles.conversationsList}>
          {filteredConversations.length > 0 ? (
            <ChatList
              conversations={filteredConversations}
              activeChat={activeChat}
              onSelectChat={selectChat}
              onlineUsers={onlineUsers}
              unreadCounts={unreadCounts}
              typingUsers={typingUsers}
            />
          ) : searchQuery ? (
            <div className={styles.emptyState}>
              <FaSearch className={styles.emptyIcon} />
              <p>No results for "{searchQuery}"</p>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <FaComments className={styles.emptyIcon} />
              <p>No conversations yet</p>
              <button 
                className={styles.startChatButton}
                onClick={() => setShowNewChatModal(true)}
              >
                <FaUserPlus /> Start a new chat
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={styles.mainArea}>
        {activeChat ? (
          <ChatConversation
            conversation={activeChat}
            currentUser={currentUser}
            onBack={goBackToList}
            isMobile={isMobile}
            online={onlineUsers[activeChat.userId] || false}
            isTyping={typingUsers[activeChat.userId] || false}
            socketService={socketService}
          />
        ) : (
          <div className={styles.welcomeScreen}>
            <div className={styles.welcomeContent}>
              <FaComments className={styles.welcomeIcon} />
              <h2>Welcome to Chat</h2>
              <p>Select a conversation or start a new one</p>
              {isMobile && (
                <button 
                  className={styles.startChatButton}
                  onClick={() => setShowNewChatModal(true)}
                >
                  <FaUserPlus /> Start new chat
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onSelectUser={createNewChat}
        currentUser={currentUser}
      />
    </div>
  );
};

export default Chat;