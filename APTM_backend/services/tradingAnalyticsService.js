// services/tradingAnalyticsService.js
// Complete Trading Analytics and Badge Calculation Service

import MetaTraderService from './metaTraderService.js';
import UserProfile from '../models/UserProfile.js';
import User from '../models/User.js';

class TradingAnalyticsService {
  constructor() {
    this.badgeLevels = {
      novice: {
        name: 'Novice Trader',
        icon: '📚',
        color: '#9CA3AF',
        bgColor: 'rgba(156, 163, 175, 0.1)',
        description: 'New to trading - learning the basics',
        minTrades: 0,
        minWinRate: 0,
        minProfitFactor: 0
      },
      beginner: {
        name: 'Beginner Trader',
        icon: '🌱',
        color: '#10B981',
        bgColor: 'rgba(16, 185, 129, 0.1)',
        description: 'Active trader developing skills',
        minTrades: 10,
        minWinRate: 35,
        minProfitFactor: 0.8
      },
      intermediate: {
        name: 'Intermediate Trader',
        icon: '📊',
        color: '#3B82F6',
        bgColor: 'rgba(59, 130, 246, 0.1)',
        description: 'Consistent trader with solid results',
        minTrades: 50,
        minWinRate: 45,
        minProfitFactor: 1.0
      },
      advanced: {
        name: 'Advanced Trader',
        icon: '📈',
        color: '#8B5CF6',
        bgColor: 'rgba(139, 92, 246, 0.1)',
        description: 'Skilled trader with excellent performance',
        minTrades: 150,
        minWinRate: 52,
        minProfitFactor: 1.3
      },
      expert: {
        name: 'Expert Trader',
        icon: '🏆',
        color: '#F59E0B',
        bgColor: 'rgba(245, 158, 11, 0.1)',
        description: 'Master trader with exceptional metrics',
        minTrades: 300,
        minWinRate: 58,
        minProfitFactor: 1.5
      },
      pro: {
        name: 'Pro Trader',
        icon: '⭐',
        color: '#EF4444',
        bgColor: 'rgba(239, 68, 68, 0.1)',
        description: 'Elite professional trader',
        minTrades: 500,
        minWinRate: 62,
        minProfitFactor: 1.8
      }
    };
  }

