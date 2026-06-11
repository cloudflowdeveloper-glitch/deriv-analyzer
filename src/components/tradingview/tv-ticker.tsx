'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface TvTickerProps {
  symbols?: string[]
  colorTheme?: 'light' | 'dark'
  className?: string
}

const DEFAULT_SYMBOLS = [
  'BINANCE:BTCUSDT',
  'BINANCE:ETHUSDT',
  'FX:EURUSD',
  'NASDAQ:AAPL',
  'NASDAQ:GOOGL',
  'NASDAQ:MSFT',
  'NASDAQ:TSLA',
  'FX:XAUUSD',
  'BINANCE:SOLUSDT',
  'TVC:US30',
]

export function TvTicker({
  symbols = DEFAULT_SYMBOLS,
  colorTheme = 'dark',
  className,
}: TvTickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Clear any previous content
    container.innerHTML = ''

    const widgetDiv = document.createElement('div')
    widgetDiv.className = 'tradingview-widget-container__widget'
    container.appendChild(widgetDiv)

    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src =
      'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js'
    script.async = true

    const config = {
      symbols: symbols.map((s) => ({
        proName: s,
        title: s,
      })),
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: 'adaptive',
      colorTheme: colorTheme,
      locale: 'en',
    }

    script.innerHTML = JSON.stringify(config)
    container.appendChild(script)

    return () => {
      // Clean up scripts on unmount
      const scripts = container.querySelectorAll('script')
      scripts.forEach((s) => s.remove())
      container.innerHTML = ''
    }
  }, [symbols, colorTheme])

  return (
    <div
      ref={containerRef}
      className={cn('tradingview-widget-container', className)}
    />
  )
}