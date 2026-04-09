// components/Chat/MessageInput.jsx
import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import ChartWidget from '../profile/ChartWidget';
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
  FaVideo,
  FaChartLine,
  FaSpinner
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
  const [showChartCreator, setShowChartCreator] = useState(false);
  const [chartData, setChartData] = useState({
    symbol: 'BTCUSDT',
    interval: '30',
    theme: darkMode ? 'dark' : 'light'
  });
  const [uploading, setUploading] = useState(false);
  
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const chartSymbols = [
    { value: 'BTCUSDT', label: 'BTC/USDT' },
    { value: 'ETHUSDT', label: 'ETH/USDT' },
    { value: 'BNBUSDT', label: 'BNB/USDT' },
    { value: 'SOLUSDT', label: 'SOL/USDT' },
    { value: 'ADAUSDT', label: 'ADA/USDT' }
  ];

  const chartIntervals = [
    { value: '1', label: '1m' },
    { value: '5', label: '5m' },
    { value: '15', label: '15m' },
    { value: '30', label: '30m' },
    { value: '60', label: '1h' },
    { value: '240', label: '4h' },
    { value: 'D', label: '1d' }
  ];

  useEffect(() => {
    if (editingMessage) {
      setMessage(editingMessage.text);
      textareaRef.current?.focus();
    }
  }, [editingMessage]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [message]);

  const handleChange = (e) => {
    setMessage(e.target.value);
    
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    if ((!message.trim() && attachments.length === 0 && !showChartCreator) || uploading) return;
    
    let chartToSend = null;
    
    if (showChartCreator && chartData.symbol) {
      chartToSend = { ...chartData };
      setShowChartCreator(false);
    }
    
    await onSendMessage(message, attachments, chartToSend);
    
    setMessage('');
    setAttachments([]);
    setChartData({
      symbol: 'BTCUSDT',
      interval: '30',
      theme: darkMode ? 'dark' : 'light'
    });
    
    if (onTyping) onTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    setUploading(true);
    
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
    
    setTimeout(() => {
      setAttachments(prev => 
        prev.map(att => ({ ...att, uploading: false }))
      );
      setUploading(false);
    }, 1000);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const getAttachmentIcon = (type) => {
    if (type?.startsWith('image/')) return <FaImage />;
    if (type?.startsWith('video/')) return <FaVideo />;
    return <FaFile />;
  };

  const addChartToMessage = () => {
    setShowChartCreator(true);
    setShowAttachmentMenu(false);
  };

  const removeChart = () => {
    setShowChartCreator(false);
  };

  return (
    <div className={`${styles.messageInput} ${darkMode ? styles.dark : styles.light}`}>
      {editingMessage && (
        <div className={styles.editingIndicator}>
          <span>Editing message</span>
          <button onClick={onCancelEdit}>
            <FaTimes />
          </button>
        </div>
      )}

      {showChartCreator && (
        <div className={styles.chartCreator}>
          <div className={styles.chartHeader}>
            <h4>Add Trading Chart</h4>
            <button onClick={removeChart} type="button">
              <FaTimes />
            </button>
          </div>
          <div className={styles.chartControls}>
            <select
              value={chartData.symbol}
              onChange={(e) => setChartData(prev => ({ ...prev, symbol: e.target.value }))}
            >
              {chartSymbols.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              value={chartData.interval}
              onChange={(e) => setChartData(prev => ({ ...prev, interval: e.target.value }))}
            >
              {chartIntervals.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className={styles.chartPreview}>
            <ChartWidget chartData={chartData} isExpanded={false} />
          </div>
          <button className={styles.sendChartBtn} onClick={handleSend}>
            <FaChartLine /> Send Chart
          </button>
        </div>
      )}

      {attachments.length > 0 && !showChartCreator && (
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
                  <FaSpinner className={styles.spinning} />
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

      {!showChartCreator && (
        <div className={styles.inputArea}>
          <button className={styles.emojiButton} type="button" title="Emoji">
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

            <button 
              className={styles.chartButton}
              onClick={addChartToMessage}
              title="Add chart"
            >
              <FaChartLine />
            </button>

            {message.trim() || attachments.length > 0 ? (
              <button 
                className={styles.sendButton}
                onClick={handleSend}
                disabled={uploading}
                title="Send"
              >
                {uploading ? <FaSpinner className={styles.spinning} /> : <FaPaperPlane />}
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

          {showAttachmentMenu && (
            <div className={styles.attachmentMenu}>
              <button onClick={() => fileInputRef.current?.click()}>
                <FaImage /> Image
              </button>
              <button onClick={() => fileInputRef.current?.click()}>
                <FaFile /> Document
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
            accept="image/*,video/*,application/pdf"
          />
        </div>
      )}
    </div>
  );
});

export default MessageInput;