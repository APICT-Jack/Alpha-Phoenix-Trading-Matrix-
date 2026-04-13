// components/Chat/ChatConversation.jsx - COMPLETE FIXED VERSION
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { chatService } from '../../services/chatService';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import styles from './ChatConversation.module.css';

// Import icons
import { FaArrowLeft, FaUser, FaEllipsisV, FaPhone, FaVideo, FaInfoCircle, FaSpinner } from 'react-icons/fa';

const ChatConversation = ({ conversation, currentUser, onBack, isMobile, online }) => {
  const { darkMode } = useTheme();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [error, setError] = useState(null);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isFirstLoadRef = useRef(true);

  // Load messages
  const loadMessages = useCallback(async (reset = false) => {
    if (!conversation?.id) return;
    
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      const currentPage = reset ? 1 : page;
      console.log(`📋 Loading messages for conversation ${conversation.id}, page ${currentPage}`);
      
      const response = await chatService.getMessages(conversation.id, currentPage, 50);
      
      console.log('📋 Load messages response:', response);
      
      if (response.success) {
        const newMessages = response.messages || [];
        
        if (reset) {
          setMessages(newMessages);
          setPage(1);
        } else {
          // Prepend older messages (keeping order)
          setMessages(prev => [...newMessages, ...prev]);
        }
        
        setHasMore(response.hasMore || false);
        if (reset) {
          setPage(2);
        } else {
          setPage(prev => prev + 1);
        }
        
        setError(null);
      } else {
        console.error('Failed to load messages:', response.message);
        setError(response.message || 'Failed to load messages');
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setError(error.message || 'Error loading messages');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [conversation?.id, page]);

  // Initial load
  useEffect(() => {
    if (conversation?.id) {
      console.log('🔄 Loading messages for conversation:', conversation.id);
      loadMessages(true);
      
      // Join conversation room for real-time updates
      chatService.joinConversation(conversation.id);
      
      // Mark messages as read
      chatService.markMessagesAsRead(conversation.id, conversation.userId);
      
      return () => {
        chatService.leaveConversation(conversation.id);
      };
    }
  }, [conversation?.id]);

  // Scroll to bottom on new messages (only for new messages, not when loading history)
  useEffect(() => {
    if (!loading && !loadingMore) {
      scrollToBottom();
    }
  }, [messages.length]);

  // Handle new message event
  useEffect(() => {
    const handleNewMessage = (message) => {
      console.log('📨 New message event in conversation:', message);
      
      // Only add if it's for this conversation
      if (message.conversationId === conversation?.id) {
        // Check if message already exists (prevent duplicates)
        setMessages(prev => {
          const exists = prev.some(msg => msg._id === message._id);
          if (exists) return prev;
          return [...prev, message];
        });
        
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
    
    const handleMessageUpdated = (data) => {
      if (data.conversationId === conversation?.id) {
        setMessages(prev => prev.map(msg => 
          msg._id === data.messageId 
            ? { ...msg, text: data.text, media: data.media, isEdited: true, updatedAt: data.updatedAt }
            : msg
        ));
      }
    };
    
    const handleMessageDeleted = (data) => {
      if (data.conversationId === conversation?.id) {
        if (data.deletedForEveryone) {
          setMessages(prev => prev.map(msg => 
            msg._id === data.messageId 
              ? { ...msg, isDeleted: true, text: 'This message was deleted', media: [] }
              : msg
          ));
        } else if (data.deletedForMe) {
          setMessages(prev => prev.filter(msg => msg._id !== data.messageId));
        }
      }
    };
    
    const handleMessageReaction = (data) => {
      if (data.messageId) {
        setMessages(prev => prev.map(msg => 
          msg._id === data.messageId 
            ? { ...msg, reactions: data.reactions }
            : msg
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
        
        // Auto-hide typing indicator after 3 seconds of no activity
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
          setTypingUser(null);
        }, 3000);
      }
    };
    
    const handleTypingStop = ({ conversationId, userId }) => {
      if (conversationId === conversation?.id && userId !== currentUser?.id) {
        setIsTyping(false);
        setTypingUser(null);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      }
    };
    
    // Register event listeners
    chatService.onMessageReceived(handleNewMessage);
    chatService.onMessageSent(handleMessageSent);
    chatService.onMessageUpdated(handleMessageUpdated);
    chatService.onMessageDeleted(handleMessageDeleted);
    chatService.onMessageReaction?.(handleMessageReaction);
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
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [conversation?.id, currentUser?.id]);

  const scrollToBottom = () => {
    // Small delay to ensure DOM is updated
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleScroll = (e) => {
    const { scrollTop } = e.target;
    // Load more messages when scrolling to top (with 100px threshold)
    if (scrollTop === 0 && hasMore && !loading && !loadingMore) {
      console.log('📜 Loading more messages...');
      loadMessages(false);
    }
  };

  const handleSendMessage = async (text, attachments, chartData) => {
    if ((!text?.trim() && (!attachments || attachments.length === 0) && !chartData) || sending) return;
    
    setSending(true);
    
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
    scrollToBottom();
    
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
        msg._id === tempId ? { ...msg, status: 'failed', error: error.message } : msg
      ));
    } finally {
      setSending(false);
    }
  };

  const handleEditMessage = async (message, newText) => {
    if (!newText?.trim()) return;
    
    try {
      // Update via REST API
      const response = await fetch(`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}/api/chat/messages/${message._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: newText })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessages(prev => prev.map(msg => 
            msg._id === message._id 
              ? { ...msg, text: newText, isEdited: true }
              : msg
          ));
        }
      }
    } catch (error) {
      console.error('Error editing message:', error);
    }
    
    setEditingMessage(null);
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}/api/chat/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ deleteForEveryone: true })
      });
      
      if (response.ok) {
        setMessages(prev => prev.filter(msg => msg._id !== messageId));
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleReactToMessage = async (messageId, emoji) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}/api/chat/messages/${messageId}/react`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ emoji })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessages(prev => prev.map(msg => 
            msg._id === messageId 
              ? { ...msg, reactions: data.reactions }
              : msg
          ));
        }
      }
    } catch (error) {
      console.error('Error reacting to message:', error);
    }
  };

  const handleReplyToMessage = (message) => {
    setReplyTo(message);
  };

  const handleForwardMessage = (message) => {
    // Implement forward functionality
    console.log('Forward message:', message);
  };

  const handleTyping = (isUserTyping) => {
    if (isUserTyping) {
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

  const handleResendMessage = async (message) => {
    if (message.status === 'failed') {
      // Remove failed message and resend
      setMessages(prev => prev.filter(msg => msg._id !== message._id));
      await handleSendMessage(message.text, message.media, null);
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
        {/* Loading more indicator */}
        {loadingMore && (
          <div className={styles.loadingMore}>
            <FaSpinner className={styles.spinning} />
            <span>Loading older messages...</span>
          </div>
        )}
        
        {/* Initial loading */}
        {loading && (
          <div className={styles.loadingMessages}>
            <div className={styles.spinner}></div>
            <p>Loading messages...</p>
          </div>
        )}
        
        {/* Error state */}
        {error && !loading && (
          <div className={styles.errorState}>
            <p>{error}</p>
            <button onClick={() => loadMessages(true)}>Retry</button>
          </div>
        )}
        
        {/* No messages */}
        {!loading && messages.length === 0 && !error && (
          <div className={styles.noMessages}>
            <p>No messages yet</p>
            <p className={styles.noMessagesSubtext}>Send a message to start the conversation</p>
          </div>
        )}
        
        {/* Messages */}
        {!loading && groupedMessages.map((item, index) => {
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
              onForward={handleForwardMessage}
              onResend={handleResendMessage}
              onAttachmentClick={handleAttachmentClick}
              previousMessage={item.previousMessage}
              nextMessage={item.nextMessage}
              currentUserId={currentUser?.id}
            />
          );
        })}
        
        {/* Typing indicator */}
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