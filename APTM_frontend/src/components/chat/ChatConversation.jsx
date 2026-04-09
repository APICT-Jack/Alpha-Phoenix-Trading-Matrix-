// components/Chat/ChatConversation.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { chatService } from '../../services/chatService';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import { getAvatarColor, getAvatarInitial } from '../../utils/avatarUtils';
import styles from './ChatConversation.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BASE_URL = API_URL.replace('/api', '');

const formatAvatarUrl = (avatar) => {
  if (!avatar) return null;
  if (avatar.startsWith('http')) return avatar;
  if (avatar.startsWith('data:')) return avatar;
  return `${BASE_URL}${avatar.startsWith('/') ? avatar : `/${avatar}`}`;
};

import { FaArrowLeft, FaPhone, FaVideo, FaInfoCircle } from 'react-icons/fa';

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
  const [avatarError, setAvatarError] = useState(false);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
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
      
      if (message.conversationId !== conversation.id) return;
      if (processedMessageIds.current.has(message._id)) {
        console.log('⏭️ Duplicate message ignored:', message._id);
        return;
      }
      
      processedMessageIds.current.add(message._id);
      
      const senderAvatar = formatAvatarUrl(message.sender?.avatar);
      
      const formattedMessage = {
        ...message,
        _id: message._id,
        senderId: message.senderId?._id || message.senderId,
        sender: message.sender || {
          _id: message.senderId?._id || message.senderId,
          name: message.senderName || 'User',
          avatar: senderAvatar
        },
        createdAt: message.createdAt || new Date().toISOString(),
        status: message.status || 'delivered',
        media: message.media || [],
        reactions: message.reactions || [],
        replyToMessage: message.replyToMessage
      };
      
      setMessages(prev => [...prev, formattedMessage]);
      
      // Mark as read if from other user
      if (formattedMessage.senderId !== currentUser?.id) {
        chatService.markMessagesAsRead(conversation.id, conversation.userId);
      }
      
      setTimeout(scrollToBottom, 100);
    };

    const handleMessageSent = (message) => {
      console.log('✅ Message sent confirmation:', message);
      
      if (message.conversationId !== conversation.id) return;
      
      const senderAvatar = formatAvatarUrl(currentUser?.avatar);
      
      setMessages(prev => {
        const updatedMessages = prev.map(m => {
          if (m._id === message.tempId) {
            if (message._id) processedMessageIds.current.add(message._id);
            return {
              ...message,
              _id: message._id,
              senderId: currentUser?.id,
              sender: {
                _id: currentUser?.id,
                name: currentUser?.name,
                avatar: senderAvatar
              },
              status: 'sent',
              media: message.media || [],
              reactions: []
            };
          }
          return m;
        });
        
        return updatedMessages;
      });
      
      setTimeout(scrollToBottom, 100);
    };

    const handleMessageUpdated = (data) => {
      setMessages(prev => 
        prev.map(m => m._id === data.messageId ? { ...m, text: data.text, isEdited: true } : m)
      );
    };

    const handleMessageDeleted = (data) => {
      setMessages(prev => prev.filter(m => m._id !== data.messageId));
      processedMessageIds.current.delete(data.messageId);
    };

    const handleMessagesRead = (data) => {
      if (data.conversationId !== conversation.id) return;
      
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

    // Register listeners
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
      
      setMessages(prev => [...messagesList.reverse(), ...prev]);
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
    if ((!text?.trim() && attachments.length === 0 && !chart) || loading) return;

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create media array
    const media = [];
    
    // Add chart if present
    if (chart) {
      media.push({
        type: 'chart',
        chartData: chart,
        url: '/api/charts/widget'
      });
    }
    
    // Add attachments
    attachments.forEach(att => {
      media.push({
        type: att.type?.startsWith('image/') ? 'image' : 'file',
        url: att.url,
        name: att.name,
        size: att.size,
        mimeType: att.type
      });
    });
    
    const tempMessage = {
      _id: tempId,
      text: text?.trim() || '',
      media: media,
      senderId: currentUser?.id,
      sender: {
        _id: currentUser?.id,
        name: currentUser?.name,
        avatar: formattedCurrentUserAvatar
      },
      createdAt: new Date().toISOString(),
      status: 'sending',
      replyTo: replyTo?._id,
      replyToMessage: replyTo ? {
        text: replyTo.text,
        senderName: replyTo.sender?.name
      } : null,
      conversationId: conversation.id,
      reactions: []
    };

    setMessages(prev => [...prev, tempMessage]);
    processedMessageIds.current.add(tempId);
    scrollToBottom();
    
    const replyToId = replyTo?._id;
    setReplyTo(null);

    // Send via socket
    const messageData = {
      conversationId: conversation.id,
      receiverId: conversation.userId,
      text: text?.trim() || '',
      media: media,
      chart: chart,
      replyTo: replyToId,
      tempId
    };
    
    const sent = chatService.sendMessage(messageData);
    
    if (!sent) {
      // Fallback to REST API
      try {
        const formData = new FormData();
        formData.append('receiverId', conversation.userId);
        formData.append('text', text?.trim() || '');
        
        attachments.forEach(file => {
          if (file.file) {
            formData.append('media', file.file);
          }
        });
        
        if (chart) {
          formData.append('chart', JSON.stringify(chart));
        }
        if (replyToId) {
          formData.append('replyToId', replyToId);
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
          
          setMessages(prev => prev.map(m => {
            if (m._id === tempId) {
              processedMessageIds.current.add(newMsg._id);
              return {
                ...newMsg,
                _id: newMsg._id,
                sender: {
                  _id: currentUser?.id,
                  name: currentUser?.name,
                  avatar: formattedCurrentUserAvatar
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

  const handleEditMessage = async (message) => {
    const newText = prompt('Edit message:', message.text);
    if (newText && newText !== message.text) {
      chatService.editMessage(message._id, newText);
      // Optimistically update
      setMessages(prev => 
        prev.map(m => m._id === message._id ? { ...m, text: newText, isEdited: true } : m)
      );
    }
    setEditingMessage(null);
  };

  const handleDeleteMessage = async (messageId) => {
    chatService.deleteMessage(messageId, conversation.id, conversation.userId);
  };

  const handleReactToMessage = async (messageId, emoji) => {
    chatService.reactToMessage(messageId, emoji);
  };

  const handleForwardMessage = (message) => {
    // Implement forward functionality
    const targetUserId = prompt('Enter user ID to forward to:');
    if (targetUserId) {
      // You'll need to implement forward in chatService
      console.log('Forward message to:', targetUserId, message);
    }
  };

  const handleAttachmentClick = (attachment) => {
    window.open(attachment.url, '_blank');
  };

  const handleTyping = (isTypingNow) => {
    if (isTypingNow) {
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
          <button className={styles.headerButton} title="Info">
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
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        editingMessage={editingMessage}
        onCancelEdit={() => setEditingMessage(null)}
      />
    </div>
  );
};

export default ChatConversation;