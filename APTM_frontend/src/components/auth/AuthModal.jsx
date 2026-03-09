// src/components/auth/AuthModal.jsx
import { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import './AuthModal.css';

const AuthModal = ({ onClose, initialForm = 'login' }) => {
  const [activeForm, setActiveForm] = useState(initialForm);

  const handleSuccess = () => {
    // Close modal after successful login/signup
    onClose();
  };

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal-container">
        <button className="close-button" onClick={onClose}>
          <FaTimes />
        </button>

        <div className="auth-modal-tabs">
          <button
            className={`auth-tab ${activeForm === 'login' ? 'active' : ''}`}
            onClick={() => setActiveForm('login')}
          >
            Login
          </button>
          <button
            className={`auth-tab ${activeForm === 'signup' ? 'active' : ''}`}
            onClick={() => setActiveForm('signup')}
          >
            Sign Up
          </button>
        </div>

        <div className="auth-modal-content">
          {activeForm === 'login' ? (
            <LoginForm
              onSuccess={handleSuccess}
              switchToSignup={() => setActiveForm('signup')}
            />
          ) : (
            <SignupForm
              onSuccess={handleSuccess}
              switchToLogin={() => setActiveForm('login')}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
