// TradingView Types
export interface TVSymbolInfo {
  symbol: string
  name: string
  exchange: string
  type: string
}

export type MarketType = 'even_odd' | 'differs' | 'over_under' | 'multiplier' | 'higher_lower' | 'turbo'

export type SignalType = 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell'

export interface AnalysisSignal {
  type: MarketType
  symbol: string
  signal: SignalType
  confidence: number
  entryPrice: number
  target: number
  stopLoss: number
  riskReward: number
  timeframe: string
  timestamp: string
  indicators: IndicatorResult[]
}

export interface IndicatorResult {
  name: string
  value: number | string
  signal: SignalType
  description: string
}

export interface AccumulatorLeg {
  symbol: string
  name: string
  marketType: MarketType
  signal: SignalType
  confidence: number
  odds: number
  entryPrice: number
  target: number
  timeframe: string
}

export interface PriceData {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export const MARKET_TYPES: Record<MarketType, {
  label: string
  icon: string
  color: string
  bg: string
  description: string
  shortDesc: string
}> = {
  even_odd: {
    label: 'Even / Odd',
    icon: 'Hash',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    description: 'Analyze last-digit patterns in price movements. Predict whether the final digit of the next tick/price will be even (0,2,4,6,8) or odd (1,3,5,7,9).',
    shortDesc: 'Last digit even or odd prediction'
  },
  differs: {
    label: 'Differs',
    icon: 'Unlink',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    description: 'Predict that the last digit of the next price will differ from a specific number. Higher accuracy when historical patterns show digit avoidance.',
    shortDesc: 'Digit differs from target prediction'
  },
  over_under: {
    label: 'Over / Under',
    icon: 'ArrowUpDown',
    color: 'text-sky-600',
    bg: 'bg-sky-50',
    description: 'Analyze whether price will close over or under a specified threshold level. Uses support/resistance, pivot points, and momentum indicators.',
    shortDesc: 'Price over/under level analysis'
  },
  multiplier: {
    label: 'Multipliers',
    icon: 'X',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    description: 'Risk/reward multiplier analysis for enhanced returns. Evaluates volatility, ATR, and probability density to recommend optimal multiplier levels.',
    shortDesc: 'Return multiplier risk analysis'
  },
  higher_lower: {
    label: 'Higher / Lower',
    icon: 'TrendingUp',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    description: 'Predict whether the next candle/bar will close higher or lower than the current price. Uses trend analysis, momentum, and pattern recognition.',
    shortDesc: 'Next candle direction prediction'
  },
  turbo: {
    label: 'Turbos',
    icon: 'Zap',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    description: 'Ultra-short timeframe analysis (1-5 ticks) for turbo-speed trading. Real-time momentum and tick velocity indicators for rapid decisions.',
    shortDesc: 'Ultra-short tick analysis'
  }
}

export const SIGNAL_COLORS: Record<SignalType, { label: string; text: string; bg: string; border: string; hex: string }> = {
  strong_buy: { label: 'Strong Buy', text: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-300', hex: '#16a34a' },
  buy: { label: 'Buy', text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', hex: '#22c55e' },
  neutral: { label: 'Neutral', text: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-300', hex: '#9ca3af' },
  sell: { label: 'Sell', text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', hex: '#ef4444' },
  strong_sell: { label: 'Strong Sell', text: 'text-red-700', bg: 'bg-red-100', border: 'border-red-300', hex: '#dc2626' }
}

export const POPULAR_SYMBOLS = [
  { symbol: 'BINANCE:BTCUSDT', name: 'BTC/USDT', exchange: 'Binance', type: 'crypto' },
  { symbol: 'BINANCE:ETHUSDT', name: 'ETH/USDT', exchange: 'Binance', type: 'crypto' },
  { symbol: 'FX:EURUSD', name: 'EUR/USD', exchange: 'Forex', type: 'forex' },
  { symbol: 'FX:GBPUSD', name: 'GBP/USD', exchange: 'Forex', type: 'forex' },
  { symbol: 'NASDAQ:AAPL', name: 'Apple', exchange: 'NASDAQ', type: 'stock' },
  { symbol: 'NASDAQ:GOOGL', name: 'Alphabet', exchange: 'NASDAQ', type: 'stock' },
  { symbol: 'NASDAQ:MSFT', name: 'Microsoft', exchange: 'NASDAQ', type: 'stock' },
  { symbol: 'NASDAQ:TSLA', name: 'Tesla', exchange: 'NASDAQ', type: 'stock' },
  { symbol: 'NASDAQ:AMZN', name: 'Amazon', exchange: 'NASDAQ', type: 'stock' },
  { symbol: 'BINANCE:SOLUSDT', name: 'SOL/USDT', exchange: 'Binance', type: 'crypto' },
  { symbol: 'BINANCE:BNBUSDT', name: 'BNB/USDT', exchange: 'Binance', type: 'crypto' },
  { symbol: 'FX:USDJPY', name: 'USD/JPY', exchange: 'Forex', type: 'forex' },
  { symbol: 'FX:XAUUSD', name: 'Gold', exchange: 'Forex', type: 'commodity' },
  { symbol: 'TVC:US30', name: 'Dow Jones 30', exchange: 'Index', type: 'index' },
  { symbol: 'FX:EURGBP', name: 'EUR/GBP', exchange: 'Forex', type: 'forex' },
  { symbol: 'BINANCE:XRPUSDT', name: 'XRP/USDT', exchange: 'Binance', type: 'crypto' },
]

export const TIMEFRAMES = [
  { value: '1', label: '1m' },
  { value: '5', label: '5m' },
  { value: '15', label: '15m' },
  { value: '30', label: '30m' },
  { value: '60', label: '1H' },
  { value: '240', label: '4H' },
  { value: 'D', label: '1D' },
  { value: 'W', label: '1W' },
]
