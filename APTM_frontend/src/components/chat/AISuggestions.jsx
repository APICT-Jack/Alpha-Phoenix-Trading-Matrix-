import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import styles from './AISuggestions.module.css';

const AISuggestions = ({ onSuggestionSelect, context }) => {
  const { darkMode } = useTheme();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const generateSuggestions = async () => {
      if (!context || context.length < 10) {
        setSuggestions(getDefaultSuggestions());
        return;
      }

      setLoading(true);
      
      try {
        // Simulate AI-generated suggestions based on context
        setTimeout(() => {
          const contextSuggestions = [
            "Based on our conversation, have you considered...",
            "That reminds me of a similar situation where...",
            "What are your thoughts on trying a different approach?",
            "I noticed you mentioned strategy, have you backtested it?",
            "That's interesting! How does that align with your risk management?"
          ];
          setSuggestions(contextSuggestions);
          setLoading(false);
        }, 800);
      } catch (error) {
        console.error('Error generating suggestions:', error);
        setSuggestions(getDefaultSuggestions());
        setLoading(false);
      }
    };

    generateSuggestions();
  }, [context]);

  const getDefaultSuggestions = () => [
    "What trading strategies are you using currently?",
    "How do you manage risk in volatile markets?",
    "Have you tried any new indicators recently?",
    "What's your opinion on the current market trend?"
  ];

  const handleSuggestionClick = (suggestion) => {
    onSuggestionSelect(suggestion);
  };

  if (loading) {
    return (
      <div className={`${styles.suggestionsContainer} ${darkMode ? styles.dark : styles.light}`}>
        <div className={styles.loadingSuggestions}>
          <div className={styles.spinner}></div>
          <span>AI is generating suggestions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.suggestionsContainer} ${darkMode ? styles.dark : styles.light}`}>
      <div className={styles.suggestionsHeader}>
        <span className={styles.aiIcon}>🤖</span>
        <span>AI Suggestions</span>
      </div>
      
      <div className={styles.suggestionsList}>
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            className={styles.suggestionItem}
            onClick={() => handleSuggestionClick(suggestion)}
          >
            <span className={styles.suggestionText}>{suggestion}</span>
            <span className={styles.useIcon}>➤</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AISuggestions;