import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import styles from './MessageInput.module.css';

const MessageInput = ({ onSendMessage, onTyping }) => {
  const { darkMode } = useTheme();
  const [message, setMessage] = useState('');
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [suggestedMessage, setSuggestedMessage] = useState('');
  const [showSuggestion, setShowSuggestion] = useState(false);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [message]);

  const handleInputChange = (e) => {
    const newMessage = e.target.value;
    setMessage(newMessage);
    
    // Handle typing indicator
    if (onTyping) {
      onTyping(true);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing after user stops typing
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 1000);
    }
    
    // Debounce AI suggestion
    clearTimeout(window.suggestionTimeout);
    window.suggestionTimeout = setTimeout(() => {
      getAISuggestion(newMessage);
    }, 500);
  };

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
      setShowSuggestion(false);
      
      // Stop typing indicator
      if (onTyping) {
        onTyping(false);
      }
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getAISuggestion = async (text) => {
    if (!text.trim() || text.length < 3) {
      setShowSuggestion(false);
      return;
    }

    setIsAIProcessing(true);
    
    try {
      // Simulate AI processing - replace with actual AI service
      setTimeout(() => {
        let improvedText = text;
        
        // Capitalize first letter
        improvedText = improvedText.charAt(0).toUpperCase() + improvedText.slice(1);
        
        // Add punctuation if missing
        if (!['.', '!', '?'].includes(improvedText.slice(-1))) {
          improvedText += '.';
        }
        
        // Replace common slang
        const slangMap = {
          'u ': 'you ',
          ' ur ': ' your ',
          ' r ': ' are ',
          ' pls ': ' please ',
          ' thx ': ' thanks ',
          ' lol ': ' ',
          ' btw ': ' by the way '
        };
        
        Object.entries(slangMap).forEach(([slang, proper]) => {
          improvedText = improvedText.replace(new RegExp(slang, 'gi'), proper);
        });

        setSuggestedMessage(improvedText);
        setShowSuggestion(true);
        setIsAIProcessing(false);
      }, 1000);
    } catch (error) {
      console.error('Error getting AI suggestion:', error);
      setIsAIProcessing(false);
      setShowSuggestion(false);
    }
  };

  const useSuggestion = () => {
    setMessage(suggestedMessage);
    setShowSuggestion(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const dismissSuggestion = () => {
    setShowSuggestion(false);
  };

  return (
    <div className={`${styles.messageInputContainer} ${darkMode ? styles.dark : styles.light}`}>
      {/* AI Suggestion Banner */}
      {showSuggestion && (
        <div className={styles.suggestionBanner}>
          <div className={styles.suggestionContent}>
            <span className={styles.aiIcon}>✨</span>
            <span className={styles.suggestionText}>
              AI Suggestion: "{suggestedMessage}"
            </span>
          </div>
          <div className={styles.suggestionActions}>
            <button 
              className={styles.useSuggestionButton}
              onClick={useSuggestion}
            >
              Use
            </button>
            <button 
              className={styles.dismissButton}
              onClick={dismissSuggestion}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className={styles.inputArea}>
        <button className={styles.attachmentButton}>
          <span>📎</span>
        </button>
        
        <div className={styles.inputWrapper}>
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className={styles.textInput}
            rows={1}
          />
          
          {isAIProcessing && (
            <div className={styles.aiProcessing}>
              <div className={styles.spinner}></div>
              <span>AI is improving your message...</span>
            </div>
          )}
        </div>

        {message.trim() ? (
          <button 
            className={styles.sendButton}
            onClick={handleSend}
            disabled={!message.trim()}
          >
            <span>➤</span>
          </button>
        ) : (
          <button className={styles.emojiButton}>
            <span>😊</span>
          </button>
        )}
      </div>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <button 
          className={styles.quickAction}
          onClick={() => setMessage("How's your trading going?")}
        >
          Trading check
        </button>
        <button 
          className={styles.quickAction}
          onClick={() => setMessage("What's your current strategy?")}
        >
          Strategy
        </button>
        <button 
          className={styles.quickAction}
          onClick={() => setMessage("Any market insights?")}
        >
          Market insights
        </button>
      </div>
    </div>
  );
};

export default MessageInput