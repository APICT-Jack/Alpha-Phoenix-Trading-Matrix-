// src/components/layout/PremiumBanner.jsx
import React from 'react';

const PremiumBanner = () => {
  return (
    <div className="premium-banner">
      <div className="container">
        <span className="premium-tag">PREMIUM</span>
        <p>Unlock advanced features, exclusive indicators, and 1-on-1 coaching</p>
        <button className="upgrade-btn">
          Upgrade Now <i className="fas fa-arrow-right"></i>
        </button>
      </div>
    </div>
  );
};

export default PremiumBanner; // This is crucial