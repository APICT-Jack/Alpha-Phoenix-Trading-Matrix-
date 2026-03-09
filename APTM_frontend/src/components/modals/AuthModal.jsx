// src/components/modals/AuthModal.jsx
import { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import LoginForm from '../auth/LoginForm';
import SignupForm from '../auth/SignupForm';
import './AuthModal.css'; 

const AuthModal = ({ onClose, initialForm = 'login' }) => {
  const [activeForm, setActiveForm] = useState(initialForm);

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <button className={styles.closeButton} onClick={onClose}>
          <FaTimes />
        </button>
        
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeForm === 'login' ? styles.active : ''}`}
            onClick={() => setActiveForm('login')}
          >
            Login
          </button>
          <button
            className={`${styles.tab} ${activeForm === 'signup' ? styles.active : ''}`}
            onClick={() => setActiveForm('signup')}
          >
            Sign Up
          </button>
        </div>
        
        <div className={styles.formContainer}>
          {activeForm === 'login' ? (
            <LoginForm onSuccess={onClose} switchToSignup={() => setActiveForm('signup')} />
          ) : (
            <SignupForm onSuccess={onClose} switchToLogin={() => setActiveForm('login')} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;