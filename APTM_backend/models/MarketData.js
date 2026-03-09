// marketDataSchema.js
const mongoose = require('mongoose');

const marketDataSchema = new mongoose.Schema({
  symbol: { type: String, required: true },
  interval: { type: String, required: true }, // '1m', '5m', '1h', etc.
  open: Number,
  high: Number,
  low: Number,
  close: Number,
  volume: Number,
  timestamp: { type: Date, required: true },
  indicators: {
    rsi: Number,
    macd: {
      histogram: Number,
      signal: Number,
      macd: Number
    },
    sma: {
      sma20: Number,
      sma50: Number,
      sma200: Number
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('MarketData', marketDataSchema);