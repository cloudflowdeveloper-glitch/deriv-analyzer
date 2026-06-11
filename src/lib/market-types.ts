export interface MarketEvent {
  id: string
  homeTeam: string
  awayTeam: string
  sport: string
  league: string
  status: 'upcoming' | 'live' | 'completed' | 'suspended'
  startTime: string
  currentScore: string
  minute: number
  markets: MarketData[]
}

export interface MarketData {
  id: string
  eventId: string
  marketType: MarketType
  marketLabel: string
  selection: string
  odds: number
  prevOdds: number
  volume: number
  impliedProb: number
  trend: 'rising' | 'falling' | 'neutral'
  status: 'active' | 'suspended' | 'settled'
  analysis?: MarketAnalysis
}

export type MarketType = 'even_odd' | 'differs' | 'over_under' | 'multiplier' | 'higher_lower' | 'turbo'

export interface MarketAnalysis {
  signal: SignalType
  confidence: number
  kellyCriterion: number
  expectedValue: number
  factors: string[]
}

export type SignalType = 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell'

export interface AnalysisSnapshot {
  marketType: string
  timestamp: string
  totalMarkets: number
  buySignals: number
  sellSignals: number
  neutralSignals: number
  avgConfidence: number
  topPick?: MarketData & { analysis: NonNullable<MarketData['analysis']> }
}

export interface MarketUpdatePayload {
  eventId: string
  market: MarketData
  eventMinute: number
  eventScore: string
  timestamp: string
}

export interface AccumulatorLeg {
  eventId: string
  homeTeam: string
  awayTeam: string
  marketLabel: string
  selection: string
  odds: number
  signal: SignalType
  confidence: number
}

export const MARKET_TYPE_CONFIG: Record<MarketType, {
  label: string
  icon: string
  color: string
  description: string
}> = {
  even_odd: {
    label: 'Even / Odd',
    icon: 'Hash',
    color: 'text-emerald-500',
    description: 'Predict whether total goals/points will be even or odd'
  },
  differs: {
    label: 'Differs',
    icon: 'Unlink',
    color: 'text-orange-500',
    description: 'Markets where a specific scoreline will NOT happen'
  },
  over_under: {
    label: 'Over / Under',
    icon: 'ArrowUpDown',
    color: 'text-sky-500',
    description: 'Total goals/points over or under a specified line'
  },
  multiplier: {
    label: 'Multipliers',
    icon: 'X',
    color: 'text-purple-500',
    description: 'Enhanced odds multiplier markets with risk/reward analysis'
  },
  higher_lower: {
    label: 'Higher / Lower',
    icon: 'TrendingUp',
    color: 'text-rose-500',
    description: 'Predict if outcome will be higher or lower than expected'
  },
  turbo: {
    label: 'Turbos',
    icon: 'Zap',
    color: 'text-amber-500',
    description: 'Fast-paced next-event markets with real-time analysis'
  }
}

export const SIGNAL_CONFIG: Record<SignalType, {
  label: string
  color: string
  bgClass: string
  textColor: string
}> = {
  strong_buy: {
    label: 'Strong Buy',
    color: '#16a34a',
    bgClass: 'bg-emerald-500',
    textColor: 'text-emerald-600'
  },
  buy: {
    label: 'Buy',
    color: '#4ade80',
    bgClass: 'bg-emerald-400',
    textColor: 'text-emerald-500'
  },
  neutral: {
    label: 'Neutral',
    color: '#9ca3af',
    bgClass: 'bg-gray-400',
    textColor: 'text-gray-500'
  },
  sell: {
    label: 'Sell',
    color: '#f87171',
    bgClass: 'bg-red-400',
    textColor: 'text-red-500'
  },
  strong_sell: {
    label: 'Strong Sell',
    color: '#dc2626',
    bgClass: 'bg-red-600',
    textColor: 'text-red-600'
  }
}
