'use client'

import { cn } from '@/lib/utils'
import { useTickStore, DigitAnalysis } from '@/stores/tick-store'
import { Zap } from 'lucide-react'

interface DigitBarProps {
  analysis: DigitAnalysis | undefined
  barrier?: number
  highlight?: 'even' | 'odd' | 'over' | 'under' | 'differs'
  differsDigit?: number
  className?: string
}

export function DigitBar({ analysis, barrier = 4, highlight, differsDigit, className }: DigitBarProps) {
  if (!analysis) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="grid grid-cols-10 gap-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <div className="w-full h-8 bg-muted/50 rounded animate-pulse" />
              <span className="text-[9px] text-muted-foreground">{i}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const maxCount = Math.max(...analysis.digitCounts, 1)

  return (
    <div className={cn('space-y-1.5', className)}>
      {/* Bar Chart */}
      <div className="grid grid-cols-10 gap-1">
        {analysis.digitCounts.map((count, digit) => {
          const pct = analysis.digitPercentages[digit]
          const heightPct = (count / maxCount) * 100
          const isEven = digit % 2 === 0
          const isOver = digit > barrier

          // Highlight logic
          let bgClass = 'bg-muted-foreground/30'
          let labelClass = 'text-muted-foreground'

          if (highlight === 'even' && isEven) {
            bgClass = 'bg-emerald-500/60'
            labelClass = 'text-emerald-400'
          } else if (highlight === 'odd' && !isEven) {
            bgClass = 'bg-rose-500/60'
            labelClass = 'text-rose-400'
          } else if (highlight === 'over' && isOver) {
            bgClass = 'bg-sky-500/60'
            labelClass = 'text-sky-400'
          } else if (highlight === 'under' && !isOver) {
            bgClass = 'bg-amber-500/60'
            labelClass = 'text-amber-400'
          } else if (highlight === 'differs' && digit !== differsDigit) {
            bgClass = 'bg-orange-500/60'
            labelClass = 'text-orange-400'
          } else if (highlight === 'differs' && digit === differsDigit) {
            bgClass = 'bg-red-500/60'
            labelClass = 'text-red-400'
          }

          return (
            <div key={digit} className="flex flex-col items-center gap-0.5">
              <span className={cn('text-[8px] font-bold leading-none', labelClass)}>{pct.toFixed(0)}%</span>
              <div className="w-full h-12 bg-muted/30 rounded-sm flex items-end overflow-hidden">
                <div
                  className={cn('w-full rounded-sm transition-all duration-300', bgClass)}
                  style={{ height: `${Math.max(heightPct, 2)}%` }}
                />
              </div>
              <span className={cn(
                'text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded',
                digit === analysis.lastDigit
                  ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                  : isEven ? 'text-emerald-500/60' : 'text-rose-500/60'
              )}>
                {digit}
              </span>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-[8px] text-muted-foreground">
        <span>{analysis.totalTicks} ticks analyzed</span>
        {highlight === 'over' || highlight === 'under' ? (
          <span>Barrier: {barrier}</span>
        ) : highlight === 'differs' && differsDigit !== undefined ? (
          <span>Differs from: {differsDigit}</span>
        ) : null}
      </div>
    </div>
  )
}

interface LastDigitDisplayProps {
  analysis: DigitAnalysis | undefined
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LastDigitDisplay({ analysis, size = 'lg', className }: LastDigitDisplayProps) {
  const digit = analysis?.lastDigit ?? '-'
  const isEven = typeof digit === 'number' && digit % 2 === 0

  const sizeClasses = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-12 w-12 text-xl',
    lg: 'h-16 w-16 text-3xl',
  }

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div className={cn(
        'rounded-xl flex items-center justify-center font-mono font-black transition-all duration-200',
        sizeClasses[size],
        isEven ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30' : 'bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/30'
      )}>
        {digit}
      </div>
      <span className="text-[8px] text-muted-foreground uppercase tracking-wider">Last Digit</span>
    </div>
  )
}

interface LivePriceDisplayProps {
  tvSymbol: string
  className?: string
}

export function LivePriceDisplay({ tvSymbol, className }: LivePriceDisplayProps) {
  const livePrice = useTickStore((s) => s.livePrices[tvSymbol])
  const connected = useTickStore((s) => s.connected)

  if (!livePrice) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="animate-pulse h-6 w-24 bg-muted/50 rounded" />
      </div>
    )
  }

  const isPositive = livePrice.change >= 0

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-center gap-1.5">
        {connected && <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />}
        <span className="font-mono font-bold text-base">{formatPrice(livePrice.price)}</span>
      </div>
      <span className={cn(
        'text-[10px] font-mono font-medium',
        isPositive ? 'text-emerald-400' : 'text-red-400'
      )}>
        {isPositive ? '+' : ''}{livePrice.changePercent.toFixed(2)}%
      </span>
    </div>
  )
}

