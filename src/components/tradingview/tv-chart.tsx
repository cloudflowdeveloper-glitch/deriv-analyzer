'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { POPULAR_SYMBOLS } from '@/lib/trading-types'
import { Skeleton } from '@/components/ui/skeleton'

interface TvChartProps {
  symbol?: string
  theme?: 'light' | 'dark'
  interval?: string
  height?: number
  studies?: string[]
  className?: string
}

declare global {
  interface Window {
    TradingView: any
  }
}

const DEFAULT_STUDIES = [
  'MASimple@tv-basicstudies',
  'RSI@tv-basicstudies',
  'MACD@tv-basicstudies',
]

export function TvChart({
  symbol = 'BINANCE:BTCUSDT',
  theme = 'dark',
  interval = '15',
  height = 500,
  studies,
  className,
}: TvChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const widgetRef = useRef<unknown>(null)
  const symbolInfo = POPULAR_SYMBOLS.find((s) => s.symbol === symbol)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const locale = 'en'
    const activeStudies = studies ?? DEFAULT_STUDIES

    const initWidget = () => {
      // Clean up previous widget
      if (widgetRef.current) {
        // TradingView widget doesn't have a documented destroy method,
        // so we clear the container and recreate
        container.innerHTML = ''
      }

      // @ts-expect-error TradingView global
      widgetRef.current = new window.TradingView.widget({
        autosize: true,
        symbol: symbol,
        interval: interval,
        timezone: 'Etc/UTC',
        theme: theme,
        style: '1',
        locale: locale,
        enable_publishing: false,
        allow_symbol_change: true,
        container_id: 'tv-chart-container',
        hide_side_toolbar: false,
        studies: activeStudies.map((id) => ({
          id: id,
          inputs: {},
        })),
      }) as unknown

      setIsLoading(false)
    }

    // Check if TradingView is already loaded
    if (window.TradingView) {
      initWidget()
      return
    }

    // Load TradingView library
    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/tv.js'
    script.async = true
    script.onload = () => initWidget()
    script.onerror = () => {
      console.error('Failed to load TradingView library')
      setIsLoading(false)
    }
    document.head.appendChild(script)

    return () => {
      // Clean up: remove the script if it was the one we added
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
      widgetRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, theme, interval, studies])

  return (
    <div className={cn('relative', className)}>
      {isLoading && (
        <div className="absolute inset-0 z-10 space-y-3 p-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="w-full" style={{ height: height - 40 }} />
        </div>
      )}
      <div
        ref={containerRef}
        className="tradingview-widget-container"
        style={{ height: `${height}px` }}
      >
        <div
          id="tv-chart-container"
          className="tradingview-widget-container__widget"
          style={{ height: `${height}px`, width: '100%' }}
        />
        {symbolInfo && (
          <div className="tradingview-widget-copyright">
            <a
              href={`https://www.tradingview.com/symbols/${symbol}/`}
              rel="noopener noreferrer"
              target="_blank"
              className="text-xs text-muted-foreground hover:underline"
            >
              {symbolInfo.name} Chart by TradingView
            </a>
          </div>
        )}
      </div>
    </div>
  )
}