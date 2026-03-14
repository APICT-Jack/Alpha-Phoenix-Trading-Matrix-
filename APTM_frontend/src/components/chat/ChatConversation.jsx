import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { chatService } from '../../services/chatService';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import { getAvatarColor, getAvatarInitial } from '../../utils/avatarUtils';
import styles from './ChatConversation.module.css';

// Constants for API URLs
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

// Helper function to format avatar URLs
const formatAvatarUrl = (avatar) => {
  if (!avatar) return null;
  
  // If it's already a full URL, return as is
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar;
  }
  
  // If it's a data URL, return as is
  if (avatar.startsWith('data:')) {
    return avatar;
  }
  
  // Handle object type avatar
  if (typeof avatar === 'object') {
    avatar = avatar.url || avatar.avatarUrl || null;
    if (!avatar) return null;
  }
  
  // Extract just the filename if it contains path
  let cleanPath = avatar;
  if (avatar.includes('/')) {
    cleanPath = avatar.split('/').pop();
  }
  
  return `${BASE_URL}/uploads/avatars/${cleanPath}`;
};

// Import icons
import {
  FaArrowLeft,
  FaPhone,
  FaVideo,
  FaInfoCircle,
  FaCheckDouble,
  FaCheck,
  FaClock
} from 'react-icons/fa';