interface DigitStatsProps {
  analysis: DigitAnalysis | undefined
  marketType: 'even_odd' | 'differs' | 'over_under' | 'higher_lower' | 'turbo' | 'multiplier'
  barrier?: number
  differsDigit?: number
  className?: string
}

export function DigitStats({ analysis, marketType, barrier = 4, differsDigit, className }: DigitStatsProps) {
  if (!analysis) {
    return (
      <div className={cn('space-y-1.5 animate-pulse', className)}>
        {[1, 2, 3].map(i => (
          <div key={i} className="h-6 bg-muted/50 rounded" />
        ))}
      </div>
    )
  }

  return (
    <div className={cn('space-y-1', className)}>
      {/* Even/Odd Stats */}
      {(marketType === 'even_odd' || marketType === 'turbo' || marketType === 'multiplier') && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-[10px] text-muted-foreground">Even</span>
            <span className="text-[11px] font-bold text-emerald-400">{analysis.evenCount}</span>
            <span className="text-[9px] text-muted-foreground">({analysis.evenPercent}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-rose-400" />
            <span className="text-[10px] text-muted-foreground">Odd</span>
            <span className="text-[11px] font-bold text-rose-400">{analysis.oddCount}</span>
            <span className="text-[9px] text-muted-foreground">({analysis.oddPercent}%)</span>
          </div>
        </div>
      )}

      {/* Over/Under Stats */}
      {(marketType === 'over_under' || marketType === 'differs') && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-sky-400" />
            <span className="text-[10px] text-muted-foreground">
              {marketType === 'over_under' ? `Over ${barrier}` : `≠ ${differsDigit ?? '?'}`}
            </span>
            <span className="text-[11px] font-bold text-sky-400">{analysis.overCount}</span>
            <span className="text-[9px] text-muted-foreground">({analysis.overPercent}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="text-[10px] text-muted-foreground">
              {marketType === 'over_under' ? `Under ${barrier}` : `= ${differsDigit ?? '?'}`}
            </span>
            <span className="text-[11px] font-bold text-amber-400">{analysis.underCount}</span>
            <span className="text-[9px] text-muted-foreground">({analysis.underPercent}%)</span>
          </div>
        </div>
      )}

      {/* Streak */}
      <div className="flex items-center gap-1.5">
        <Zap className="h-3 w-3 text-amber-400" />
        <span className="text-[10px] text-muted-foreground">
          {analysis.streakLength} consecutive {analysis.streakType}
        </span>
      </div>

      {/* Tick Speed */}
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-muted-foreground">Tick Speed</span>
        <span className="text-[10px] font-mono font-medium">{analysis.tickSpeed} t/s</span>
      </div>

      {/* Price Range */}
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-muted-foreground">Range ({analysis.totalTicks} ticks)</span>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-emerald-400">{formatPrice(analysis.lowPrice)}</span>
          <span className="text-[9px] text-muted-foreground">→</span>
          <span className="text-[9px] font-mono text-rose-400">{formatPrice(analysis.highPrice)}</span>
        </div>
      </div>
    </div>
  )
}

// Recent ticks table
interface RecentTicksProps {
  analysis: DigitAnalysis | undefined
  limit?: number
  className?: string
}

export function RecentTicks({ analysis, limit = 25, className }: RecentTicksProps) {
  if (!analysis || analysis.recentTicks.length === 0) return null

  const ticks = analysis.recentTicks.slice(-limit).reverse()

  return (
    <div className={cn('space-y-1', className)}>
      <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
        Recent Ticks{limit < 25 ? ` (last ${limit})` : ''}
      </p>
      <div className="space-y-0.5 max-h-40 overflow-y-auto">
        {ticks.map((tick, i) => {
          const isEven = tick.lastDigit % 2 === 0
          const time = new Date(tick.timestamp)
          const timeStr = `${time.getMinutes().toString().padStart(2, '0')}:${time.getSeconds().toString().padStart(2, '0')}.${time.getMilliseconds().toString().padStart(3, '0')}`

          return (
            <div key={i} className="flex items-center justify-between px-1.5 py-0.5 text-[9px] font-mono rounded hover:bg-muted/30">
              <span className="text-muted-foreground">{timeStr}</span>
              <span className="font-medium">{formatPrice(tick.price)}</span>
              <div className={cn(
                'h-4 w-4 flex items-center justify-center rounded text-[8px] font-bold',
                isEven ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              )}>
                {tick.lastDigit}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────
function formatPrice(price: number): string {
  if (price >= 10000) return price.toFixed(2)
  if (price >= 100) return price.toFixed(2)
  if (price >= 1) return price.toFixed(4)
  return price.toFixed(6)
}
