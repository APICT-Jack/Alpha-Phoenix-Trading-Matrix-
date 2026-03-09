import { FaBrain, FaGraduationCap, FaUsers, FaTools, FaArrowRight } from 'react-icons/fa';
import Container from '../ui/Container'; // This imports the component we just made
import React from 'react';

export default function Features() {
  const features = [
    {
      icon: <FaBrain />,
      iconClass: 'ai',
      title: "AI-Powered Analysis",
      description: "Our proprietary algorithms analyze market conditions 24/7 to identify high-probability setups",
      linkText: "Explore AI Tools"
    },
    {
      icon: <FaGraduationCap />,
      iconClass: 'education',
      title: "Structured Education",
      description: "From beginner to advanced trader with our step-by-step curriculum and certifications",
      linkText: "View Courses"
    },
    {
      icon: <FaUsers />,
      iconClass: 'community',
      title: "Vibrant Community",
      description: "Connect with thousands of traders, share strategies, and participate in challenges",
      linkText: "Join Community"
    },
    {
      icon: <FaTools />,
      iconClass: 'tools',
      title: "Advanced Tools",
      description: "Custom indicators, automated trading, backtesting, and portfolio management",
      linkText: "Browse Tools"
    }
  ];

  return (
    <section className="features-section section">
      {/* REPLACED the div with Container component */}
      <Container>
        <h2 className="section-title">Why Alpha Phoenix Stands Out</h2>
        <p className="section-subtitle">Experience the future of trading with our unique ecosystem</p>
        
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className={`feature-card card animated`}>
              <div className={`feature-icon ${feature.iconClass}`}>
                {feature.icon}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <a href="#" className="feature-link">
                {feature.linkText} <FaArrowRight />
              </a>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}