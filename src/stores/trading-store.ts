import { create } from 'zustand'
import { MarketType, SignalType, AccumulatorLeg, AnalysisSignal } from '@/lib/trading-types'

interface TradingStore {
  // Selected symbol
  activeSymbol: string
  setActiveSymbol: (symbol: string) => void

  // Active tab
  activeTab: MarketType | 'dashboard' | 'accumulators' | 'chart'
  setActiveTab: (tab: MarketType | 'dashboard' | 'accumulators' | 'chart') => void

  // Timeframe
  timeframe: string
  setTimeframe: (tf: string) => void

  // Theme
  theme: 'light' | 'dark'
  toggleTheme: () => void

  // Analysis results cache
  analysisResults: Record<string, AnalysisSignal>
  setAnalysisResult: (key: string, result: AnalysisSignal) => void

  // Accumulator
  accumulatorLegs: AccumulatorLeg[]
  addLeg: (leg: AccumulatorLeg) => void
  removeLeg: (symbol: string) => void
  clearAccumulator: () => void

  // Watchlist
  watchlist: string[]
  addToWatchlist: (symbol: string) => void
  removeFromWatchlist: (symbol: string) => void
}

export const useTradingStore = create<TradingStore>((set) => ({
  activeSymbol: 'BINANCE:BTCUSDT',
  activeTab: 'chart',
  timeframe: '15',
  theme: 'dark',

  setActiveSymbol: (symbol) => set({ activeSymbol: symbol }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setTimeframe: (tf) => set({ timeframe: tf }),
  toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

  analysisResults: {},
  setAnalysisResult: (key, result) =>
    set((s) => ({ analysisResults: { ...s.analysisResults, [key]: result } })),

  accumulatorLegs: [],
  addLeg: (leg) =>
    set((s) => {
      if (s.accumulatorLegs.some((l) => l.symbol === leg.symbol && l.marketType === leg.marketType)) return s
      if (s.accumulatorLegs.length >= 10) return s
      return { accumulatorLegs: [...s.accumulatorLegs, leg] }
    }),
  removeLeg: (symbol) =>
    set((s) => ({ accumulatorLegs: s.accumulatorLegs.filter((l) => l.symbol !== symbol) })),
  clearAccumulator: () => set({ accumulatorLegs: [] }),

  watchlist: [
    'BINANCE:BTCUSDT',
    'BINANCE:ETHUSDT',
    'FX:EURUSD',
    'NASDAQ:AAPL',
    'FX:XAUUSD',
  ],
  addToWatchlist: (symbol) =>
    set((s) => {
      if (s.watchlist.includes(symbol)) return s
      return { watchlist: [...s.watchlist, symbol] }
    }),
  removeFromWatchlist: (symbol) =>
    set((s) => ({ watchlist: s.watchlist.filter((s2) => s2 !== symbol) })),
}))
