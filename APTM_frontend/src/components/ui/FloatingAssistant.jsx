import { useState, useEffect, useRef } from 'react';
import { FaRobot, FaTimes, FaPaperPlane, FaBook, FaChartLine, FaQuestionCircle } from 'react-icons/fa';

export default function FloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const assistantRef = useRef(null);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (assistantRef.current && !assistantRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="floating-assistant" ref={assistantRef}>
      <button 
        className="assistant-icon" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open trading assistant"
      >
        <FaRobot />
        <div className="notification-badge">3</div>
      </button>
      
      {isOpen && (
        <div className="assistant-panel">
          <div className="assistant-header">
            <h3>DC Trading Assistant</h3>
            <button 
              className="close-assistant" 
              onClick={() => setIsOpen(false)}
              aria-label="Close assistant"
            >
              <FaTimes />
            </button>
          </div>
          <div className="assistant-messages">
            <div className="message bot">
              <div className="message-content">
                Welcome to DC Trading! How can I help you today?
              </div>
              <div className="message-time">Just now</div>
            </div>
          </div>
          <div className="quick-actions">
            <button className="quick-action">
              <FaBook /> Tutorials
            </button>
            <button className="quick-action">
              <FaChartLine /> Market Analysis
            </button>
            <button className="quick-action">
              <FaQuestionCircle /> FAQ
            </button>
          </div>
          <div className="assistant-input">
            <input 
              type="text" 
              placeholder="Ask me anything about trading..." 
              aria-label="Ask the assistant"
            />
            <button className="send-btn" aria-label="Send message">
              <FaPaperPlane />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}