// src/components/auth/OtpModal.jsx
import { useState, useEffect } from 'react';

const OtpModal = ({ email, onVerified, onClose }) => {
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  // Check if we should show debug OTP
  useEffect(() => {
    // Always show OTP in development
    const isDev = import.meta.env.MODE === 'development';
    // Also check if there's a debug query param
    const urlParams = new URLSearchParams(window.location.search);
    const debug = urlParams.get('debug') === 'true';
    
    setDebugMode(isDev || debug);

    // Try to get OTP from the server
    const fetchOTP = async () => {
      try {
        // You can create a debug endpoint that returns the OTP
        // For now, we'll just log a message
        console.log('📧 If this is development, check your server console for OTP');
        
        // In production, you can still check localStorage for testing
        const storedOtp = localStorage.getItem('dev_otp_' + email);
        if (storedOtp) {
          setDevOtp(storedOtp);
          setOtpCode(storedOtp);
        }
      } catch (err) {
        console.log('Could not fetch OTP');
      }
    };

    fetchOTP();

    // Countdown timer for resend
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [email]);

  const handleVerify = async () => {
    setError('');
    setLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://alpha-phoenix-trading-matrix-backend.onrender.com/api';
      
      const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otpCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'OTP verification failed');
      }

      setSuccessMsg('Account verified! Redirecting to login...');
      
      // Clear any dev OTP from localStorage
      localStorage.removeItem('dev_otp_' + email);
      
      setTimeout(() => onVerified(), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://alpha-phoenix-trading-matrix-backend.onrender.com/api';
      
      const response = await fetch(`${API_URL}/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Failed to resend OTP');

      setSuccessMsg('OTP resent successfully. Check your email or server console.');
      
      // Reset countdown
      setCountdown(60);
      setCanResend(false);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Inline styles (same as before)
  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(5px)'
  };

  const modalStyle = {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '16px',
    width: '90%',
    maxWidth: '420px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
    textAlign: 'center',
    position: 'relative'
  };

  const closeButtonStyle = {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666',
    padding: '4px 8px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const inputStyle = {
    width: '100%',
    padding: '14px',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    fontSize: '18px',
    marginBottom: '1.5rem',
    textAlign: 'center',
    letterSpacing: '8px',
    fontWeight: 'bold',
    boxSizing: 'border-box'
  };

  const buttonStyle = {
    width: '100%',
    padding: '14px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '1rem'
  };

  const disabledButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#9ca3af',
    cursor: 'not-allowed'
  };

  const resendButtonStyle = {
    background: 'none',
    border: 'none',
    color: canResend ? '#2563eb' : '#9ca3af',
    cursor: canResend ? 'pointer' : 'default',
    textDecoration: 'underline',
    fontSize: '14px',
    fontWeight: '500'
  };

  const devOtpBoxStyle = {
    backgroundColor: '#f3f4f6',
    border: '2px dashed #2563eb',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '16px',
    textAlign: 'center'
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <button onClick={onClose} style={closeButtonStyle}>×</button>

        <h2 style={{ marginBottom: '0.5rem', color: '#1f2937', fontSize: '24px' }}>
          🔐 Verify Your Email
        </h2>
        
        <p style={{ marginBottom: '1.5rem', color: '#6b7280', fontSize: '14px' }}>
          We've sent a verification code to<br />
          <strong style={{ color: '#2563eb' }}>{email}</strong>
        </p>

        {/* SHOW OTP IN DEBUG MODE - Works on Render too! */}
        {debugMode && (
          <div style={devOtpBoxStyle}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
              🔧 DEBUG MODE - Check server console for OTP
            </div>
            <div style={{ 
              fontSize: '14px', 
              color: '#2563eb',
              marginTop: '4px'
            }}>
              Add ?debug=true to URL to enable
            </div>
            {devOtp && (
              <div style={{ 
                fontSize: '28px', 
                fontWeight: 'bold', 
                color: '#2563eb',
                letterSpacing: '4px',
                marginTop: '8px'
              }}>
                {devOtp}
              </div>
            )}
          </div>
        )}

        {/* FOR TESTING: You can also manually enter OTP from server console */}
        <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeeba',
          borderRadius: '8px',
          padding: '8px',
          marginBottom: '16px',
          fontSize: '12px',
          color: '#856404'
        }}>
          💡 Check your server console/logs for the OTP code
        </div>

        {error && (
          <div style={{
            color: '#dc2626',
            backgroundColor: '#fee2e2',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '1rem',
            border: '1px solid #fecaca',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {successMsg && (
          <div style={{
            color: '#059669',
            backgroundColor: '#d1fae5',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '1rem',
            border: '1px solid #a7f3d0',
            fontSize: '14px'
          }}>
            ✅ {successMsg}
          </div>
        )}

        <input
          type="text"
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
          placeholder="Enter 6-digit code"
          style={inputStyle}
          maxLength={6}
          autoFocus
        />

        <button
          onClick={handleVerify}
          disabled={loading || otpCode.length !== 6}
          style={loading || otpCode.length !== 6 ? disabledButtonStyle : buttonStyle}
        >
          {loading ? 'Verifying...' : 'Verify Account'}
        </button>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginTop: '0.5rem'
        }}>
          <button 
            onClick={handleResend} 
            disabled={loading || !canResend} 
            style={resendButtonStyle}
          >
            {canResend ? 'Resend Code' : `Resend in ${countdown}s`}
          </button>
          
          <button 
            onClick={onClose} 
            style={{
              ...resendButtonStyle,
              color: '#6b7280',
              textDecoration: 'none'
            }}
          >
            Change Email
          </button>
        </div>

        <p style={{
          marginTop: '1.5rem',
          fontSize: '12px',
          color: '#9ca3af',
          borderTop: '1px solid #e5e7eb',
          paddingTop: '1rem'
        }}>
          Didn't receive the code? Check your spam folder or request a new one.
        </p>
      </div>
    </div>
  );
};

export default OtpModal;