const ChatConversation = ({ conversation, currentUser, onBack, isMobile, online }) => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const processedMessageIds = useRef(new Set());

  // Format conversation user avatar
  const formattedUserAvatar = formatAvatarUrl(conversation.userAvatar);
  
  // Format current user avatar
  const formattedCurrentUserAvatar = formatAvatarUrl(currentUser?.avatar);

  // Load messages
  useEffect(() => {
    if (!conversation?.id) return;

    const loadMessages = async () => {
      try {
        setLoading(true);
        processedMessageIds.current.clear();
        
        const data = await chatService.getMessages(conversation.id, 1);
        console.log('📥 Loaded messages:', data);
        
        // Track message IDs
        const messagesList = data.messages || [];
        messagesList.forEach(msg => {
          if (msg._id) processedMessageIds.current.add(msg._id);
        });
        
        setMessages(messagesList);
        setHasMore(data.hasMore || false);
        setPage(1);
        
        // Mark as read
        chatService.markMessagesAsRead(conversation.id, conversation.userId);
        
        scrollToBottom();
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();

    // Join conversation room
    chatService.joinConversation(conversation.id);

    return () => {
      chatService.leaveConversation(conversation.id);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [conversation?.id]);

  // Handle real-time messages
  useEffect(() => {
    if (!conversation?.id) return;

    const handleNewMessage = (message) => {
      console.log('📨 New message received:', message);
      
      // Check if message belongs to this conversation
      if (message.conversationId !== conversation.id) return;
      
      // Check for duplicates
      if (processedMessageIds.current.has(message._id)) {
        console.log('⏭️ Duplicate message ignored:', message._id);
        return;
      }
      
      // Add to processed IDs
      processedMessageIds.current.add(message._id);
      
      // Format sender avatar
      const senderAvatar = formatAvatarUrl(message.sender?.avatar || message.senderAvatar);
      
      // Format the message
      const formattedMessage = {
        ...message,
        _id: message._id || message.id,
        senderId: message.senderId?._id || message.senderId,
        sender: message.sender || {
          _id: message.senderId?._id || message.senderId,
          name: message.senderName || 'User',
          avatar: senderAvatar
        },
        createdAt: message.createdAt || new Date().toISOString(),
        status: message.status || 'delivered'
      };
      
      // Add to messages
      setMessages(prev => [...prev, formattedMessage]);
      
      // Mark as read if it's from other user
      if (formattedMessage.senderId !== currentUser?.id) {
        chatService.markMessagesAsRead(conversation.id, conversation.userId);
      }
      
      // Scroll to bottom
      setTimeout(scrollToBottom, 100);
    };

    const handleMessageSent = (message) => {
      console.log('✅ Message sent confirmation:', message);
      
      if (message.conversationId !== conversation.id) return;
      
      // Format sender avatar
      const senderAvatar = formatAvatarUrl(message.sender?.avatar || currentUser?.avatar);
      
      setMessages(prev => {
        // Find and update the temp message
        const updatedMessages = prev.map(m => {
          if (m._id === message.tempId) {
            // Add to processed IDs
            if (message._id) {
              processedMessageIds.current.add(message._id);
            }
            
            return {
              ...message,
              _id: message._id || message.id,
              senderId: message.senderId?._id || message.senderId || currentUser?.id,
              sender: message.sender || {
                _id: currentUser?.id,
                name: currentUser?.name,
                avatar: senderAvatar
              },
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
      
      // Scroll to bottom
      setTimeout(scrollToBottom, 100);
    };

    const handleMessageUpdated = ({ messageId, text }) => {
      setMessages(prev => 
        prev.map(m => m._id === messageId ? { ...m, text, edited: true } : m)
      );
    };

    const handleMessageDeleted = ({ messageId }) => {
      setMessages(prev => prev.filter(m => m._id !== messageId));
      processedMessageIds.current.delete(messageId);
    };

    const handleMessagesRead = ({ conversationId, readerId }) => {
      if (conversationId !== conversation.id) return;
      
      setMessages(prev => 
        prev.map(m => {
          if (m.senderId === currentUser?.id && m.status !== 'read') {
            return { ...m, status: 'read' };
          }
          return m;
        })
      );
    };

    const handleTypingStart = ({ userId, username }) => {
      if (userId === conversation.userId) {
        setIsTyping(true);
      }
    };

    const handleTypingStop = ({ userId }) => {
      if (userId === conversation.userId) {
        setIsTyping(false);
      }
    };

    // Subscribe to events
    chatService.onMessageReceived(handleNewMessage);
    chatService.onMessageSent(handleMessageSent);
    chatService.onMessageUpdated(handleMessageUpdated);
    chatService.onMessageDeleted(handleMessageDeleted);
    chatService.onMessagesRead(handleMessagesRead);
    chatService.onTypingStart(handleTypingStart);
    chatService.onTypingStop(handleTypingStop);

    return () => {
      chatService.offMessageReceived(handleNewMessage);
      chatService.offMessageSent(handleMessageSent);
      chatService.offMessageUpdated(handleMessageUpdated);
      chatService.offMessageDeleted(handleMessageDeleted);
      chatService.offMessagesRead(handleMessagesRead);
      chatService.offTypingStart(handleTypingStart);
      chatService.offTypingStop(handleTypingStop);
    };
  }, [conversation.id, currentUser?.id]);

  // Load more messages on scroll
  const loadMoreMessages = async () => {
    if (!hasMore || loadingMore) return;
    
    try {
      setLoadingMore(true);
      const data = await chatService.getMessages(conversation.id, page + 1);
      
      // Track new message IDs
      const messagesList = data.messages || [];
      messagesList.forEach(msg => {
        if (msg._id) processedMessageIds.current.add(msg._id);
      });
      
      setMessages(prev => [...messagesList, ...prev]);
      setHasMore(data.hasMore || false);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Handle scroll
  const handleScroll = useCallback((e) => {
    if (e.target.scrollTop === 0 && hasMore && !loadingMore) {
      loadMoreMessages();
    }
  }, [hasMore, loadingMore]);

  // Scroll to bottom
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Send message
  const handleSendMessage = async (text, attachments = []) => {
    if (!text.trim() && attachments.length === 0) return;

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const tempMessage = {
      _id: tempId,
      text: text.trim(),
      senderId: currentUser?.id,
      sender: {
        _id: currentUser?.id,
        name: currentUser?.name,
        avatar: formattedCurrentUserAvatar
      },
      createdAt: new Date().toISOString(),
      status: 'sending',
      attachments,
      replyTo: replyTo ? {
        id: replyTo._id,
        text: replyTo.text,
        senderName: replyTo.sender?.name
      } : null,
      conversationId: conversation.id
    };

    // Add optimistically
    setMessages(prev => [...prev, tempMessage]);
    processedMessageIds.current.add(tempId);
    scrollToBottom();

    // Clear reply
    setReplyTo(null);

    // Send via service
    const sent = chatService.sendMessage({
      conversationId: conversation.id,
      receiverId: conversation.userId,
      text: text.trim(),
      attachments,
      replyTo: replyTo?._id,
      tempId
    });

    // If sending failed (socket disconnected), try REST API fallback
    if (!sent) {
      try {
        console.log('📤 Sending message via REST API fallback');
        const response = await fetch(`${API_URL}/chat/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            receiverId: conversation.userId,
            text: text.trim(),
            type: 'text'
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const newMsg = data.message || data;
          
          // Format avatar URL
          const newMsgAvatar = formatAvatarUrl(newMsg.sender?.avatar);
          
          setMessages(prev => prev.map(m => {
            if (m._id === tempId) {
              processedMessageIds.current.add(newMsg._id);
              return {
                ...newMsg,
                _id: newMsg._id,
                sender: {
                  _id: currentUser?.id,
                  name: currentUser?.name,
                  avatar: newMsgAvatar
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
        console.error('Error sending message via REST:', error);
        // Remove failed message
        setMessages(prev => prev.filter(m => m._id !== tempId));
        processedMessageIds.current.delete(tempId);
        alert('Failed to send message. Please try again.');
      }
    }
  };

  // Handle typing
  const handleTyping = (isTyping) => {
    if (isTyping) {
      chatService.sendTypingStart(conversation.id, conversation.userId);
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        chatService.sendTypingStop(conversation.id, conversation.userId);
      }, 2000);
    } else {
      chatService.sendTypingStop(conversation.id, conversation.userId);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  // Edit message
  const handleEditMessage = (messageId, newText) => {
    chatService.editMessage(messageId, newText);
    setEditingMessage(null);
  };

  // Delete message
  const handleDeleteMessage = (messageId) => {
    if (window.confirm('Delete this message?')) {
      chatService.deleteMessage(messageId, conversation.id, conversation.userId);
    }
  };

  // React to message
  const handleReactToMessage = (messageId, reaction) => {
    chatService.reactToMessage(messageId, reaction);
  };

  // Handle attachment click
  const handleAttachmentClick = (attachment) => {
    let url = attachment.url;
    
    // Format attachment URL if needed
    if (url && !url.startsWith('http') && !url.startsWith('data:')) {
      const folder = attachment.type?.startsWith('image/') ? 'gallery' : 'documents';
      let cleanPath = url;
      if (url.includes('/')) {
        cleanPath = url.split('/').pop();
      }
      url = `${BASE_URL}/uploads/${folder}/${cleanPath}`;
    }
    
    window.open(url, '_blank');
  };

  // Group messages by date
  const groupMessagesByDate = () => {
    const groups = {};
    messages.forEach(message => {
      const date = new Date(message.createdAt).toLocaleDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(message);
    });
    return groups;
  };

  const messageGroups = groupMessagesByDate();

  // Format date header
  const formatDateHeader = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className={`${styles.conversation} ${darkMode ? styles.dark : styles.light}`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          {isMobile && (
            <button className={styles.backButton} onClick={onBack}>
              <FaArrowLeft />
            </button>
          )}
          <div 
            className={styles.userInfo}
            onClick={() => navigate(`/profile/${conversation.userId}`)}
          >
            <div className={styles.avatar}>
              {formattedUserAvatar && !avatarError ? (
                <img 
                  src={formattedUserAvatar} 
                  alt={conversation.userName}
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div 
                  className={styles.avatarPlaceholder}
                  style={{ backgroundColor: getAvatarColor(conversation.userId) }}
                >
                  {getAvatarInitial({ name: conversation.userName })}
                </div>
              )}
              {online && <span className={styles.onlineBadge}></span>}
            </div>
            <div className={styles.userDetails}>
              <h3>{conversation.userName}</h3>
              <span className={styles.userStatus}>
                {isTyping ? 'typing...' : online ? 'online' : 'offline'}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.headerRight}>
          <button className={styles.headerButton} title="Voice call">
            <FaPhone />
          </button>
          <button className={styles.headerButton} title="Video call">
            <FaVideo />
          </button>
          <button 
            className={styles.headerButton} 
            title="Info"
            onClick={() => setShowUserInfo(!showUserInfo)}
          >
            <FaInfoCircle />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        className={styles.messagesArea}
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {loadingMore && (
          <div className={styles.loadingMore}>
            <div className={styles.spinner}></div>
          </div>
        )}

        {loading ? (
          <div className={styles.loadingMessages}>
            <div className={styles.spinner}></div>
            <p>Loading messages...</p>
          </div>
        ) : (
          <>
            {Object.entries(messageGroups).map(([date, groupMessages]) => (
              <div key={date} className={styles.dateGroup}>
                <div className={styles.dateHeader}>
                  <span>{formatDateHeader(date)}</span>
                </div>
                
                {groupMessages.map((message, index) => (
                  <MessageBubble
                    key={message._id}
                    message={message}
                    isOwn={message.senderId === currentUser?.id}
                    onEdit={handleEditMessage}
                    onDelete={handleDeleteMessage}
                    onReact={handleReactToMessage}
                    onReply={setReplyTo}
                    onAttachmentClick={handleAttachmentClick}
                    previousMessage={index > 0 ? groupMessages[index - 1] : null}
                    nextMessage={index < groupMessages.length - 1 ? groupMessages[index + 1] : null}
                    currentUserId={currentUser?.id}
                  />
                ))}
              </div>
            ))}

            {isTyping && (
              <div className={styles.typingIndicator}>
                <div className={styles.typingBubble}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Reply Preview */}
      {replyTo && (
        <div className={styles.replyPreview}>
          <div className={styles.replyContent}>
            <span className={styles.replyLabel}>
              Replying to {replyTo.sender?.name || 'user'}
            </span>
            <p className={styles.replyText}>{replyTo.text}</p>
          </div>
          <button 
            className={styles.closeReply}
            onClick={() => setReplyTo(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Message Input */}
      <MessageInput
        ref={inputRef}
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        editingMessage={editingMessage}
        onCancelEdit={() => setEditingMessage(null)}
      />
    </div>
  );
};

export default ChatConversation;