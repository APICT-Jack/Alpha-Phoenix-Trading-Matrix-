// src/components/auth/LoginForm.jsx
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import styles from './LoginForm.module.css';

const LoginForm = ({ onSuccess, switchToSignup, onClose }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  
  const { signIn, signInWithGoogle } = useAuth();

  const validateField = useCallback((name, value) => {
    switch (name) {
      case 'email':
        if (!value) return 'Email is required';
        if (!/\S+@\S+\.\S+/.test(value)) return 'Please enter a valid email address';
        return '';
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        return '';
      default:
        return '';
    }
  }, []);

  const validateForm = useCallback(() => {
    const newErrors = {};
    newErrors.email = validateField('email', formData.email);
    newErrors.password = validateField('password', formData.password);
    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
  }, [formData, validateField]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
    if (serverError) setServerError('');
  }, [touched, validateField, serverError]);

  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  }, [validateField]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    
    // Mark all fields as touched
    setTouched({ email: true, password: true });
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      const result = await signIn(formData.email, formData.password);
      
      if (result?.success) {
        if (onSuccess) onSuccess();
      } else {
        setServerError(result?.message || 'Invalid email or password');
      }
    } catch (err) {
      console.error('Login error:', err);
      
      if (err.message?.includes('Network') || err.message?.includes('fetch')) {
        setServerError('Network error. Please check your connection.');
      } else if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        setServerError('Invalid email or password');
      } else if (err.message?.includes('verified')) {
        setServerError('Please verify your email before logging in');
      } else {
        setServerError(err.message || 'An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setServerError('');
    setGoogleLoading(true);

    try {
      const result = await signInWithGoogle();
      if (result?.success && onSuccess) {
        onSuccess();
      } else {
        setServerError(result?.message || 'Google sign in failed');
      }
    } catch (error) {
      setServerError(error.message || 'Google sign in failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const errorVariants = {
    hidden: { opacity: 0, y: -10, height: 0 },
    visible: { opacity: 1, y: 0, height: 'auto', transition: { duration: 0.2 } },
    exit: { opacity: 0, y: -10, height: 0, transition: { duration: 0.15 } }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <div className={styles.header}>
          <h2 className={styles.title}>Welcome Back</h2>
          <p className={styles.subtitle}>Sign in to continue your journey</p>
        </div>

        <AnimatePresence mode="wait">
          {serverError && (
            <motion.div
              className={styles.serverError}
              variants={errorVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              role="alert"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{serverError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={styles.formGroup}>
          <label htmlFor="login-email" className={styles.label}>
            Email Address
          </label>
          <div className={`${styles.inputContainer} ${errors.email && touched.email ? styles.error : ''}`}>
            <svg className={styles.inputIcon} viewBox="0 0 20 20" fill="none">
              <path d="M2.5 6.66667L8.232 10.8987C9.21067 11.624 10.7893 11.624 11.768 10.8987L17.5 6.66667M4.16667 15.8333H15.8333C16.7538 15.8333 17.5 15.0871 17.5 14.1667V5.83333C17.5 4.91286 16.7538 4.16667 15.8333 4.16667H4.16667C3.24619 4.16667 2.5 4.91286 2.5 5.83333V14.1667C2.5 15.0871 3.24619 15.8333 4.16667 15.8333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              id="login-email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              className={styles.input}
              placeholder="Enter your email"
              disabled={loading || googleLoading}
              autoComplete="email"
              aria-invalid={errors.email && touched.email}
            />
          </div>
          <AnimatePresence>
            {errors.email && touched.email && (
              <motion.p className={styles.fieldError} variants={errorVariants} initial="hidden" animate="visible" exit="exit">
                {errors.email}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className={styles.formGroup}>
          <div className={styles.labelContainer}>
            <label htmlFor="login-password" className={styles.label}>Password</label>
            <button type="button" onClick={() => {}} className={styles.forgotPassword}>
              Forgot Password?
            </button>
          </div>
          <div className={`${styles.inputContainer} ${errors.password && touched.password ? styles.error : ''}`}>
            <svg className={styles.inputIcon} viewBox="0 0 20 20" fill="none">
              <rect x="3" y="11" width="14" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M6 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              className={styles.input}
              placeholder="Enter your password"
              disabled={loading || googleLoading}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={styles.passwordToggle}
              disabled={loading || googleLoading}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <svg viewBox="0 0 20 20" fill="none">
                {showPassword ? (
                  <path d="M2.5 2.5L17.5 17.5M8.703 8.703C8.259 9.147 8 9.75 8 10.417C8 11.75 9.083 12.833 10.417 12.833C11.083 12.833 11.687 12.574 12.13 12.13M7.362 4.65C8.199 4.333 9.083 4.167 10 4.167C14.167 4.167 17.5 7.5 17.5 10C17.5 10.917 17.334 11.8 17.017 12.638M12.95 12.95C11.891 13.607 10.617 14.167 10 14.167C5.833 14.167 2.5 10.833 2.5 10C2.5 9.383 3.059 8.109 3.717 7.05" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                ) : (
                  <path d="M2.5 10C2.5 10 5.833 4.167 10 4.167C14.167 4.167 17.5 10 17.5 10C17.5 10 14.167 15.833 10 15.833C5.833 15.833 2.5 10 2.5 10Z" stroke="currentColor" strokeWidth="1.5"/>
                )}
              </svg>
            </button>
          </div>
          <AnimatePresence>
            {errors.password && touched.password && (
              <motion.p className={styles.fieldError} variants={errorVariants} initial="hidden" animate="visible" exit="exit">
                {errors.password}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <button 
          type="submit" 
          className={styles.submitButton}
          disabled={loading || googleLoading}
        >
          {loading ? (
            <>
              <svg className={styles.spinner} viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3"/>
                <path d="M10 2a8 8 0 0 1 8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </button>

        <div className={styles.divider}>
          <span>or continue with</span>
        </div>

        <button 
          type="button" 
          onClick={handleGoogleSignIn}
          className={styles.googleButton}
          disabled={loading || googleLoading}
        >
          {googleLoading ? (
            <>
              <svg className={styles.spinner} viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3"/>
                <path d="M10 2a8 8 0 0 1 8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Connecting...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M16.5 9.20455C16.5 8.56636 16.4455 7.95273 16.3455 7.36364H9V10.845H13.1918C12.9818 11.97 12.3273 12.9232 11.3318 13.5614V15.8195H14.1636C15.6545 14.4527 16.5 12.5 16.5 9.20455Z" fill="#4285F4"/>
                <path d="M9 17C11.05 17 12.7955 16.2795 14.1636 15.0682L11.3318 13.0114C10.5864 13.5341 9.62273 13.8523 8.5 13.8523C6.48636 13.8523 4.77273 12.4659 4.18636 10.6364H1.26364V12.9545C2.62727 15.6364 5.54545 17 9 17Z" fill="#34A853"/>
                <path d="M4.18636 10.6364C4.02273 10.1364 3.93182 9.60227 3.93182 9.04545C3.93182 8.48864 4.02273 7.95455 4.18636 7.45455V5.13636H1.26364C0.681818 6.30682 0.318182 7.61364 0.318182 9.04545C0.318182 10.4773 0.681818 11.7841 1.26364 12.9545L4.18636 10.6364Z" fill="#FBBC05"/>
                <path d="M9 4.19318C10.1909 4.19318 11.2545 4.61364 12.0864 5.43864L14.2318 3.29318C12.7864 1.94318 11.0418 1 9 1C5.54545 1 2.62727 2.36364 1.26364 5.13636L4.18636 7.45455C4.77273 5.625 6.48636 4.19318 9 4.19318Z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </>
          )}
        </button>

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