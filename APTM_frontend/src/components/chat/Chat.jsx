// Chat.jsx - COMPLETE FIXED VERSION
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { chatService } from '../../services/chatService';
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
  FaRegCircle
} from 'react-icons/fa';

const Chat = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
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
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // connecting, connected, disconnected, timeout
  const [unreadCounts, setUnreadCounts] = useState({});
  const [retryCount, setRetryCount] = useState(0);
  const [socketError, setSocketError] = useState(null);
  
  const loadingTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);

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
  const deduplicateConversations = (convs) => {
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
        if (new Date(conv.lastMessageTime) > new Date(existing.lastMessageTime)) {
          const index = unique.findIndex(c => c.userId === userId);
          if (index !== -1) unique[index] = conv;
          seen.set(userId, conv);
        }
      }
    }
    
    return unique;
  };

  // Load conversations function
  const loadConversations = useCallback(async (showLoading = true) => {
    if (!currentUser?._id && !currentUser?.id) {
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
      console.log('📋 Loading conversations for user:', currentUser?._id || currentUser?.id);
      
      const data = await chatService.getConversations();
      console.log('📋 Loaded conversations data:', data);
      
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
        lastMessageTime: conv.lastMessageTime || conv.updatedAt || new Date().toISOString(),
        lastMessageStatus: conv.lastMessageStatus,
        unreadCount: conv.unreadCount || 0,
        isOnline: onlineUsers[conv.userId] || false,
        isTyping: false,
        typingUser: null
      }));
      
      // Deduplicate by userId
      const uniqueConvs = deduplicateConversations(formattedConversations);
      
      // Sort by lastMessageTime (newest first)
      uniqueConvs.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
      
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
          } else {
            // Try to create conversation with this user
            createChatFromUserId(chatId);
          }
        }
      }
      
    } catch (err) {
      console.error('❌ Error loading conversations:', err);
      if (isMountedRef.current) {
        setError(err.message || 'Failed to load conversations');
        
        // Retry logic
        if (retryCount < 3) {
          setTimeout(() => {
            if (isMountedRef.current) {
              setRetryCount(prev => prev + 1);
              loadConversations(true);
            }
          }, 2000);
        }
      }
    } finally {
      if (isMountedRef.current && showLoading) {
        setLoading(false);
      }
    }
  }, [currentUser, chatId, activeChat, isMobile, onlineUsers, retryCount]);

  // Function to create chat from user ID
  const createChatFromUserId = async (userId) => {
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
        isOnline: onlineUsers[conversation.userId] || false
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
      }
    } catch (error) {
      console.error('Error creating chat from user ID:', error);
      if (isMountedRef.current) {
        setError('Could not create conversation. Please try again.');
      }
    }
  };

  // Update conversation in list
  const updateConversationInList = (updatedConv) => {
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
      newConvs.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
      return newConvs;
    });
  };

  // Handle new message
  const handleNewMessage = (message) => {
    if (!isMountedRef.current) return;
    
    console.log('📨 New message in Chat:', message);
    
    // Update conversations list
    setConversations(prev => {
      let updated = false;
      const newConvs = prev.map(conv => {
        if (conv.id === message.conversationId) {
          updated = true;
          return {
            ...conv,
            lastMessage: message.text || (message.media?.length > 0 ? '📎 Media' : ''),
            lastMessageTime: message.createdAt,
            unreadCount: message.senderId !== currentUser?.id && message.senderId !== currentUser?._id
              ? (conv.unreadCount || 0) + 1 
              : conv.unreadCount
          };
        }
        return conv;
      });
      
      // Sort by lastMessageTime
      newConvs.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
      
      // If conversation doesn't exist yet, reload conversations
      if (!updated && message.senderId !== currentUser?.id && message.senderId !== currentUser?._id) {
        setTimeout(() => loadConversations(false), 500);
      }
      
      return newConvs;
    });

    // Update unread counts
    if (message.senderId !== currentUser?.id && message.senderId !== currentUser?._id) {
      setUnreadCounts(prev => ({
        ...prev,
        [message.conversationId]: (prev[message.conversationId] || 0) + 1
      }));
    }
  };

  // Handle messages read
  const handleMessagesRead = ({ conversationId, readerId }) => {
    if (!isMountedRef.current) return;
    
    if (readerId === currentUser?.id || readerId === currentUser?._id) {
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
  };

  // Handle typing indicators
  const handleTypingStart = (conversationId, userId, username) => {
    if (!isMountedRef.current) return;
    
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId && userId !== currentUser?.id
          ? { ...conv, isTyping: true, typingUser: username }
          : conv
      )
    );
  };

  const handleTypingStop = (conversationId, userId) => {
    if (!isMountedRef.current) return;
    
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId
          ? { ...conv, isTyping: false, typingUser: null }
          : conv
      )
    );
  };

  // Select chat
  const selectChat = async (chat) => {
    console.log('💬 Selecting chat:', chat);
    
    // Clear unread count
    if (unreadCounts[chat.id] > 0) {
      try {
        // Use REST API to mark as read
        const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
        await fetch(`${BASE_URL}/api/chat/conversations/${chat.id}/read`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ senderId: chat.userId })
        });
        
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
    
    // Update URL
    navigate(`/chat/${chat.userId}`);
    
    // On mobile, hide sidebar
    if (isMobile) {
      setShowSidebar(false);
    }
  };

  // Create new chat
  const createNewChat = async (user) => {
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
        isOnline: onlineUsers[conversation.userId] || false
      };
      
      setConversations(prev => {
        const exists = prev.some(c => c.userId === user.id);
        if (!exists) {
          return [formattedConv, ...prev];
        }
        return prev;
      });
      
      selectChat(formattedConv);
    } catch (error) {
      console.error('Error creating chat:', error);
      alert('Failed to create chat. Please try again.');
    }
  };

  // Go back to conversations list (mobile)
  const goBackToList = () => {
    setActiveChat(null);
    setShowSidebar(true);
    navigate('/chat');
  };

  // Retry loading
  const handleRetry = () => {
    setRetryCount(0);
    setError(null);
    loadConversations(true);
  };

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
    
    console.log('🔌 Initializing chat service for user:', currentUser._id || currentUser.id);
    
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
        console.log('🔄 Conversation update:', conversation);
        updateConversationInList(conversation);
      },
      onNewMessage: (message) => {
        console.log('📨 New message received:', message);
        handleNewMessage(message);
      },
      onMessagesRead: ({ conversationId, readerId }) => {
        console.log('📖 Messages read:', conversationId, readerId);
        handleMessagesRead({ conversationId, readerId });
      },
      onTypingStart: ({ conversationId, userId, username }) => {
        handleTypingStart(conversationId, userId, username);
      },
      onTypingStop: ({ conversationId, userId }) => {
        handleTypingStop(conversationId, userId);
      },
      onUserOnline: (data) => {
        console.log('🟢 User online:', data);
        if (isMountedRef.current) {
          setOnlineUsers(prev => ({ ...prev, [data.userId]: true }));
          setConversations(prev => prev.map(conv => 
            conv.userId === data.userId ? { ...conv, isOnline: true } : conv
          ));
        }
      },
      onUserOffline: (data) => {
        console.log('🔴 User offline:', data);
        if (isMountedRef.current) {
          setOnlineUsers(prev => ({ ...prev, [data.userId]: false }));
          setConversations(prev => prev.map(conv => 
            conv.userId === data.userId ? { ...conv, isOnline: false } : conv
          ));
        }
      },
      onOnlineUsers: (users) => {
        console.log('📊 Online users received:', Object.keys(users).length);
        if (isMountedRef.current) {
          const onlineMap = {};
          Object.entries(users).forEach(([id, data]) => {
            const isOnline = typeof data === 'boolean' ? data : data?.online || false;
            onlineMap[id] = isOnline;
          });
          setOnlineUsers(onlineMap);
        }
      },
      onMessageError: (data) => {
        console.error('❌ Message error:', data);
      }
    });

    // Load conversations immediately even if socket not connected yet
    loadConversations(true);

    return () => {
      isMountedRef.current = false;
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
      chatService.disconnect();
    };
  }, [currentUser]);

  // Filter conversations
  const filteredConversations = conversations.filter(conv => 
    conv.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
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
            <button className={styles.iconButton} title="Settings">
              <FaCog />
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
                Start a new chat
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
                  Start new chat
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