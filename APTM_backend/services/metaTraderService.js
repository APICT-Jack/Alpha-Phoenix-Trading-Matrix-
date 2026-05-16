// services/metaTraderService.js
// Complete MetaTrader API Integration Service

import axios from 'axios';
import crypto from 'crypto';

// MetaTrader Manager API Configuration
const MT_MANAGER_URL = process.env.MT_MANAGER_URL || 'https://mt-manager-api.example.com';
const MT_API_KEY = process.env.MT_API_KEY;
const MT_API_SECRET = process.env.MT_API_SECRET;

// Trading platform configurations
const PLATFORM_CONFIGS = {
  mt4: {
    apiUrl: process.env.MT4_API_URL,
    login: process.env.MT4_LOGIN,
    password: process.env.MT4_PASSWORD,
    server: process.env.MT4_SERVER
  },
  mt5: {
    apiUrl: process.env.MT5_API_URL,
    login: process.env.MT5_LOGIN,
    password: process.env.MT5_PASSWORD,
    server: process.env.MT5_SERVER
  }
};

class MetaTraderService {
  constructor() {
    this.sessions = new Map();
    this.connectionStatus = new Map();
  }

  /**
   * Generate authentication signature for MT API
   */
  generateAuthSignature(timestamp, method, path, body = '') {
    const stringToSign = `${timestamp}${method}${path}${body}`;
    return crypto
      .createHmac('sha256', MT_API_SECRET)
      .update(stringToSign)
      .digest('hex');
  }

