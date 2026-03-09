import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import styles from './MessageList.module.css';

const MessageList = ({ 
  messages, 
  currentUserId, 
  isTyping, 
  loading, 
  onDeleteMessage,
  onReact,
  onReply,
  onEdit,
  onForward
}) => {
  const { darkMode } = useTheme();
  const messagesEndRef = useRef(null);
  const messageRefs = useRef({});
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showActions, setShowActions] = useState(false);
  const [messageStatuses, setMessageStatuses] = useState({});
  const processedMessageIds = useRef(new Set());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Update local message statuses when messages change and track processed IDs
  useEffect(() => {
    const statusMap = {};
    messages.forEach(msg => {
      if (msg._id) {
        statusMap[msg._id] = msg.status;
        // Track message IDs to prevent duplicates
        processedMessageIds.current.add(msg._id);
      }
    });
    setMessageStatuses(statusMap);
  }, [messages]);

  // Deduplicate messages by ID
  const uniqueMessages = useMemo(() => {
    const seen = new Set();
    return messages.filter(msg => {
      const id = msg._id || msg.id;
      if (seen.has(id)) {
        console.log('⚠️ Duplicate message detected and filtered:', id);
        return false;
      }
      seen.add(id);
      return true;
    });
  }, [messages]);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } catch {
      return '';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '';
      
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      } else {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        });
      }
    } catch {
      return '';
    }
  };

  const isOwnMessage = (message) => {
    if (message.deletedFor?.includes(currentUserId)) return false;
    
    let messageSenderId = null;
    
    if (message.senderId) {
      if (typeof message.senderId === 'object' && message.senderId !== null) {
        messageSenderId = message.senderId._id || message.senderId.id;
      } else {
        messageSenderId = message.senderId;
      }
    } else if (message.sender) {
      messageSenderId = message.sender._id || message.sender.id;
    }
    
    return String(messageSenderId) === String(currentUserId);
  };

  const getMessageStatus = (message) => {
    if (!isOwnMessage(message)) return null;
    
    const status = message.status || messageStatuses[message._id];
    
    if (!status) return null;
    
    switch(status) {
      case 'sending':
        return { icon: '⏳', text: 'Sending...' };
      case 'sent':
        return { icon: '✓', text: 'Sent' };
      case 'delivered':
        return { icon: '✓✓', text: 'Delivered' };
      case 'read':
        return { icon: '👁️', text: 'Read' };
      default:
        return null;
    }
  };

  const handleMessageClick = (message, e) => {
    if (e.detail === 2) { // Double click
      if (!message.isDeleted && isOwnMessage(message) && onEdit) {
        const newText = prompt('Edit message:', message.text);
        if (newText && newText.trim() && newText !== message.text) {
          onEdit(message._id, newText.trim());
        }
      }
    } else { // Single click
      setSelectedMessage(selectedMessage === message._id ? null : message._id);
      setShowActions(false);
    }
  };

  const handleReplyClick = (message, e) => {
    e.stopPropagation();
    if (onReply && !message.isDeleted) {
      onReply(message);
      setSelectedMessage(null);
    }
  };

  const handleReactClick = (message, reaction, e) => {
    e.stopPropagation();
    if (onReact && !message.isDeleted) {
      onReact(message._id, reaction);
      setSelectedMessage(null);
    }
  };

  const handleDeleteClick = (message, e) => {
    e.stopPropagation();
    if (window.confirm('Delete this message?')) {
      onDeleteMessage(message._id);
      setSelectedMessage(null);
    }
  };

  const handleForwardClick = (message, e) => {
    e.stopPropagation();
    if (onForward && !message.isDeleted) {
      onForward(message);
      setSelectedMessage(null);
    }
  };

  const groupMessagesByDate = () => {
    const groups = {};
    uniqueMessages.forEach(message => {
      const date = formatDate(message.createdAt || message.timestamp);
      if (!date) return;
      if (!groups[date]) groups[date] = [];
      groups[date].push(message);
    });
    return groups;
  };

  if (loading) {
    return (
      <div className={`${styles.container} ${darkMode ? styles.dark : styles.light}`}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}>
            <div className={styles.spinnerRing}></div>
            <div className={styles.spinnerRing}></div>
            <div className={styles.spinnerRing}></div>
          </div>
          <span className={styles.loadingText}>Loading messages...</span>
        </div>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate();

  return (
    <div className={`${styles.container} ${darkMode ? styles.dark : styles.light}`}>
      <div className={styles.messageList}>
        {Object.entries(messageGroups).map(([date, dateMessages]) => (
          <div key={date} className={styles.dateGroup}>
            <div className={styles.dateSeparator}>
              <div className={styles.dateLine}></div>
              <span className={styles.dateText}>{date}</span>
              <div className={styles.dateLine}></div>
            </div>
            
            {dateMessages.map((message, index) => {
              const isCurrentUser = isOwnMessage(message);
              const isSelected = selectedMessage === message._id;
              const messageStatus = getMessageStatus(message);
              
              if (message.deletedFor?.includes(currentUserId)) return null;

              return (
                <div
                  key={message._id || message.id}
                  ref={el => messageRefs.current[message._id || message.id] = el}
                  className={`${styles.messageWrapper} ${
                    isCurrentUser ? styles.myMessage : styles.theirMessage
                  } ${isSelected ? styles.selected : ''}`}
                  onClick={(e) => handleMessageClick(message, e)}
                  data-message-id={message._id}
                >
                  {/* Message Container */}
                  <div className={styles.messageContainer}>
                    {/* Message Bubble */}
                    <div className={`${styles.messageBubble} ${
                      message.isDeleted ? styles.deleted : ''
                    }`}>
                      {message.isDeleted ? (
                        <div className={styles.deletedMessage}>
                          <span className={styles.deletedIcon}>🗑️</span>
                          <span>This message was deleted</span>
                        </div>
                      ) : (
                        <>
                          {/* Reply Preview */}
                          {message.replyTo && message.replyPreview && (
                            <div 
                              className={styles.replyPreview}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (message.replyTo && messageRefs.current[message.replyTo]) {
                                  messageRefs.current[message.replyTo].scrollIntoView({ 
                                    behavior: 'smooth', 
                                    block: 'center' 
                                  });
                                }
                              }}
                            >
                              <div className={styles.replyBar}></div>
                              <div className={styles.replyContent}>
                                <div className={styles.replyHeader}>
                                  <span className={styles.replyIcon}>↩️</span>
                                  <span className={styles.replyName}>
                                    {message.replyPreview?.senderId === currentUserId 
                                      ? 'You' 
                                      : message.replyPreview?.senderName || 'Message'}
                                  </span>
                                </div>
                                <div className={styles.replyText}>
                                  {message.replyPreview?.text || 'Original message'}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Message Content */}
                          <div className={styles.messageContent}>
                            {/* Media Attachments */}
                            {message.media && message.media.length > 0 && (
                              <div className={styles.mediaGrid}>
                                {message.media.map((media, idx) => (
                                  <div key={idx} className={styles.mediaItem}>
                                    {media.type === 'image' ? (
                                      <img 
                                        src={media.url} 
                                        alt="attachment"
                                        className={styles.mediaImage}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          window.open(media.url, '_blank');
                                        }}
                                        loading="lazy"
                                      />
                                    ) : media.type === 'video' ? (
                                      <video 
                                        src={media.url} 
                                        controls
                                        className={styles.mediaVideo}
                                      />
                                    ) : (
                                      <a 
                                        href={media.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.mediaFile}
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <span className={styles.fileIcon}>📎</span>
                                        <span className={styles.fileName}>
                                          {media.fileName || 'Attachment'}
                                        </span>
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Voice Note */}
                            {message.voiceNote && (
                              <div className={styles.voiceNote}>
                                <div className={styles.voiceNoteControls}>
                                  <button className={styles.playButton}>
                                    <span>▶</span>
                                  </button>
                                  <div className={styles.waveform}>
                                    {[...Array(20)].map((_, i) => (
                                      <div
                                        key={i}
                                        className={styles.waveformBar}
                                        style={{ 
                                          height: `${Math.random() * 30 + 10}px`,
                                          animationDelay: `${i * 0.05}s`
                                        }}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Message Text */}
                            {message.text && (
                              <p className={styles.messageText}>
                                {message.text}
                                {message.isEdited && (
                                  <span className={styles.edited}>(edited)</span>
                                )}
                              </p>
                            )}

                            {/* Reactions */}
                            {message.reactions && message.reactions.length > 0 && (
                              <div className={styles.reactions}>
                                {message.reactions.map((reaction, idx) => (
                                  <button
                                    key={idx}
                                    className={`${styles.reaction} ${
                                      reaction.users?.includes(currentUserId) 
                                        ? styles.reacted 
                                        : ''
                                    }`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onReact?.(message._id, reaction.emoji);
                                    }}
                                  >
                                    <span>{reaction.emoji}</span>
                                    <span className={styles.reactionCount}>
                                      {reaction.count}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Message Footer */}
                          <div className={styles.messageFooter}>
                            <span className={styles.messageTime}>
                              {formatTime(message.createdAt || message.timestamp)}
                            </span>
                            {isCurrentUser && messageStatus && (
                              <span 
                                className={styles.messageStatus} 
                                title={messageStatus.text}
                              >
                                {messageStatus.icon}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Action Buttons (shown on select) */}
                    {isSelected && !message.isDeleted && (
                      <div className={styles.actionButtons}>
                        <button
                          className={`${styles.actionButton} ${styles.replyButton}`}
                          onClick={(e) => handleReplyClick(message, e)}
                          title="Reply"
                        >
                          <span className={styles.actionIcon}>↩️</span>
                          <span className={styles.actionText}>Reply</span>
                        </button>
                        
                        <button
                          className={`${styles.actionButton} ${styles.reactButton}`}
                          onClick={(e) => handleReactClick(message, '👍', e)}
                          title="React"
                        >
                          <span className={styles.actionIcon}>😊</span>
                          <span className={styles.actionText}>React</span>
                        </button>
                        
                        {isCurrentUser && (
                          <>
                            <button
                              className={`${styles.actionButton} ${styles.editButton}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                const newText = prompt('Edit message:', message.text);
                                if (newText && newText.trim() && newText !== message.text) {
                                  onEdit?.(message._id, newText.trim());
                                }
                                setSelectedMessage(null);
                              }}
                              title="Edit"
                            >
                              <span className={styles.actionIcon}>✏️</span>
                              <span className={styles.actionText}>Edit</span>
                            </button>
                            
                            <button
                              className={`${styles.actionButton} ${styles.deleteButton}`}
                              onClick={(e) => handleDeleteClick(message, e)}
                              title="Delete"
                            >
                              <span className={styles.actionIcon}>🗑️</span>
                              <span className={styles.actionText}>Delete</span>
                            </button>
                          </>
                        )}
                        
                        {onForward && (
                          <button
                            className={`${styles.actionButton} ${styles.forwardButton}`}
                            onClick={(e) => handleForwardClick(message, e)}
                            title="Forward"
                          >
                            <span className={styles.actionIcon}>⏩</span>
                            <span className={styles.actionText}>Forward</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        
        {/* Typing Indicator */}
        {isTyping && (
          <div className={`${styles.messageWrapper} ${styles.theirMessage}`}>
            <div className={styles.typingIndicator}>
              <div className={styles.typingBubble}>
                <div className={styles.typingDots}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
              <span className={styles.typingText}>typing...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageList;