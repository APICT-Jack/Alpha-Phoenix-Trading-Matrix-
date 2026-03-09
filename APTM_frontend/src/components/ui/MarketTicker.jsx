import { useState } from 'react';

export default function MarketTicker() {
  const [isVisible, setIsVisible] = useState(true);
  
  const tickerItems = [
    { symbol: 'EUR/USD', price: '1.0854', change: 'positive', percent: '+0.24%' },
    { symbol: 'GBP/USD', price: '1.2658', change: 'negative', percent: '-0.12%' },
    { symbol: 'BTC/USD', price: '42,356.78', change: 'positive', percent: '+2.45%' },
    { symbol: 'ETH/USD', price: '2,345.67', change: 'positive', percent: '+1.89%' },
    { symbol: 'SPX500', price: '4,567.89', change: 'negative', percent: '-0.34%' },
    { symbol: 'GOLD', price: '1,987.56', change: 'positive', percent: '+0.67%' }
  ];

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="market-ticker" aria-hidden="true">
      <button 
        className="ticker-close-button" 
        onClick={handleClose}
        aria-label="Close market ticker"
        title="Close ticker"
      >
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <div className="ticker-container">
        {/* First set */}
        {tickerItems.map((item, index) => (
          <div key={`set1-${index}`} className="ticker-item">
            <span className="ticker-symbol">{item.symbol}</span>
            <span className="ticker-price">{item.price}</span>
            <span className={`ticker-change ${item.change}`}>{item.percent}</span>
          </div>
        ))}
        {/* Duplicate set for seamless loop */}
        {tickerItems.map((item, index) => (
          <div key={`set2-${index}`} className="ticker-item">
            <span className="ticker-symbol">{item.symbol}</span>
            <span className="ticker-price">{item.price}</span>
            <span className={`ticker-change ${item.change}`}>{item.percent}</span>
          </div>
        ))}
      </div>
    </div>
  );
}