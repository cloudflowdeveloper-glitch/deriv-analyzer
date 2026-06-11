import { create } from 'zustand'
import { MarketType, SignalType, AccumulatorLeg, AnalysisSignal, Duration } from '@/lib/trading-types'

interface TradingStore {
  // Symbol
  activeSymbol: string
  setActiveSymbol: (symbol: string) => void

  // Tab
  activeTab: MarketType | 'dashboard' | 'accumulators' | 'chart'
  setActiveTab: (tab: MarketType | 'dashboard' | 'accumulators' | 'chart') => void

  // Chart timeframe
  timeframe: string
  setTimeframe: (tf: string) => void

  // Theme
  theme: 'light' | 'dark'
  toggleTheme: () => void

  // Trade contract settings
  stake: number
  setStake: (stake: number) => void
  duration: Duration
  setDuration: (d: Duration) => void
  selectedPrediction: string
  setSelectedPrediction: (p: string) => void
  barrier?: number
  setBarrier: (b: number | undefined) => void
  multiplier?: number
  setMultiplier: (m: number | undefined) => void

  // Analysis results cache
  analysisResults: Record<string, AnalysisSignal>
  setAnalysisResult: (key: string, result: AnalysisSignal) => void

  // Accumulator
  accumulatorLegs: AccumulatorLeg[]
  addLeg: (leg: AccumulatorLeg) => void
  removeLeg: (id: string) => void
  clearAccumulator: () => void

  // Watchlist
  watchlist: string[]
  addToWatchlist: (symbol: string) => void
  removeFromWatchlist: (symbol: string) => void
}

export const useTradingStore = create<TradingStore>((set) => ({
  activeSymbol: 'BINANCE:BTCUSDT',
  activeTab: 'even_odd',
  timeframe: '15',
  theme: 'dark',
  stake: 10,
  duration: { value: 5, unit: 'ticks', label: '5 ticks' },
  selectedPrediction: 'Even',
  barrier: undefined,
  multiplier: undefined,

  setActiveSymbol: (symbol) => set({ activeSymbol: symbol }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setTimeframe: (tf) => set({ timeframe: tf }),
  toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
  setStake: (stake) => set({ stake }),
  setDuration: (d) => set({ duration: d }),
  setSelectedPrediction: (p) => set({ selectedPrediction: p }),
  setBarrier: (b) => set({ barrier: b }),
  setMultiplier: (m) => set({ multiplier: m }),

  analysisResults: {},
  setAnalysisResult: (key, result) =>
    set((s) => ({ analysisResults: { ...s.analysisResults, [key]: result } })),

  accumulatorLegs: [],
  addLeg: (leg) =>
    set((s) => {
      if (s.accumulatorLegs.some((l) => l.id === leg.id)) return s
      if (s.accumulatorLegs.length >= 10) return s
      return { accumulatorLegs: [...s.accumulatorLegs, leg] }
    }),
  removeLeg: (id) =>
    set((s) => ({ accumulatorLegs: s.accumulatorLegs.filter((l) => l.id !== id) })),
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
    set((s) => ({ watchlist: s.watchlist.filter((w) => w !== symbol) })),
}))
