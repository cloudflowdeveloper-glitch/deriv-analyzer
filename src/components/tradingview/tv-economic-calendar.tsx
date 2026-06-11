'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface TvEconomicCalendarProps {
  colorTheme?: 'light' | 'dark'
  isTransparent?: boolean
  className?: string
}

export function TvEconomicCalendar({
  colorTheme = 'dark',
  isTransparent = true,
  className,
}: TvEconomicCalendarProps) {
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
      'https://s3.tradingview.com/external-embedding/embed-widget-events.js'
    script.async = true

    const config = {
      colorTheme: colorTheme,
      isTransparent: isTransparent,
      width: '100%',
      height: '500',
      locale: 'en',
      importanceFilter: '-1,0,1',
      countryFilter: 'us,gb,eu,de,jp,cn',
    }

    script.innerHTML = JSON.stringify(config)
    container.appendChild(script)

    return () => {
      const scripts = container.querySelectorAll('script')
      scripts.forEach((s) => s.remove())
      container.innerHTML = ''
    }
  }, [colorTheme, isTransparent])

  return (
    <div
      ref={containerRef}
      className={cn('tradingview-widget-container', className)}
    />
  )
}