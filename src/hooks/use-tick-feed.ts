'use client'

import { useEffect, useCallback } from 'react'
import { useTickStore } from '@/stores/tick-store'
import { useTradingStore } from '@/stores/trading-store'

/**
 * Hook to fetch tick data from the in-process Deriv tick service.
 * Uses the /api/ticks API route (no separate mini-service needed).
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

  const fetchTicksApi = useCallback(async (action: string, params?: Record<string, string>): Promise<any | null> => {
    try {
      const qs = new URLSearchParams({ action, ...params })
      const res = await fetch('/api/ticks?' + qs.toString())
      if (!res.ok) return null
      return await res.json()
    } catch {
      return null
    }
  }, [])

  const fetchAllPrices = useCallback(async () => {
    try {
      const data = await fetchTicksApi('all-prices')
      if (data?.prices) {
        setAllPrices(data.prices)
        for (const p of data.prices) {
          updateLivePrice(p.symbol, p.price, p.lastDigit, p.change, p.changePercent)
        }
        if (data.prices.length > 0) setConnected(true)
      }
    } catch {
      // ignore
    }
  }, [fetchTicksApi, setAllPrices, updateLivePrice, setConnected])

  const fetchDigits = useCallback(async (symbol: string, barrier?: number) => {
    try {
      const params: Record<string, string> = { symbol }
      if (barrier !== undefined) params.barrier = String(barrier)
      const data = await fetchTicksApi('digits', params)
      if (data?.tvSymbol) {
        setDigitAnalysis(symbol, data)
        updateLivePrice(symbol, data.currentPrice, data.lastDigit, data.priceChange, data.priceChangePercent)
      }
      return data
    } catch {
      return null
    }
  }, [fetchTicksApi, setDigitAnalysis, updateLivePrice])

  const fetchAllDigits = useCallback(async () => {
    try {
      const allPricesData = await fetchTicksApi('all-prices')
      if (!allPricesData?.prices) return

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
  }, [fetchTicksApi, fetchDigits, setConnected, setLoading])

  useEffect(() => {
    setLoading(true)
    fetchAllPrices()
    fetchAllDigits()

    const priceInterval = setInterval(fetchAllPrices, 5000)
    const digitInterval = setInterval(fetchAllDigits, 3000)

    return () => {
      clearInterval(priceInterval)
      clearInterval(digitInterval)
    }
  }, [fetchAllPrices, fetchAllDigits, setLoading])

  useEffect(() => {
    if (!activeSymbol) return

    fetchDigits(activeSymbol)

    const interval = setInterval(() => {
      fetchDigits(activeSymbol)
    }, 2000)

    return () => clearInterval(interval)
  }, [activeSymbol, fetchDigits])

  useEffect(() => {
    const checkHealth = async () => {
      const health = await fetchTicksApi('health')
      if (health?.status === 'ok') {
        setConnected(health.derivConnected ?? true)
      } else {
        setConnected(false)
      }
    }
    checkHealth()
    const interval = setInterval(checkHealth, 15000)
    return () => clearInterval(interval)
  }, [fetchTicksApi, setConnected])

  return { connected, loading }
}
