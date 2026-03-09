import React from 'react';
import { FaChartLine, FaBalanceScale, FaTrophy, FaThumbsUp } from 'react-icons/fa';

const PerformanceMetrics = () => {
  const metrics = [
    {
      id: 1,
      value: '76.8%',
      label: 'Win Rate',
      description: 'Average win rate across all recommended trades',
      icon: <FaChartLine className="metric-icon" />
    },
    {
      id: 2,
      value: '2.4:1',
      label: 'Risk/Reward',
      description: 'Average risk-to-reward ratio maintained',
      icon: <FaBalanceScale className="metric-icon" />
    },
    {
      id: 3,
      value: '+142%',
      label: 'Avg. ROI',
      description: 'Average return for members following our system',
      icon: <FaTrophy className="metric-icon" />
    },
    {
      id: 4,
      value: '98.7%',
      label: 'Satisfaction',
      description: 'Member satisfaction with our education',
      icon: <FaThumbsUp className="metric-icon" />
    }
  ];

  return (
    <section className="performance-section py-20 bg-bg-tertiary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-2">Our Track Record</h2>
          <p className="text-text-secondary max-w-2xl mx-auto">
            Transparent performance metrics from our trading community
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {metrics.map((metric) => (
            <div key={metric.id} className="metric-card bg-card p-8 rounded-xl text-center hover:transform hover:-translate-y-2 transition-transform">
              <div className="icon-container w-16 h-16 mx-auto mb-4 rounded-full bg-primary bg-opacity-10 flex items-center justify-center text-primary">
                {metric.icon}
              </div>
              <div className="metric-value text-4xl font-bold mb-2">{metric.value}</div>
              <h3 className="text-xl font-semibold mb-2">{metric.label}</h3>
              <p className="text-text-secondary">{metric.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PerformanceMetrics;