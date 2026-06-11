'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface TvSymbolInfoProps {
  symbol?: string
  colorTheme?: 'light' | 'dark'
  className?: string
}

export function TvSymbolInfo({
  symbol = 'BINANCE:BTCUSDT',
  colorTheme = 'dark',
  className,
}: TvSymbolInfoProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.innerHTML = ''

    const widgetDiv = document.createElement('div')
    widgetDiv.className = 'tradingview-widget-container__widget'
    container.appendChild(widgetDiv)

    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src =
      'https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js'
    script.async = true

    const config = {
      symbol: symbol,
      width: '100%',
      isTransparent: true,
      colorTheme: colorTheme,
      locale: 'en',
    }

    script.innerHTML = JSON.stringify(config)
    container.appendChild(script)

    return () => {
      const scripts = container.querySelectorAll('script')
      scripts.forEach((s) => s.remove())
      container.innerHTML = ''
    }
  }, [symbol, colorTheme])

  return (
    <div
      ref={containerRef}
      className={cn('tradingview-widget-container', className)}
    />
  )
}