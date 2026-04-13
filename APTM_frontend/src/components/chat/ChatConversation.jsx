// components/Chat/ChatConversation.jsx - COMPLETE FIXED VERSION
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { chatService } from '../../services/chatService';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import styles from './ChatConversation.module.css';

// Import icons
import { FaArrowLeft, FaUser, FaEllipsisV, FaPhone, FaVideo, FaInfoCircle } from 'react-icons/fa';

const ChatConversation = ({ conversation, currentUser, onBack, isMobile, online }) => {
  const { darkMode } = useTheme();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Load messages
  const loadMessages = useCallback(async (reset = false) => {
    if (!conversation?.id) return;
    
    try {
      setLoading(true);
      const currentPage = reset ? 1 : page;
      const response = await chatService.getMessages(conversation.id, currentPage, 50);
      
      if (response.success) {
        const newMessages = response.messages || [];
        
        if (reset) {
          setMessages(newMessages);
          setPage(1);
        } else {
          setMessages(prev => [...newMessages, ...prev]);
        }
        
        setHasMore(response.hasMore || false);
        if (reset) {
          setPage(2);
        } else {
          setPage(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  }, [conversation?.id, page]);

  // Initial load
  useEffect(() => {
    if (conversation?.id) {
      loadMessages(true);
      
      // Join conversation room
      chatService.joinConversation(conversation.id);
      
      // Mark messages as read
      chatService.markMessagesAsRead(conversation.id, conversation.userId);
      
      return () => {
        chatService.leaveConversation(conversation.id);
      };
    }
  }, [conversation?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle new message event
  useEffect(() => {
    const handleNewMessage = (message) => {
      console.log('📨 New message event in conversation:', message);
      
      // Only add if it's for this conversation
      if (message.conversationId === conversation?.id) {
        setMessages(prev => [...prev, message]);
        
        // Mark as read if it's from other user
        if (message.senderId !== currentUser?.id) {
          chatService.markMessagesAsRead(conversation.id, conversation.userId);
        }
      }
    };
    
    const handleMessageSent = (message) => {
      console.log('✅ Message sent event:', message);
      if (message.conversationId === conversation?.id) {
        setMessages(prev => prev.map(msg => 
          msg.tempId === message.tempId ? message : msg
        ));
      }
    };
    
    const handleMessagesRead = ({ conversationId, readerId }) => {
      if (conversationId === conversation?.id && readerId !== currentUser?.id) {
        setMessages(prev => prev.map(msg => 
          msg.senderId === currentUser?.id && msg.status !== 'read'
            ? { ...msg, status: 'read' }
            : msg
        ));
      }
    };
    
    const handleTypingStart = ({ conversationId, userId, username }) => {
      if (conversationId === conversation?.id && userId !== currentUser?.id) {
        setIsTyping(true);
        setTypingUser(username);
      }
    };
    
    const handleTypingStop = ({ conversationId, userId }) => {
      if (conversationId === conversation?.id && userId !== currentUser?.id) {
        setIsTyping(false);
        setTypingUser(null);
      }
    };
    
    chatService.onMessageReceived(handleNewMessage);
    chatService.onMessageSent(handleMessageSent);
    chatService.onMessagesRead(handleMessagesRead);
    chatService.onTypingStart(handleTypingStart);
    chatService.onTypingStop(handleTypingStop);
    
    return () => {
      chatService.offMessageReceived(handleNewMessage);
      chatService.offMessageSent(handleMessageSent);
      chatService.offMessagesRead(handleMessagesRead);
      chatService.offTypingStart(handleTypingStart);
      chatService.offTypingStop(handleTypingStop);
    };
  }, [conversation?.id, currentUser?.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = (e) => {
    const { scrollTop } = e.target;
    if (scrollTop === 0 && hasMore && !loading) {
      loadMessages();
    }
  };

  const handleSendMessage = async (text, attachments, chartData) => {
    if ((!text?.trim() && (!attachments || attachments.length === 0) && !chartData) || sending) return;
    
    setSending(true);
    
    const tempId = Date.now().toString();
    const tempMessage = {
      _id: tempId,
      tempId,
      text: text || '',
      media: attachments?.map(att => ({
        url: att.url,
        type: att.type?.startsWith('image/') ? 'image' : 
              att.type?.startsWith('video/') ? 'video' : 'document',
        name: att.name,
        size: att.size,
        mimeType: att.type,
        uploading: true
      })) || [],
      type: chartData ? 'chart' : (attachments?.length > 0 ? 'mixed' : 'text'),
      status: 'sending',
      senderId: currentUser?.id,
      sender: {
        _id: currentUser?.id,
        name: currentUser?.name,
        username: currentUser?.username,
        avatar: currentUser?.avatar
      },
      receiverId: conversation.userId,
      conversationId: conversation.id,
      replyTo: replyTo?._id,
      replyToMessage: replyTo ? {
        text: replyTo.text,
        senderId: replyTo.senderId,
        senderName: replyTo.sender?.name || 'User',
        media: replyTo.media || []
      } : null,
      createdAt: new Date().toISOString(),
      reactions: []
    };
    
    // Add temp message to UI
    setMessages(prev => [...prev, tempMessage]);
    
    try {
      // Prepare actual files for upload
      const filesToUpload = attachments?.filter(att => att.file).map(att => att.file) || [];
      
      // Send via REST API with file upload
      const response = await chatService.sendMessageWithMedia(
        conversation.userId,
        text,
        filesToUpload,
        chartData
      );
      
      if (response.success) {
        // Replace temp message with real one
        setMessages(prev => prev.map(msg => 
          msg._id === tempId ? response.message : msg
        ));
        
        // Clear reply
        setReplyTo(null);
      } else {
        // Mark as failed
        setMessages(prev => prev.map(msg => 
          msg._id === tempId ? { ...msg, status: 'failed' } : msg
        ));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.map(msg => 
        msg._id === tempId ? { ...msg, status: 'failed' } : msg
      ));
    } finally {
      setSending(false);
    }
  };

  const handleEditMessage = async (message, newText) => {
    // Implement edit API call
    console.log('Edit message:', message._id, newText);
  };

  const handleDeleteMessage = async (messageId) => {
    // Implement delete API call
    console.log('Delete message:', messageId);
  };

  const handleReactToMessage = async (messageId, emoji) => {
    // Implement react API call
    console.log('React to message:', messageId, emoji);
  };

  const handleReplyToMessage = (message) => {
    setReplyTo(message);
  };

  const handleTyping = (isTyping) => {
    if (isTyping) {
      chatService.sendTypingStart(conversation.id, conversation.userId);
    } else {
      chatService.sendTypingStop(conversation.id, conversation.userId);
    }
  };

  const handleAttachmentClick = (media) => {
    if (media.url && media.url.startsWith('http')) {
      window.open(media.url, '_blank');
    }
  };

  // Group messages by date
  const groupMessagesByDate = () => {
    const groups = [];
    let currentDate = null;
    
    messages.forEach((message, index) => {
      const messageDate = new Date(message.createdAt).toDateString();
      const previousMessage = messages[index - 1];
      const nextMessage = messages[index + 1];
      
      if (messageDate !== currentDate) {
        currentDate = messageDate;
        groups.push({
          type: 'date',
          date: messageDate,
          timestamp: message.createdAt
        });
      }
      
      groups.push({
        type: 'message',
        message,
        isOwn: message.senderId === currentUser?.id,
        previousMessage,
        nextMessage
      });
    });
    
    return groups;
  };

  if (!conversation) {
    return (
      <div className={`${styles.emptyState} ${darkMode ? styles.dark : styles.light}`}>
        <p>Select a conversation to start chatting</p>
      </div>
    );
  }

  const groupedMessages = groupMessagesByDate();

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
          <div className={styles.userAvatar}>
            {conversation.userAvatar ? (
              <img src={conversation.userAvatar} alt={conversation.userName} />
            ) : (
              <div className={styles.avatarPlaceholder}>
                <FaUser />
              </div>
            )}
            {online && <span className={styles.onlineDot}></span>}
          </div>
          <div className={styles.userInfo}>
            <h3>{conversation.userName}</h3>
            <span className={styles.userStatus}>
              {online ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.iconButton} title="Voice call">
            <FaPhone />
          </button>
          <button className={styles.iconButton} title="Video call">
            <FaVideo />
          </button>
          <button className={styles.iconButton} title="Info">
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
        {loading && page === 1 && (
          <div className={styles.loadingMessages}>
            <div className={styles.spinner}></div>
            <p>Loading messages...</p>
          </div>
        )}
        
        {groupedMessages.map((item, index) => {
          if (item.type === 'date') {
            return (
              <div key={`date-${index}`} className={styles.dateDivider}>
                <span>{new Date(item.timestamp).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
            );
          }
          
          return (
            <MessageBubble
              key={item.message._id || index}
              message={item.message}
              isOwn={item.isOwn}
              onEdit={handleEditMessage}
              onDelete={handleDeleteMessage}
              onReact={handleReactToMessage}
              onReply={handleReplyToMessage}
              onForward={() => {}}
              onAttachmentClick={handleAttachmentClick}
              previousMessage={item.previousMessage}
              nextMessage={item.nextMessage}
              currentUserId={currentUser?.id}
            />
          );
        })}
        
        {isTyping && (
          <div className={styles.typingIndicator}>
            <div className={styles.typingBubble}>
              <span className={styles.typingText}>{typingUser || 'Someone'} is typing</span>
              <span className={styles.typingDots}>
                <span>.</span><span>.</span><span>.</span>
              </span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview */}
      {replyTo && (
        <div className={styles.replyPreview}>
          <div className={styles.replyContent}>
            <span className={styles.replyLabel}>Replying to {replyTo.sender?.name || 'User'}</span>
            <p className={styles.replyText}>
              {replyTo.text || (replyTo.media?.length > 0 ? '📎 Media' : '')}
            </p>
          </div>
          <button className={styles.cancelReply} onClick={() => setReplyTo(null)}>
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