'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useTickStore } from '@/stores/tick-store'
import { useTradingStore } from '@/stores/trading-store'

/**
 * Hook to fetch tick data from the tick-feed service via Next.js API proxy.
 * Uses polling for real-time data updates.
 */
export function useTickFeed() {
  const {
    connected, setConnected,
    setDigitAnalysis, setDigitAnalyses,
    setAllPrices,
    updateLivePrice,
    loading, setLoading,
  } = useTickStore()
  const activeSymbol = useTradingStore((s) => s.activeSymbol)

  const fetchFromTickFeed = useCallback(async (path: string): Promise<any | null> => {
    try {
      const url = `/api/tick-feed?path=${encodeURIComponent(path)}`
      const res = await fetch(url)
      if (!res.ok) return null
      return await res.json()
    } catch {
      return null
    }
  }, [])

  // Fetch all prices
  const fetchAllPrices = useCallback(async () => {
    try {
      const data = await fetchFromTickFeed('/api/all-prices')
      if (data?.prices) {
        setAllPrices(data.prices)
        for (const p of data.prices) {
          updateLivePrice(p.symbol, p.price, p.lastDigit, p.change, p.changePercent)
        }
        setConnected(true)
      }
    } catch {
      // ignore
    }
  }, [fetchFromTickFeed, setAllPrices, updateLivePrice, setConnected])

  // Fetch digit analysis for a specific symbol
  const fetchDigits = useCallback(async (symbol: string, barrier?: number) => {
    try {
      const barrierParam = barrier !== undefined ? `&barrier=${barrier}` : ''
      const url = `/api/tick-feed?path=${encodeURIComponent(`/api/digits?symbol=${encodeURIComponent(symbol)}${barrierParam}`)}`
      const res = await fetch(url)
      if (!res.ok) return null
      const data = await res.json()
      if (data?.tvSymbol) {
        setDigitAnalysis(symbol, data)
        updateLivePrice(symbol, data.currentPrice, data.lastDigit, data.priceChange, data.priceChangePercent)
      }
      return data
    } catch {
      return null
    }
  }, [setDigitAnalysis, updateLivePrice])

  // Fetch all digit analyses (batch)
  const fetchAllDigits = useCallback(async () => {
    try {
      const allPricesData = await fetchFromTickFeed('/api/all-prices')
      if (!allPricesData?.prices) return

      // Fetch digits for the most important symbols
      const importantSymbols = allPricesData.prices
        .filter((p: any) => p.price > 0)
        .slice(0, 15)

      const results = await Promise.allSettled(
        importantSymbols.map(async (sym: any) => {
          return fetchDigits(sym.symbol)
        })
      )

      const successCount = results.filter(r => r.status === 'fulfilled' && r.value !== null).length
      if (successCount > 0) {
        setConnected(true)
        setLoading(false)
      }
    } catch {
      // ignore
    }
  }, [fetchFromTickFeed, fetchDigits, setConnected, setLoading])

  // Initial fetch and periodic updates
  useEffect(() => {
    // Initial fetch
    setLoading(true)
    fetchAllPrices()
    fetchAllDigits()

    // Periodic price updates (every 5 seconds)
    const priceInterval = setInterval(fetchAllPrices, 5000)

    // Periodic digit updates (every 3 seconds)
    const digitInterval = setInterval(fetchAllDigits, 3000)

    return () => {
      clearInterval(priceInterval)
      clearInterval(digitInterval)
    }
  }, [fetchAllPrices, fetchAllDigits, setLoading])

  // Fetch digit analysis for active symbol more frequently
  useEffect(() => {
    if (!activeSymbol) return

    // Initial fetch
    fetchDigits(activeSymbol)

    // Frequent updates for active symbol (every 2 seconds)
    const interval = setInterval(() => {
      fetchDigits(activeSymbol)
    }, 2000)

    return () => clearInterval(interval)
  }, [activeSymbol, fetchDigits])

  // Check health
  useEffect(() => {
    const checkHealth = async () => {
      const health = await fetchFromTickFeed('/api/health')
      if (health?.status === 'ok') {
        setConnected(health.binanceConnected)
      } else {
        setConnected(false)
      }
    }
    checkHealth()
    const interval = setInterval(checkHealth, 15000)
    return () => clearInterval(interval)
  }, [fetchFromTickFeed, setConnected])

  return { connected, loading }
}