  /**
   * Calculate complete trading profile from raw trade data
   */
  calculateTradingProfile(trades, accountInfo = null) {
    if (!trades || trades.length === 0) {
      return this.getEmptyProfile();
    }

    const closedTrades = trades.filter(t => t.status === 'closed' && t.closeTime);
    const openPositions = trades.filter(t => t.status === 'open');
    
    // Basic metrics
    const totalTrades = closedTrades.length;
    const winningTrades = closedTrades.filter(t => t.profit > 0);
    const losingTrades = closedTrades.filter(t => t.profit < 0);
    const breakevenTrades = closedTrades.filter(t => t.profit === 0);
    
    // Profit metrics
    const totalGrossProfit = winningTrades.reduce((sum, t) => sum + t.profit, 0);
    const totalGrossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.profit, 0));
    const totalNetProfit = totalGrossProfit - totalGrossLoss;
    
    // Win rate
    const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
    
    // Profit factor
    const profitFactor = totalGrossLoss > 0 ? totalGrossProfit / totalGrossLoss : totalGrossProfit > 0 ? Infinity : 0;
    
    // Average metrics
    const averageWin = winningTrades.length > 0 ? totalGrossProfit / winningTrades.length : 0;
    const averageLoss = losingTrades.length > 0 ? totalGrossLoss / losingTrades.length : 0;
    const averageTrade = totalTrades > 0 ? totalNetProfit / totalTrades : 0;
    
    // Largest trades
    const largestWin = winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.profit)) : 0;
    const largestLoss = losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.profit)) : 0;
    
    // Risk-Reward ratio
    const riskRewardRatio = averageLoss > 0 ? averageWin / averageLoss : averageWin > 0 ? Infinity : 0;
    
    // Expectancy
    const expectancy = (winRate / 100 * averageWin) - ((100 - winRate) / 100 * averageLoss);
    
    // Maximum drawdown calculation
    let peak = 0;
    let maxDrawdown = 0;
    let runningEquity = 0;
    const equityCurve = [];
    
    for (const trade of closedTrades.sort((a, b) => a.closeTime - b.closeTime)) {
      runningEquity += trade.profit;
      equityCurve.push({ time: trade.closeTime, equity: runningEquity });
      
      if (runningEquity > peak) {
        peak = runningEquity;
      }
      const drawdown = peak - runningEquity;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
    
    // Maximum drawdown percentage
    const maxDrawdownPercent = peak > 0 ? (maxDrawdown / peak) * 100 : 0;
    
    // Sharpe ratio (simplified)
    const returns = closedTrades.map(t => t.profit);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const sharpeRatio = Math.sqrt(variance) !== 0 ? avgReturn / Math.sqrt(variance) : 0;
    
    // Sortino ratio (downside deviation only)
    const negativeReturns = returns.filter(r => r < 0);
    const downsideVariance = negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / (negativeReturns.length || 1);
    const sortinoRatio = Math.sqrt(downsideVariance) !== 0 ? avgReturn / Math.sqrt(downsideVariance) : 0;
    
    // Calmar ratio (return vs max drawdown)
    const calmarRatio = maxDrawdown !== 0 ? (totalNetProfit / Math.abs(maxDrawdown)) : totalNetProfit > 0 ? Infinity : 0;
    
    // Holding time analysis
    const holdingTimes = closedTrades.map(t => t.closeTime - t.openTime);
    const avgHoldingTimeMs = holdingTimes.reduce((a, b) => a + b, 0) / (holdingTimes.length || 1);
    const avgHoldingTimeHours = avgHoldingTimeMs / (1000 * 60 * 60);
    const avgHoldingTimeDays = avgHoldingTimeHours / 24;
    
    // Time-based performance
    const monthlyPerformance = this.calculateMonthlyPerformance(closedTrades);
    const weeklyPerformance = this.calculateWeeklyPerformance(closedTrades);
    const hourlyPerformance = this.calculateHourlyPerformance(closedTrades);
    
    // Symbol performance breakdown
    const symbolPerformance = {};
    for (const trade of closedTrades) {
      if (!symbolPerformance[trade.symbol]) {
        symbolPerformance[trade.symbol] = {
          symbol: trade.symbol,
          trades: 0,
          wins: 0,
          losses: 0,
          totalProfit: 0,
          grossProfit: 0,
          grossLoss: 0
        };
      }
      const perf = symbolPerformance[trade.symbol];
      perf.trades++;
      perf.totalProfit += trade.profit;
      if (trade.profit > 0) {
        perf.wins++;
        perf.grossProfit += trade.profit;
      } else if (trade.profit < 0) {
        perf.losses++;
        perf.grossLoss += Math.abs(trade.profit);
      }
    }
    
    // Calculate win rate per symbol
    for (const symbol in symbolPerformance) {
      const perf = symbolPerformance[symbol];
      perf.winRate = perf.trades > 0 ? (perf.wins / perf.trades) * 100 : 0;
      perf.profitFactor = perf.grossLoss > 0 ? perf.grossProfit / perf.grossLoss : perf.grossProfit > 0 ? Infinity : 0;
    }
    
    // Consecutive wins/losses
    let currentStreak = 0;
    let maxConsecutiveWins = 0;
    let maxConsecutiveLosses = 0;
    let currentWinStreak = 0;
    let currentLossStreak = 0;
    
    for (const trade of closedTrades.sort((a, b) => a.closeTime - b.closeTime)) {
      if (trade.profit > 0) {
        currentWinStreak++;
        currentLossStreak = 0;
        maxConsecutiveWins = Math.max(maxConsecutiveWins, currentWinStreak);
        currentStreak = currentWinStreak;
      } else if (trade.profit < 0) {
        currentLossStreak++;
        currentWinStreak = 0;
        maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentLossStreak);
        currentStreak = -currentLossStreak;
      } else {
        currentWinStreak = 0;
        currentLossStreak = 0;
        currentStreak = 0;
      }
    }
    
    // Recovery factor
    const recoveryFactor = maxDrawdown !== 0 ? totalNetProfit / maxDrawdown : totalNetProfit > 0 ? Infinity : 0;
    
    // Calculate badge
    const badge = this.calculateBadge({
      totalTrades,
      winRate,
      profitFactor: profitFactor === Infinity ? 999 : profitFactor,
      sharpeRatio,
      maxDrawdownPercent,
      totalNetProfit,
      averageTrade
    });
    
    // Calculate experience level based on real data
    const experienceLevel = this.calculateExperienceLevel({
      totalTrades,
      winRate,
      profitFactor,
      totalNetProfit,
      avgHoldingTimeDays
    });
    
    return {
      // Summary
      totalTrades,
      totalClosedTrades: totalTrades,
      openPositions: openPositions.length,
      
      // Win/Loss breakdown
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      breakevenTrades: breakevenTrades.length,
      winRate: Math.round(winRate * 100) / 100,
      
      // Profit metrics
      totalGrossProfit: Math.round(totalGrossProfit * 100) / 100,
      totalGrossLoss: Math.round(totalGrossLoss * 100) / 100,
      totalNetProfit: Math.round(totalNetProfit * 100) / 100,
      profitFactor: profitFactor === Infinity ? 999 : Math.round(profitFactor * 100) / 100,
      
      // Average metrics
      averageWin: Math.round(averageWin * 100) / 100,
      averageLoss: Math.round(averageLoss * 100) / 100,
      averageTrade: Math.round(averageTrade * 100) / 100,
      
      // Largest trades
      largestWin: Math.round(largestWin * 100) / 100,
      largestLoss: Math.round(largestLoss * 100) / 100,
      
      // Risk metrics
      riskRewardRatio: riskRewardRatio === Infinity ? 999 : Math.round(riskRewardRatio * 100) / 100,
      expectancy: Math.round(expectancy * 100) / 100,
      maxDrawdown: Math.round(maxDrawdown * 100) / 100,
      maxDrawdownPercent: Math.round(maxDrawdownPercent * 100) / 100,
      
      // Ratio metrics
      sharpeRatio: Math.round(sharpeRatio * 100) / 100,
      sortinoRatio: Math.round(sortinoRatio * 100) / 100,
      calmarRatio: calmarRatio === Infinity ? 999 : Math.round(calmarRatio * 100) / 100,
      recoveryFactor: recoveryFactor === Infinity ? 999 : Math.round(recoveryFactor * 100) / 100,
      
      // Time metrics
      averageHoldingTimeMs: Math.round(avgHoldingTimeMs),
      averageHoldingTimeHours: Math.round(avgHoldingTimeHours * 100) / 100,
      averageHoldingTimeDays: Math.round(avgHoldingTimeDays * 100) / 100,
      
      // Streaks
      maxConsecutiveWins,
      maxConsecutiveLosses,
      currentStreak,
      
      // Performance breakdowns
      monthlyPerformance,
      weeklyPerformance,
      hourlyPerformance,
      symbolPerformance: Object.values(symbolPerformance),
      
      // Equity curve data points
      equityCurve,
      
      // Badge and experience
      badge,
      experienceLevel,
      
      // Account info if provided
      accountInfo: accountInfo ? {
        balance: accountInfo.balance,
        equity: accountInfo.equity,
        margin: accountInfo.margin,
        freeMargin: accountInfo.freeMargin,
        marginLevel: accountInfo.marginLevel,
        leverage: accountInfo.leverage
      } : null,
      
      lastUpdated: new Date()
    };
  }
  
  /**
   * Calculate monthly performance
   */
  calculateMonthlyPerformance(trades) {
    const monthly = {};
    
    for (const trade of trades) {
      const monthKey = trade.closeTime.toISOString().slice(0, 7);
      if (!monthly[monthKey]) {
        monthly[monthKey] = {
          month: monthKey,
          profit: 0,
          trades: 0,
          wins: 0,
          losses: 0
        };
      }
      monthly[monthKey].profit += trade.profit;
      monthly[monthKey].trades++;
      if (trade.profit > 0) monthly[monthKey].wins++;
      else if (trade.profit < 0) monthly[monthKey].losses++;
    }
    
    for (const month in monthly) {
      monthly[month].winRate = monthly[month].trades > 0 
        ? (monthly[month].wins / monthly[month].trades) * 100 
        : 0;
    }
    
    return Object.values(monthly).sort((a, b) => a.month.localeCompare(b.month));
  }
  
  /**
   * Calculate weekly performance (by day of week)
   */
  calculateWeeklyPerformance(trades) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weekly = {};
    
    for (const day of days) {
      weekly[day] = { day, profit: 0, trades: 0, wins: 0 };
    }
    
    for (const trade of trades) {
      const dayName = days[trade.closeTime.getDay()];
      weekly[dayName].profit += trade.profit;
      weekly[dayName].trades++;
      if (trade.profit > 0) weekly[dayName].wins++;
    }
    
    for (const day in weekly) {
      weekly[day].winRate = weekly[day].trades > 0 
        ? (weekly[day].wins / weekly[day].trades) * 100 
        : 0;
    }
    
    return Object.values(weekly);
  }
  
  /**
   * Calculate hourly performance
   */
  calculateHourlyPerformance(trades) {
    const hourly = {};
    
    for (let i = 0; i < 24; i++) {
      hourly[i] = { hour: i, profit: 0, trades: 0, wins: 0 };
    }
    
    for (const trade of trades) {
      const hour = trade.closeTime.getHours();
      hourly[hour].profit += trade.profit;
      hourly[hour].trades++;
      if (trade.profit > 0) hourly[hour].wins++;
    }
    
    for (const hour in hourly) {
      hourly[hour].winRate = hourly[hour].trades > 0 
        ? (hourly[hour].wins / hourly[hour].trades) * 100 
        : 0;
    }
    
    return Object.values(hourly);
  }
  
  /**
   * Calculate badge based on trading metrics
   */
  calculateBadge(metrics) {
    const { totalTrades, winRate, profitFactor, sharpeRatio, maxDrawdownPercent, totalNetProfit, averageTrade } = metrics;
    
    let score = 0;
    
    // Trade volume scoring
    if (totalTrades >= 500) score += 30;
    else if (totalTrades >= 300) score += 25;
    else if (totalTrades >= 200) score += 20;
    else if (totalTrades >= 100) score += 15;
    else if (totalTrades >= 50) score += 10;
    else if (totalTrades >= 20) score += 5;
    
    // Win rate scoring
    if (winRate >= 65) score += 25;
    else if (winRate >= 60) score += 22;
    else if (winRate >= 55) score += 19;
    else if (winRate >= 50) score += 16;
    else if (winRate >= 45) score += 13;
    else if (winRate >= 40) score += 10;
    else if (winRate >= 35) score += 7;
    else if (winRate >= 30) score += 4;
    
    // Profit factor scoring
    if (profitFactor >= 2) score += 20;
    else if (profitFactor >= 1.8) score += 17;
    else if (profitFactor >= 1.6) score += 14;
    else if (profitFactor >= 1.4) score += 11;
    else if (profitFactor >= 1.2) score += 8;
    else if (profitFactor >= 1.0) score += 5;
    
    // Sharpe ratio scoring
    if (sharpeRatio >= 2) score += 15;
    else if (sharpeRatio >= 1.5) score += 12;
    else if (sharpeRatio >= 1.0) score += 9;
    else if (sharpeRatio >= 0.5) score += 6;
    else if (sharpeRatio >= 0) score += 3;
    
    // Drawdown management
    if (maxDrawdownPercent <= 5) score += 10;
    else if (maxDrawdownPercent <= 10) score += 8;
    else if (maxDrawdownPercent <= 15) score += 6;
    else if (maxDrawdownPercent <= 20) score += 4;
    else if (maxDrawdownPercent <= 30) score += 2;
    
    // Profitability bonus
    if (totalNetProfit > 10000) score += 15;
    else if (totalNetProfit > 5000) score += 12;
    else if (totalNetProfit > 2000) score += 9;
    else if (totalNetProfit > 1000) score += 6;
    else if (totalNetProfit > 500) score += 3;
    
    // Consistency bonus (positive average trade)
    if (averageTrade > 0) score += 5;
    
    // Determine badge level
    if (score >= 90) {
      return this.badgeLevels.pro;
    } else if (score >= 75) {
      return this.badgeLevels.expert;
    } else if (score >= 60) {
      return this.badgeLevels.advanced;
    } else if (score >= 45) {
      return this.badgeLevels.intermediate;
    } else if (score >= 25) {
      return this.badgeLevels.beginner;
    } else {
      return this.badgeLevels.novice;
    }
  }
  
  /**
   * Calculate experience level from trading data
   */
  calculateExperienceLevel(metrics) {
    const { totalTrades, winRate, profitFactor, totalNetProfit, avgHoldingTimeDays } = metrics;
    
    // Experience score based on multiple factors
    let experienceScore = 0;
    
    // Time/seniority factor
    if (totalTrades >= 500) experienceScore += 40;
    else if (totalTrades >= 300) experienceScore += 35;
    else if (totalTrades >= 200) experienceScore += 30;
    else if (totalTrades >= 100) experienceScore += 25;
    else if (totalTrades >= 50) experienceScore += 20;
    else if (totalTrades >= 25) experienceScore += 15;
    else if (totalTrades >= 10) experienceScore += 10;
    else experienceScore += 5;
    
    // Skill factor
    if (winRate >= 60) experienceScore += 30;
    else if (winRate >= 55) experienceScore += 26;
    else if (winRate >= 50) experienceScore += 22;
    else if (winRate >= 45) experienceScore += 18;
    else if (winRate >= 40) experienceScore += 14;
    else experienceScore += 10;
    
    // Profitability factor
    if (profitFactor >= 2) experienceScore += 20;
    else if (profitFactor >= 1.5) experienceScore += 16;
    else if (profitFactor >= 1.2) experienceScore += 12;
    else if (profitFactor >= 1.0) experienceScore += 8;
    else experienceScore += 4;
    
    // Net profit factor
    if (totalNetProfit > 10000) experienceScore += 10;
    else if (totalNetProfit > 5000) experienceScore += 8;
    else if (totalNetProfit > 1000) experienceScore += 6;
    else if (totalNetProfit > 0) experienceScore += 4;
    
    // Determine level
    if (experienceScore >= 80) {
      return {
        level: 'expert',
        title: 'Expert Trader',
        description: 'Experienced trader with proven track record',
        score: experienceScore,
        color: '#F59E0B'
      };
    } else if (experienceScore >= 65) {
      return {
        level: 'advanced',
        title: 'Advanced Trader',
        description: 'Skilled trader with consistent results',
        score: experienceScore,
        color: '#8B5CF6'
      };
    } else if (experienceScore >= 50) {
      return {
        level: 'intermediate',
        title: 'Intermediate Trader',
        description: 'Developing trader with solid foundation',
        score: experienceScore,
        color: '#3B82F6'
      };
    } else if (experienceScore >= 30) {
      return {
        level: 'beginner',
        title: 'Beginner Trader',
        description: 'Active trader building experience',
        score: experienceScore,
        color: '#10B981'
      };
    } else {
      return {
        level: 'novice',
        title: 'Novice Trader',
        description: 'New trader learning the markets',
        score: experienceScore,
        color: '#9CA3AF'
      };
    }
  }
  
  /**
   * Get empty profile for users with no trades
   */
  getEmptyProfile() {
    return {
      totalTrades: 0,
      totalClosedTrades: 0,
      openPositions: 0,
      winningTrades: 0,
      losingTrades: 0,
      breakevenTrades: 0,
      winRate: 0,
      totalGrossProfit: 0,
      totalGrossLoss: 0,
      totalNetProfit: 0,
      profitFactor: 0,
      averageWin: 0,
      averageLoss: 0,
      averageTrade: 0,
      largestWin: 0,
      largestLoss: 0,
      riskRewardRatio: 0,
      expectancy: 0,
      maxDrawdown: 0,
      maxDrawdownPercent: 0,
      sharpeRatio: 0,
      sortinoRatio: 0,
      calmarRatio: 0,
      recoveryFactor: 0,
      averageHoldingTimeMs: 0,
      averageHoldingTimeHours: 0,
      averageHoldingTimeDays: 0,
      maxConsecutiveWins: 0,
      maxConsecutiveLosses: 0,
      currentStreak: 0,
      monthlyPerformance: [],
      weeklyPerformance: [],
      hourlyPerformance: [],
      symbolPerformance: [],
      equityCurve: [],
      badge: this.badgeLevels.novice,
      experienceLevel: {
        level: 'novice',
        title: 'Novice Trader',
        description: 'Connect your trading account to see analytics',
        score: 0,
        color: '#9CA3AF'
      },
      accountInfo: null,
      lastUpdated: new Date()
    };
  }
  
  /**
   * Get tier requirements for display
   */
  getTierRequirements() {
    return {
      novice: {
        minTrades: 0,
        minWinRate: 0,
        nextTier: 'beginner',
        nextTierRequirements: { minTrades: 10, minWinRate: 35 }
      },
      beginner: {
        minTrades: 10,
        minWinRate: 35,
        nextTier: 'intermediate',
        nextTierRequirements: { minTrades: 50, minWinRate: 45, minProfitFactor: 1.0 }
      },
      intermediate: {
        minTrades: 50,
        minWinRate: 45,
        minProfitFactor: 1.0,
        nextTier: 'advanced',
        nextTierRequirements: { minTrades: 150, minWinRate: 52, minProfitFactor: 1.3 }
      },
      advanced: {
        minTrades: 150,
        minWinRate: 52,
        minProfitFactor: 1.3,
        nextTier: 'expert',
        nextTierRequirements: { minTrades: 300, minWinRate: 58, minProfitFactor: 1.5 }
      },
      expert: {
        minTrades: 300,
        minWinRate: 58,
        minProfitFactor: 1.5,
        nextTier: 'pro',
        nextTierRequirements: { minTrades: 500, minWinRate: 62, minProfitFactor: 1.8 }
      },
      pro: {
        minTrades: 500,
        minWinRate: 62,
        minProfitFactor: 1.8,
        nextTier: null,
        nextTierRequirements: null
      }
    };
  }
}

export default new TradingAnalyticsService();