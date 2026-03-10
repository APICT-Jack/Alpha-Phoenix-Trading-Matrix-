// components/ChartWidget.jsx - FIXED HOVER BLINKING ISSUE
import React, { useState, useRef, useEffect } from 'react';
import { FaChartLine, FaExpand, FaCompress, FaExternalLinkAlt, FaSpinner } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import styles from './styles/ChartWidget.module.css';

const ChartWidget = ({ chartData, onClick, isExpanded = false }) => {
  const { darkMode } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState(isExpanded);
  const overlayRef = useRef(null);
  const containerRef = useRef(null);
  const hoverTimeoutRef = useRef(null);

  const {
    symbol = 'BTCUSDT',
    interval = '30',
    theme = darkMode ? 'dark' : 'light',
    height = expanded ? window.innerHeight - 200 : 300,
    hideToolbar = !expanded,
    hideSideToolbar = !expanded
  } = chartData || {};

  // Convert interval to TradingView format
  const getIntervalParam = () => {
    const intervalMap = {
      '1': '1',
      '5': '5',
      '15': '15',
      '30': '30',
      '60': '60',
      '240': '240',
      'D': '1D',
      'W': '1W',
      'M': '1M'
    };
    return intervalMap[interval] || '30';
  };

  const iframeUrl = `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_${Date.now()}&symbol=BINANCE%3A${symbol}&interval=${getIntervalParam()}&hidesidetoolbar=${hideSideToolbar ? '1' : '0'}&hidetoptoolbar=${hideToolbar ? '1' : '0'}&symboledit=0&saveimage=0&toolbarbg=${theme === 'dark' ? '1e222d' : 'f1f3f6'}&studies=[]&theme=${theme}&style=1&timezone=Etc%2FUTC&withdateranges=0&showpopupbutton=0&locale=en`;

  const handleExpandToggle = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setExpanded(!expanded);
    if (onClick) onClick();
  };

  const handleOverlayClick = (e) => {
    // Only close if clicking directly on the overlay, not its children
    if (e.target === overlayRef.current) {
      setExpanded(false);
    }
  };

  const handleContainerMouseEnter = () => {
    // Clear any pending close timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  const handleContainerMouseLeave = () => {
    // Don't auto-close, just clear any pending timeouts
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  const openFullChart = (e) => {
    e.stopPropagation();
    e.preventDefault();
    window.open(`https://www.tradingview.com/chart/?symbol=BINANCE%3A${symbol}`, '_blank');
  };

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // If expanded, render in portal/modal
  if (expanded) {
    return (
      <div 
        ref={overlayRef}
        className={styles.expandedOverlay} 
        onClick={handleOverlayClick}
      >
        <div 
          ref={containerRef}
          className={styles.expandedContainer} 
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={handleContainerMouseEnter}
          onMouseLeave={handleContainerMouseLeave}
        >
          <div className={styles.expandedHeader}>
            <div className={styles.chartInfo}>
              <FaChartLine className={styles.chartIcon} />
              <span className={styles.chartSymbol}>{symbol}</span>
              <span className={styles.chartInterval}>
                {interval === '1' && '1m'}
                {interval === '5' && '5m'}
                {interval === '15' && '15m'}
                {interval === '30' && '30m'}
                {interval === '60' && '1h'}
                {interval === '240' && '4h'}
                {interval === 'D' && '1d'}
                {interval === 'W' && '1w'}
                {interval === 'M' && '1M'}
              </span>
            </div>
            
            <div className={styles.chartActions}>
              <button 
                className={styles.expandBtn}
                onClick={handleExpandToggle}
                title="Minimize chart"
                type="button"
              >
                <FaCompress />
              </button>
              <button 
                className={styles.externalBtn}
                onClick={openFullChart}
                title="Open in TradingView"
                type="button"
              >
                <FaExternalLinkAlt />
              </button>
            </div>
          </div>

          <div className={styles.expandedChartContainer}>
            {isLoading && (
              <div className={styles.loadingOverlay}>
                <FaSpinner className={styles.spinner} />
                <p>Loading chart...</p>
              </div>
            )}
            
            <iframe
              src={iframeUrl}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                display: isLoading ? 'none' : 'block',
                pointerEvents: 'auto' // Ensure iframe captures mouse events
              }}
              onLoad={() => setIsLoading(false)}
              title={`${symbol} Chart`}
              allow="fullscreen"
            />
          </div>
        </div>
      </div>
    );
  }

  // Normal (non-expanded) view
  return (
    <div 
      className={`${styles.chartWidget} ${onClick ? styles.clickable : ''}`}
      onClick={onClick}
    >
      <div className={styles.chartHeader}>
        <div className={styles.chartInfo}>
          <FaChartLine className={styles.chartIcon} />
          <span className={styles.chartSymbol}>{symbol}</span>
          <span className={styles.chartInterval}>
            {interval === '1' && '1m'}
            {interval === '5' && '5m'}
            {interval === '15' && '15m'}
            {interval === '30' && '30m'}
            {interval === '60' && '1h'}
            {interval === '240' && '4h'}
            {interval === 'D' && '1d'}
            {interval === 'W' && '1w'}
            {interval === 'M' && '1M'}
          </span>
        </div>
        
        <div className={styles.chartActions}>
          <button 
            className={styles.expandBtn}
            onClick={handleExpandToggle}
            title="Expand chart"
            type="button"
          >
            <FaExpand />
          </button>
          <button 
            className={styles.externalBtn}
            onClick={openFullChart}
            title="Open in TradingView"
            type="button"
          >
            <FaExternalLinkAlt />
          </button>
        </div>
      </div>

      <div 
        className={styles.chartContainer}
        style={{ height: `${height}px`, minHeight: `${height}px`, position: 'relative' }}
      >
        {isLoading && (
          <div className={styles.loadingOverlay}>
            <FaSpinner className={styles.spinner} />
            <p>Loading chart...</p>
          </div>
        )}
        
        <iframe
          src={iframeUrl}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: isLoading ? 'none' : 'block'
          }}
          onLoad={() => setIsLoading(false)}
          title={`${symbol} Chart`}
          allow="fullscreen"
        />
      </div>

      <div className={styles.chartFooter}>
        <span>Interactive Chart • Powered by TradingView</span>
      </div>
    </div>
  );
};

export default ChartWidget;