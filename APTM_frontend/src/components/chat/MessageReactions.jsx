// components/Chat/MessageReactions.jsx - NEW COMPONENT
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import styles from './MessageReactions.module.css';

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '😡', '👏', '🔥'];

const MessageReactions = ({ messageId, reactions = [], onReact, position = 'bottom' }) => {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const [showPicker, setShowPicker] = useState(false);
  const [localReactions, setLocalReactions] = useState(reactions);
  const pickerRef = useRef(null);

  useEffect(() => {
    setLocalReactions(reactions);
  }, [reactions]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleReaction = (emoji) => {
    const hasReacted = localReactions.some(r => r.userId === user?.id && r.emoji === emoji);
    
    if (hasReacted) {
      // Remove reaction
      onReact(messageId, emoji, 'remove');
    } else {
      // Add reaction
      onReact(messageId, emoji, 'add');
    }
    
    setShowPicker(false);
  };

  const getReactionCounts = () => {
    const counts = {};
    localReactions.forEach(r => {
      counts[r.emoji] = (counts[r.emoji] || 0) + 1;
    });
    return counts;
  };

  const getUsersByReaction = (emoji) => {
    return localReactions.filter(r => r.emoji === emoji).map(r => r.userId);
  };

  const hasUserReacted = (emoji) => {
    return localReactions.some(r => r.userId === user?.id && r.emoji === emoji);
  };

  const reactionCounts = getReactionCounts();

  return (
    <div className={`${styles.reactionsContainer} ${darkMode ? styles.dark : styles.light}`}>
      {/* Existing reactions */}
      {Object.entries(reactionCounts).map(([emoji, count]) => (
        <button
          key={emoji}
          className={`${styles.reactionButton} ${hasUserReacted(emoji) ? styles.reacted : ''}`}
          onClick={() => handleReaction(emoji)}
          title={getUsersByReaction(emoji).length > 0 
            ? `${getUsersByReaction(emoji).length} people` 
            : ''}
        >
          <span className={styles.emoji}>{emoji}</span>
          <span className={styles.count}>{count}</span>
        </button>
      ))}

      {/* Add reaction button */}
      <button 
        className={styles.addReactionButton}
        onClick={() => setShowPicker(!showPicker)}
      >
        <span>😊</span>
      </button>

      {/* Reaction picker */}
      {showPicker && (
        <div 
          ref={pickerRef}
          className={`${styles.reactionPicker} ${styles[position]}`}
        >
          {EMOJI_LIST.map(emoji => (
            <button
              key={emoji}
              className={styles.emojiButton}
              onClick={() => handleReaction(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageReactions;