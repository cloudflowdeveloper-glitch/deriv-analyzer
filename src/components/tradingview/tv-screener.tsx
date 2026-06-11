'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface TvScreenerProps {
  colorTheme?: 'light' | 'dark'
  className?: string
}

export function TvScreener({
  colorTheme = 'dark',
  className,
}: TvScreenerProps) {
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
      'https://s3.tradingview.com/external-embedding/embed-widget-screener.js'
    script.async = true

    const config = {
      width: '100%',
      height: '550',
      defaultColumn: 'overview',
      defaultScreen: 'most_capitalized',
      market: 'crypto',
      showToolbar: true,
      colorTheme: colorTheme,
      locale: 'en',
      isTransparent: true,
    }

    script.innerHTML = JSON.stringify(config)
    container.appendChild(script)

    return () => {
      const scripts = container.querySelectorAll('script')
      scripts.forEach((s) => s.remove())
      container.innerHTML = ''
    }
  }, [colorTheme])

  return (
    <div
      ref={containerRef}
      className={cn('tradingview-widget-container', className)}
    />
  )
}