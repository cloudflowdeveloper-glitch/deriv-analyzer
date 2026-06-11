// ─── Deriv + TradingView Types ─────────────────────────────────────

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
export type SymbolItem = {
  symbol: string
  name: string
  exchange: string
  type: string
  category: string
  deriv: string      // Deriv API symbol name
  tv: string          // TradingView widget symbol for chart display
}

// ─── ALL_SYMBOLS — Deriv symbols ───────────────────────────────────
export const ALL_SYMBOLS: SymbolItem[] = [
  // Synthetic Indices — Volatility
  { symbol: 'R_10',    name: 'Volatility 10',     exchange: 'Deriv', type: 'synthetic', category: 'Synthetic Indices', deriv: 'R_10',    tv: 'DERIV:R_10' },
  { symbol: 'R_25',    name: 'Volatility 25',     exchange: 'Deriv', type: 'synthetic', category: 'Synthetic Indices', deriv: 'R_25',    tv: 'DERIV:R_25' },
  { symbol: 'R_50',    name: 'Volatility 50',     exchange: 'Deriv', type: 'synthetic', category: 'Synthetic Indices', deriv: 'R_50',    tv: 'DERIV:R_50' },
  { symbol: 'R_75',    name: 'Volatility 75',     exchange: 'Deriv', type: 'synthetic', category: 'Synthetic Indices', deriv: 'R_75',    tv: 'DERIV:R_75' },
  { symbol: 'R_100',   name: 'Volatility 100',    exchange: 'Deriv', type: 'synthetic', category: 'Synthetic Indices', deriv: 'R_100',   tv: 'DERIV:R_100' },
  // Synthetic Indices — 1-Second
  { symbol: '1HZ10V',  name: 'Volatility 10 (1s)', exchange: 'Deriv', type: 'synthetic', category: '1-Second Indices', deriv: '1HZ10V', tv: 'DERIV:1HZ10V' },
  { symbol: '1HZ25V',  name: 'Volatility 25 (1s)', exchange: 'Deriv', type: 'synthetic', category: '1-Second Indices', deriv: '1HZ25V', tv: 'DERIV:1HZ25V' },
  { symbol: '1HZ50V',  name: 'Volatility 50 (1s)', exchange: 'Deriv', type: 'synthetic', category: '1-Second Indices', deriv: '1HZ50V', tv: 'DERIV:1HZ50V' },
  { symbol: '1HZ75V',  name: 'Volatility 75 (1s)', exchange: 'Deriv', type: 'synthetic', category: '1-Second Indices', deriv: '1HZ75V', tv: 'DERIV:1HZ75V' },
  { symbol: '1HZ100V', name: 'Volatility 100 (1s)',exchange: 'Deriv', type: 'synthetic', category: '1-Second Indices', deriv: '1HZ100V',tv: 'DERIV:1HZ100V' },
  // Crash & Boom
  { symbol: 'CRASH300N',  name: 'Crash 300',  exchange: 'Deriv', type: 'crash_boom', category: 'Crash/Boom', deriv: 'CRASH300N', tv: 'DERIV:CRASH300N' },
  { symbol: 'BOOM300N',   name: 'Boom 300',   exchange: 'Deriv', type: 'crash_boom', category: 'Crash/Boom', deriv: 'BOOM300N',   tv: 'DERIV:BOOM300N' },
  // Step & Jump Indices
  { symbol: 'stpRNG', name: 'Step Index', exchange: 'Deriv', type: 'step', category: 'Step/Jump Indices', deriv: 'stpRNG', tv: 'DERIV:stpRNG' },
  { symbol: 'JD10',   name: 'Jump 10',   exchange: 'Deriv', type: 'jump', category: 'Step/Jump Indices', deriv: 'JD10',   tv: 'DERIV:JD10' },
  { symbol: 'JD25',   name: 'Jump 25',   exchange: 'Deriv', type: 'jump', category: 'Step/Jump Indices', deriv: 'JD25',   tv: 'DERIV:JD25' },
  { symbol: 'JD50',   name: 'Jump 50',   exchange: 'Deriv', type: 'jump', category: 'Step/Jump Indices', deriv: 'JD50',   tv: 'DERIV:JD50' },
  { symbol: 'JD75',   name: 'Jump 75',   exchange: 'Deriv', type: 'jump', category: 'Step/Jump Indices', deriv: 'JD75',   tv: 'DERIV:JD75' },
  { symbol: 'JD100',  name: 'Jump 100',  exchange: 'Deriv', type: 'jump', category: 'Step/Jump Indices', deriv: 'JD100',  tv: 'DERIV:JD100' },
  // Forex
  { symbol: 'frxEURUSD', name: 'EUR/USD', exchange: 'Deriv', type: 'forex', category: 'Forex', deriv: 'frxEURUSD', tv: 'FX:EURUSD' },
  { symbol: 'frxGBPUSD', name: 'GBP/USD', exchange: 'Deriv', type: 'forex', category: 'Forex', deriv: 'frxGBPUSD', tv: 'FX:GBPUSD' },
  { symbol: 'frxUSDJPY', name: 'USD/JPY', exchange: 'Deriv', type: 'forex', category: 'Forex', deriv: 'frxUSDJPY', tv: 'FX:USDJPY' },
  { symbol: 'frxUSDCHF', name: 'USD/CHF', exchange: 'Deriv', type: 'forex', category: 'Forex', deriv: 'frxUSDCHF', tv: 'FX:USDCHF' },
  { symbol: 'frxAUDUSD', name: 'AUD/USD', exchange: 'Deriv', type: 'forex', category: 'Forex', deriv: 'frxAUDUSD', tv: 'FX:AUDUSD' },
  { symbol: 'frxNZDUSD', name: 'NZD/USD', exchange: 'Deriv', type: 'forex', category: 'Forex', deriv: 'frxNZDUSD', tv: 'FX:NZDUSD' },
  { symbol: 'frxUSDCAD', name: 'USD/CAD', exchange: 'Deriv', type: 'forex', category: 'Forex', deriv: 'frxUSDCAD', tv: 'FX:USDCAD' },
  { symbol: 'frxEURGBP', name: 'EUR/GBP', exchange: 'Deriv', type: 'forex', category: 'Forex', deriv: 'frxEURGBP', tv: 'FX:EURGBP' },
  { symbol: 'frxEURJPY', name: 'EUR/JPY', exchange: 'Deriv', type: 'forex', category: 'Forex', deriv: 'frxEURJPY', tv: 'FX:EURJPY' },
  { symbol: 'frxGBPJPY', name: 'GBP/JPY', exchange: 'Deriv', type: 'forex', category: 'Forex', deriv: 'frxGBPJPY', tv: 'FX:GBPJPY' },
  { symbol: 'frxAUDJPY', name: 'AUD/JPY', exchange: 'Deriv', type: 'forex', category: 'Forex', deriv: 'frxAUDJPY', tv: 'FX:AUDJPY' },
  { symbol: 'frxEURAUD', name: 'EUR/AUD', exchange: 'Deriv', type: 'forex', category: 'Forex', deriv: 'frxEURAUD', tv: 'FX:EURAUD' },
  { symbol: 'frxEURCAD', name: 'EUR/CAD', exchange: 'Deriv', type: 'forex', category: 'Forex', deriv: 'frxEURCAD', tv: 'FX:EURCAD' },
  { symbol: 'frxEURCHF', name: 'EUR/CHF', exchange: 'Deriv', type: 'forex', category: 'Forex', deriv: 'frxEURCHF', tv: 'FX:EURCHF' },
  { symbol: 'frxGBPCHF', name: 'GBP/CHF', exchange: 'Deriv', type: 'forex', category: 'Forex', deriv: 'frxGBPCHF', tv: 'FX:GBPCHF' },
  { symbol: 'frxGBPAUD', name: 'GBP/AUD', exchange: 'Deriv', type: 'forex', category: 'Forex', deriv: 'frxGBPAUD', tv: 'FX:GBPAUD' },
  { symbol: 'frxGBPCAD', name: 'GBP/CAD', exchange: 'Deriv', type: 'forex', category: 'Forex', deriv: 'frxGBPCAD', tv: 'FX:GBPCAD' },
  // Commodities
  { symbol: 'frxXAUUSD', name: 'Gold',   exchange: 'Deriv', type: 'commodity', category: 'Commodities', deriv: 'frxXAUUSD', tv: 'FX:XAUUSD' },
  { symbol: 'frxXAGUSD', name: 'Silver', exchange: 'Deriv', type: 'commodity', category: 'Commodities', deriv: 'frxXAGUSD', tv: 'FX:XAGUSD' },
]