  /**
   * Get authentication headers for MT API
   */
  getAuthHeaders(method, path, body = '') {
    const timestamp = Date.now().toString();
    const signature = this.generateAuthSignature(timestamp, method, path, body);
    
    return {
      'X-API-Key': MT_API_KEY,
      'X-Timestamp': timestamp,
      'X-Signature': signature,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Connect to MetaTrader account
   */
  async connectAccount(userId, platform, credentials) {
    try {
      console.log(`🔌 Connecting ${platform.toUpperCase()} account for user: ${userId}`);
      
      const config = PLATFORM_CONFIGS[platform];
      if (!config) {
        throw new Error(`Unsupported platform: ${platform}`);
      }

      // Validate credentials
      if (!credentials.login || !credentials.password) {
        throw new Error('Login and password are required');
      }

      // Create session key
      const sessionKey = `${userId}_${platform}_${Date.now()}`;
      
      // Attempt connection to MT server
      const connectionResult = await this.establishConnection({
        platform,
        login: credentials.login,
        password: credentials.password,
        server: credentials.server || config.server,
        sessionKey
      });

      if (!connectionResult.success) {
        throw new Error(connectionResult.error || 'Failed to connect to MetaTrader');
      }

      // Store session
      this.sessions.set(sessionKey, {
        userId,
        platform,
        login: credentials.login,
        server: credentials.server || config.server,
        connectedAt: new Date(),
        lastActivity: new Date(),
        connectionId: connectionResult.connectionId
      });

      this.connectionStatus.set(`${userId}_${platform}`, {
        connected: true,
        lastSync: new Date(),
        error: null
      });

      // Fetch initial account data
      const accountData = await this.getAccountInfo(sessionKey);
      
      // Fetch trading history
      const tradingHistory = await this.getTradingHistory(sessionKey, {
        from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Last year
        to: new Date()
      });

      return {
        success: true,
        sessionKey,
        accountData,
        tradingHistory: tradingHistory.trades,
        statistics: this.calculateStatistics(tradingHistory.trades)
      };

    } catch (error) {
      console.error(`❌ Error connecting ${platform} account:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Establish connection with MT server
   */
  async establishConnection(params) {
    // This is a placeholder - actual implementation depends on your MT API provider
    // For MetaTrader Manager API or第三方服务 like Match-Trader, DXtrade, etc.
    
    try {
      // Example using REST API
      const response = await axios.post(`${MT_MANAGER_URL}/api/connect`, {
        platform: params.platform,
        login: params.login,
        password: params.password,
        server: params.server
      }, {
        headers: this.getAuthHeaders('POST', '/api/connect', JSON.stringify({
          platform: params.platform,
          login: params.login,
          password: params.password,
          server: params.server
        }))
      });

      if (response.data && response.data.success) {
        return {
          success: true,
          connectionId: response.data.connectionId,
          serverTime: response.data.serverTime
        };
      }
      
      return {
        success: false,
        error: response.data.error || 'Connection failed'
      };

    } catch (error) {
      console.error('MT Connection error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Get account information
   */
  async getAccountInfo(sessionKey) {
    const session = this.sessions.get(sessionKey);
    if (!session) {
      throw new Error('Invalid or expired session');
    }

    try {
      const response = await axios.get(`${MT_MANAGER_URL}/api/account`, {
        params: {
          sessionId: session.connectionId,
          platform: session.platform
        },
        headers: this.getAuthHeaders('GET', '/api/account')
      });

      if (response.data && response.data.success) {
        return {
          accountId: response.data.accountId,
          balance: response.data.balance,
          equity: response.data.equity,
          margin: response.data.margin,
          freeMargin: response.data.freeMargin,
          marginLevel: response.data.marginLevel,
          leverage: response.data.leverage,
          currency: response.data.currency,
          name: response.data.name,
          server: response.data.server,
          type: response.data.type,
          status: response.data.status,
          lastUpdate: new Date()
        };
      }
      
      throw new Error(response.data.error || 'Failed to fetch account info');

    } catch (error) {
      console.error('Error fetching account info:', error);
      throw error;
    }
  }

  /**
   * Get trading history
   */
  async getTradingHistory(sessionKey, options = {}) {
    const session = this.sessions.get(sessionKey);
    if (!session) {
      throw new Error('Invalid or expired session');
    }

    const { from, to, limit = 1000, offset = 0 } = options;

    try {
      const response = await axios.get(`${MT_MANAGER_URL}/api/trades/history`, {
        params: {
          sessionId: session.connectionId,
          platform: session.platform,
          from: from?.toISOString(),
          to: to?.toISOString(),
          limit,
          offset
        },
        headers: this.getAuthHeaders('GET', '/api/trades/history')
      });

      if (response.data && response.data.success) {
        const trades = response.data.trades || [];
        
        // Format trades for our system
        const formattedTrades = trades.map(trade => ({
          id: trade.ticket || trade.id,
          symbol: trade.symbol,
          type: trade.type, // buy/sell
          orderType: trade.orderType, // market/limit/stop
          volume: trade.volume,
          openPrice: trade.openPrice,
          closePrice: trade.closePrice,
          stopLoss: trade.stopLoss,
          takeProfit: trade.takeProfit,
          profit: trade.profit,
          swap: trade.swap || 0,
          commission: trade.commission || 0,
          openTime: new Date(trade.openTime),
          closeTime: trade.closeTime ? new Date(trade.closeTime) : null,
          status: trade.status, // open/closed
          comment: trade.comment,
          magic: trade.magic
        }));

        return {
          success: true,
          trades: formattedTrades,
          total: response.data.total || formattedTrades.length,
          hasMore: response.data.hasMore || false
        };
      }
      
      return {
        success: false,
        trades: [],
        error: response.data.error || 'Failed to fetch trading history'
      };

    } catch (error) {
      console.error('Error fetching trading history:', error);
      return {
        success: false,
        trades: [],
        error: error.message
      };
    }
  }

  /**
   * Get open positions
   */
  async getOpenPositions(sessionKey) {
    const session = this.sessions.get(sessionKey);
    if (!session) {
      throw new Error('Invalid or expired session');
    }

    try {
      const response = await axios.get(`${MT_MANAGER_URL}/api/positions`, {
        params: {
          sessionId: session.connectionId,
          platform: session.platform
        },
        headers: this.getAuthHeaders('GET', '/api/positions')
      });

      if (response.data && response.data.success) {
        const positions = response.data.positions || [];
        
        const formattedPositions = positions.map(pos => ({
          id: pos.ticket,
          symbol: pos.symbol,
          type: pos.type,
          volume: pos.volume,
          openPrice: pos.openPrice,
          currentPrice: pos.currentPrice,
          stopLoss: pos.stopLoss,
          takeProfit: pos.takeProfit,
          profit: pos.profit,
          swap: pos.swap,
          openTime: new Date(pos.openTime),
          comment: pos.comment
        }));

        return {
          success: true,
          positions: formattedPositions
      };
      }
      
      return {
        success: false,
        positions: [],
        error: response.data.error
      };

    } catch (error) {
      console.error('Error fetching open positions:', error);
      return {
        success: false,
        positions: [],
        error: error.message
      };
    }
  }

  /**
   * Calculate trading statistics from history
   */
  calculateStatistics(trades) {
    const closedTrades = trades.filter(t => t.status === 'closed' && t.closeTime);
    const winningTrades = closedTrades.filter(t => t.profit > 0);
    const losingTrades = closedTrades.filter(t => t.profit < 0);
    
    const totalProfit = closedTrades.reduce((sum, t) => sum + t.profit, 0);
    const totalWins = winningTrades.reduce((sum, t) => sum + t.profit, 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.profit, 0));
    
    const winRate = closedTrades.length > 0 
      ? (winningTrades.length / closedTrades.length) * 100 
      : 0;
    
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;
    
    const averageWin = winningTrades.length > 0 ? totalWins / winningTrades.length : 0;
    const averageLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0;
    
    const largestWin = winningTrades.length > 0 
      ? Math.max(...winningTrades.map(t => t.profit)) 
      : 0;
    const largestLoss = losingTrades.length > 0 
      ? Math.min(...losingTrades.map(t => t.profit)) 
      : 0;
    
    // Calculate Sharpe Ratio (simplified)
    const returns = closedTrades.map(t => t.profit);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const sharpeRatio = Math.sqrt(variance) !== 0 ? avgReturn / Math.sqrt(variance) : 0;
    
    // Calculate maximum drawdown
    let peak = 0;
    let maxDrawdown = 0;
    let runningTotal = 0;
    
    for (const trade of closedTrades.sort((a, b) => a.closeTime - b.closeTime)) {
      runningTotal += trade.profit;
      if (runningTotal > peak) {
        peak = runningTotal;
      }
      const drawdown = peak - runningTotal;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
    
    // Calculate average holding time
    const holdingTimes = closedTrades.map(t => t.closeTime - t.openTime);
    const avgHoldingTime = holdingTimes.length > 0 
      ? holdingTimes.reduce((a, b) => a + b, 0) / holdingTimes.length 
      : 0;
    
    // Group by symbol for symbol performance
    const symbolPerformance = {};
    for (const trade of closedTrades) {
      if (!symbolPerformance[trade.symbol]) {
        symbolPerformance[trade.symbol] = { trades: 0, wins: 0, profit: 0 };
      }
      symbolPerformance[trade.symbol].trades++;
      symbolPerformance[trade.symbol].profit += trade.profit;
      if (trade.profit > 0) symbolPerformance[trade.symbol].wins++;
    }
    
    for (const symbol in symbolPerformance) {
      const perf = symbolPerformance[symbol];
      perf.winRate = perf.trades > 0 ? (perf.wins / perf.trades) * 100 : 0;
    }
    
    return {
      totalTrades: closedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      totalProfit,
      totalWins,
      totalLosses,
      winRate,
      profitFactor: profitFactor === Infinity ? 999 : profitFactor,
      averageWin,
      averageLoss,
      largestWin,
      largestLoss,
      sharpeRatio,
      maxDrawdown,
      averageHoldingTimeMs: avgHoldingTime,
      averageHoldingTimeHours: avgHoldingTime / (1000 * 60 * 60),
      symbolPerformance,
      // Performance by month
      monthlyPerformance: this.calculateMonthlyPerformance(closedTrades),
      // Risk metrics
      riskRewardRatio: averageWin / (averageLoss || 1),
      expectancy: totalProfit / closedTrades.length || 0
    };
  }

  /**
   * Calculate monthly performance breakdown
   */
  calculateMonthlyPerformance(trades) {
    const monthly = {};
    
    for (const trade of trades) {
      const monthKey = trade.closeTime.toISOString().slice(0, 7); // YYYY-MM
      if (!monthly[monthKey]) {
        monthly[monthKey] = { profit: 0, trades: 0, wins: 0 };
      }
      monthly[monthKey].profit += trade.profit;
      monthly[monthKey].trades++;
      if (trade.profit > 0) monthly[monthKey].wins++;
    }
    
    // Calculate win rate per month
    for (const month in monthly) {
      monthly[month].winRate = (monthly[month].wins / monthly[month].trades) * 100;
    }
    
    return monthly;
  }

  /**
   * Get badge based on trading performance
   * This determines user's actual skill level from real trading data
   */
  getPerformanceBadge(statistics) {
    const {
      totalTrades,
      winRate,
      profitFactor,
      sharpeRatio,
      maxDrawdown,
      averageHoldingTimeHours,
      totalProfit
    } = statistics;
    
    // Calculate composite score
    let score = 0;
    
    // Trade volume
    if (totalTrades >= 500) score += 25;
    else if (totalTrades >= 200) score += 20;
    else if (totalTrades >= 100) score += 15;
    else if (totalTrades >= 50) score += 10;
    else if (totalTrades >= 20) score += 5;
    
    // Win rate
    if (winRate >= 65) score += 25;
    else if (winRate >= 55) score += 20;
    else if (winRate >= 45) score += 15;
    else if (winRate >= 40) score += 10;
    else if (winRate >= 35) score += 5;
    
    // Profit factor
    if (profitFactor >= 2) score += 20;
    else if (profitFactor >= 1.5) score += 15;
    else if (profitFactor >= 1.2) score += 10;
    else if (profitFactor >= 1) score += 5;
    
    // Sharpe ratio (risk-adjusted returns)
    if (sharpeRatio >= 1.5) score += 15;
    else if (sharpeRatio >= 1) score += 10;
    else if (sharpeRatio >= 0.5) score += 5;
    
    // Drawdown management
    if (maxDrawdown <= 10) score += 15;
    else if (maxDrawdown <= 20) score += 10;
    else if (maxDrawdown <= 30) score += 5;
    
    // Determine badge level
    if (score >= 80 && totalTrades >= 200 && winRate >= 55) {
      return {
        level: 'expert',
        badge: '🏆 Expert Trader',
        title: 'Expert Trader',
        description: 'Master trader with exceptional performance and risk management',
        score,
        requirements: {
          minTrades: 200,
          minWinRate: 55,
          minProfitFactor: 1.5
        }
      };
    } else if (score >= 60 && totalTrades >= 100 && winRate >= 50) {
      return {
        level: 'advanced',
        badge: '📈 Advanced Trader',
        title: 'Advanced Trader',
        description: 'Consistent performer with strong trading metrics',
        score,
        requirements: {
          minTrades: 100,
          minWinRate: 50,
          minProfitFactor: 1.2
        }
      };
    } else if (score >= 40 && totalTrades >= 30 && winRate >= 45) {
      return {
        level: 'intermediate',
        badge: '📊 Intermediate Trader',
        title: 'Intermediate Trader',
        description: 'Developing trader with positive results',
        score,
        requirements: {
          minTrades: 30,
          minWinRate: 45,
          minProfitFactor: 1.0
        }
      };
    } else if (score >= 20 && totalTrades >= 10) {
      return {
        level: 'beginner',
        badge: '🌱 Beginner Trader',
        title: 'Beginner Trader',
        description: 'Starting trading journey with active engagement',
        score,
        requirements: {
          minTrades: 10,
          minWinRate: 35
        }
      };
    } else {
      return {
        level: 'novice',
        badge: '📚 Novice Trader',
        title: 'Novice Trader',
        description: 'New to trading - learn and grow',
        score,
        requirements: {
          minTrades: 1
        }
      };
    }
  }

  /**
   * Disconnect MetaTrader account
   */
  async disconnectAccount(sessionKey) {
    const session = this.sessions.get(sessionKey);
    if (!session) {
      return { success: true, message: 'Session already closed' };
    }

    try {
      await axios.post(`${MT_MANAGER_URL}/api/disconnect`, {
        sessionId: session.connectionId,
        platform: session.platform
      }, {
        headers: this.getAuthHeaders('POST', '/api/disconnect')
      });
      
      this.sessions.delete(sessionKey);
      this.connectionStatus.delete(`${session.userId}_${session.platform}`);
      
      return {
        success: true,
        message: 'Account disconnected successfully'
      };
    } catch (error) {
      console.error('Error disconnecting:', error);
      // Still remove from local storage even if API call fails
      this.sessions.delete(sessionKey);
      return {
        success: true,
        message: 'Account disconnected locally'
      };
    }
  }

  /**
   * Sync trading data for a user
   */
  async syncUserTradingData(userId, platform, sessionKey) {
    try {
      const session = this.sessions.get(sessionKey);
      if (!session) {
        throw new Error('Session not found');
      }

      // Fetch latest account info
      const accountInfo = await this.getAccountInfo(sessionKey);
      
      // Fetch new trades since last sync
      const lastSync = session.lastActivity;
      const newTrades = await this.getTradingHistory(sessionKey, {
        from: lastSync,
        to: new Date()
      });
      
      // Update session last activity
      session.lastActivity = new Date();
      this.sessions.set(sessionKey, session);
      
      // Update connection status
      this.connectionStatus.set(`${userId}_${platform}`, {
        connected: true,
        lastSync: new Date(),
        error: null
      });
      
      return {
        success: true,
        accountInfo,
        newTrades: newTrades.trades,
        syncTime: new Date()
      };
    } catch (error) {
      console.error('Error syncing trading data:', error);
      this.connectionStatus.set(`${userId}_${platform}`, {
        connected: false,
        lastSync: null,
        error: error.message
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verify if a user is connected to any trading platform
   */
  isConnected(userId, platform) {
    const status = this.connectionStatus.get(`${userId}_${platform}`);
    return status?.connected || false;
  }

  /**
   * Get all connected platforms for a user
   */
  getUserConnectedPlatforms(userId) {
    const platforms = [];
    for (const [key, status] of this.connectionStatus.entries()) {
      if (key.startsWith(`${userId}_`) && status.connected) {
        const platform = key.split('_')[1];
        platforms.push(platform);
      }
    }
    return platforms;
  }
}

export default new MetaTraderService();