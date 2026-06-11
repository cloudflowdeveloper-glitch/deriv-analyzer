'use client'

import { useEffect, useId, useRef, useState } from 'react'
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
  const uniqueId = useId()
  // useId() returns a string with colons (e.g. ":r0:") — sanitize for a valid DOM id
  const containerId = `tv-chart-${uniqueId.replace(/:/g, '')}`
  const symbolInfo = POPULAR_SYMBOLS.find((s) => s.symbol === symbol)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const locale = 'en'
    const activeStudies = studies ?? DEFAULT_STUDIES

    const initWidget = () => {
      // Destroy previous widget by clearing the container innerHTML.
      // TradingView widget has no documented destroy method, so removing
      // its DOM nodes is the safest cleanup.
      const widgetContainer = document.getElementById(containerId)
      if (widgetContainer) {
        widgetContainer.innerHTML = ''
      }
      widgetRef.current = null

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
        container_id: containerId,
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
      // Clean up: clear the widget container and remove the script tag
      const widgetContainer = document.getElementById(containerId)
      if (widgetContainer) {
        widgetContainer.innerHTML = ''
      }
      widgetRef.current = null
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [symbol, theme, interval, studies, containerId])

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
          id={containerId}
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