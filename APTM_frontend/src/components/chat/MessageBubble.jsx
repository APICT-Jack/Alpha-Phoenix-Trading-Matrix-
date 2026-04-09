// components/Chat/MessageBubble.jsx - UPDATED with reply, react, forward
import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { getAvatarColor, getAvatarInitial } from '../../utils/avatarUtils';
import ChartWidget from '../profile/ChartWidget';
import styles from './MessageBubble.module.css';

// Import icons
import {
  FaCheck,
  FaCheckDouble,
  FaClock,
  FaEdit,
  FaTrash,
  FaReply,
  FaCopy,
  FaShare,
  FaRegSmile,
  FaDownload,
  FaEye,
  FaFile,
  FaMusic,
  FaVideo,
  FaImage,
  FaForward,
  FaEllipsisH
} from 'react-icons/fa';

const MessageBubble = ({ 
  message, 
  isOwn, 
  onEdit, 
  onDelete, 
  onReact, 
  onReply,
  onForward,
  onAttachmentClick,
  previousMessage,
  nextMessage,
  currentUserId
}) => {
  const { darkMode } = useTheme();
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [imgError, setImgError] = useState({});

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusIcon = () => {
    switch(message.status) {
      case 'sending':
        return <FaClock className={styles.statusIcon} />;
      case 'sent':
        return <FaCheck className={styles.statusIcon} />;
      case 'delivered':
        return <FaCheckDouble className={styles.statusIcon} />;
      case 'read':
        return <FaCheckDouble className={`${styles.statusIcon} ${styles.read}`} />;
      default:
        return null;
    }
  };

  const handleReaction = (emoji) => {
    onReact(message._id, emoji);
    setShowReactions(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setShowMoreMenu(false);
    // Show toast notification
  };

  const handleForward = () => {
    onForward(message);
    setShowMoreMenu(false);
  };

  const handleEdit = () => {
    onEdit(message);
    setShowMoreMenu(false);
  };

  const handleDelete = () => {
    if (window.confirm('Delete this message?')) {
      onDelete(message._id);
    }
    setShowMoreMenu(false);
  };

  const isFirstInGroup = () => {
    if (!previousMessage) return true;
    return previousMessage.senderId !== message.senderId;
  };

  const isLastInGroup = () => {
    if (!nextMessage) return true;
    return nextMessage.senderId !== message.senderId;
  };

  const renderMedia = (mediaItem, index) => {
    if (mediaItem.type === 'chart') {
      return (
        <div key={index} className={styles.chartAttachment}>
          <ChartWidget chartData={mediaItem.chartData} isExpanded={false} />
        </div>
      );
    }
    
    if (mediaItem.type === 'image') {
      return (
        <div 
          key={index} 
          className={styles.imageAttachment}
          onClick={() => onAttachmentClick(mediaItem)}
        >
          <img 
            src={mediaItem.url} 
            alt="attachment"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <div className={styles.imageOverlay}>
            <FaEye />
          </div>
        </div>
      );
    }
    
    if (mediaItem.type === 'video') {
      return (
        <div key={index} className={styles.videoAttachment}>
          <video controls>
            <source src={mediaItem.url} type={mediaItem.mimeType} />
          </video>
        </div>
      );
    }
    
    return (
      <div 
        key={index}
        className={styles.fileAttachment}
        onClick={() => onAttachmentClick(mediaItem)}
      >
        {mediaItem.type === 'image' ? <FaImage /> : <FaFile />}
        <div className={styles.fileInfo}>
          <span className={styles.fileName}>
            {mediaItem.name || 'File'}
          </span>
          {mediaItem.size && (
            <span className={styles.fileSize}>
              {formatFileSize(mediaItem.size)}
            </span>
          )}
        </div>
        <FaDownload className={styles.downloadIcon} />
      </div>
    );
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (message.isDeleted) {
    return (
      <div className={`${styles.messageWrapper} ${isOwn ? styles.own : styles.other}`}>
        <div className={styles.deletedMessage}>
          <span>This message was deleted</span>
        </div>
      </div>
    );
  }

  const sender = message.sender || {};
  const senderName = sender.name || 'User';
  const senderId = sender._id || sender.id || message.senderId;

  // Group reactions by emoji
  const groupedReactions = {};
  (message.reactions || []).forEach(r => {
    if (!groupedReactions[r.emoji]) {
      groupedReactions[r.emoji] = { count: 0, users: [] };
    }
    groupedReactions[r.emoji].count++;
    groupedReactions[r.emoji].users.push(r.userId);
  });

  return (
    <div 
      className={`
        ${styles.messageWrapper}
        ${isOwn ? styles.own : styles.other}
        ${isFirstInGroup() ? styles.firstInGroup : ''}
        ${isLastInGroup() ? styles.lastInGroup : ''}
        ${darkMode ? styles.dark : styles.light}
      `}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowMoreMenu(false);
        setShowReactions(false);
      }}
    >
      {/* Avatar for other users */}
      {!isOwn && isFirstInGroup() && (
        <div className={styles.avatar}>
          {sender.avatar && !imgError[senderId] ? (
            <img 
              src={sender.avatar} 
              alt={senderName}
              onError={() => setImgError(prev => ({ ...prev, [senderId]: true }))}
            />
          ) : (
            <div 
              className={styles.avatarPlaceholder}
              style={{ backgroundColor: getAvatarColor(senderId) }}
            >
              {getAvatarInitial({ name: senderName })}
            </div>
          )}
        </div>
      )}

      <div className={styles.messageContainer}>
        {/* Sender name */}
        {!isOwn && isFirstInGroup() && (
          <span className={styles.senderName}>{senderName}</span>
        )}

        {/* Forward indicator */}
        {message.isForwarded && (
          <div className={styles.forwardIndicator}>
            <FaForward /> Forwarded
          </div>
        )}

        {/* Reply preview */}
        {message.replyToMessage && (
          <div className={styles.replyPreview}>
            <div className={styles.replyBar}></div>
            <div className={styles.replyContent}>
              <span className={styles.replySender}>
                {message.replyToMessage.senderName}
              </span>
              <p className={styles.replyText}>
                {message.replyToMessage.text || (message.replyToMessage.media?.length > 0 ? '📎 Media' : '')}
              </p>
            </div>
          </div>
        )}

        {/* Message bubble */}
        <div className={styles.messageBubble}>
          {/* Media attachments */}
          {message.media?.length > 0 && (
            <div className={`${styles.attachments} ${message.media.length > 1 ? styles.grid : ''}`}>
              {message.media.map((media, idx) => renderMedia(media, idx))}
            </div>
          )}

          {/* Message text */}
          {message.text && (
            <div className={styles.messageText}>
              <p>{message.text}</p>
              {message.isEdited && (
                <span className={styles.edited}>edited</span>
              )}
            </div>
          )}

          {/* Reactions */}
          {Object.keys(groupedReactions).length > 0 && (
            <div className={styles.reactions}>
              {Object.entries(groupedReactions).map(([emoji, data]) => (
                <button 
                  key={emoji}
                  className={`${styles.reaction} ${
                    data.users.includes(currentUserId) ? styles.active : ''
                  }`}
                  onClick={() => onReact(message._id, emoji)}
                >
                  <span>{emoji}</span>
                  <span className={styles.reactionCount}>{data.count}</span>
                </button>
              ))}
            </div>
          )}

          {/* Message footer */}
          <div className={styles.messageFooter}>
            <span className={styles.messageTime}>{formatTime(message.createdAt)}</span>
            {isOwn && getStatusIcon()}
          </div>
        </div>

        {/* Action buttons */}
        {showActions && !message.isDeleted && (
          <div className={styles.messageActions}>
            <button 
              className={styles.actionButton}
              onClick={() => onReply(message)}
              title="Reply"
            >
              <FaReply />
            </button>
            
            <div className={styles.reactionButtonWrapper}>
              <button 
                className={styles.actionButton}
                onClick={() => setShowReactions(!showReactions)}
                title="React"
              >
                <FaRegSmile />
              </button>
              
              {showReactions && (
                <div className={styles.reactionPicker}>
                  <button onClick={() => handleReaction('👍')}>👍</button>
                  <button onClick={() => handleReaction('❤️')}>❤️</button>
                  <button onClick={() => handleReaction('😂')}>😂</button>
                  <button onClick={() => handleReaction('😮')}>😮</button>
                  <button onClick={() => handleReaction('😢')}>😢</button>
                  <button onClick={() => handleReaction('😡')}>😡</button>
                  <button onClick={() => handleReaction('🎉')}>🎉</button>
                  <button onClick={() => handleReaction('🔥')}>🔥</button>
                </div>
              )}
            </div>

            <div className={styles.moreMenuWrapper}>
              <button 
                className={styles.actionButton}
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                title="More"
              >
                <FaEllipsisH />
              </button>
              
              {showMoreMenu && (
                <div className={styles.moreMenu}>
                  <button onClick={handleCopy}>
                    <FaCopy /> Copy
                  </button>
                  <button onClick={handleForward}>
                    <FaForward /> Forward
                  </button>
                  {isOwn && (
                    <>
                      <button onClick={handleEdit}>
                        <FaEdit /> Edit
                      </button>
                      <button onClick={handleDelete} className={styles.deleteOption}>
                        <FaTrash /> Delete
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;