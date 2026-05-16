// components/TradingConnection.jsx - Complete Trading Connection UI

import React, { useState, useEffect } from 'react';
import styles from './TradingConnection.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const TradingConnection = ({ onConnected, onSync }) => {
  const [activePlatform, setActivePlatform] = useState('mt4');
  const [formData, setFormData] = useState({
    accountId: '',
    password: '',
    broker: '',
    server: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [connectionStatus, setConnectionStatus] = useState({
    mt4: false,
    mt5: false
  });
  const [tradingStats, setTradingStats] = useState(null);
  const [badge, setBadge] = useState(null);
  const [syncing, setSyncing] = useState(false);

  // Load current connection status
  useEffect(() => {
    loadConnectionStatus();
    loadTradingAnalytics();
  }, []);

  const loadConnectionStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/profile/complete`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.user) {
          setConnectionStatus({
            mt4: result.user.tradingConnections?.mt4?.connected || false,
            mt5: result.user.tradingConnections?.mt5?.connected || false
          });
        }
      }
    } catch (error) {
      console.error('Error loading connection status:', error);
    }
  };

  const loadTradingAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/profile/analytics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setTradingStats(result.data.tradingStats);
          setBadge(result.data.badge);
        }
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleConnect = async () => {
    if (!formData.accountId || !formData.password) {
      setError('Account ID and password are required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/profile/connect/${activePlatform}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(`${activePlatform.toUpperCase()} account connected successfully!`);
        setConnectionStatus({
          ...connectionStatus,
          [activePlatform]: true
        });
        
        // Update trading stats
        if (result.data) {
          setTradingStats(result.data.tradingStats);
          setBadge(result.data.badge);
        }
        
        // Reset form
        setFormData({
          accountId: '',
          password: '',
          broker: '',
          server: ''
        });
        
        if (onConnected) onConnected(result.data);
      } else {
        setError(result.message || 'Failed to connect account');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm(`Are you sure you want to disconnect your ${activePlatform.toUpperCase()} account?`)) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/profile/disconnect/${activePlatform}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(`${activePlatform.toUpperCase()} account disconnected successfully!`);
        setConnectionStatus({
          ...connectionStatus,
          [activePlatform]: false
        });
        await loadTradingAnalytics();
      } else {
        setError(result.message || 'Failed to disconnect account');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/profile/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Trading data synced successfully!');
        if (result.data) {
          setTradingStats(result.data.tradingStats);
          setBadge(result.data.badge);
        }
        if (onSync) onSync(result.data);
      } else {
        setError(result.message || 'Failed to sync data');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const getBadgeColor = (level) => {
    const colors = {
      novice: '#9CA3AF',
      beginner: '#10B981',
      intermediate: '#3B82F6',
      advanced: '#8B5CF6',
      expert: '#F59E0B',
      pro: '#EF4444'
    };
    return colors[level] || '#9CA3AF';
  };

  const isConnected = connectionStatus[activePlatform];

  return (
    <div className={styles.container}>
      {/* Badge Display */}
      {badge && badge.level !== 'novice' && (
        <div className={styles.badgeSection}>
          <div 
            className={styles.badgeCard}
            style={{ borderColor: getBadgeColor(badge.level) }}
          >
            <div 
              className={styles.badgeIcon}
              style={{ backgroundColor: getBadgeColor(badge.level) }}
            >
              {badge.icon}
            </div>
            <div className={styles.badgeInfo}>
              <h3>{badge.title}</h3>
              <p>{badge.description}</p>
              <div className={styles.badgeScore}>
                Score: {badge.score}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Platform Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activePlatform === 'mt4' ? styles.active : ''}`}
          onClick={() => setActivePlatform('mt4')}
        >
          MetaTrader 4
          {connectionStatus.mt4 && <span className={styles.connectedBadge}>Connected</span>}
        </button>
        <button
          className={`${styles.tab} ${activePlatform === 'mt5' ? styles.active : ''}`}
          onClick={() => setActivePlatform('mt5')}
        >
          MetaTrader 5
          {connectionStatus.mt5 && <span className={styles.connectedBadge}>Connected</span>}
        </button>
      </div>

      {/* Connection Form */}
      <div className={styles.formSection}>
        {error && <div className={styles.errorMessage}>{error}</div>}
        {success && <div className={styles.successMessage}>{success}</div>}

        {!isConnected ? (
          <>
            <div className={styles.formGroup}>
              <label>Account ID / Login</label>
              <input
                type="text"
                name="accountId"
                value={formData.accountId}
                onChange={handleInputChange}
                placeholder="Enter your MT account number"
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your MT password"
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Broker (Optional)</label>
              <input
                type="text"
                name="broker"
                value={formData.broker}
                onChange={handleInputChange}
                placeholder="Your broker name"
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Server (Optional)</label>
              <input
                type="text"
                name="server"
                value={formData.server}
                onChange={handleInputChange}
                placeholder="Server address"
                disabled={loading}
              />
            </div>

            <button
              className={styles.connectBtn}
              onClick={handleConnect}
              disabled={loading}
            >
              {loading ? 'Connecting...' : `Connect ${activePlatform.toUpperCase()}`}
            </button>
          </>
        ) : (
          <div className={styles.connectedSection}>
            <div className={styles.connectedInfo}>
              <div className={styles.statusIcon}>✅</div>
              <h3>Connected to {activePlatform.toUpperCase()}</h3>
              <p>Your trading data is being synced automatically</p>
            </div>

            <button
              className={styles.syncBtn}
              onClick={handleSync}
              disabled={syncing}
            >
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>

            <button
              className={styles.disconnectBtn}
              onClick={handleDisconnect}
              disabled={loading}
            >
              Disconnect
            </button>
          </div>
        )}
      </div>

      {/* Trading Stats Display */}
      {tradingStats && tradingStats.totalTrades > 0 && (
        <div className={styles.statsSection}>
          <h3>Trading Performance</h3>
          
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Total Trades</span>
              <span className={styles.statValue}>{tradingStats.totalTrades}</span>
            </div>
            
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Win Rate</span>
              <span className={styles.statValue}>{tradingStats.winRate}%</span>
            </div>
            
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Profit Factor</span>
              <span className={styles.statValue}>{tradingStats.profitFactor}</span>
            </div>
            
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Net Profit</span>
              <span className={styles.statValue}>${tradingStats.totalNetProfit?.toLocaleString()}</span>
            </div>
            
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Sharpe Ratio</span>
              <span className={styles.statValue}>{tradingStats.sharpeRatio}</span>
            </div>
            
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Max Drawdown</span>
              <span className={styles.statValue}>{tradingStats.maxDrawdownPercent}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradingConnection;