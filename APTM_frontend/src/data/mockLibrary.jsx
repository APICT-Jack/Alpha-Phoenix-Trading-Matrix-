// data/mockLibrary.jsx
import React from 'react';
import { 
  FaChartLine, 
  FaChess, 
  FaPalette, 
  FaCode, 
  FaChessKnight, 
  FaChartPie, 
  FaRobot,
  FaWaveSquare,
  FaBalanceScale,
  FaBullseye,
  FaShieldAlt,
  FaMagic,
  FaCogs,
  FaProjectDiagram,
  FaMobileAlt,
  FaDesktop,
  FaDatabase,
  FaNetworkWired,
  FaCloud,
  FaLock,
  FaChartBar,
  FaExchangeAlt,
  FaFilter,
  FaCalculator,
  FaLightbulb,
  FaRocket,
  FaCrown,
  FaStar,
  FaRegChartBar,
  FaSignal,
  FaMoneyBillWave,
 
  FaHistory,
  FaSyncAlt,
  FaPuzzlePiece,
  FaCodeBranch,
  FaTerminal,
  FaServer,
  FaBolt,
  FaEye,
  FaChessBoard,
  FaChessRook,
  FaChessQueen,
  FaDice,
  FaCube,
  FaShapes,
  FaLayerGroup
} from 'react-icons/fa';

export const libraryTypes = [
  'all',
  'indicators',
  'strategies', 
  'templates',
  'scripts',
  'systems',
  'tools'
];

export const librarySortOptions = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'recent', label: 'Recently Added' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'downloads', label: 'Most Downloads' },
  { value: 'featured', label: 'Featured First' },
  { value: 'trending', label: 'Trending Now' }
];

export const LIBRARY_DATA = {
  indicators: [
    {
      id: 1,
      title: "Phoenix Momentum Indicator",
      description: "Advanced momentum detection with early trend reversal signals using multi-timeframe analysis",
      category: "Trend Analysis",
      version: "v3.2.1",
      stats: { downloads: 3842, rating: 4.9, comments: 128 },
      featured: true,
      icon: <FaChartLine />
    },
    {
      id: 2,
      title: "ATR Channel Scanner Pro",
      description: "Identifies optimal entry points based on volatility-adjusted channels with dynamic width calculation",
      category: "Volatility",
      version: "v2.0.3",
      stats: { downloads: 2156, rating: 4.7, comments: 87 },
      featured: false,
      icon: <FaWaveSquare />
    },
    {
      id: 3,
      title: "Quantum Support Resistance",
      description: "AI-powered support and resistance levels with volume confirmation and break detection",
      category: "Levels",
      version: "v4.1.0",
      stats: { downloads: 5123, rating: 4.8, comments: 234 },
      featured: true,
      icon: <FaBalanceScale />
    },
    {
      id: 4,
      title: "Fibonacci Harmony Tool",
      description: "Advanced Fibonacci retracement and extension levels with harmonic pattern detection",
      category: "Fibonacci",
      version: "v1.8.2",
      stats: { downloads: 1876, rating: 4.6, comments: 93 },
      featured: false,
      icon: <FaProjectDiagram />
    },
    {
      id: 5,
      title: "Volume Profile Master",
      description: "Complete volume profile analysis with value area and point of control detection",
      category: "Volume",
      version: "v2.5.0",
      stats: { downloads: 2987, rating: 4.9, comments: 156 },
      featured: true,
      icon: <FaChartBar />
    },
    {
      id: 6,
      title: "Market Structure Analyzer",
      description: "Automated market structure analysis with swing point detection and trend validation",
      category: "Structure",
      version: "v1.3.4",
      stats: { downloads: 1423, rating: 4.5, comments: 67 },
      featured: false,
      icon: <FaNetworkWired />
    }
  ],
  strategies: [
    {
      id: 7,
      title: "Breakout Momentum Pro",
      description: "Advanced breakout strategy with volume confirmation and false breakout protection",
      category: "Trend Following",
      version: "v2.1.0",
      stats: { downloads: 1842, rating: 4.7, comments: 56 },
      featured: false,
      icon: <FaChess />
    },
    {
      id: 8,
      title: "Bollinger Bounce Elite",
      description: "Profitable mean reversion strategy using Bollinger Bands with RSI confirmation",
      category: "Mean Reversion",
      version: "v1.5.2",
      stats: { downloads: 1245, rating: 4.5, comments: 42 },
      featured: false,
      icon: <FaChessKnight />
    },
    {
      id: 9,
      title: "Scalper's Edge System",
      description: "High-frequency scalping strategy for quick profits with tight risk management",
      category: "Scalping",
      version: "v3.0.1",
      stats: { downloads: 3210, rating: 4.8, comments: 189 },
      featured: true,
      icon: <FaBullseye />
    },
    {
      id: 10,
      title: "Swing Trader's Toolkit",
      description: "Complete swing trading system with position sizing and multi-timeframe analysis",
      category: "Swing Trading",
      version: "v2.8.3",
      stats: { downloads: 2765, rating: 4.7, comments: 134 },
      featured: true,
      icon: <FaExchangeAlt />
    },
    {
      id: 11,
      title: "Options Flow Strategy",
      description: "Advanced options trading strategy based on unusual options flow and volume analysis",
      category: "Options",
      version: "v1.2.5",
      stats: { downloads: 987, rating: 4.6, comments: 45 },
      featured: false,
      icon: <FaMoneyBillWave />
    },
    {
      id: 12,
      title: "Cryptocurrency Arbitrage",
      description: "Multi-exchange arbitrage strategy for cryptocurrency markets with automated execution",
      category: "Arbitrage",
      version: "v2.3.0",
      stats: { downloads: 1543, rating: 4.4, comments: 78 },
      featured: false,
      icon: <FaSyncAlt />
    }
  ],
  templates: [
    {
      id: 13,
      title: "Advanced Trading Dashboard Pro",
      description: "Complete trading workspace with multiple chart layouts, watchlists, and news integration",
      category: "Dashboard",
      version: "v1.5.2",
      stats: { downloads: 2451, rating: 4.8, comments: 124 },
      featured: true,
      icon: <FaPalette />
    },
    {
      id: 14,
      title: "Multi-Timeframe Analysis Suite",
      description: "Pre-configured workspace for analyzing multiple timeframes with synchronized charts",
      category: "Analysis",
      version: "v2.0.0",
      stats: { downloads: 1876, rating: 4.6, comments: 93 },
      featured: true,
      icon: <FaChartPie />
    },
    {
      id: 15,
      title: "Mobile Trading Dashboard",
      description: "Optimized trading template for mobile devices with touch-friendly interface",
      category: "Mobile",
      version: "v1.2.1",
      stats: { downloads: 1324, rating: 4.7, comments: 67 },
      featured: false,
      icon: <FaMobileAlt />
    },
    {
      id: 16,
      title: "Institutional Trading Layout",
      description: "Professional trading layout used by institutional traders with advanced order management",
      category: "Professional",
      version: "v3.1.0",
      stats: { downloads: 876, rating: 4.9, comments: 45 },
      featured: true,
      icon: <FaDesktop />
    },
    {
      id: 17,
      title: "Risk Management Dashboard",
      description: "Comprehensive risk management template with position sizing and portfolio analysis",
      category: "Risk Management",
      version: "v1.8.3",
      stats: { downloads: 1987, rating: 4.8, comments: 89 },
      featured: false,
      icon: <FaShieldAlt />
    },
    {
      id: 18,
      title: "Algorithmic Trading Workspace",
      description: "Specialized template for algorithmic traders with backtesting and optimization tools",
      category: "Algorithmic",
      version: "v2.5.2",
      stats: { downloads: 1123, rating: 4.6, comments: 56 },
      featured: true,
      icon: <FaCogs />
    }
  ],
  scripts: [
    {
      id: 19,
      title: "Auto Risk Management Pro",
      description: "Automatically calculates position size based on account balance and risk tolerance",
      category: "Automation",
      version: "v3.0.1",
      stats: { downloads: 3127, rating: 4.9, comments: 87 },
      featured: false,
      icon: <FaCode />
    },
    {
      id: 20,
      title: "Trend Following EA Elite",
      description: "Automated trading system that follows strong trends with dynamic trailing stops",
      category: "Trading Bot",
      version: "v1.8.3",
      stats: { downloads: 2543, rating: 4.8, comments: 112 },
      featured: true,
      icon: <FaRobot />
    },
    {
      id: 21,
      title: "News Sentiment Analyzer",
      description: "Real-time news sentiment analysis with automatic trade execution based on market sentiment",
      category: "Sentiment",
      version: "v2.2.0",
      stats: { downloads: 1876, rating: 4.7, comments: 94 },
      featured: true,
      icon: <FaMagic />
    },
    {
      id: 22,
      title: "Backtesting Framework Pro",
      description: "Advanced backtesting framework with walk-forward optimization and Monte Carlo simulation",
      category: "Backtesting",
      version: "v4.1.2",
      stats: { downloads: 2345, rating: 4.9, comments: 134 },
      featured: false,
      icon: <FaHistory />
    },
    {
      id: 23,
      title: "Portfolio Rebalancer",
      description: "Automatic portfolio rebalancing script with risk parity and modern portfolio theory",
      category: "Portfolio",
      version: "v1.6.3",
      stats: { downloads: 1432, rating: 4.6, comments: 67 },
      featured: false,
      icon: <FaBalanceScale />
    },
    {
      id: 24,
      title: "Market Maker Simulator",
      description: "Advanced market making simulation with spread capture and inventory management",
      category: "Simulation",
      version: "v2.3.1",
      stats: { downloads: 876, rating: 4.5, comments: 43 },
      featured: true,
      icon: <FaChessBoard />
    }
  ],
  systems: [
    {
      id: 25,
      title: "Quantum Trading System",
      description: "Complete AI-powered trading system with machine learning and pattern recognition",
      category: "AI Trading",
      version: "v5.2.0",
      stats: { downloads: 1987, rating: 4.9, comments: 156 },
      featured: true,
      icon: <FaBolt />
    },
    {
      id: 26,
      title: "Hedge Fund Replication",
      description: "Systematic strategy replicating top hedge fund strategies with risk management",
      category: "Institutional",
      version: "v3.1.4",
      stats: { downloads: 1123, rating: 4.7, comments: 78 },
      featured: true,
      icon: <FaCrown />
    },
    {
      id: 27,
      title: "Market Neutral Portfolio",
      description: "Complete market neutral trading system with pairs trading and statistical arbitrage",
      category: "Market Neutral",
      version: "v2.8.2",
      stats: { downloads: 876, rating: 4.6, comments: 45 },
      featured: false,
      icon: <FaShieldAlt />
    },
    {
      id: 28,
      title: "High Frequency Trading Engine",
      description: "Ultra-low latency trading system for high-frequency strategies with direct market access",
      category: "HFT",
      version: "v4.0.1",
      stats: { downloads: 654, rating: 4.8, comments: 32 },
      featured: true,
      icon: <FaRocket />
    },
    {
      id: 29,
      title: "Global Macro System",
      description: "Comprehensive global macro trading system with economic data integration",
      category: "Macro",
      version: "v3.5.2",
      stats: { downloads: 987, rating: 4.7, comments: 56 },
      featured: false,
      icon: <FaCode />
    },
    {
      id: 30,
      title: "Quantitative Value System",
      description: "Data-driven value investing system with fundamental analysis and screening",
      category: "Quantitative",
      version: "v2.2.3",
      stats: { downloads: 1324, rating: 4.6, comments: 67 },
      featured: true,
      icon: <FaCalculator />
    }
  ],
  tools: [
    {
      id: 31,
      title: "Advanced Position Sizer",
      description: "Sophisticated position sizing calculator with multiple risk models and portfolio integration",
      category: "Risk Management",
      version: "v2.1.0",
      stats: { downloads: 2876, rating: 4.8, comments: 134 },
      featured: true,
      icon: <FaCalculator />
    },
    {
      id: 32,
      title: "Trade Journal Pro",
      description: "Comprehensive trade journal with performance analytics and psychological tracking",
      category: "Analytics",
      version: "v1.7.3",
      stats: { downloads: 1987, rating: 4.9, comments: 89 },
      featured: false,
      icon: <FaRegChartBar />
    },
    {
      id: 33,
      title: "Economic Calendar Plus",
      description: "Advanced economic calendar with impact analysis and automated trade setups",
      category: "Fundamental",
      version: "v3.2.1",
      stats: { downloads: 1543, rating: 4.7, comments: 76 },
      featured: true,
      icon: <FaChess />
    },
    {
      id: 34,
      title: "Correlation Matrix Tool",
      description: "Dynamic correlation matrix with real-time updates and portfolio diversification analysis",
      category: "Portfolio",
      version: "v2.0.4",
      stats: { downloads: 1123, rating: 4.6, comments: 54 },
      featured: false,
      icon: <FaProjectDiagram />
    },
    {
      id: 35,
      title: "Volatility Analyzer Pro",
      description: "Comprehensive volatility analysis tool with term structure and surface modeling",
      category: "Volatility",
      version: "v4.1.2",
      stats: { downloads: 876, rating: 4.8, comments: 43 },
      featured: true,
      icon: <FaWaveSquare />
    },
    {
      id: 36,
      title: "Backtest Optimizer Suite",
      description: "Advanced backtest optimization with genetic algorithms and walk-forward testing",
      category: "Optimization",
      version: "v3.5.0",
      stats: { downloads: 1324, rating: 4.9, comments: 67 },
      featured: true,
      icon: <FaCogs />
    }
  ]
};

