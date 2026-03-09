// models/TradingAccount.js
import mongoose from 'mongoose';

const tradingAccountSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  platform: { 
    type: String, 
    enum: ['mt4', 'mt5', 'tradingview', 'ctrader', 'other'],
    required: true 
  },
  accountNumber: { type: String, required: true },
  accountName: String,
  broker: String,
  server: String,
  connectionStatus: { 
    type: String, 
    enum: ['connected', 'disconnected', 'pending'], 
    default: 'pending' 
  },
  lastSync: Date,
  apiKey: { type: String, select: false },
  apiSecret: { type: String, select: false },
  isActive: { type: Boolean, default: true },
  metadata: mongoose.Schema.Types.Mixed,
  stats: {
    totalTrades: { type: Number, default: 0 },
    profitLoss: { type: Number, default: 0 },
    winRate: { type: Number, default: 0 },
    lastUpdated: Date
  }
}, { 
  timestamps: true 
});

export default mongoose.model('TradingAccount', tradingAccountSchema);