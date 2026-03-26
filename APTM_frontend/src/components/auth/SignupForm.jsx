// src/components/auth/SignupForm.jsx
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './SignupForm.module.css';
import OtpModal from './OtpModal';

const SignupForm = ({ onSuccess, switchToLogin, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');

  const validateField = useCallback((name, value, allData = formData) => {
    switch (name) {
      case 'name':
        if (!value) return 'Full name is required';
        if (value.length < 2) return 'Name must be at least 2 characters';
        return '';
      case 'username':
        if (!value) return 'Username is required';
        if (value.length < 3) return 'Username must be at least 3 characters';
        if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Username can only contain letters, numbers, and underscores';
        return '';
      case 'email':
        if (!value) return 'Email is required';
        if (!/\S+@\S+\.\S+/.test(value)) return 'Please enter a valid email address';
        return '';
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        if (allData.confirmPassword && value !== allData.confirmPassword) {
          setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
        }
        return '';
      case 'confirmPassword':
        if (!value) return 'Please confirm your password';
        if (value !== allData.password) return 'Passwords do not match';
        return '';
      default:
        return '';
    }
  }, [formData]);

  const validateForm = useCallback(() => {
    const newErrors = {};
    newErrors.name = validateField('name', formData.name);
    newErrors.username = validateField('username', formData.username);
    newErrors.email = validateField('email', formData.email);
    newErrors.password = validateField('password', formData.password);
    newErrors.confirmPassword = validateField('confirmPassword', formData.confirmPassword);
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
    const allTouched = Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {});
    setTouched(allTouched);
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');

      setPendingEmail(formData.email);
      setShowOtp(true);
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerified = () => {
    setShowOtp(false);
    if (onSuccess) onSuccess();
  };

  const handleOtpClose = () => {
    setShowOtp(false);
  };

  const errorVariants = {
    hidden: { opacity: 0, y: -10, height: 0 },
    visible: { opacity: 1, y: 0, height: 'auto', transition: { duration: 0.2 } },
    exit: { opacity: 0, y: -10, height: 0, transition: { duration: 0.15 } }
  };

  return (
    <>
      <div className={styles.container}>
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.header}>
            <h2 className={styles.title}>Create Account</h2>
            <p className={styles.subtitle}>Join our community and start your journey</p>
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

          {/* Name Field */}
          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.label}>Full Name</label>
            <div className={`${styles.inputContainer} ${errors.name && touched.name ? styles.error : ''}`}>
              <svg className={styles.inputIcon} viewBox="0 0 20 20" fill="none">
                <path d="M10 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 18v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                className={styles.input}
                placeholder="Enter your full name"
                disabled={loading}
                autoComplete="name"
              />
            </div>
            <AnimatePresence>
              {errors.name && touched.name && (
                <motion.p className={styles.fieldError} variants={errorVariants} initial="hidden" animate="visible" exit="exit">
                  {errors.name}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Username Field */}
          <div className={styles.formGroup}>
            <label htmlFor="username" className={styles.label}>Username</label>
            <div className={`${styles.inputContainer} ${errors.username && touched.username ? styles.error : ''}`}>
              <svg className={styles.inputIcon} viewBox="0 0 20 20" fill="none">
                <path d="M10 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 18v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="10" cy="6" r="3" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                onBlur={handleBlur}
                className={styles.input}
                placeholder="Choose a username"
                disabled={loading}
                autoComplete="username"
              />
            </div>
            <AnimatePresence>
              {errors.username && touched.username && (
                <motion.p className={styles.fieldError} variants={errorVariants} initial="hidden" animate="visible" exit="exit">
                  {errors.username}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Email Field */}
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>Email Address</label>
            <div className={`${styles.inputContainer} ${errors.email && touched.email ? styles.error : ''}`}>
              <svg className={styles.inputIcon} viewBox="0 0 20 20" fill="none">
                <path d="M2.5 6.66667L8.232 10.8987C9.21067 11.624 10.7893 11.624 11.768 10.8987L17.5 6.66667M4.16667 15.8333H15.8333C16.7538 15.8333 17.5 15.0871 17.5 14.1667V5.83333C17.5 4.91286 16.7538 4.16667 15.8333 4.16667H4.16667C3.24619 4.16667 2.5 4.91286 2.5 5.83333V14.1667C2.5 15.0871 3.24619 15.8333 4.16667 15.8333Z" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={styles.input}
                placeholder="Enter your email"
                disabled={loading}
                autoComplete="email"
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

          {/* Password Field */}
          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <div className={`${styles.inputContainer} ${errors.password && touched.password ? styles.error : ''}`}>
              <svg className={styles.inputIcon} viewBox="0 0 20 20" fill="none">
                <rect x="3" y="11" width="14" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M6 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className={styles.input}
                placeholder="Create a password (min. 6 characters)"
                disabled={loading}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={styles.passwordToggle}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <svg viewBox="0 0 20 20" fill="none">
                  {showPassword ? (
                    <path d="M2.5 2.5L17.5 17.5M8.703 8.703C8.259 9.147 8 9.75 8 10.417C8 11.75 9.083 12.833 10.417 12.833C11.083 12.833 11.687 12.574 12.13 12.13" stroke="currentColor" strokeWidth="1.5"/>
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

          {/* Confirm Password Field */}
          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>Confirm Password</label>
            <div className={`${styles.inputContainer} ${errors.confirmPassword && touched.confirmPassword ? styles.error : ''}`}>
              <svg className={styles.inputIcon} viewBox="0 0 20 20" fill="none">
                <path d="M16.5 9.5L9.5 16.5L4 12L11 5L16.5 9.5Z" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M13 8L8 13" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                className={styles.input}
                placeholder="Confirm your password"
                disabled={loading}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className={styles.passwordToggle}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                <svg viewBox="0 0 20 20" fill="none">
                  {showConfirmPassword ? (
                    <path d="M2.5 2.5L17.5 17.5M8.703 8.703C8.259 9.147 8 9.75 8 10.417C8 11.75 9.083 12.833 10.417 12.833C11.083 12.833 11.687 12.574 12.13 12.13" stroke="currentColor" strokeWidth="1.5"/>
                  ) : (
                    <path d="M2.5 10C2.5 10 5.833 4.167 10 4.167C14.167 4.167 17.5 10 17.5 10C17.5 10 14.167 15.833 10 15.833C5.833 15.833 2.5 10 2.5 10Z" stroke="currentColor" strokeWidth="1.5"/>
                  )}
                </svg>
              </button>
            </div>
            <AnimatePresence>
              {errors.confirmPassword && touched.confirmPassword && (
                <motion.p className={styles.fieldError} variants={errorVariants} initial="hidden" animate="visible" exit="exit">
                  {errors.confirmPassword}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className={styles.submitButton}
          >
            {loading ? (
              <>
                <svg className={styles.spinner} viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3"/>
                  <path d="M10 2a8 8 0 0 1 8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Creating account...
              </>
            ) : (
              'Sign Up'
            )}
          </button>

          <div className={styles.switchText}>
            Already have an account?{' '}
            <button 
              type="button" 
              onClick={switchToLogin} 
              className={styles.switchButton}
              disabled={loading}
            >
              Sign in
            </button>
          </div>
        </form>
      </div>

      {showOtp && (
        <OtpModal 
          email={pendingEmail} 
          onVerified={handleOtpVerified} 
          onClose={handleOtpClose} 
        />
      )}
    </>
  );
};

export default SignupForm;