// Additional utility data
export const libraryCategories = [
  { id: 'indicators', name: 'Technical Indicators', count: 6, color: '#2979ff' },
  { id: 'strategies', name: 'Trading Strategies', count: 6, color: '#ff7a00' },
  { id: 'templates', name: 'Chart Templates', count: 6, color: '#00c6ff' },
  { id: 'scripts', name: 'Automation Scripts', count: 6, color: '#ff4757' },
  { id: 'systems', name: 'Trading Systems', count: 6, color: '#2ed573' },
  { id: 'tools', name: 'Trading Tools', count: 6, color: '#ffa502' }
];

export const featuredResources = LIBRARY_DATA.indicators
  .filter(resource => resource.featured)
  .concat(
    LIBRARY_DATA.strategies.filter(resource => resource.featured),
    LIBRARY_DATA.templates.filter(resource => resource.featured),
    LIBRARY_DATA.scripts.filter(resource => resource.featured),
    LIBRARY_DATA.systems.filter(resource => resource.featured),
    LIBRARY_DATA.tools.filter(resource => resource.featured)
  );

export const trendingResources = [
  LIBRARY_DATA.indicators[0],
  LIBRARY_DATA.strategies[2],
  LIBRARY_DATA.templates[0],
  LIBRARY_DATA.scripts[1],
  LIBRARY_DATA.systems[0],
  LIBRARY_DATA.tools[0]
];

export const recentlyAdded = [
  LIBRARY_DATA.indicators[5],
  LIBRARY_DATA.strategies[5],
  LIBRARY_DATA.templates[5],
  LIBRARY_DATA.scripts[5],
  LIBRARY_DATA.systems[5],
  LIBRARY_DATA.tools[5]
];