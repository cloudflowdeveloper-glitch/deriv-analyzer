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

// ─── Symbol shape ───────────────────────────────────────────────
export type SymbolItem = { symbol: string; name: string; exchange: string; type: string; category: string }

// ─── ALL_SYMBOLS – comprehensive flat list ──────────────────────────
export const ALL_SYMBOLS: SymbolItem[] = [
  // ── Crypto (Binance) ──────────────────────────────────────────────
  { symbol: 'BINANCE:BTCUSDT',  name: 'Bitcoin',           exchange: 'Binance', type: 'crypto',     category: 'Crypto' },
  { symbol: 'BINANCE:ETHUSDT',  name: 'Ethereum',          exchange: 'Binance', type: 'crypto',     category: 'Crypto' },
  { symbol: 'BINANCE:SOLUSDT',  name: 'Solana',            exchange: 'Binance', type: 'crypto',     category: 'Crypto' },
  { symbol: 'BINANCE:BNBUSDT',  name: 'BNB',               exchange: 'Binance', type: 'crypto',     category: 'Crypto' },
  { symbol: 'BINANCE:XRPUSDT',  name: 'XRP',               exchange: 'Binance', type: 'crypto',     category: 'Crypto' },
  { symbol: 'BINANCE:ADAUSDT',  name: 'Cardano',           exchange: 'Binance', type: 'crypto',     category: 'Crypto' },
  { symbol: 'BINANCE:DOGEUSDT', name: 'Dogecoin',          exchange: 'Binance', type: 'crypto',     category: 'Crypto' },
  { symbol: 'BINANCE:AVAXUSDT', name: 'Avalanche',         exchange: 'Binance', type: 'crypto',     category: 'Crypto' },
  { symbol: 'BINANCE:DOTUSDT',  name: 'Polkadot',          exchange: 'Binance', type: 'crypto',     category: 'Crypto' },
  { symbol: 'BINANCE:MATICUSDT',name: 'Polygon',           exchange: 'Binance', type: 'crypto',     category: 'Crypto' },
  { symbol: 'BINANCE:LINKUSDT', name: 'Chainlink',         exchange: 'Binance', type: 'crypto',     category: 'Crypto' },
  { symbol: 'BINANCE:SHIBUSDT', name: 'Shiba Inu',         exchange: 'Binance', type: 'crypto',     category: 'Crypto' },
  { symbol: 'BINANCE:ATOMUSDT', name: 'Cosmos',            exchange: 'Binance', type: 'crypto',     category: 'Crypto' },
  { symbol: 'BINANCE:UNIUSDT',  name: 'Uniswap',           exchange: 'Binance', type: 'crypto',     category: 'Crypto' },
  { symbol: 'BINANCE:NEARUSDT', name: 'NEAR Protocol',     exchange: 'Binance', type: 'crypto',     category: 'Crypto' },

  // ── Forex ────────────────────────────────────────────────────────
  { symbol: 'FX:EURUSD',  name: 'EUR/USD', exchange: 'Forex', type: 'forex',     category: 'Forex' },
  { symbol: 'FX:GBPUSD',  name: 'GBP/USD', exchange: 'Forex', type: 'forex',     category: 'Forex' },
  { symbol: 'FX:USDJPY',  name: 'USD/JPY', exchange: 'Forex', type: 'forex',     category: 'Forex' },
  { symbol: 'FX:USDCHF',  name: 'USD/CHF', exchange: 'Forex', type: 'forex',     category: 'Forex' },
  { symbol: 'FX:AUDUSD',  name: 'AUD/USD', exchange: 'Forex', type: 'forex',     category: 'Forex' },
  { symbol: 'FX:NZDUSD',  name: 'NZD/USD', exchange: 'Forex', type: 'forex',     category: 'Forex' },
  { symbol: 'FX:USDCAD',  name: 'USD/CAD', exchange: 'Forex', type: 'forex',     category: 'Forex' },
  { symbol: 'FX:EURGBP',  name: 'EUR/GBP', exchange: 'Forex', type: 'forex',     category: 'Forex' },
  { symbol: 'FX:EURJPY',  name: 'EUR/JPY', exchange: 'Forex', type: 'forex',     category: 'Forex' },
  { symbol: 'FX:GBPJPY',  name: 'GBP/JPY', exchange: 'Forex', type: 'forex',     category: 'Forex' },
  { symbol: 'FX:AUDJPY',  name: 'AUD/JPY', exchange: 'Forex', type: 'forex',     category: 'Forex' },
  { symbol: 'FX:EURCHF',  name: 'EUR/CHF', exchange: 'Forex', type: 'forex',     category: 'Forex' },
  { symbol: 'FX:EURAUD',  name: 'EUR/AUD', exchange: 'Forex', type: 'forex',     category: 'Forex' },
  { symbol: 'FX:GBPAUD',  name: 'GBP/AUD', exchange: 'Forex', type: 'forex',     category: 'Forex' },
  { symbol: 'FX:GBPCHF',  name: 'GBP/CHF', exchange: 'Forex', type: 'forex',     category: 'Forex' },
  { symbol: 'FX:NZDJPY',  name: 'NZD/JPY', exchange: 'Forex', type: 'forex',     category: 'Forex' },
  { symbol: 'FX:CADJPY',  name: 'CAD/JPY', exchange: 'Forex', type: 'forex',     category: 'Forex' },
  { symbol: 'FX:AUDNZD',  name: 'AUD/NZD', exchange: 'Forex', type: 'forex',     category: 'Forex' },
  { symbol: 'FX:EURNZD',  name: 'EUR/NZD', exchange: 'Forex', type: 'forex',     category: 'Forex' },
  { symbol: 'FX:GBPNZD',  name: 'GBP/NZD', exchange: 'Forex', type: 'forex',     category: 'Forex' },
  { symbol: 'FX:XAUUSD',  name: 'Gold',    exchange: 'Forex', type: 'commodity', category: 'Forex' },
  { symbol: 'FX:XAGUSD',  name: 'Silver',  exchange: 'Forex', type: 'commodity', category: 'Forex' },
  { symbol: 'FX:USOIL',   name: 'Oil',     exchange: 'Forex', type: 'commodity', category: 'Forex' },

  // ── US Stocks (NASDAQ) ───────────────────────────────────────────
  { symbol: 'NASDAQ:AAPL', name: 'Apple',            exchange: 'NASDAQ', type: 'stock',     category: 'Stocks' },
  { symbol: 'NASDAQ:MSFT', name: 'Microsoft',        exchange: 'NASDAQ', type: 'stock',     category: 'Stocks' },
  { symbol: 'NASDAQ:GOOGL',name: 'Alphabet',         exchange: 'NASDAQ', type: 'stock',     category: 'Stocks' },
  { symbol: 'NASDAQ:AMZN', name: 'Amazon',           exchange: 'NASDAQ', type: 'stock',     category: 'Stocks' },
  { symbol: 'NASDAQ:TSLA', name: 'Tesla',            exchange: 'NASDAQ', type: 'stock',     category: 'Stocks' },
  { symbol: 'NASDAQ:META', name: 'Meta Platforms',    exchange: 'NASDAQ', type: 'stock',     category: 'Stocks' },
  { symbol: 'NASDAQ:NVDA', name: 'NVIDIA',           exchange: 'NASDAQ', type: 'stock',     category: 'Stocks' },
  { symbol: 'NASDAQ:NFLX', name: 'Netflix',          exchange: 'NASDAQ', type: 'stock',     category: 'Stocks' },
  { symbol: 'NASDAQ:AMD',  name: 'AMD',              exchange: 'NASDAQ', type: 'stock',     category: 'Stocks' },
  { symbol: 'NASDAQ:INTC', name: 'Intel',            exchange: 'NASDAQ', type: 'stock',     category: 'Stocks' },
  { symbol: 'NASDAQ:PYPL', name: 'PayPal',           exchange: 'NASDAQ', type: 'stock',     category: 'Stocks' },
  { symbol: 'NASDAQ:CRM',  name: 'Salesforce',       exchange: 'NASDAQ', type: 'stock',     category: 'Stocks' },
  { symbol: 'NASDAQ:ORCL', name: 'Oracle',           exchange: 'NASDAQ', type: 'stock',     category: 'Stocks' },
  { symbol: 'NASDAQ:CSCO', name: 'Cisco',            exchange: 'NASDAQ', type: 'stock',     category: 'Stocks' },
  { symbol: 'NASDAQ:PEP',  name: 'PepsiCo',          exchange: 'NASDAQ', type: 'stock',     category: 'Stocks' },
  { symbol: 'NASDAQ:COST', name: 'Costco',           exchange: 'NASDAQ', type: 'stock',     category: 'Stocks' },
  { symbol: 'NASDAQ:AVGO', name: 'Broadcom',         exchange: 'NASDAQ', type: 'stock',     category: 'Stocks' },
  { symbol: 'NASDAQ:QCOM', name: 'Qualcomm',         exchange: 'NASDAQ', type: 'stock',     category: 'Stocks' },
  { symbol: 'NASDAQ:TXN',  name: 'Texas Instruments',exchange: 'NASDAQ', type: 'stock',     category: 'Stocks' },
  { symbol: 'NASDAQ:SBUX', name: 'Starbucks',        exchange: 'NASDAQ', type: 'stock',     category: 'Stocks' },

  // ── US Stocks (NYSE) ─────────────────────────────────────────────
  { symbol: 'NYSE:JPM',  name: 'JPMorgan Chase',  exchange: 'NYSE', type: 'stock', category: 'Stocks' },
  { symbol: 'NYSE:BAC',  name: 'Bank of America', exchange: 'NYSE', type: 'stock', category: 'Stocks' },
  { symbol: 'NYSE:V',    name: 'Visa',           exchange: 'NYSE', type: 'stock', category: 'Stocks' },
  { symbol: 'NYSE:MA',   name: 'Mastercard',     exchange: 'NYSE', type: 'stock', category: 'Stocks' },
  { symbol: 'NYSE:WMT',  name: 'Walmart',        exchange: 'NYSE', type: 'stock', category: 'Stocks' },
  { symbol: 'NYSE:DIS',  name: 'Walt Disney',    exchange: 'NYSE', type: 'stock', category: 'Stocks' },
  { symbol: 'NYSE:BA',   name: 'Boeing',         exchange: 'NYSE', type: 'stock', category: 'Stocks' },
  { symbol: 'NYSE:HD',   name: 'Home Depot',     exchange: 'NYSE', type: 'stock', category: 'Stocks' },
  { symbol: 'NYSE:CAT',  name: 'Caterpillar',    exchange: 'NYSE', type: 'stock', category: 'Stocks' },
  { symbol: 'NYSE:GE',   name: 'General Electric',exchange: 'NYSE', type: 'stock', category: 'Stocks' },
  { symbol: 'NYSE:IBM',  name: 'IBM',            exchange: 'NYSE', type: 'stock', category: 'Stocks' },
  { symbol: 'NYSE:KO',   name: 'Coca-Cola',      exchange: 'NYSE', type: 'stock', category: 'Stocks' },
  { symbol: 'NYSE:PFE',  name: 'Pfizer',         exchange: 'NYSE', type: 'stock', category: 'Stocks' },
  { symbol: 'NYSE:JNJ',  name: 'Johnson & Johnson',exchange: 'NYSE',type: 'stock', category: 'Stocks' },
  { symbol: 'NYSE:UNH',  name: 'UnitedHealth',   exchange: 'NYSE', type: 'stock', category: 'Stocks' },
  { symbol: 'NYSE:MRK',  name: 'Merck',          exchange: 'NYSE', type: 'stock', category: 'Stocks' },
  { symbol: 'NYSE:PG',   name: 'Procter & Gamble',exchange: 'NYSE',type: 'stock', category: 'Stocks' },
  { symbol: 'NYSE:UBER', name: 'Uber',           exchange: 'NYSE', type: 'stock', category: 'Stocks' },
  { symbol: 'NYSE:COIN', name: 'Coinbase',       exchange: 'NYSE', type: 'stock', category: 'Stocks' },
  { symbol: 'NYSE:NIO',  name: 'NIO',            exchange: 'NYSE', type: 'stock', category: 'Stocks' },

  // ── Indices ──────────────────────────────────────────────────────
  { symbol: 'TVC:US30',   name: 'Dow Jones 30',       exchange: 'Index', type: 'index', category: 'Indices' },
  { symbol: 'TVC:SPX500', name: 'S&P 500',            exchange: 'Index', type: 'index', category: 'Indices' },
  { symbol: 'TVC:NDX100', name: 'Nasdaq 100',         exchange: 'Index', type: 'index', category: 'Indices' },
  { symbol: 'TVC:UK100',  name: 'FTSE 100',           exchange: 'Index', type: 'index', category: 'Indices' },
  { symbol: 'TVC:DE40',   name: 'DAX 40',             exchange: 'Index', type: 'index', category: 'Indices' },
  { symbol: 'TVC:JP225',  name: 'Nikkei 225',         exchange: 'Index', type: 'index', category: 'Indices' },
  { symbol: 'TVC:FR40',   name: 'CAC 40',             exchange: 'Index', type: 'index', category: 'Indices' },
  { symbol: 'TVC:EU50',   name: 'Euro Stoxx 50',      exchange: 'Index', type: 'index', category: 'Indices' },
  { symbol: 'TVC:HK50',   name: 'Hang Seng',          exchange: 'Index', type: 'index', category: 'Indices' },
  { symbol: 'TVC:AU200',  name: 'ASX 200',            exchange: 'Index', type: 'index', category: 'Indices' },
]

// ─── SYMBOL_CATEGORIES – grouped by market sector ───────────────────
export const SYMBOL_CATEGORIES: Array<{ id: string; label: string; symbols: SymbolItem[] }> = [
  {
    id: 'crypto',
    label: 'Crypto',
    symbols: ALL_SYMBOLS.filter(s => s.category === 'Crypto'),
  },
  {
    id: 'forex',
    label: 'Forex',
    symbols: ALL_SYMBOLS.filter(s => s.category === 'Forex'),
  },
  {
    id: 'stocks',
    label: 'Stocks',
    symbols: ALL_SYMBOLS.filter(s => s.category === 'Stocks'),
  },
  {
    id: 'indices',
    label: 'Indices',
    symbols: ALL_SYMBOLS.filter(s => s.category === 'Indices'),
  },
  {
    id: 'commodities',
    label: 'Commodities',
    symbols: ALL_SYMBOLS.filter(s => s.type === 'commodity'),
  },
]

// ─── searchSymbols – fuzzy-match helper ─────────────────────────────
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

// ─── POPULAR_SYMBOLS – backward-compatible alias ────────────────────
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
