// src/components/auth/AuthModal.jsx
import { useState, useEffect, useCallback } from 'react';
import { FaTimes } from 'react-icons/fa';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import './AuthModal.css';

const AuthModal = ({ onClose, initialForm = 'login', isOpen = true }) => {
  const [activeForm, setActiveForm] = useState(initialForm);
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${window.scrollY}px`;
    }
    return () => {
      // Restore body scroll when modal closes
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    };
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 200);
  }, [onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [handleClose]);

  const handleSuccess = () => {
    handleClose();
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div 
      className={`auth-modal-overlay ${isVisible ? 'visible' : 'closing'}`}
      onClick={handleClose}
    >
      <div 
        className={`auth-modal-container ${isVisible ? 'visible' : 'closing'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close-button" onClick={handleClose} aria-label="Close modal">
          <FaTimes />
        </button>

        <div className="auth-modal-tabs">
          <button
            className={`auth-tab ${activeForm === 'login' ? 'active' : ''}`}
            onClick={() => setActiveForm('login')}
            aria-selected={activeForm === 'login'}
            role="tab"
          >
            Login
          </button>
          <button
            className={`auth-tab ${activeForm === 'signup' ? 'active' : ''}`}
            onClick={() => setActiveForm('signup')}
            aria-selected={activeForm === 'signup'}
            role="tab"
          >
            Sign Up
          </button>
        </div>

        <div className="auth-modal-content">
          {activeForm === 'login' ? (
            <LoginForm
              onSuccess={handleSuccess}
              switchToSignup={() => setActiveForm('signup')}
              onClose={handleClose}
            />
          ) : (
            <SignupForm
              onSuccess={handleSuccess}
              switchToLogin={() => setActiveForm('login')}
              onClose={handleClose}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;