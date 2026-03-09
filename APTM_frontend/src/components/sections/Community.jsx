import React from 'react';
import { 
    FaComments, 
    FaVideo, 
    FaTrophy, 
    FaUser, 
    FaArrowRight 
  } from 'react-icons/fa';
  
  export default function Community() {
    const communityFeatures = [
      {
        id: 1,
        icon: <FaComments size={24} />,
        title: "Discussion Forums",
        description: "Engage in market discussions, share ideas, and get feedback on your trades",
        stat: (
          <span className="online-count">
            <FaUser size={14} /> 243 Online
          </span>
        ),
        cta: "Join Conversations"
      },
      {
        id: 2,
        icon: <FaVideo size={24} />,
        title: "Live Trading Rooms",
        description: "Watch professional traders analyze markets in real-time",
        stat: <span className="live-badge">LIVE</span>,
        cta: "View Schedule"
      },
      {
        id: 3,
        icon: <FaTrophy size={24} />,
        title: "Trading Challenges",
        description: "Test your skills in monthly competitions with real prizes",
        stat: <span className="prize-badge">$5K Prize</span>,
        cta: "Learn More"
      }
    ];
  
    return (
      <section className="community-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Join Our Trading Community</h2>
            <p className="section-subtitle">Connect, learn, and grow with traders worldwide</p>
          </div>
          
          <div className="community-features">
            {communityFeatures.map(feature => (
              <div key={feature.id} className="community-card">
                <div className="card-visual">
                  <div className="feature-icon">
                    {feature.icon}
                  </div>
                  <div className="stat-container">
                    {feature.stat}
                  </div>
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <button className="community-btn">
                  {feature.cta} <FaArrowRight />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }