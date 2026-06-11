import { create } from 'zustand'
import { MarketEvent, MarketType, AnalysisSnapshot, MarketUpdatePayload, AccumulatorLeg, SignalType } from '@/lib/market-types'

interface MarketStore {
  // Events & Markets
  events: MarketEvent[]
  activeTab: MarketType | 'dashboard' | 'accumulators'
  searchQuery: string
  
  // Live data
  isConnected: boolean
  lastUpdate: string | null
  snapshot: AnalysisSnapshot | null
  
  // Accumulator
  accumulatorLegs: AccumulatorLeg[]
  
  // Filters
  sportFilter: string | null
  signalFilter: SignalType | null
  statusFilter: string | null
  
  // Actions
  setEvents: (events: MarketEvent[]) => void
  setActiveTab: (tab: MarketType | 'dashboard' | 'accumulators') => void
  setSearchQuery: (query: string) => void
  setConnected: (connected: boolean) => void
  updateMarket: (payload: MarketUpdatePayload) => void
  setSnapshot: (snapshot: AnalysisSnapshot) => void
  addAccumulatorLeg: (leg: AccumulatorLeg) => void
  removeAccumulatorLeg: (eventId: string) => void
  clearAccumulator: () => void
  setSportFilter: (sport: string | null) => void
  setSignalFilter: (signal: SignalType | null) => void
  setStatusFilter: (status: string | null) => void
}

export const useMarketStore = create<MarketStore>((set) => ({
  events: [],
  activeTab: 'dashboard',
  searchQuery: '',
  isConnected: false,
  lastUpdate: null,
  snapshot: null,
  accumulatorLegs: [],
  sportFilter: null,
  signalFilter: null,
  statusFilter: null,

  setEvents: (events) => set({ events }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setConnected: (isConnected) => set({ isConnected }),
  updateMarket: (payload) =>
    set((state) => {
      const newEvents = state.events.map((event) => {
        if (event.id === payload.eventId) {
          return {
            ...event,
            markets: event.markets.map((m) =>
              m.id === payload.market.id ? payload.market : m
            ),
            minute: payload.eventMinute,
            currentScore: payload.eventScore,
          }
        }
        return event
      })
      return { events: newEvents, lastUpdate: payload.timestamp }
    }),
  setSnapshot: (snapshot) => set({ snapshot }),
  addAccumulatorLeg: (leg) =>
    set((state) => {
      const exists = state.accumulatorLegs.some((l) => l.eventId === leg.eventId)
      if (exists || state.accumulatorLegs.length >= 10) return state
      return { accumulatorLegs: [...state.accumulatorLegs, leg] }
    }),
  removeAccumulatorLeg: (eventId) =>
    set((state) => ({
      accumulatorLegs: state.accumulatorLegs.filter((l) => l.eventId !== eventId),
    })),
  clearAccumulator: () => set({ accumulatorLegs: [] }),
  setSportFilter: (sportFilter) => set({ sportFilter }),
  setSignalFilter: (signalFilter) => set({ signalFilter }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
}))
