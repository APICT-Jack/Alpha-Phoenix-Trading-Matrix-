// Chat.jsx - FIXED VERSION with proper loading
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
  FaCog
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
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showSidebar, setShowSidebar] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [unreadCounts, setUnreadCounts] = useState({});

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

  // Initialize chat service
  useEffect(() => {
    if (!currentUser) return;

    console.log('🔌 Initializing chat service', currentUser);
    
    chatService.init(currentUser, {
      onConnect: () => {
        console.log('✅ Chat service connected');
        setConnectionStatus('connected');
        loadConversations();
      },
      onDisconnect: () => {
        console.log('❌ Chat service disconnected');
        setConnectionStatus('disconnected');
      },
      onConversationUpdate: (conversation) => {
        console.log('🔄 Conversation update:', conversation);
        updateConversationInList(conversation);
      },
      onNewMessage: (message) => {
        console.log('📨 New message:', message);
        handleNewMessage(message);
      },
      onMessagesRead: ({ conversationId, readerId }) => {
        console.log('📖 Messages read:', conversationId, readerId);
        handleMessagesRead(conversationId, readerId);
      },
      onTypingStart: ({ conversationId, userId, username }) => {
        handleTypingStart(conversationId, userId, username);
      },
      onTypingStop: ({ conversationId, userId }) => {
        handleTypingStop(conversationId, userId);
      },
      onUserOnline: (data) => {
        console.log('🟢 User online:', data);
        setOnlineUsers(prev => ({ ...prev, [data.userId]: true }));
      },
      onUserOffline: (data) => {
        console.log('🔴 User offline:', data);
        setOnlineUsers(prev => ({ ...prev, [data.userId]: false }));
      },
      onOnlineUsers: (users) => {
        console.log('📊 Online users:', users);
        const onlineMap = {};
        Object.entries(users).forEach(([id, data]) => {
          onlineMap[id] = data.online || data;
        });
        setOnlineUsers(onlineMap);
      }
    });

    return () => {
      chatService.disconnect();
    };
  }, [currentUser]);

  // Handle chatId from URL params
  useEffect(() => {
    if (chatId && conversations.length > 0 && !activeChat) {
      const chat = conversations.find(c => c.userId === chatId);
      if (chat) {
        selectChat(chat);
      } else {
        createChatFromUserId(chatId);
      }
    }
  }, [chatId, conversations, activeChat]);

  // Function to create chat from user ID
  const createChatFromUserId = async (userId) => {
    try {
      const conversation = await chatService.getOrCreateConversation(userId);
      setConversations(prev => {
        const exists = prev.some(c => c.id === conversation.id);
        if (!exists) {
          return [conversation, ...prev];
        }
        return prev;
      });
      setActiveChat(conversation);
    } catch (error) {
      console.error('Error creating chat from user ID:', error);
    }
  };

  // Deduplicate conversations helper
  const deduplicateConversations = (convs) => {
    const seen = new Map();
    return convs.filter(conv => {
      if (seen.has(conv.userId)) {
        const existing = seen.get(conv.userId);
        if (new Date(conv.lastMessageTime) > new Date(existing.lastMessageTime)) {
          seen.set(conv.userId, conv);
          return false;
        }
        return false;
      }
      seen.set(conv.userId, conv);
      return true;
    });
  };

  // Load conversations
  const loadConversations = async () => {
    try {
      setLoading(true);
      console.log('📋 Loading conversations...');
      const data = await chatService.getConversations();
      console.log('📋 Loaded conversations:', data);
      
      const conversationsWithStatus = (data || []).map(conv => ({
        ...conv,
        online: onlineUsers[conv.userId] || false,
        unreadCount: conv.unreadCount || 0
      }));
      
      // Deduplicate conversations
      const uniqueConvs = deduplicateConversations(conversationsWithStatus);
      setConversations(uniqueConvs);
      
      // Initialize unread counts
      const counts = {};
      uniqueConvs.forEach(conv => {
        if (conv.unreadCount > 0) {
          counts[conv.id] = conv.unreadCount;
        }
      });
      setUnreadCounts(counts);
      
      // Check if chatId from URL exists
      if (chatId && uniqueConvs.length > 0) {
        const chat = uniqueConvs.find(c => c.userId === chatId);
        if (chat) {
          setActiveChat(chat);
        }
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update conversation in list
  const updateConversationInList = (updatedConv) => {
    setConversations(prev => {
      const index = prev.findIndex(c => c.id === updatedConv.id);
      if (index >= 0) {
        const newConvs = [...prev];
        newConvs[index] = { ...newConvs[index], ...updatedConv };
        return newConvs;
      }
      return [updatedConv, ...prev];
    });
  };

  // Handle new message
  const handleNewMessage = (message) => {
    console.log('📨 New message in Chat:', message);
    
    // Update conversations list
    setConversations(prev => {
      let updated = false;
      const newConvs = prev.map(conv => {
        if (conv.id === message.conversationId) {
          updated = true;
          return {
            ...conv,
            lastMessage: message.text,
            lastMessageTime: message.createdAt,
            unreadCount: message.senderId !== currentUser?.id 
              ? (conv.unreadCount || 0) + 1 
              : conv.unreadCount
          };
        }
        return conv;
      });
      
      // If conversation doesn't exist yet, reload conversations
      if (!updated && message.senderId !== currentUser?.id) {
        setTimeout(() => loadConversations(), 500);
      }
      
      return newConvs;
    });

    // Update unread counts
    if (message.senderId !== currentUser?.id) {
      setUnreadCounts(prev => ({
        ...prev,
        [message.conversationId]: (prev[message.conversationId] || 0) + 1
      }));
    }
  };

  // Handle messages read
  const handleMessagesRead = (conversationId, readerId) => {
    if (readerId === currentUser?.id) {
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
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, isTyping: true, typingUser: username }
          : conv
      )
    );
  };

  const handleTypingStop = (conversationId, userId) => {
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
        await chatService.markMessagesAsRead(chat.id, chat.userId);
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
      const conversation = await chatService.getOrCreateConversation(user.id);
      setShowNewChatModal(false);
      
      // Check if conversation already exists
      setConversations(prev => {
        const exists = prev.some(c => c.userId === user.id);
        if (!exists) {
          return [conversation, ...prev];
        }
        return prev;
      });
      
      selectChat(conversation);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  // Go back to conversations list (mobile)
  const goBackToList = () => {
    setActiveChat(null);
    setShowSidebar(true);
    navigate('/chat');
  };

  // Filter conversations
  const filteredConversations = conversations.filter(conv => 
    conv.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate total unread
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  // Show loading state
  if (loading && conversations.length === 0) {
    return (
      <div className={`${styles.chatApp} ${darkMode ? styles.dark : styles.light}`}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading conversations...</p>
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
                  style={{ backgroundColor: getAvatarColor(currentUser?.id) }}
                >
                  {getAvatarInitial(currentUser)}
                </div>
              )}
            </div>
            <div className={styles.userDetails}>
              <h3>{currentUser?.name || 'User'}</h3>
              <span className={styles.userStatus}>
                <span className={`${styles.statusDot} ${styles.online}`}></span>
                Online
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

        {/* Connection Status */}
        {connectionStatus !== 'connected' && (
          <div className={styles.connectionStatus}>
            <span>Connecting...</span>
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