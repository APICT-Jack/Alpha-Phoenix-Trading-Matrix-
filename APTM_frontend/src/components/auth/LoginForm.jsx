// src/components/auth/LoginForm.jsx
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from './LoginForm.module.css';

const LoginForm = ({ onSuccess, switchToSignup, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      console.log('🔐 Attempting login with:', { email, password: '***' });
      
      const result = await signIn(email, password);
      console.log('✅ SignIn result:', result);
      
      if (result && result.success) {
        console.log('🎉 Login successful, calling onSuccess');
        setError('');
        if (onSuccess) onSuccess();
      } else {
        const errorMessage = result?.message || 'Login failed. Please check your credentials.';
        setError(errorMessage);
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      
      // Handle different error types
      if (err.message.includes('Network') || err.message.includes('Failed to fetch')) {
        setError('Network error. Please check your connection and try again.');
      } else if (err.message.includes('401') || err.message.includes('Unauthorized')) {
        setError('Invalid email or password. Please try again.');
      } else if (err.message.includes('Account not verified')) {
        setError('Please verify your email address before logging in.');
      } else if (err.message.includes('User not found')) {
        setError('No account found with this email address.');
      } else {
        setError(err.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  const handleGoogleSignIn = async () => {
  setError('');
  setGoogleLoading(true);

  try {
    console.log('🔐 Attempting Google sign in');
    
    // Open Google OAuth popup window
    const width = 500;
    const height = 600;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    const popup = window.open(
      'http://localhost:5000/api/auth/google', // Make sure this matches your backend route
      'Google Sign In',
      `width=${width},height=${height},top=${top},left=${left}`
    );

    // Listen for message from popup
    return new Promise((resolve, reject) => {
      const handleMessage = (event) => {
        // Check origin for security
        if (event.origin !== 'http://localhost:5000') {
          console.log('Origin mismatch:', event.origin);
          return;
        }

        const { success, user, token, error: authError } = event.data;
        
        if (success && user && token) {
          // Store token in localStorage
          localStorage.setItem('token', token);
          
          // Update state
          // eslint-disable-next-line no-undef
          setUser(user);
          // eslint-disable-next-line no-undef
          setIsAuthenticated(true);
          setError(null);
          
          console.log('🎉 Google sign in successful');
          popup.close();
          window.removeEventListener('message', handleMessage);
          if (onSuccess) onSuccess();
          resolve({ success: true, user });
        } else if (authError) {
          setError(authError);
          console.log('❌ Google sign in failed:', authError);
          popup.close();
          window.removeEventListener('message', handleMessage);
          resolve({ success: false, message: authError });
        }
      };

      window.addEventListener('message', handleMessage);

      // Check if popup was blocked
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        const errorMsg = 'Popup blocked. Please allow popups for this site.';
        setError(errorMsg);
        reject(new Error(errorMsg));
        return;
      }

      // Check for popup closure (user cancelled)
      const popupCheck = setInterval(() => {
        if (popup.closed) {
          clearInterval(popupCheck);
          window.removeEventListener('message', handleMessage);
          const errorMsg = 'Google sign in was cancelled.';
          setError(errorMsg);
          resolve({ success: false, message: errorMsg });
        }
      }, 500);
    });
  } catch (error) {
    console.error('❌ Google sign in error:', error);
    const errorMessage = error.message || 'Google sign in failed. Please try again.';
    setError(errorMessage);
    return { success: false, message: errorMessage };
  } finally {
    setGoogleLoading(false);
  }
};

  const handleForgotPassword = () => {
    console.log('Forgot password clicked for:', email);
    setError('Password reset functionality coming soon!');
  };

  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
    // Clear error when user starts typing
    if (error) setError('');
  };

  return (
    <div className={styles.container}>
      {onClose && (
        <button 
          type="button" 
          className={styles.closeButton} 
          onClick={onClose} 
          aria-label="Close"
          disabled={loading || googleLoading}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
      
      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <div className={styles.header}>
          <h2 className={styles.title}>Welcome Back</h2>
          <p className={styles.subtitle}>Sign in to your Alpha Phoenix Trading account</p>
        </div>
        
        {error && (
          <div className={styles.error} role="alert">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zM7 11V5h2v6H7zm0 3v-2h2v2H7z" fill="currentColor"/>
            </svg>
            <span>{error}</span>
          </div>
        )}
        
        <div className={styles.formGroup}>
          <label htmlFor="login-email" className={styles.label}>
            Email Address
          </label>
          <div className={styles.inputContainer}>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={handleInputChange(setEmail)}
              className={styles.input}
              required
              placeholder="Enter your email"
              disabled={loading || googleLoading}
              autoComplete="email"
              aria-describedby={error ? "login-error" : undefined}
            />
            <svg className={styles.inputIcon} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.5 6.66667L8.232 10.8987C9.21067 11.624 10.7893 11.624 11.768 10.8987L17.5 6.66667M4.16667 15.8333H15.8333C16.7538 15.8333 17.5 15.0871 17.5 14.1667V5.83333C17.5 4.91286 16.7538 4.16667 15.8333 4.16667H4.16667C3.24619 4.16667 2.5 4.91286 2.5 5.83333V14.1667C2.5 15.0871 3.24619 15.8333 4.16667 15.8333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        
        <div className={styles.formGroup}>
          <div className={styles.labelContainer}>
            <label htmlFor="login-password" className={styles.label}>
              Password
            </label>
            <button 
              type="button" 
              onClick={handleForgotPassword}
              className={styles.forgotPassword}
              disabled={loading || googleLoading}
            >
              Forgot Password?
            </button>
          </div>
          <div className={styles.inputContainer}>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={handleInputChange(setPassword)}
              className={styles.input}
              required
              placeholder="Enter your password"
              disabled={loading || googleLoading}
              autoComplete="current-password"
              aria-describedby={error ? "login-error" : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={styles.passwordToggle}
              disabled={loading || googleLoading}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex="-1"
            >
              <svg width="40" height="40" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                {showPassword ? (
                  <>
                    <path d="M2.5 2.5L17.5 17.5M8.703 8.703C8.259 9.147 8 9.75 8 10.417C8 11.75 9.083 12.833 10.417 12.833C11.083 12.833 11.687 12.574 12.13 12.13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7.362 4.65C8.199 4.333 9.083 4.167 10 4.167C14.167 4.167 17.5 7.5 17.5 10C17.5 10.917 17.334 11.8 17.017 12.638M12.95 12.95C11.891 13.607 10.617 14.167 10 14.167C5.833 14.167 2.5 10.833 2.5 10C2.5 9.383 3.059 8.109 3.717 7.05" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M5.833 5.833C4.25 7.083 3.333 8.75 3.333 10C3.333 12.75 6.25 15 10 15C11.25 15 12.917 14.083 14.167 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </>
                ) : (
                  <>
                    <path d="M2.5 10C2.5 10 5.833 4.167 10 4.167C14.167 4.167 17.5 10 17.5 10C17.5 10 14.167 15.833 10 15.833C5.833 15.833 2.5 10 2.5 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        <button 
          type="submit" 
          className={styles.submitButton}
          disabled={loading || googleLoading}
          aria-busy={loading}
          style={{
            backgroundColor: loading ? '#3b82f6' : '#2563eb',
            color: 'white'
          }}
        >
          {loading ? (
            <>
              <svg className={styles.spinner} width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 2.5C10 2.5 10 5.5 10 5.5C10 5.5 13 5.5 13 5.5C13 5.5 13 2.5 13 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 17.5C10 17.5 10 14.5 10 14.5C10 14.5 7 14.5 7 14.5C7 14.5 7 17.5 7 17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17.5 10C17.5 10 14.5 10 14.5 10C14.5 10 14.5 13 14.5 13C14.5 13 17.5 13 17.5 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2.5 10C2.5 10 5.5 10 5.5 10C5.5 10 5.5 7 5.5 7C5.5 7 2.5 7 2.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </button>

        <div className={styles.googleSection}>
          <div className={styles.divider}>
            <span>or continue with</span>
          </div>
          <button 
            type="button" 
            onClick={handleGoogleSignIn}
            className={styles.googleButton}
            disabled={loading || googleLoading}
            aria-busy={googleLoading}
          >
            {googleLoading ? (
              <>
                <svg className={styles.spinner} width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 2.5C10 2.5 10 5.5 10 5.5C10 5.5 13 5.5 13 5.5C13 5.5 13 2.5 13 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 17.5C10 17.5 10 14.5 10 14.5C10 14.5 7 14.5 7 14.5C7 14.5 7 17.5 7 17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17.5 10C17.5 10 14.5 10 14.5 10C14.5 10 14.5 13 14.5 13C14.5 13 17.5 13 17.5 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2.5 10C2.5 10 5.5 10 5.5 10C5.5 10 5.5 7 5.5 7C5.5 7 2.5 7 2.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Signing in with Google...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.5 9.20455C16.5 8.56636 16.4455 7.95273 16.3455 7.36364H9V10.845H13.1918C12.9818 11.97 12.3273 12.9232 11.3318 13.5614V15.8195H14.1636C15.6545 14.4527 16.5 12.5 16.5 9.20455Z" fill="#4285F4"/>
                  <path d="M9 17C11.05 17 12.7955 16.2795 14.1636 15.0682L11.3318 13.0114C10.5864 13.5341 9.62273 13.8523 8.5 13.8523C6.48636 13.8523 4.77273 12.4659 4.18636 10.6364H1.26364V12.9545C2.62727 15.6364 5.54545 17 9 17Z" fill="#34A853"/>
                  <path d="M4.18636 10.6364C4.02273 10.1364 3.93182 9.60227 3.93182 9.04545C3.93182 8.48864 4.02273 7.95455 4.18636 7.45455V5.13636H1.26364C0.681818 6.30682 0.318182 7.61364 0.318182 9.04545C0.318182 10.4773 0.681818 11.7841 1.26364 12.9545L4.18636 10.6364Z" fill="#FBBC05"/>
                  <path d="M9 4.19318C10.1909 4.19318 11.2545 4.61364 12.0864 5.43864L14.2318 3.29318C12.7864 1.94318 11.0418 1 9 1C5.54545 1 2.62727 2.36364 1.26364 5.13636L4.18636 7.45455C4.77273 5.625 6.48636 4.19318 9 4.19318Z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>
        </div>
        
        <div className={styles.switchText}>
          Don't have an account?{' '}
          <button 
            type="button" 
            onClick={switchToSignup} 
            className={styles.switchButton}
            disabled={loading || googleLoading}
          >
            Create account
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;