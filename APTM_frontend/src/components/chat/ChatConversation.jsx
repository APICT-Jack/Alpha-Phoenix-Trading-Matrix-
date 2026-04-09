// components/Chat/ChatConversation.jsx - UPDATED with media and reply support
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { chatService } from '../../services/chatService';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import { getAvatarColor, getAvatarInitial } from '../../utils/avatarUtils';
import styles from './ChatConversation.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const formatAvatarUrl = (avatar) => {
  if (!avatar) return null;
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) return avatar;
  if (avatar.startsWith('data:')) return avatar;
  if (typeof avatar === 'object') {
    avatar = avatar.url || avatar.avatarUrl || null;
    if (!avatar) return null;
  }
  let cleanPath = avatar;
  if (avatar.includes('/')) {
    cleanPath = avatar.split('/').pop();
  }
  return `${BASE_URL}/uploads/avatars/${cleanPath}`;
};

import {
  FaArrowLeft,
  FaPhone,
  FaVideo,
  FaInfoCircle,
  FaImage,
  FaFile,
  FaChartLine
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
  const [forwardMessage, setForwardMessage] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const processedMessageIds = useRef(new Set());

  const formattedUserAvatar = formatAvatarUrl(conversation.userAvatar);
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
        
        const messagesList = data.messages || [];
        messagesList.forEach(msg => {
          if (msg._id) processedMessageIds.current.add(msg._id);
        });
        
        setMessages(messagesList);
        setHasMore(data.hasMore || false);
        setPage(1);
        
        chatService.markMessagesAsRead(conversation.id, conversation.userId);
        
        scrollToBottom();
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
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
      if (message.conversationId !== conversation.id) return;
      if (processedMessageIds.current.has(message._id)) return;
      
      processedMessageIds.current.add(message._id);
      
      const senderAvatar = formatAvatarUrl(message.sender?.avatar || message.senderAvatar);
      
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
      
      setMessages(prev => [...prev, formattedMessage]);
      
      if (formattedMessage.senderId !== currentUser?.id) {
        chatService.markMessagesAsRead(conversation.id, conversation.userId);
      }
      
      setTimeout(scrollToBottom, 100);
    };

    const handleMessageSent = (message) => {
      if (message.conversationId !== conversation.id) return;
      
      const senderAvatar = formatAvatarUrl(message.sender?.avatar || currentUser?.avatar);
      
      setMessages(prev => {
        const updatedMessages = prev.map(m => {
          if (m._id === message.tempId) {
            if (message._id) processedMessageIds.current.add(message._id);
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
        
        return updatedMessages.filter((msg, index, self) => 
          index === self.findIndex(m => m._id === msg._id)
        );
      });
      
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
      if (userId === conversation.userId) setIsTyping(true);
    };

    const handleTypingStop = ({ userId }) => {
      if (userId === conversation.userId) setIsTyping(false);
    };

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

  const loadMoreMessages = async () => {
    if (!hasMore || loadingMore) return;
    
    try {
      setLoadingMore(true);
      const data = await chatService.getMessages(conversation.id, page + 1);
      
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

  const handleScroll = useCallback((e) => {
    if (e.target.scrollTop === 0 && hasMore && !loadingMore) {
      loadMoreMessages();
    }
  }, [hasMore, loadingMore]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (text, attachments = [], chart = null) => {
    if ((!text.trim() && attachments.length === 0 && !chart) || loading) return;

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
      media: chart ? [{
        type: 'chart',
        chartData: chart,
        url: '/api/charts/widget'
      }] : attachments.map(a => ({ type: a.type, url: a.url })),
      replyTo: replyTo ? replyTo._id : null,
      replyToMessage: replyTo ? {
        text: replyTo.text,
        senderName: replyTo.sender?.name
      } : null,
      conversationId: conversation.id
    };

    setMessages(prev => [...prev, tempMessage]);
    processedMessageIds.current.add(tempId);
    scrollToBottom();
    setReplyTo(null);

    // Send via service with chart support
    const sent = await chatService.sendMessage({
      conversationId: conversation.id,
      receiverId: conversation.userId,
      text: text.trim(),
      attachments,
      chart,
      replyTo: replyTo?._id,
      tempId
    });

    if (!sent) {
      // Fallback to REST API
      try {
        const formData = new FormData();
        formData.append('receiverId', conversation.userId);
        formData.append('text', text.trim());
        
        attachments.forEach(file => {
          formData.append('media', file.file);
        });
        
        if (chart) {
          formData.append('chart', JSON.stringify(chart));
        }
        if (replyTo?._id) {
          formData.append('replyToId', replyTo._id);
        }
        
        const response = await fetch(`${API_URL}/chat/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });

        if (response.ok) {
          const data = await response.json();
          const newMsg = data.message;
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
        setMessages(prev => prev.filter(m => m._id !== tempId));
        processedMessageIds.current.delete(tempId);
        alert('Failed to send message. Please try again.');
      }
    }
  };

  const handleEditMessage = (message) => {
    setEditingMessage(message);
    inputRef.current?.focus();
  };

  const handleEditSubmit = async (messageId, newText) => {
    await chatService.editMessage(messageId, newText);
    setEditingMessage(null);
  };

  const handleDeleteMessage = async (messageId) => {
    await chatService.deleteMessage(messageId);
  };

  const handleReactToMessage = async (messageId, emoji) => {
    await chatService.reactToMessage(messageId, emoji);
  };

  const handleForwardMessage = (message) => {
    setForwardMessage(message);
    setShowForwardModal(true);
  };

  const handleForwardSubmit = async (targetUserId) => {
    if (forwardMessage) {
      await chatService.forwardMessage(forwardMessage._id, targetUserId);
      setShowForwardModal(false);
      setForwardMessage(null);
    }
  };

  const handleAttachmentClick = (attachment) => {
    let url = attachment.url;
    if (url && !url.startsWith('http') && !url.startsWith('data:')) {
      url = `${BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
    }
    window.open(url, '_blank');
  };

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

  const groupMessagesByDate = () => {
    const groups = {};
    messages.forEach(message => {
      const date = new Date(message.createdAt).toLocaleDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(message);
    });
    return groups;
  };

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

  const messageGroups = groupMessagesByDate();

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
                    onEdit={handleEditSubmit}
                    onDelete={handleDeleteMessage}
                    onReact={handleReactToMessage}
                    onReply={setReplyTo}
                    onForward={handleForwardMessage}
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

      {/* Forward Modal (simplified) */}
      {showForwardModal && (
        <div className={styles.forwardModal}>
          <div className={styles.forwardModalContent}>
            <h3>Forward to...</h3>
            <div className={styles.forwardUserList}>
              {/* Add user search and selection here */}
              <button onClick={() => handleForwardSubmit('user-id')}>
                Select User
              </button>
            </div>
            <button onClick={() => setShowForwardModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatConversation;