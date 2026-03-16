/* eslint-disable no-unused-vars */
import { FaCopy, FaChartLine, FaDesktop, FaSync, FaCog, FaChartBar, FaDollarSign, FaPercentage } from 'react-icons/fa';
import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import '../../styles/TradingCard.css';

export default function TradingCard() {
  const widgetRef = useRef(null);
  const tradingViewWidgetRef = useRef(null);
  const { darkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('tradingview');
  const [isLoading, setIsLoading] = useState(false);
  const [isMT5Connected, setIsMT5Connected] = useState(false);

  // Position settings state
  const [positionSettings, setPositionSettings] = useState({
    takeProfit: 50,
    stopLoss: 25,
    riskPercent: 2,
    lotSize: 0.1,
    leverage: 10
  });

  // Account growth statistics state
  const [accountStats, setAccountStats] = useState({
    initialBalance: 10000,
    currentBalance: 15420.50,
    profitLoss: 5420.50,
    profitLossPercent: 54.2,
    winningTrades: 45,
    losingTrades: 12,
    winRate: 78.9,
    totalTrades: 57
  });

  const getCurrentPrice = () => {
    return 36542.20; // Default price
  };

  const openFullChart = () => {
    const theme = darkMode ? "dark" : "light";
    const url = `https://www.tradingview.com/chart/?theme=${theme}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const openMT5Platform = () => {
    const url = `https://your-mt5-web-platform.com/trading/`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const copyTrade = () => {
    const tradeData = {
      currentPrice: getCurrentPrice(),
      ...positionSettings
    };
    console.log('Copy trade executed:', tradeData);
    alert(`Copy trade executed with TP: ${positionSettings.takeProfit}, SL: ${positionSettings.stopLoss}`);
  };

  // FIXED: Safe cleanup function
  const removeTradingViewWidget = () => {
    // Remove widget reference first
    if (tradingViewWidgetRef.current) {
      try {
        if (tradingViewWidgetRef.current && typeof tradingViewWidgetRef.current.remove === 'function') {
          tradingViewWidgetRef.current.remove();
        }
      } catch (error) {
        console.debug('Widget removal (non-critical):', error?.message);
      } finally {
        tradingViewWidgetRef.current = null;
      }
    }
    
    // Safely remove scripts
    try {
      const scripts = document.querySelectorAll('script[src*="tradingview.com"]');
      scripts.forEach(script => {
        if (script && script.parentNode) {
          try {
            script.parentNode.removeChild(script);
          } catch (e) {
            // Ignore
          }
        }
      });
    } catch (error) {
      // Ignore
    }
  };

  // FIXED: Initialize TradingView with proper DOM checks
  const initializeTradingView = () => {
    if (!widgetRef.current) {
      console.log('Widget ref not ready yet');
      return;
    }

    setIsLoading(true);
    
    // Clear previous content safely
    try {
      if (widgetRef.current) {
        widgetRef.current.innerHTML = '';
      }
    } catch (error) {
      console.debug('Error clearing container:', error);
    }

    // Remove any existing widget first
    removeTradingViewWidget();

    // Create container ID
    const containerId = 'tradingview-widget-' + Date.now();
    
    // Create container element
    const tvContainer = document.createElement('div');
    tvContainer.id = containerId;
    tvContainer.style.width = '100%';
    tvContainer.style.height = '100%';
    tvContainer.style.minHeight = '400px';
    
    // FIXED: Ensure widgetRef.current exists before appending
    if (widgetRef.current) {
      try {
        widgetRef.current.appendChild(tvContainer);
      } catch (error) {
        console.error('Error appending container:', error);
        setIsLoading(false);
        return;
      }
    } else {
      setIsLoading(false);
      return;
    }

    // FIXED: Check if container actually exists in DOM
    const checkContainer = () => {
      const container = document.getElementById(containerId);
      if (!container) {
        console.log('Container not yet in DOM, retrying...');
        setTimeout(checkContainer, 50);
        return false;
      }
      return true;
    };

    const loadTradingViewScript = () => {
      // First check if container exists
      if (!checkContainer()) {
        setTimeout(loadTradingViewScript, 50);
        return;
      }

      if (window.TradingView) {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          createTradingViewWidget(containerId);
        }, 100);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = () => {
        // Check container again after script loads
        if (!checkContainer()) {
          console.log('Container missing after script load');
          setIsLoading(false);
          return;
        }
        
        setTimeout(() => {
          createTradingViewWidget(containerId);
        }, 200);
      };
      script.onerror = () => {
        console.error('Failed to load TradingView script');
        setIsLoading(false);
      };
      document.head.appendChild(script);
    };

    // Start loading
    setTimeout(loadTradingViewScript, 100);
  };

  // FIXED: Create widget with proper error handling
  const createTradingViewWidget = (containerId) => {
    // Double-check container exists
    const container = document.getElementById(containerId);
    if (!window.TradingView || !container) {
      console.error('TradingView not loaded or container not found', { 
        hasTradingView: !!window.TradingView, 
        containerExists: !!container 
      });
      setIsLoading(false);
      return;
    }

    try {
      // Remove any existing widget
      removeTradingViewWidget();

      tradingViewWidgetRef.current = new window.TradingView.widget({
        autosize: true,
        symbol: 'BINANCE:BTCUSDT',
        interval: '30',
        timezone: 'Etc/UTC',
        theme: darkMode ? 'dark' : 'light',
        style: '1',
        locale: 'en',
        toolbar_bg: darkMode ? '#1e222d' : '#f1f3f6',
        enable_publishing: false,
        hide_top_toolbar: false,
        hide_side_toolbar: false,
        allow_symbol_change: true,
        save_image: false,
        container_id: containerId,
        studies: []
      });

      // Success - loading complete
      setTimeout(() => setIsLoading(false), 500);
    } catch (error) {
      console.error('Error creating TradingView widget:', error);
      setIsLoading(false);
    }
  };

  const initializePositionSettings = () => {
    if (!widgetRef.current) return;

    setIsLoading(true);
    
    // Clear previous content
    if (widgetRef.current) {
      widgetRef.current.innerHTML = '';
    }

    const positionContainer = document.createElement('div');
    positionContainer.className = 'position-settings-container';
    positionContainer.innerHTML = `
      <div class="position-settings">
        <div class="settings-section">
          <h3>Position Settings</h3>
          <div class="settings-grid">
            <div class="setting-item">
              <label>Take Profit (TP)</label>
              <div class="input-group">
                <input type="number" id="takeProfit" value="${positionSettings.takeProfit}" step="0.1" />
                <span class="input-suffix">pips</span>
              </div>
            </div>
            
            <div class="setting-item">
              <label>Stop Loss (SL)</label>
              <div class="input-group">
                <input type="number" id="stopLoss" value="${positionSettings.stopLoss}" step="0.1" />
                <span class="input-suffix">pips</span>
              </div>
            </div>
            
            <div class="setting-item">
              <label>Risk %</label>
              <div class="input-group">
                <input type="number" id="riskPercent" value="${positionSettings.riskPercent}" step="0.1" min="0.1" max="10" />
                <span class="input-suffix">%</span>
              </div>
            </div>
            
            <div class="setting-item">
              <label>Lot Size</label>
              <div class="input-group">
                <input type="number" id="lotSize" value="${positionSettings.lotSize}" step="0.01" min="0.01" max="100" />
                <span class="input-suffix">lots</span>
              </div>
            </div>
            
            <div class="setting-item">
              <label>Leverage</label>
              <div class="input-group">
                <input type="number" id="leverage" value="${positionSettings.leverage}" step="1" min="1" max="100" />
                <span class="input-suffix">x</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="risk-calculator">
          <h3>Risk Calculator</h3>
          <div class="risk-results">
            <div class="risk-item">
              <span>Risk Amount:</span>
              <span class="risk-value">$${(accountStats.currentBalance * positionSettings.riskPercent / 100).toFixed(2)}</span>
            </div>
            <div class="risk-item">
              <span>Potential Profit:</span>
              <span class="risk-value positive">$${(positionSettings.takeProfit * positionSettings.lotSize * 10).toFixed(2)}</span>
            </div>
            <div class="risk-item">
              <span>Potential Loss:</span>
              <span class="risk-value negative">$${(positionSettings.stopLoss * positionSettings.lotSize * 10).toFixed(2)}</span>
            </div>
            <div class="risk-item">
              <span>Risk/Reward:</span>
              <span class="risk-value">1:${(positionSettings.takeProfit / positionSettings.stopLoss).toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add event listeners for position settings
    const inputs = positionContainer.querySelectorAll('input');
    inputs.forEach(input => {
      input.addEventListener('change', (e) => {
        const { id, value } = e.target;
        setPositionSettings(prev => ({
          ...prev,
          [id]: parseFloat(value) || 0
        }));
      });
    });

    if (widgetRef.current) {
      widgetRef.current.appendChild(positionContainer);
    }
    setIsLoading(false);
  };

  const initializeAccountStats = () => {
    if (!widgetRef.current) return;

    setIsLoading(true);
    
    // Clear previous content
    if (widgetRef.current) {
      widgetRef.current.innerHTML = '';
    }

    const statsContainer = document.createElement('div');
    statsContainer.className = 'account-stats-container';
    statsContainer.innerHTML = `
      <div class="stats-overview">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-dollar-sign"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">$${accountStats.currentBalance.toLocaleString()}</div>
              <div class="stat-label">Current Balance</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-percentage"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value positive">+${accountStats.profitLossPercent}%</div>
              <div class="stat-label">Total P&L</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-chart-bar"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">${accountStats.winRate}%</div>
              <div class="stat-label">Win Rate</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-chart-line"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">${accountStats.totalTrades}</div>
              <div class="stat-label">Total Trades</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="performance-details">
        <div class="performance-section">
          <h3>Trade Performance</h3>
          <div class="performance-stats">
            <div class="performance-item">
              <span>Winning Trades:</span>
              <span class="performance-value positive">${accountStats.winningTrades}</span>
            </div>
            <div class="performance-item">
              <span>Losing Trades:</span>
              <span class="performance-value negative">${accountStats.losingTrades}</span>
            </div>
            <div class="performance-item">
              <span>Total Profit:</span>
              <span class="performance-value positive">$${accountStats.profitLoss.toLocaleString()}</span>
            </div>
            <div class="performance-item">
              <span>Initial Balance:</span>
              <span class="performance-value">$${accountStats.initialBalance.toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        <div class="monthly-performance">
          <h3>Monthly Performance</h3>
          <div class="monthly-stats">
            <div class="month-item">
              <span>January:</span>
              <span class="month-value positive">+15.2%</span>
            </div>
            <div class="month-item">
              <span>February:</span>
              <span class="month-value positive">+12.8%</span>
            </div>
            <div class="month-item">
              <span>March:</span>
              <span class="month-value positive">+18.5%</span>
            </div>
            <div class="month-item">
              <span>April:</span>
              <span class="month-value positive">+9.7%</span>
            </div>
          </div>
        </div>
      </div>
    `;

    if (widgetRef.current) {
      widgetRef.current.appendChild(statsContainer);
    }
    setIsLoading(false);
  };

  const handleTabChange = (tab) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      try {
        removeTradingViewWidget();
      } catch (error) {
        // Ignore
      }
    };
  }, []);

  // Initialize based on active tab
  useEffect(() => {
    let isMounted = true;
    let timeoutId;

    const loadContent = () => {
      if (!isMounted) return;
      
      // Small delay to ensure DOM is ready
      timeoutId = setTimeout(() => {
        if (!isMounted) return;

        switch (activeTab) {
          case 'tradingview':
            initializeTradingView();
            break;
          case 'positions':
            initializePositionSettings();
            break;
          case 'stats':
            initializeAccountStats();
            break;
          default:
            initializeTradingView();
        }
      }, 100);
    };

    loadContent();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [activeTab, darkMode]);

  return (
    <div className="trading-card">
      <div className="card-header">
        <div className="header-top">
          <div className="currency-pair">
            <span className="pair">BTCUSDT</span>
            <span className="price">{getCurrentPrice().toLocaleString()}</span>
            <span className="change positive">+2.34%</span>
          </div>
          
          <div className="platform-tabs">
            <button 
              className={`tab-button ${activeTab === 'tradingview' ? 'active' : ''}`}
              onClick={() => handleTabChange('tradingview')}
            >
              <FaChartLine className="tab-icon" />
              Chart
            </button>
            <button 
              className={`tab-button ${activeTab === 'positions' ? 'active' : ''}`}
              onClick={() => handleTabChange('positions')}
            >
              <FaCog className="tab-icon" />
              Position Settings
            </button>
            <button 
              className={`tab-button ${activeTab === 'stats' ? 'active' : ''}`}
              onClick={() => handleTabChange('stats')}
            >
              <FaChartBar className="tab-icon" />
              Growth
            </button>
          </div>
        </div>

        {activeTab === 'tradingview' && (
          <div className="header-bottom">
            
          </div>
        )}
      </div>
      
      <div className="platform-content">
        {isLoading && (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>Loading {activeTab === 'tradingview' ? 'TradingView' : activeTab === 'positions' ? 'Position Settings' : 'Account Statistics'}...</p>
          </div>
        )}
        
        <div 
          ref={widgetRef}
          className={`platform-container ${activeTab}`}
          style={{ 
            height: activeTab === 'tradingview' ? '400px' : 'auto',
            minHeight: activeTab === 'tradingview' ? '400px' : '200px',
            position: 'relative'
          }}
        />
      </div>
      
      <div className="card-footer">
        <div className="action-buttons">
          <button className="CopyT-btn primary" onClick={copyTrade}>
            <FaCopy /> Copy Trade
          </button>
        </div>
        
        <div className="platform-actions">
          {activeTab === 'tradingview' && (
            <button onClick={openFullChart} className="action-btn secondary">
              <FaChartLine /> Full Chart
            </button>
          )}
          <button className="action-btn settings">
            <FaCog /> Settings
          </button>
        </div>
        
        <div className="platform-indicator">
          <span className={`indicator ${activeTab}`}>
            {activeTab === 'tradingview' ? 'TradingView Chart' : 
             activeTab === 'positions' ? 'Position Settings' : 'Account Statistics'}
          </span>
        </div>
      </div>
    </div>
  );
}