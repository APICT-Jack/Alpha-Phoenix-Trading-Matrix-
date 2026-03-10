// components/ChartPreview.jsx
import React, { useEffect, useRef } from 'react';
import { 
  FaChartLine, 
  FaChartBar, 
  FaChartPie,  // Alternative for candlestick
  FaChartArea  // Alternative
} from 'react-icons/fa';
import styles from './styles/ChartPreview.module.css';
import { useTheme } from '../../context/ThemeContext';

const ChartPreview = ({ chartData, className = '' }) => {
  const chartRef = useRef(null);
  const { darkMode } = useTheme();
  
  useEffect(() => {
    if (!chartData || !chartRef.current) return;
    
    // If it's a TradingView chart, load the widget
    if (chartData.type === 'tradingview') {
      loadTradingViewWidget();
    }
    
    return () => {
      // Clean up
      if (window.TradingView && chartRef.current) {
        chartRef.current.innerHTML = '';
      }
    };
  }, [chartData, darkMode]);
  
  const loadTradingViewWidget = () => {
    if (!window.TradingView) {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = createTradingViewWidget;
      document.head.appendChild(script);
    } else {
      createTradingViewWidget();
    }
  };
  
  const createTradingViewWidget = () => {
    if (!chartRef.current || !window.TradingView) return;
    
    // Clear previous content
    chartRef.current.innerHTML = '';
    
    // Create a unique ID for this widget
    const widgetId = `tradingview-widget-${Date.now()}`;
    chartRef.current.id = widgetId;
    
    new window.TradingView.widget({
      autosize: true,
      symbol: chartData.symbol || 'BINANCE:BTCUSDT',
      interval: chartData.interval || '30',
      timezone: "Etc/UTC",
      theme: darkMode ? "dark" : "light",
      style: "1",
      locale: "en",
      toolbar_bg: darkMode ? "#1e222d" : "#f1f3f6",
      enable_publishing: false,
      hide_top_toolbar: true,
      hide_side_toolbar: true,
      allow_symbol_change: false,
      save_image: false,
      container_id: widgetId,
      studies: chartData.indicators || []
    });
  };
  
  const getChartIcon = () => {
    switch(chartData?.type) {
      case 'tradingview':
        return <FaChartLine />;
      case 'candlestick':
        return <FaChartBar />; // Using FaChartBar as alternative
      case 'line':
        return <FaChartLine />;
      case 'area':
        return <FaChartArea />;
      default:
        return <FaChartLine />;
    }
  };
  
  const getChartTypeLabel = () => {
    switch(chartData?.type) {
      case 'tradingview':
        return 'TradingView';
      case 'candlestick':
        return 'Candlestick';
      case 'line':
        return 'Line Chart';
      case 'area':
        return 'Area Chart';
      default:
        return 'Chart';
    }
  };
  
  if (!chartData) return null;
  
  return (
    <div className={`${styles.chartPreview} ${className}`}>
      <div className={styles.chartHeader}>
        <div className={styles.chartInfo}>
          {getChartIcon()}
          <span className={styles.chartSymbol}>{chartData.symbol}</span>
          <span className={styles.chartInterval}>
            {chartData.interval}m
          </span>
        </div>
        <div className={styles.chartBadge}>
          {getChartTypeLabel()}
        </div>
      </div>
      
      <div 
        ref={chartRef}
        className={styles.chartContainer}
        style={{ height: '200px', width: '100%' }}
      />
      
      <div className={styles.chartFooter}>
        <span>Interactive Chart • Click to expand</span>
      </div>
    </div>
  );
};

export default ChartPreview;