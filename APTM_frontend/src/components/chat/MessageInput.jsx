import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import styles from './MessageInput.module.css';

// Import icons
import {
  FaRegSmile,
  FaPaperclip,
  FaMicrophone,
  FaPaperPlane,
  FaTimes,
  FaImage,
  FaFile,
  FaMusic,
  FaVideo
} from 'react-icons/fa';

const MessageInput = forwardRef(({ 
  onSendMessage, 
  onTyping,
  editingMessage,
  onCancelEdit
}, ref) => {
  const { darkMode } = useTheme();
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Handle editing
  useEffect(() => {
    if (editingMessage) {
      setMessage(editingMessage.text);
      textareaRef.current?.focus();
    }
  }, [editingMessage]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [message]);

  // Handle input change
  const handleChange = (e) => {
    setMessage(e.target.value);
    
    // Typing indicator
    if (onTyping) {
      onTyping(e.target.value.length > 0);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 2000);
    }
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle send
  const handleSend = () => {
    if (!message.trim() && attachments.length === 0) return;
    
    onSendMessage(message, attachments);
    setMessage('');
    setAttachments([]);
    
    if (onTyping) onTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    const newAttachments = files.map(file => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
      uploading: true
    }));
    
    setAttachments(prev => [...prev, ...newAttachments]);
    setShowAttachmentMenu(false);
    
    // Simulate upload (replace with actual upload)
    setTimeout(() => {
      setAttachments(prev => 
        prev.map(att => ({ ...att, uploading: false }))
      );
    }, 2000);
  };

  // Remove attachment
  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Get attachment icon
  const getAttachmentIcon = (type) => {
    if (type?.startsWith('image/')) return <FaImage />;
    if (type?.startsWith('video/')) return <FaVideo />;
    if (type?.startsWith('audio/')) return <FaMusic />;
    return <FaFile />;
  };

  return (
    <div className={`${styles.messageInput} ${darkMode ? styles.dark : styles.light}`}>
      {/* Editing indicator */}
      {editingMessage && (
        <div className={styles.editingIndicator}>
          <span>Editing message</span>
          <button onClick={onCancelEdit}>
            <FaTimes />
          </button>
        </div>
      )}

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className={styles.attachmentsPreview}>
          {attachments.map((att, index) => (
            <div key={index} className={styles.attachmentPreview}>
              {att.type?.startsWith('image/') ? (
                <img src={att.url} alt={att.name} />
              ) : (
                <div className={styles.filePreview}>
                  {getAttachmentIcon(att.type)}
                  <span className={styles.fileName}>{att.name}</span>
                </div>
              )}
              {att.uploading && (
                <div className={styles.uploadProgress}>
                  <div className={styles.spinner}></div>
                </div>
              )}
              <button 
                className={styles.removeAttachment}
                onClick={() => removeAttachment(index)}
              >
                <FaTimes />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className={styles.inputArea}>
        <button 
          className={styles.emojiButton}
          type="button"
          title="Emoji"
        >
          <FaRegSmile />
        </button>

        <div className={styles.textareaWrapper}>
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyPress}
            placeholder={editingMessage ? "Edit message..." : "Type a message..."}
            rows="1"
          />
        </div>

        <div className={styles.actionButtons}>
          <button 
            className={styles.attachButton}
            onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
            title="Attach file"
          >
            <FaPaperclip />
          </button>

          {message.trim() || attachments.length > 0 ? (
            <button 
              className={styles.sendButton}
              onClick={handleSend}
              title="Send"
            >
              <FaPaperPlane />
            </button>
          ) : (
            <button 
              className={styles.micButton}
              onClick={() => setIsRecording(!isRecording)}
              title={isRecording ? "Stop recording" : "Voice message"}
            >
              <FaMicrophone />
            </button>
          )}
        </div>

        {/* Attachment menu */}
        {showAttachmentMenu && (
          <div className={styles.attachmentMenu}>
            <button onClick={() => fileInputRef.current?.click()}>
              <FaImage /> Image
            </button>
            <button onClick={() => fileInputRef.current?.click()}>
              <FaFile /> Document
            </button>
            <button onClick={() => fileInputRef.current?.click()}>
              <FaMusic /> Audio
            </button>
            <button onClick={() => fileInputRef.current?.click()}>
              <FaVideo /> Video
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
});

export default MessageInput;