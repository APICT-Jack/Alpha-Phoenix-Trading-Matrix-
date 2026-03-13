import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { getAvatarColor, getAvatarInitial } from '../../utils/avatarUtils';
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
  FaImage
} from 'react-icons/fa';

const MessageBubble = ({ 
  message, 
  isOwn, 
  onEdit, 
  onDelete, 
  onReact, 
  onReply,
  onAttachmentClick,
  previousMessage,
  nextMessage,
  currentUserId
}) => {
  const { darkMode } = useTheme();
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [imgError, setImgError] = useState({});

  // Format time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Get message status icon
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

  // Handle reaction
  const handleReaction = (emoji) => {
    onReact(message._id, emoji);
    setShowReactions(false);
  };

  // Check if message is part of a group
  const isFirstInGroup = () => {
    if (!previousMessage) return true;
    return previousMessage.senderId !== message.senderId;
  };

  const isLastInGroup = () => {
    if (!nextMessage) return true;
    return nextMessage.senderId !== message.senderId;
  };

  // Render attachment
  const renderAttachment = (attachment) => {
    const getIcon = () => {
      if (attachment.type?.startsWith('image/')) return <FaImage />;
      if (attachment.type?.startsWith('video/')) return <FaVideo />;
      if (attachment.type?.startsWith('audio/')) return <FaMusic />;
      return <FaFile />;
    };

    return (
      <div 
        key={attachment.url}
        className={styles.attachment}
        onClick={() => onAttachmentClick(attachment)}
      >
        {attachment.type?.startsWith('image/') ? (
          <div className={styles.imageAttachment}>
            <img 
              src={attachment.url} 
              alt="attachment"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <div className={styles.imageOverlay}>
              <FaEye />
            </div>
          </div>
        ) : (
          <div className={styles.fileAttachment}>
            {getIcon()}
            <div className={styles.fileInfo}>
              <span className={styles.fileName}>
                {attachment.name || 'File'}
              </span>
              {attachment.size && (
                <span className={styles.fileSize}>
                  {formatFileSize(attachment.size)}
                </span>
              )}
            </div>
            <FaDownload className={styles.downloadIcon} />
          </div>
        )}
      </div>
    );
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Check if message is deleted
  if (message.isDeleted) {
    return (
      <div className={`${styles.messageWrapper} ${isOwn ? styles.own : styles.other}`}>
        <div className={styles.deletedMessage}>
          <span>This message was deleted</span>
        </div>
      </div>
    );
  }

  // Get sender info
  const sender = message.sender || {};
  const senderName = sender.name || 'User';
  const senderId = sender._id || sender.id || message.senderId;

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
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar for other users (first in group) */}
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
        {/* Sender name (first in group) */}
        {!isOwn && isFirstInGroup() && (
          <span className={styles.senderName}>{senderName}</span>
        )}

        {/* Reply preview */}
        {message.replyTo && (
          <div className={styles.replyPreview}>
            <div className={styles.replyBar}></div>
            <div className={styles.replyContent}>
              <span className={styles.replySender}>
                {message.replyTo.senderName}
              </span>
              <p className={styles.replyText}>{message.replyTo.text}</p>
            </div>
          </div>
        )}

        {/* Message bubble */}
        <div className={styles.messageBubble}>
          {/* Attachments */}
          {message.attachments?.length > 0 && (
            <div className={styles.attachments}>
              {message.attachments.map(renderAttachment)}
            </div>
          )}

          {/* Message text */}
          {message.text && (
            <div className={styles.messageText}>
              <p>{message.text}</p>
              {message.edited && (
                <span className={styles.edited}>edited</span>
              )}
            </div>
          )}

          {/* Reactions */}
          {message.reactions?.length > 0 && (
            <div className={styles.reactions}>
              {message.reactions.map((reaction, idx) => (
                <button 
                  key={idx}
                  className={`${styles.reaction} ${
                    reaction.users?.includes(currentUserId) ? styles.active : ''
                  }`}
                  onClick={() => onReact(message._id, reaction.emoji)}
                >
                  <span>{reaction.emoji}</span>
                  <span className={styles.reactionCount}>{reaction.count}</span>
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
                </div>
              )}
            </div>

            
{isOwn && (
  <span className={styles.messageStatus}>
    {message.status === 'sending' && <FaClock className={styles.statusSending} />}
    {message.status === 'sent' && <FaCheck className={styles.statusSent} />}
    {message.status === 'delivered' && <FaCheckDouble className={styles.statusDelivered} />}
    {message.status === 'read' && <FaCheckDouble className={styles.statusRead} />}
  </span>
)}
            
            <button 
              className={styles.actionButton}
              onClick={() => {
                navigator.clipboard.writeText(message.text);
                alert('Message copied!');
              }}
              title="Copy"
            >
              <FaCopy />
            </button>
            
            <button 
              className={styles.actionButton}
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'Message',
                    text: message.text
                  });
                }
              }}
              title="Share"
            >
              <FaShare />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;