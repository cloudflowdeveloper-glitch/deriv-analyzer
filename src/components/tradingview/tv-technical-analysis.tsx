'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface TvTechnicalAnalysisProps {
  symbol?: string
  colorTheme?: 'light' | 'dark'
  isTransparent?: boolean
  className?: string
}

export function TvTechnicalAnalysis({
  symbol = 'BINANCE:BTCUSDT',
  colorTheme = 'dark',
  isTransparent = true,
  className,
}: TvTechnicalAnalysisProps) {
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
      'https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js'
    script.async = true

    const config = {
      interval: '1h',
      width: '100%',
      isTransparent: isTransparent,
      height: '450',
      symbol: symbol,
      showIntervalTabs: true,
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
  }, [symbol, colorTheme, isTransparent])

  return (
    <div
      ref={containerRef}
      className={cn('tradingview-widget-container', className)}
    />
  )
}