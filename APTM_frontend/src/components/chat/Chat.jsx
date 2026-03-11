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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [conversationsFetched, setConversationsFetched] = useState(false);

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

  // Initialize socket and fetch conversations
  useEffect(() => {
    if (!currentUser) return;

    console.log('🔌 Chat - Initializing socket connection');

    // Initialize socket connection
    const token = localStorage.getItem('token');
    socketService.connect(currentUser.id, token);

    // Request online users
    if (socketService.isConnected()) {
      socketService.getSocket()?.emit('get-online-users');
    }

    // Fetch conversations only once
    if (!conversationsFetched) {
      fetchConversations();
    }

    // Cleanup
    return () => {
      console.log('🧹 Chat - Cleaning up');
      // Don't disconnect socket here, just remove specific listeners
    };
  }, [currentUser, conversationsFetched]);

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
          const conversationsWithStatus = (result.conversations || []).map(conv => ({
            ...conv,
            id: conv.id || conv._id,
            isOnline: false, // Will be updated by socket
            unreadCount: conv.unreadCount || 0
          }));
          
          console.log('📋 Fetched conversations:', conversationsWithStatus);
          setConversations(conversationsWithStatus);
          setConversationsFetched(true);
          
          // If chatId is provided, set active chat
          if (chatId && conversationsWithStatus.length > 0) {
            const chat = conversationsWithStatus.find(c => c.userId === chatId || c.id === chatId);
            if (chat) {
              setTimeout(() => handleSelectChat(chat), 100);
            }
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
            userId: userId,
            userName: result.conversation.userName || 'User',
            userAvatar: result.conversation.userAvatar || null,
            isOnline: false,
            unreadCount: 0
          };
          
          console.log('🆕 New chat created:', newChat);
          
          // Add to conversations list if not already there
          setConversations(prev => {
            if (!prev.find(c => c.userId === userId)) {
              return [newChat, ...prev];
            }
            return prev.map(c => c.userId === userId ? newChat : c);
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