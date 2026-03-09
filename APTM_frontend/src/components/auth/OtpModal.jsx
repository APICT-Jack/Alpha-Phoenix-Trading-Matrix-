// src/components/auth/OtpModal.jsx
import { useState } from 'react';

const OtpModal = ({ email, onVerified, onClose }) => {
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleVerify = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otpCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'OTP verification failed');
      }

      setSuccessMsg('Account verified! Redirecting to login...');
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
      const response = await fetch('http://localhost:5000/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Failed to resend OTP');

      setSuccessMsg('OTP resent successfully. Check your email.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Inline styles
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
    zIndex: 1000
  };

  const modalStyle = {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '400px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
    textAlign: 'center'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    fontSize: '16px',
    marginBottom: '1rem',
    textAlign: 'center',
    boxSizing: 'border-box'
  };

  const buttonStyle = {
    width: '100%',
    padding: '12px',
    backgroundColor: '#2979ff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginBottom: '1rem'
  };

  const disabledButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#ccc',
    cursor: 'not-allowed'
  };

  const linkButtonStyle = {
    background: 'none',
    border: 'none',
    color: '#2979ff',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontSize: '14px'
  };

  const actionsStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '1rem'
  };

  const errorStyle = {
    color: 'red',
    backgroundColor: '#ffeaea',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '1rem',
    border: '1px solid red'
  };

  const successStyle = {
    color: 'green',
    backgroundColor: '#eaffea',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '1rem',
    border: '1px solid green'
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2 style={{ marginBottom: '0.5rem', color: '#333' }}>Activate Your Account</h2>
        <p style={{ marginBottom: '1.5rem', color: '#666' }}>
          Please enter the OTP sent to <strong>{email}</strong>
        </p>

        {error && <div style={errorStyle}>{error}</div>}
        {successMsg && <div style={successStyle}>{successMsg}</div>}

        <input
          type="text"
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value)}
          placeholder="Enter 6-digit OTP"
          style={inputStyle}
          maxLength={6}
        />

        <button
          onClick={handleVerify}
          disabled={loading || otpCode.length !== 6}
          style={loading || otpCode.length !== 6 ? disabledButtonStyle : buttonStyle}
        >
          {loading ? 'Verifying...' : 'Activate Account'}
        </button>

        <div style={actionsStyle}>
          <button 
            onClick={handleResend} 
            disabled={loading} 
            style={linkButtonStyle}
          >
            Resend OTP
          </button>
          <button onClick={onClose} style={linkButtonStyle}>
            Change Email
          </button>
        </div>
      </div>
    </div>
  );
};

export default OtpModal;