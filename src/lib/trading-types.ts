// ─── TradingView / Deriv-Style Types ─────────────────────────────

export interface TVSymbolInfo {
  symbol: string
  name: string
  exchange: string
  type: string
}

export type MarketType = 'even_odd' | 'differs' | 'over_under' | 'multiplier' | 'higher_lower' | 'turbo'

export type SignalType = 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell'

export type DurationUnit = 'ticks' | 'seconds' | 'minutes' | 'hours' | 'days'

export interface Duration {
  value: number
  unit: DurationUnit
  label: string
}

export interface TradeContract {
  type: MarketType
  symbol: string
  symbolName: string
  signal: SignalType
  prediction: 'even' | 'odd' | 'differs' | 'over' | 'under' | 'higher' | 'lower' | 'rise' | 'fall' | string
  stake: number
  payout: number
  profit: number
  potentialLoss: number
  returnPercent: number
  confidence: number
  probability: number
  entryPrice: number
  targetPrice: number
  barrier?: number
  duration: Duration
  lastDigit?: number
  indicators: IndicatorResult[]
  timestamp: string
}

export interface AnalysisSignal {
  type: MarketType
  symbol: string
  signal: SignalType
  confidence: number
  probability: number
  entryPrice: number
  target: number
  stopLoss: number
  riskReward: number
  payout: number
  returnPercent: number
  lastDigit: number
  barrier?: number
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
  id: string
  symbol: string
  name: string
  marketType: MarketType
  signal: SignalType
  prediction: string
  confidence: number
  probability: number
  odds: number
  stake: number
  payout: number
  entryPrice: number
  target: number
  barrier?: number
  duration: Duration
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

// ─── Market Types Configuration ──────────────────────────────────
export const MARKET_TYPES: Record<MarketType, {
  label: string
  icon: string
  color: string
  bg: string
  borderColor: string
  description: string
  shortDesc: string
  predictions: string[]
  defaultDuration: Duration
  minStake: number
  maxStake: number
}> = {
  even_odd: {
    label: 'Even / Odd',
    icon: 'Hash',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    description: 'Predict whether the last digit of the price will be even (0,2,4,6,8) or odd (1,3,5,7,9).',
    shortDesc: 'Last digit even or odd',
    predictions: ['Even', 'Odd'],
    defaultDuration: { value: 5, unit: 'ticks', label: '5 ticks' },
    minStake: 0.35,
    maxStake: 10000,
  },
  differs: {
    label: 'Differs',
    icon: 'Unlink',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    description: 'Predict that the last digit will differ from a specific digit (0-9).',
    shortDesc: 'Digit differs from target',
    predictions: ['Differs 0', 'Differs 1', 'Differs 2', 'Differs 3', 'Differs 4', 'Differs 5', 'Differs 6', 'Differs 7', 'Differs 8', 'Differs 9'],
    defaultDuration: { value: 5, unit: 'ticks', label: '5 ticks' },
    minStake: 0.35,
    maxStake: 10000,
  },
  over_under: {
    label: 'Over / Under',
    icon: 'ArrowUpDown',
    color: 'text-sky-500',
    bg: 'bg-sky-500/10',
    borderColor: 'border-sky-500/30',
    description: 'Predict if the last digit will be over or under a selected digit.',
    shortDesc: 'Last digit over/under',
    predictions: ['Over', 'Under'],
    defaultDuration: { value: 5, unit: 'ticks', label: '5 ticks' },
    minStake: 0.35,
    maxStake: 10000,
  },
  multiplier: {
    label: 'Multiplier',
    icon: 'X',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    description: 'Multiply your stake by a selected multiplier. Higher multiplier = higher risk and reward.',
    shortDesc: 'Stake multiplier trade',
    predictions: ['x2', 'x5', 'x10', 'x20', 'x50', 'x100', 'x250', 'x500'],
    defaultDuration: { value: 5, unit: 'ticks', label: '5 ticks' },
    minStake: 0.35,
    maxStake: 10000,
  },
  higher_lower: {
    label: 'Rise / Fall',
    icon: 'TrendingUp',
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
    description: 'Predict if the price will rise or fall compared to the current price at trade expiry.',
    shortDesc: 'Price rise or fall',
    predictions: ['Rise', 'Fall'],
    defaultDuration: { value: 5, unit: 'ticks', label: '5 ticks' },
    minStake: 0.35,
    maxStake: 10000,
  },
  turbo: {
    label: 'Turbo',
    icon: 'Zap',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    description: 'Ultra-fast 1-5 tick trades for turbo-speed trading. Quick results, high action.',
    shortDesc: '1-5 tick turbo trade',
    predictions: ['Higher', 'Lower'],
    defaultDuration: { value: 1, unit: 'ticks', label: '1 tick' },
    minStake: 0.35,
    maxStake: 10000,
  },
}

export const SIGNAL_COLORS: Record<SignalType, { label: string; text: string; bg: string; border: string; hex: string }> = {
  strong_buy: { label: 'Strong Buy', text: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', hex: '#22c55e' },
  buy: { label: 'Buy', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', hex: '#4ade80' },
  neutral: { label: 'Neutral', text: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/30', hex: '#9ca3af' },
  sell: { label: 'Sell', text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', hex: '#f87171' },
  strong_sell: { label: 'Strong Sell', text: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/40', hex: '#ef4444' },
}

// ─── Durations ───────────────────────────────────────────────────
export const TICK_DURATIONS: Duration[] = [
  { value: 1, unit: 'ticks', label: '1 tick' },
  { value: 2, unit: 'ticks', label: '2 ticks' },
  { value: 3, unit: 'ticks', label: '3 ticks' },
  { value: 4, unit: 'ticks', label: '4 ticks' },
  { value: 5, unit: 'ticks', label: '5 ticks' },
  { value: 6, unit: 'ticks', label: '6 ticks' },
  { value: 7, unit: 'ticks', label: '7 ticks' },
  { value: 8, unit: 'ticks', label: '8 ticks' },
  { value: 9, unit: 'ticks', label: '9 ticks' },
  { value: 10, unit: 'ticks', label: '10 ticks' },
]

export const TIME_DURATIONS: Duration[] = [
  { value: 15, unit: 'seconds', label: '15s' },
  { value: 30, unit: 'seconds', label: '30s' },
  { value: 1, unit: 'minutes', label: '1 min' },
  { value: 2, unit: 'minutes', label: '2 min' },
  { value: 3, unit: 'minutes', label: '3 min' },
  { value: 5, unit: 'minutes', label: '5 min' },
  { value: 10, unit: 'minutes', label: '10 min' },
  { value: 15, unit: 'minutes', label: '15 min' },
  { value: 30, unit: 'minutes', label: '30 min' },
  { value: 1, unit: 'hours', label: '1 hr' },
  { value: 2, unit: 'hours', label: '2 hrs' },
  { value: 4, unit: 'hours', label: '4 hrs' },
  { value: 1, unit: 'days', label: '1 day' },
]

// ─── Symbol shape ────────────────────────────────────────────────
export type SymbolItem = { symbol: string; name: string; exchange: string; type: string; category: string }

// ─── ALL_SYMBOLS – comprehensive flat list ───────────────────────
export const ALL_SYMBOLS: SymbolItem[] = [
  // Crypto
  { symbol: 'BINANCE:BTCUSDT',  name: 'BTC/USDT',  exchange: 'Binance', type: 'crypto', category: 'Crypto' },
  { symbol: 'BINANCE:ETHUSDT',  name: 'ETH/USDT',  exchange: 'Binance', type: 'crypto', category: 'Crypto' },
  { symbol: 'BINANCE:SOLUSDT',  name: 'SOL/USDT',  exchange: 'Binance', type: 'crypto', category: 'Crypto' },
  { symbol: 'BINANCE:BNBUSDT',  name: 'BNB/USDT',  exchange: 'Binance', type: 'crypto', category: 'Crypto' },
  { symbol: 'BINANCE:XRPUSDT',  name: 'XRP/USDT',  exchange: 'Binance', type: 'crypto', category: 'Crypto' },
  { symbol: 'BINANCE:ADAUSDT',  name: 'ADA/USDT',  exchange: 'Binance', type: 'crypto', category: 'Crypto' },
  { symbol: 'BINANCE:DOGEUSDT', name: 'DOGE/USDT', exchange: 'Binance', type: 'crypto', category: 'Crypto' },
  { symbol: 'BINANCE:AVAXUSDT', name: 'AVAX/USDT', exchange: 'Binance', type: 'crypto', category: 'Crypto' },
  { symbol: 'BINANCE:DOTUSDT',  name: 'DOT/USDT',  exchange: 'Binance', type: 'crypto', category: 'Crypto' },
  { symbol: 'BINANCE:MATICUSDT',name: 'MATIC/USDT',exchange: 'Binance', type: 'crypto', category: 'Crypto' },
  { symbol: 'BINANCE:LINKUSDT', name: 'LINK/USDT', exchange: 'Binance', type: 'crypto', category: 'Crypto' },
  { symbol: 'BINANCE:SHIBUSDT', name: 'SHIB/USDT', exchange: 'Binance', type: 'crypto', category: 'Crypto' },
  { symbol: 'BINANCE:ATOMUSDT', name: 'ATOM/USDT', exchange: 'Binance', type: 'crypto', category: 'Crypto' },
  { symbol: 'BINANCE:UNIUSDT',  name: 'UNI/USDT',  exchange: 'Binance', type: 'crypto', category: 'Crypto' },
  { symbol: 'BINANCE:NEARUSDT', name: 'NEAR/USDT', exchange: 'Binance', type: 'crypto', category: 'Crypto' },
  // Forex
  { symbol: 'FX:EURUSD',  name: 'EUR/USD', exchange: 'Forex', type: 'forex', category: 'Forex' },
  { symbol: 'FX:GBPUSD',  name: 'GBP/USD', exchange: 'Forex', type: 'forex', category: 'Forex' },
  { symbol: 'FX:USDJPY',  name: 'USD/JPY', exchange: 'Forex', type: 'forex', category: 'Forex' },
  { symbol: 'FX:USDCHF',  name: 'USD/CHF', exchange: 'Forex', type: 'forex', category: 'Forex' },
  { symbol: 'FX:AUDUSD',  name: 'AUD/USD', exchange: 'Forex', type: 'forex', category: 'Forex' },
  { symbol: 'FX:NZDUSD',  name: 'NZD/USD', exchange: 'Forex', type: 'forex', category: 'Forex' },
  { symbol: 'FX:USDCAD',  name: 'USD/CAD', exchange: 'Forex', type: 'forex', category: 'Forex' },
  { symbol: 'FX:EURGBP',  name: 'EUR/GBP', exchange: 'Forex', type: 'forex', category: 'Forex' },
  { symbol: 'FX:EURJPY',  name: 'EUR/JPY', exchange: 'Forex', type: 'forex', category: 'Forex' },
  { symbol: 'FX:GBPJPY',  name: 'GBP/JPY', exchange: 'Forex', type: 'forex', category: 'Forex' },
  { symbol: 'FX:XAUUSD',  name: 'Gold',    exchange: 'Forex', type: 'commodity', category: 'Commodities' },
  { symbol: 'FX:XAGUSD',  name: 'Silver',  exchange: 'Forex', type: 'commodity', category: 'Commodities' },
  { symbol: 'FX:USOIL',   name: 'Oil',     exchange: 'Forex', type: 'commodity', category: 'Commodities' },
  // Stocks
  { symbol: 'NASDAQ:AAPL', name: 'Apple',     exchange: 'NASDAQ', type: 'stock', category: 'Stocks' },
  { symbol: 'NASDAQ:MSFT', name: 'Microsoft', exchange: 'NASDAQ', type: 'stock', category: 'Stocks' },
  { symbol: 'NASDAQ:GOOGL',name: 'Alphabet',  exchange: 'NASDAQ', type: 'stock', category: 'Stocks' },
  { symbol: 'NASDAQ:AMZN', name: 'Amazon',    exchange: 'NASDAQ', type: 'stock', category: 'Stocks' },
  { symbol: 'NASDAQ:TSLA', name: 'Tesla',     exchange: 'NASDAQ', type: 'stock', category: 'Stocks' },
  { symbol: 'NASDAQ:META', name: 'Meta',      exchange: 'NASDAQ', type: 'stock', category: 'Stocks' },
  { symbol: 'NASDAQ:NVDA', name: 'NVIDIA',    exchange: 'NASDAQ', type: 'stock', category: 'Stocks' },
  { symbol: 'NASDAQ:NFLX', name: 'Netflix',   exchange: 'NASDAQ', type: 'stock', category: 'Stocks' },
  { symbol: 'NASDAQ:AMD',  name: 'AMD',       exchange: 'NASDAQ', type: 'stock', category: 'Stocks' },
  { symbol: 'NASDAQ:INTC', name: 'Intel',     exchange: 'NASDAQ', type: 'stock', category: 'Stocks' },
  { symbol: 'NASDAQ:PYPL', name: 'PayPal',    exchange: 'NASDAQ', type: 'stock', category: 'Stocks' },
  { symbol: 'NASDAQ:CRM',  name: 'Salesforce',exchange: 'NASDAQ', type: 'stock', category: 'Stocks' },
  { symbol: 'NASDAQ:ORCL', name: 'Oracle',    exchange: 'NASDAQ', type: 'stock', category: 'Stocks' },
  { symbol: 'NYSE:JPM',  name: 'JPMorgan',   exchange: 'NYSE',   type: 'stock', category: 'Stocks' },
  { symbol: 'NYSE:V',    name: 'Visa',       exchange: 'NYSE',   type: 'stock', category: 'Stocks' },
  { symbol: 'NYSE:WMT',  name: 'Walmart',    exchange: 'NYSE',   type: 'stock', category: 'Stocks' },
  { symbol: 'NYSE:DIS',  name: 'Disney',     exchange: 'NYSE',   type: 'stock', category: 'Stocks' },
  { symbol: 'NYSE:BA',   name: 'Boeing',     exchange: 'NYSE',   type: 'stock', category: 'Stocks' },
  { symbol: 'NYSE:KO',   name: 'Coca-Cola',  exchange: 'NYSE',   type: 'stock', category: 'Stocks' },
  { symbol: 'NYSE:PFE',  name: 'Pfizer',     exchange: 'NYSE',   type: 'stock', category: 'Stocks' },
  // Indices
  { symbol: 'TVC:US30',   name: 'US30',      exchange: 'Index', type: 'index', category: 'Indices' },
  { symbol: 'TVC:SPX500', name: 'SPX500',    exchange: 'Index', type: 'index', category: 'Indices' },
  { symbol: 'TVC:NDX100', name: 'NDX100',    exchange: 'Index', type: 'index', category: 'Indices' },
  { symbol: 'TVC:UK100',  name: 'UK100',     exchange: 'Index', type: 'index', category: 'Indices' },
  { symbol: 'TVC:DE40',   name: 'DE40',      exchange: 'Index', type: 'index', category: 'Indices' },
  { symbol: 'TVC:JP225',  name: 'JP225',     exchange: 'Index', type: 'index', category: 'Indices' },
  { symbol: 'TVC:HK50',   name: 'HK50',      exchange: 'Index', type: 'index', category: 'Indices' },
]

export const SYMBOL_CATEGORIES: Array<{ id: string; label: string; symbols: SymbolItem[] }> = [
  { id: 'crypto', label: 'Crypto', symbols: ALL_SYMBOLS.filter(s => s.category === 'Crypto') },
  { id: 'forex', label: 'Forex', symbols: ALL_SYMBOLS.filter(s => s.category === 'Forex') },
  { id: 'stocks', label: 'Stocks', symbols: ALL_SYMBOLS.filter(s => s.category === 'Stocks') },
  { id: 'indices', label: 'Indices', symbols: ALL_SYMBOLS.filter(s => s.category === 'Indices') },
  { id: 'commodities', label: 'Commodities', symbols: ALL_SYMBOLS.filter(s => s.category === 'Commodities') },
]

export function searchSymbols(query: string): SymbolItem[] {
  const q = query.toLowerCase().trim()
  if (!q) return ALL_SYMBOLS
  return ALL_SYMBOLS.filter(s =>
    s.symbol.toLowerCase().includes(q) ||
    s.name.toLowerCase().includes(q) ||
    s.exchange.toLowerCase().includes(q) ||
    s.category.toLowerCase().includes(q)
  )
}

export const POPULAR_SYMBOLS = ALL_SYMBOLS

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
