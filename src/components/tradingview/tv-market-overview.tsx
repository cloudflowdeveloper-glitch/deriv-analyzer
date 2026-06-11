'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { POPULAR_SYMBOLS } from '@/lib/trading-types'

interface TvMarketOverviewProps {
  colorTheme?: 'light' | 'dark'
  symbols?: Array<{
    s: string
    d: string
  }>
  className?: string
}

const DEFAULT_SYMBOLS = [
  { s: 'BINANCE:BTCUSDT', d: 'BTC/USDT' },
  { s: 'BINANCE:ETHUSDT', d: 'ETH/USDT' },
  { s: 'FX:EURUSD', d: 'EUR/USD' },
  { s: 'NASDAQ:AAPL', d: 'Apple' },
  { s: 'NASDAQ:GOOGL', d: 'Alphabet' },
  { s: 'NASDAQ:MSFT', d: 'Microsoft' },
  { s: 'NASDAQ:TSLA', d: 'Tesla' },
  { s: 'FX:XAUUSD', d: 'Gold' },
  { s: 'BINANCE:SOLUSDT', d: 'SOL/USDT' },
  { s: 'TVC:US30', d: 'Dow Jones 30' },
  { s: 'NASDAQ:AMZN', d: 'Amazon' },
  { s: 'BINANCE:BNBUSDT', d: 'BNB/USDT' },
]

export function TvMarketOverview({
  colorTheme = 'dark',
  symbols,
  className,
}: TvMarketOverviewProps) {
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
      'https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js'
    script.async = true

    const config = {
      colorTheme: colorTheme,
      dateRange: '1D',
      showChart: true,
      locale: 'en',
      largeChartUrl: '',
      isTransparent: true,
      showSymbolLogo: true,
      showFloatingTooltip: true,
      width: '100%',
      height: '100%',
      plotLineColorGrowing: 'rgba(22, 163, 74, 1)',
      plotLineColorFalling: 'rgba(220, 38, 38, 1)',
      gridLineColor: 'rgba(42, 46, 57, 1)',
      scaleFontColor: 'rgba(120, 123, 134, 1)',
      belowLineFillColorGrowing: 'rgba(22, 163, 74, 0.12)',
      belowLineFillColorFalling: 'rgba(220, 38, 38, 0.12)',
      belowLineFillColorGrowingBottom: 'rgba(22, 163, 74, 0)',
      belowLineFillColorFallingBottom: 'rgba(220, 38, 38, 0)',
      symbolActiveColor: 'rgba(22, 163, 74, 0.12)',
      tabs: [
        {
          title: 'Indices',
          symbols: [
            { s: 'TVC:US30', d: 'Dow Jones 30' },
            { s: 'TVC:SPX', d: 'S&P 500' },
            { s: 'TVC:NDX', d: 'Nasdaq 100' },
          ],
          originalTitle: 'Indices',
        },
        {
          title: 'Crypto',
          symbols: [
            { s: 'BINANCE:BTCUSDT', d: 'BTC/USDT' },
            { s: 'BINANCE:ETHUSDT', d: 'ETH/USDT' },
            { s: 'BINANCE:SOLUSDT', d: 'SOL/USDT' },
            { s: 'BINANCE:BNBUSDT', d: 'BNB/USDT' },
          ],
          originalTitle: 'Crypto',
        },
        {
          title: 'Forex',
          symbols: [
            { s: 'FX:EURUSD', d: 'EUR/USD' },
            { s: 'FX:GBPUSD', d: 'GBP/USD' },
            { s: 'FX:USDJPY', d: 'USD/JPY' },
          ],
          originalTitle: 'Forex',
        },
        {
          title: 'Stocks',
          symbols: [
            { s: 'NASDAQ:AAPL', d: 'Apple' },
            { s: 'NASDAQ:GOOGL', d: 'Alphabet' },
            { s: 'NASDAQ:MSFT', d: 'Microsoft' },
          ],
          originalTitle: 'Stocks',
        },
      ],
    }

    script.innerHTML = JSON.stringify(config)
    container.appendChild(script)

    return () => {
      const scripts = container.querySelectorAll('script')
      scripts.forEach((s) => s.remove())
      container.innerHTML = ''
    }
  }, [colorTheme, symbols])

  return (
    <div
      ref={containerRef}
      className={cn('tradingview-widget-container', className)}
    />
  )
}