/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { socketService } from '../../services/socketService';
import { formatAvatarUrl, getAvatarInitial, hasValidAvatar } from '../../utils/avatarUtils';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import AISuggestions from './AISuggestions';
import styles from './ChatWindow.module.css';

const ChatWindow = ({ chat, currentUser, onBack, onToggleSidebar, isMobile }) => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const processedMessageIds = useRef(new Set());

  // Format chat data with proper avatar URLs
  const formattedChat = {
    ...chat,
    userAvatar: formatAvatarUrl(chat?.userAvatar),
    userName: chat?.userName || 'Unknown User'
  };

  // Handle profile navigation
  const handleOpenProfile = () => {
    if (chat?.userId) {
      navigate(`/profile/${chat.userId}`);
    }
  };

  // Handle online status updates
  useEffect(() => {
    if (!chat?.userId) return;

    const handleUserOnline = (data) => {
      if (data.userId === chat.userId) {
        setOnlineStatus(true);
      }
    };

    const handleUserOffline = (data) => {
      if (data.userId === chat.userId) {
        setOnlineStatus(false);
      }
    };

    const handleUserStatusResponse = (data) => {
      if (data.userId === chat.userId) {
        setOnlineStatus(data.isOnline);
      }
    };

    socketService.on('user:online', handleUserOnline);
    socketService.on('user:offline', handleUserOffline);
    socketService.on('user:status:response', handleUserStatusResponse);

    if (socketService.isConnected()) {
      socketService.getUserStatus(chat.userId);
    }

    return () => {
      socketService.off('user:online', handleUserOnline);
      socketService.off('user:offline', handleUserOffline);
      socketService.off('user:status:response', handleUserStatusResponse);
    };
  }, [chat?.userId]);

  // Function to mark messages as read
  const markMessagesAsRead = useCallback(() => {
    if (conversationId && chat?.userId && socketService.isConnected()) {
      console.log('📖 Marking messages as read for conversation:', conversationId);
      socketService.markMessagesAsRead(conversationId, chat.userId);
    }
  }, [conversationId, chat?.userId]);

  // Fetch messages function
  const fetchMessages = useCallback(async (convId, pageNum) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
        // Clear processed IDs when loading new conversation
        processedMessageIds.current.clear();
      } else {
        setLoadingMore(true);
      }

      console.log('📥 Fetching messages for conversation:', convId, 'page:', pageNum);

      const response = await fetch(`http://localhost:5000/api/chat/messages/${convId}?page=${pageNum}&limit=50`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          const processedMessages = (data.messages || []).map(msg => {
            let sender = null;
            
            if (msg.sender) {
              sender = {
                _id: msg.sender._id || msg.sender.id,
                name: msg.sender.name || msg.sender.username || 'Unknown User',
                avatar: msg.sender.avatar || msg.sender.avatarUrl || null,
                username: msg.sender.username
              };
            } else if (msg.senderId) {
              sender = {
                _id: typeof msg.senderId === 'object' 
                  ? (msg.senderId._id || msg.senderId.id)
                  : msg.senderId,
                name: msg.senderName || 'Unknown User',
                avatar: null
              };
            }
            
            const formattedMsg = {
              ...msg,
              _id: msg._id || msg.id,
              sender: sender,
              createdAt: msg.createdAt || new Date().toISOString(),
              timestamp: msg.timestamp || msg.createdAt || new Date().toISOString(),
              status: msg.status || (msg.senderId === currentUser?.id ? 'sent' : 'delivered')
            };
            
            // Track message ID
            if (formattedMsg._id) {
              processedMessageIds.current.add(formattedMsg._id);
            }
            
            return formattedMsg;
          });
          
          if (pageNum === 1) {
            setMessages(processedMessages);
          } else {
            setMessages(prev => [...processedMessages, ...prev]);
          }
          setHasMore(data.hasMore);
          setPage(pageNum);
          
          if (pageNum === 1) {
            setTimeout(scrollToBottom, 100);
          }

          // Mark messages as read after fetching
          if (convId && socketService.isConnected() && pageNum === 1) {
            setTimeout(() => {
              markMessagesAsRead();
            }, 500);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [currentUser, markMessagesAsRead]);

  // Socket event handlers
  const handleMessageReceive = useCallback((message) => {
    console.log('📨 Received message:', message);
    
    // Don't process if it's the current user's own message (echo)
    if (message.senderId === currentUser?.id || message.sender?._id === currentUser?.id) {
      console.log('⏭️ Ignoring own message echo');
      return;
    }
    
    if (message.conversationId === conversationId) {
      // Check if message already exists
      const messageId = message._id || message.id;
      if (processedMessageIds.current.has(messageId)) {
        console.log('⏭️ Message already processed:', messageId);
        return;
      }

      const processedMessage = {
        ...message,
        _id: messageId || Date.now().toString(),
        sender: message.sender ? {
          _id: message.sender._id || message.sender.id,
          name: message.sender.name || message.sender.username || 'Unknown User',
          avatar: message.sender.avatar || message.sender.avatarUrl || null,
          username: message.sender.username
        } : message.senderId ? {
          _id: typeof message.senderId === 'object' 
            ? (message.senderId._id || message.senderId.id)
            : message.senderId,
          name: message.senderName || 'Unknown User',
          avatar: null
        } : null,
        createdAt: message.createdAt || new Date().toISOString(),
        timestamp: message.timestamp || new Date().toISOString(),
        status: 'delivered'
      };
      
      // Track message ID
      if (processedMessage._id) {
        processedMessageIds.current.add(processedMessage._id);
      }
      
      setMessages(prev => [...prev, processedMessage]);
      
      // Auto-mark as read
      if (conversationId && socketService.isConnected()) {
        setTimeout(() => {
          markMessagesAsRead();
        }, 100);
      }
      
      setTimeout(scrollToBottom, 100);
    }
  }, [conversationId, markMessagesAsRead, currentUser?.id]);

  const handleMessageSent = useCallback((message) => {
    console.log('✅ Message sent confirmation:', message);
    
    if (message.conversationId === conversationId) {
      setMessages(prev => {
        // Find and update the temp message
        const updatedMessages = prev.map(m => {
          // Match by tempId
          if (m._id === message.tempId) {
            const messageId = message._id || message.id;
            
            // Track the new message ID
            if (messageId) {
              processedMessageIds.current.add(messageId);
            }
            
            return {
              ...message,
              _id: messageId || m._id,
              sender: message.sender ? {
                _id: message.sender._id || message.sender.id,
                name: message.sender.name || message.sender.username,
                avatar: formatAvatarUrl(message.sender.avatar),
                username: message.sender.username
              } : m.sender,
              status: 'sent'
            };
          }
          return m;
        });
        
        // Remove any potential duplicates
        return updatedMessages.filter((msg, index, self) => 
          index === self.findIndex(m => m._id === msg._id)
        );
      });
    }
  }, [conversationId]);

  const handleTypingStart = useCallback(({ conversationId: convId, userId, username }) => {
    if (convId === conversationId && userId === chat?.userId) {
      setIsTyping(true);
    }
  }, [conversationId, chat?.userId]);

  const handleTypingStop = useCallback(({ conversationId: convId, userId }) => {
    if (convId === conversationId && userId === chat?.userId) {
      setIsTyping(false);
    }
  }, [conversationId, chat?.userId]);

  const handleMessagesRead = useCallback(({ conversationId: convId, readerId, count }) => {
    console.log(`📖 Messages read event:`, { convId, readerId, count });
    
    if (convId === conversationId) {
      setMessages(prev => prev.map(m => {
        if (m.senderId === currentUser?.id && m.status !== 'read') {
          return { ...m, status: 'read' };
        }
        return m;
      }));
    }
  }, [conversationId, currentUser?.id]);

  const handleMessageDeleted = useCallback(({ messageId, conversationId: convId }) => {
    if (convId === conversationId) {
      setMessages(prev => prev.filter(m => m._id !== messageId));
      // Remove from processed IDs
      processedMessageIds.current.delete(messageId);
    }
  }, [conversationId]);

  const handleMessageError = useCallback(({ error, text, receiverId, tempId }) => {
    console.error('Message error:', error);
    setMessages(prev => prev.filter(m => !(m._id === tempId)));
    // Remove from processed IDs
    processedMessageIds.current.delete(tempId);
    alert('Failed to send message. Please try again.');
  }, []);

  // Setup socket listeners
  useEffect(() => {
    if (!socketService) return;

    console.log('🔌 Setting up socket listeners for conversation:', conversationId);

    socketService.on('message:receive', handleMessageReceive);
    socketService.on('message:sent', handleMessageSent);
    socketService.on('typing:start', handleTypingStart);
    socketService.on('typing:stop', handleTypingStop);
    socketService.on('messages:read', handleMessagesRead);
    socketService.on('message:deleted', handleMessageDeleted);
    socketService.on('message:error', handleMessageError);

    return () => {
      console.log('🧹 Cleaning up socket listeners');
      socketService.off('message:receive', handleMessageReceive);
      socketService.off('message:sent', handleMessageSent);
      socketService.off('typing:start', handleTypingStart);
      socketService.off('typing:stop', handleTypingStop);
      socketService.off('messages:read', handleMessagesRead);
      socketService.off('message:deleted', handleMessageDeleted);
      socketService.off('message:error', handleMessageError);
    };
  }, [conversationId, handleMessageReceive, handleMessageSent, handleTypingStart, 
      handleTypingStop, handleMessagesRead, handleMessageDeleted, handleMessageError]);

  // Initialize chat
  useEffect(() => {
    if (!chat?.userId) return;

    const initializeChat = async () => {
      try {
        setLoading(true);
        setMessages([]);
        setPage(1);
        // Clear processed IDs for new conversation
        processedMessageIds.current.clear();
        
        const response = await fetch(`http://localhost:5000/api/chat/conversation/${chat.userId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const newConversationId = data.conversation.id;
            setConversationId(newConversationId);
            
            // Leave previous conversation if exists
            if (conversationId && socketService.isConnected()) {
              socketService.leaveConversation(conversationId);
            }
            
            // Join new conversation
            if (socketService.isConnected()) {
              socketService.joinConversation(newConversationId);
            }
            
            await fetchMessages(newConversationId, 1);
          }
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeChat();

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [chat?.userId]);

  // Mark messages as read when conversation becomes active
  useEffect(() => {
    if (conversationId && chat?.userId && messages.length > 0 && !loading) {
      markMessagesAsRead();
    }
  }, [conversationId, chat?.userId, messages.length, loading, markMessagesAsRead]);

  const loadMoreMessages = () => {
    if (hasMore && !loadingMore && conversationId) {
      fetchMessages(conversationId, page + 1);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (messageText) => {
    if (!messageText.trim() || !conversationId || !chat.userId) return;

    const tempId = `temp_${Date.now()}`;
    const tempMessage = {
      _id: tempId,
      text: messageText,
      senderId: currentUser?.id || currentUser?._id,
      sender: {
        _id: currentUser?.id || currentUser?._id,
        name: currentUser?.name,
        avatar: formatAvatarUrl(currentUser?.avatar),
        username: currentUser?.username
      },
      createdAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      status: 'sending',
      type: 'text',
      conversationId: conversationId
    };

    // Track temp ID
    processedMessageIds.current.add(tempId);

    // Add message optimistically
    setMessages(prev => [...prev, tempMessage]);
    scrollToBottom();

    // Send via socket
    if (socketService.isConnected()) {
      console.log('📤 Sending message via socket:', { conversationId, receiverId: chat.userId, text: messageText, tempId });
      
      socketService.sendMessage({
        conversationId,
        receiverId: chat.userId,
        text: messageText,
        tempId
      });
    } else {
      // Fallback to REST API if socket not connected
      try {
        console.log('📤 Sending message via REST API');
        const response = await fetch(`http://localhost:5000/api/chat/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversationId,
            receiverId: chat.userId,
            text: messageText
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const newMsg = data.message || data;
          setMessages(prev => prev.map(m => {
            if (m._id === tempId) {
              const messageId = newMsg._id || newMsg.id;
              if (messageId) {
                processedMessageIds.current.add(messageId);
              }
              return {
                ...newMsg,
                sender: {
                  _id: currentUser?.id || currentUser?._id,
                  name: currentUser?.name,
                  avatar: formatAvatarUrl(currentUser?.avatar),
                  username: currentUser?.username
                },
                status: 'sent'
              };
            }
            return m;
          }));
        } else {
          throw new Error('Failed to send message');
        }
      } catch (error) {
        console.error('Error sending message:', error);
        setMessages(prev => prev.filter(m => m._id !== tempId));
        processedMessageIds.current.delete(tempId);
        alert('Failed to send message');
      }
    }

    // Stop typing
    if (socketService.isConnected()) {
      socketService.stopTyping(conversationId, chat.userId);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleTyping = (isUserTyping) => {
    if (!conversationId || !chat.userId || !socketService.isConnected()) return;

    if (isUserTyping) {
      socketService.startTyping(conversationId, chat.userId);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        if (socketService.isConnected()) {
          socketService.stopTyping(conversationId, chat.userId);
        }
      }, 2000);
    } else {
      socketService.stopTyping(conversationId, chat.userId);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleDeleteMessage = (messageId) => {
    if (window.confirm('Delete this message?')) {
      if (socketService.isConnected()) {
        socketService.deleteMessage(messageId, conversationId, chat.userId);
      } else {
        fetch(`http://localhost:5000/api/chat/messages/${messageId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }).then(response => {
          if (response.ok) {
            setMessages(prev => prev.filter(m => m._id !== messageId));
            processedMessageIds.current.delete(messageId);
          }
        }).catch(error => {
          console.error('Error deleting message:', error);
          alert('Failed to delete message');
        });
      }
    }
  };

  return (
    <div className={`${styles.chatWindow} ${darkMode ? styles.dark : styles.light}`}>
      {/* Chat Header */}
      <div className={styles.chatHeader}>
        <div className={styles.headerLeft}>
          {isMobile && (
            <button className={styles.backButton} onClick={onBack} title="Back to conversations">
              <span>←</span>
            </button>
          )}
          <button className={styles.menuButton} onClick={onToggleSidebar} title="Toggle sidebar">
            <span>☰</span>
          </button>
          <div 
            className={styles.userInfo}
            onClick={handleOpenProfile}
            style={{ cursor: 'pointer' }}
            title={`View ${formattedChat.userName}'s profile`}
          >
            <div className={styles.avatar}>
              {hasValidAvatar(formattedChat.userAvatar) ? (
                <img 
                  src={formattedChat.userAvatar} 
                  alt={formattedChat.userName}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const parent = e.target.parentNode;
                    if (parent) {
                      const initialSpan = document.createElement('span');
                      initialSpan.className = styles.avatarInitial;
                      initialSpan.textContent = getAvatarInitial({ name: formattedChat.userName });
                      parent.appendChild(initialSpan);
                    }
                  }}
                />
              ) : (
                <span className={styles.avatarInitial}>
                  {getAvatarInitial({ name: formattedChat.userName })}
                </span>
              )}
              <div className={`${styles.onlineIndicator} ${onlineStatus ? styles.online : ''}`}></div>
            </div>
            <div className={styles.userDetails}>
              <strong>{formattedChat.userName}</strong>
              <span className={styles.status}>
                {isTyping ? 'typing...' : onlineStatus ? 'online' : 'offline'}
              </span>
            </div>
          </div>
        </div>
        
        <div className={styles.headerRight}>
          <button className={styles.headerButton} title="Voice call">
            <span>📞</span>
          </button>
          <button className={styles.headerButton} title="Video call">
            <span>🎥</span>
          </button>
          <button className={styles.headerButton} title="User info" onClick={handleOpenProfile}>
            <span>ⓘ</span>
          </button>
        </div>
      </div>

      {/* AI Suggestions */}
      <AISuggestions 
        onSuggestionSelect={handleSendMessage}
        context={messages.slice(-3).map(m => m.text).join(' ')}
      />

      {/* Messages Area */}
      <div 
        className={styles.messagesArea} 
        ref={messagesContainerRef}
        onScroll={(e) => {
          if (e.target.scrollTop === 0 && hasMore && !loadingMore) {
            loadMoreMessages();
          }
        }}
      >
        {loadingMore && (
          <div className={styles.loadingMore}>
            <div className={styles.spinner}></div>
            <span>Loading older messages...</span>
          </div>
        )}
        
        <MessageList 
          messages={messages}
          currentUserId={currentUser?.id || currentUser?._id} 
          isTyping={isTyping}
          loading={loading}
          onDeleteMessage={handleDeleteMessage}
        />
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <MessageInput 
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        disabled={loading}
      />
    </div>
  );
};

export default ChatWindow;