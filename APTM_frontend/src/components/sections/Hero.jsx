import React from 'react';
import { FaRocket, FaPlayCircle } from 'react-icons/fa';
import TradingCard from '../ui/TradingCard';
import Logo from '../ui/Logo';

export default function Hero() {
  return (
    <section className="hero section">
      <div className="container">
        <div className="hero-content">
          <div className="hero-text">
            <h2>APT Deriv Broker Trading Room</h2>
            <p className="subtitle">Join our high-energy live trading room...</p>
            
            <div className="hero-stats">
              {[
                { value: '15K+', label: 'Active Traders' },
                { value: '92%', label: 'Success Rate' },
                { value: '24/7', label: 'Market Coverage' }
              ].map((stat, index) => (
                <div key={index} className="stat-item">
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              ))}
            </div>
            
            <div className="hero-cta">
              <button className="btn btn-accent">
                Join The Room <FaRocket />
              </button>
              <button className="btn btn-outline">
                Previous Session <FaPlayCircle />
              </button>
            </div>
          </div>
          
          <div className="hero-visual">
            <TradingCard />
          </div>
        </div>
      </div>
    </section>
  );
}