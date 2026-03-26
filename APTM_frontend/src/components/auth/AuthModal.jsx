// src/components/auth/AuthModal.jsx
import { useState, useEffect, useCallback } from 'react';
import { FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import './AuthModal.css';

const AuthModal = ({ onClose, initialForm = 'login', isOpen = true }) => {
  const [activeForm, setActiveForm] = useState(initialForm);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
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

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSuccess = () => {
    handleClose();
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: 'easeOut' } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2, ease: 'easeIn' } }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };

  if (!isOpen && !isClosing) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="auth-modal-overlay"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={handleClose}
        >
          <motion.div
            className="auth-modal-container"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;