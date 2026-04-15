// MessageInput.jsx - Premium macOS/iOS Glass Edition
import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import ChartWidget from '../profile/ChartWidget';
import styles from './MessageInput.module.css';

// Premium minimal icons
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
  FaSpinner,
  FaStop
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
  const [recordingTime, setRecordingTime] = useState(0);
  const [showChartCreator, setShowChartCreator] = useState(false);
  const [chartData, setChartData] = useState({
    symbol: 'BTCUSDT',
    interval: '30',
    theme: darkMode ? 'dark' : 'light'
  });
  const [uploading, setUploading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const recordingIntervalRef = useRef(null);

  const chartSymbols = [
    { value: 'BTCUSDT', label: 'BTC/USDT' },
    { value: 'ETHUSDT', label: 'ETH/USDT' },
    { value: 'BNBUSDT', label: 'BNB/USDT' },
    { value: 'SOLUSDT', label: 'SOL/USDT' },
    { value: 'ADAUSDT', label: 'ADA/USDT' },
    { value: 'XRPUSDT', label: 'XRP/USDT' },
    { value: 'DOGEUSDT', label: 'DOGE/USDT' },
    { value: 'AVAXUSDT', label: 'AVAX/USDT' }
  ];

  const chartIntervals = [
    { value: '1', label: '1m' },
    { value: '5', label: '5m' },
    { value: '15', label: '15m' },
    { value: '30', label: '30m' },
    { value: '60', label: '1h' },
    { value: '240', label: '4h' },
    { value: 'D', label: '1d' },
    { value: 'W', label: '1w' }
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
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [message]);

  useEffect(() => {
    if (!isRecording) {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      setRecordingTime(0);
    }
  }, [isRecording]);

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
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
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
    
    // Simulate upload (replace with actual upload)
    setTimeout(() => {
      setAttachments(prev => 
        prev.map(att => ({ ...att, uploading: false }))
      );
      setUploading(false);
    }, 1000);
  };

  const removeAttachment = (index) => {
    const attachment = attachments[index];
    if (attachment.url && attachment.url.startsWith('blob:')) {
      URL.revokeObjectURL(attachment.url);
    }
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

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = async () => {
    setIsRecording(false);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    
    // Here you would send the voice message
    if (recordingTime > 0) {
      // Voice message logic here
      console.log(`Recording stopped at ${recordingTime} seconds`);
    }
  };

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`${styles.messageInput} ${darkMode ? styles.dark : styles.light} ${isFocused ? styles.focused : ''}`}>
      {/* Editing Indicator */}
      {editingMessage && (
        <div className={styles.editingIndicator}>
          <div className={styles.editingContent}>
            <span className={styles.editingLabel}>Editing message</span>
            <span className={styles.editingPreview}>{editingMessage.text?.substring(0, 50)}</span>
          </div>
          <button onClick={onCancelEdit} className={styles.cancelEditBtn}>
            <FaTimes />
          </button>
        </div>
      )}

      {/* Chart Creator Panel */}
      {showChartCreator && (
        <div className={styles.chartCreator}>
          <div className={styles.chartHeader}>
            <h4>
              <FaChartLine /> Add Trading Chart
            </h4>
            <button onClick={removeChart} type="button" className={styles.closeChartBtn}>
              <FaTimes />
            </button>
          </div>
          <div className={styles.chartControls}>
            <select
              value={chartData.symbol}
              onChange={(e) => setChartData(prev => ({ ...prev, symbol: e.target.value }))}
              className={styles.chartSelect}
            >
              {chartSymbols.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              value={chartData.interval}
              onChange={(e) => setChartData(prev => ({ ...prev, interval: e.target.value }))}
              className={styles.chartSelect}
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

      {/* Attachments Preview */}
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
                  <span className={styles.fileSize}>
                    {att.size ? `${(att.size / 1024).toFixed(0)} KB` : ''}
                  </span>
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

      {/* Recording Indicator */}
      {isRecording && (
        <div className={styles.recordingIndicator}>
          <div className={styles.recordingPulse}></div>
          <span className={styles.recordingTime}>{formatRecordingTime(recordingTime)}</span>
          <button className={styles.stopRecordingBtn} onClick={stopRecording}>
            <FaStop /> Stop
          </button>
        </div>
      )}

      {/* Main Input Area */}
      {!showChartCreator && (
        <div className={styles.inputArea}>
          <button 
            className={styles.emojiButton} 
            type="button" 
            title="Emoji"
            onClick={() => {
              // Emoji picker logic here
              console.log('Open emoji picker');
            }}
          >
            <FaRegSmile />
          </button>

          <div className={`${styles.textareaWrapper} ${isFocused ? styles.focused : ''}`}>
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyPress}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={editingMessage ? "Edit message..." : (isRecording ? "Recording voice message..." : "Type a message...")}
              rows="1"
              disabled={isRecording}
            />
          </div>

          <div className={styles.actionButtons}>
            <div className={styles.attachWrapper}>
              <button 
                className={styles.attachButton}
                onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                title="Attach file"
              >
                <FaPaperclip />
              </button>
              
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
            </div>

            <button 
              className={styles.chartButton}
              onClick={addChartToMessage}
              title="Add chart"
            >
              <FaChartLine />
            </button>

            {(message.trim() || attachments.length > 0 || showChartCreator) ? (
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
                className={`${styles.micButton} ${isRecording ? styles.recording : ''}`}
                onClick={isRecording ? stopRecording : startRecording}
                title={isRecording ? "Stop recording" : "Voice message"}
              >
                <FaMicrophone />
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          />
        </div>
      )}
    </div>
  );
});

export default MessageInput;