export const SYMBOL_CATEGORIES: Array<{ id: string; label: string; symbols: SymbolItem[] }> = [
  { id: 'synthetic', label: 'Synthetic Indices', symbols: ALL_SYMBOLS.filter(s => s.category === 'Synthetic Indices') },
  { id: '1second', label: '1-Second Indices', symbols: ALL_SYMBOLS.filter(s => s.category === '1-Second Indices') },
  { id: 'crash_boom', label: 'Crash/Boom', symbols: ALL_SYMBOLS.filter(s => s.category === 'Crash/Boom') },
  { id: 'step_jump', label: 'Step/Jump', symbols: ALL_SYMBOLS.filter(s => s.category === 'Step/Jump Indices') },
  { id: 'forex', label: 'Forex', symbols: ALL_SYMBOLS.filter(s => s.category === 'Forex') },
  { id: 'commodities', label: 'Commodities', symbols: ALL_SYMBOLS.filter(s => s.category === 'Commodities') },
]

export function searchSymbols(query: string): SymbolItem[] {
  const q = query.toLowerCase().trim()
  if (!q) return ALL_SYMBOLS
  return ALL_SYMBOLS.filter(s =>
    s.symbol.toLowerCase().includes(q) ||
    s.name.toLowerCase().includes(q) ||
    s.deriv.toLowerCase().includes(q) ||
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
