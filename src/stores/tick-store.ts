import { create } from 'zustand'

// ─── Types ───────────────────────────────────────────────────────────
export interface TickData {
  price: number
  timestamp: number
  lastDigit: number
}

export interface DigitAnalysis {
  symbol: string
  tvSymbol: string
  currentPrice: number
  lastDigit: number
  digitCounts: number[]
  digitPercentages: number[]
  evenCount: number
  oddCount: number
  evenPercent: number
  oddPercent: number
  overCount: number
  underCount: number
  overPercent: number
  underPercent: number
  streakType: string
  streakLength: number
  highPrice: number
  lowPrice: number
  priceChange: number
  priceChangePercent: number
  tickSpeed: number
  recentTicks: TickData[]
  totalTicks: number
}

export interface PriceInfo {
  symbol: string
  name: string
  category: string
  price: number
  change: number
  changePercent: number
  lastDigit: number
  source: string
  tickSpeed: number
}

interface TickStore {
  // Connection state
  connected: boolean
  setConnected: (v: boolean) => void

  // Digit analysis per symbol
  digitAnalyses: Record<string, DigitAnalysis>
  setDigitAnalysis: (tvSymbol: string, analysis: DigitAnalysis) => void
  setDigitAnalyses: (analyses: Record<string, DigitAnalysis>) => void

  // All prices (for ticker)
  allPrices: PriceInfo[]
  setAllPrices: (prices: PriceInfo[]) => void

  // Live price per symbol (quick access)
  livePrices: Record<string, { price: number; lastDigit: number; change: number; changePercent: number; timestamp: number }>
  updateLivePrice: (tvSymbol: string, price: number, lastDigit: number, change: number, changePercent: number) => void

  // Loading state
  loading: boolean
  setLoading: (v: boolean) => void
}

export const useTickStore = create<TickStore>((set) => ({
  connected: false,
  setConnected: (v) => set({ connected: v }),

  digitAnalyses: {},
  setDigitAnalysis: (tvSymbol, analysis) =>
    set((s) => ({
      digitAnalyses: { ...s.digitAnalyses, [tvSymbol]: analysis },
    })),
  setDigitAnalyses: (analyses) =>
    set((s) => ({
      digitAnalyses: { ...s.digitAnalyses, ...analyses },
    })),

  allPrices: [],
  setAllPrices: (prices) => set({ allPrices: prices }),

  livePrices: {},
  updateLivePrice: (tvSymbol, price, lastDigit, change, changePercent) =>
    set((s) => ({
      livePrices: {
        ...s.livePrices,
        [tvSymbol]: { price, lastDigit, change, changePercent, timestamp: Date.now() },
      },
    })),

  loading: true,
  setLoading: (v) => set({ loading: v }),
}))
