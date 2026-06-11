'use client'

import { useState, useMemo, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTradingStore } from '@/stores/trading-store'
import { useTickStore } from '@/stores/tick-store'
import { MarketType, MARKET_TYPES, SIGNAL_COLORS, ALL_SYMBOLS, SYMBOL_CATEGORIES, AnalysisSignal, TICK_DURATIONS, TIME_DURATIONS, Duration } from '@/lib/trading-types'
import { DigitBar, LastDigitDisplay, LivePriceDisplay, DigitStats, RecentTicks } from '@/components/ticks/digit-analysis'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Activity, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Layers, ChevronUp, ChevronDown, Clock, Hash, DollarSign,
  Target, Zap, BarChart3, Wifi, WifiOff, Brain, ArrowRight,
  CheckCircle2, XCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Prediction types ───────────────────────────────────────────
interface PredictionData {
  symbol: string
  marketType: string
  prediction: string
  confidence: number
  probability: number
  lastDigit: number
  recentDigits: number[]
  tickCount: number
  streakInfo: string
  reasoning: string
  timestamp: string
}

// ─── Prediction Card ──────────────────────────────────────────────
function PredictionCard({ prediction, marketType, config }: {
  prediction: PredictionData | undefined
  marketType: MarketType
  config: typeof MARKET_TYPES[MarketType]
}) {
  if (!prediction) return null

  const isPositive = ['Even', 'Over', 'Differs'].includes(prediction.prediction)
  const confidenceLevel = prediction.confidence >= 75 ? 'high' : prediction.confidence >= 55 ? 'medium' : 'low'
  const confidenceColor = {
    high: 'text-emerald-400',
    medium: 'text-amber-400',
    low: 'text-gray-400'
  }[confidenceLevel]

  const predictionBg = {
    even_odd: 'bg-gradient-to-r from-emerald-500/10 to-rose-500/10',
    differs: 'bg-gradient-to-r from-orange-500/10 to-amber-500/10',
    over_under: 'bg-gradient-to-r from-sky-500/10 to-amber-500/10',
    multiplier: 'bg-gradient-to-r from-purple-500/10 to-emerald-500/10',
    higher_lower: 'bg-gradient-to-r from-rose-500/10 to-emerald-500/10',
    turbo: 'bg-gradient-to-r from-amber-500/10 to-rose-500/10',
  }[marketType] || 'bg-muted/20'

  return (
    <Card className={cn('overflow-hidden border', config.borderColor, predictionBg)}>
      <div className={cn(
        'px-3 py-1.5 flex items-center justify-between',
        'bg-gradient-to-r',
        isPositive
          ? 'from-emerald-500/15 via-emerald-500/5 to-transparent'
          : 'from-rose-500/15 via-rose-500/5 to-transparent'
      )}>
        <div className="flex items-center gap-1.5">
          <Brain className={cn('h-3.5 w-3.5', config.color)} />
          <span className={cn('text-[10px] font-bold uppercase tracking-wider', config.color)}>AI Prediction</span>
        </div>
        <Badge variant="outline" className={cn('text-[8px]', confidenceColor, config.borderColor)}>
          {confidenceLevel.toUpperCase()}
        </Badge>
      </div>

      <CardContent className="p-3 space-y-2.5">
        {/* Main Prediction */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              'h-12 w-12 rounded-xl flex items-center justify-center text-lg font-black',
              'ring-1 ring-offset-1 ring-offset-background',
              isPositive
                ? 'bg-emerald-500/20 text-emerald-400 ring-emerald-500/30'
                : 'bg-rose-500/20 text-rose-400 ring-rose-500/30'
            )}>
              {prediction.prediction === 'Even' ? 'EVN' :
               prediction.prediction === 'Odd' ? 'ODD' :
               prediction.prediction === 'Over' ? 'OV↑' :
               prediction.prediction === 'Under' ? 'UN↓' :
               prediction.prediction === 'Differs' ? '≠' :
               prediction.prediction === 'Matches' ? '=' :
               prediction.prediction.slice(0, 3).toUpperCase()}
            </div>
            <div>
              <p className={cn('text-base font-bold', isPositive ? 'text-emerald-400' : 'text-rose-400')}>
                {prediction.prediction}
              </p>
              <p className="text-[9px] text-muted-foreground">
                Last digit: <span className="font-mono font-bold text-foreground">{prediction.lastDigit}</span>
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className={cn('text-2xl font-black', confidenceColor)}>
              {prediction.confidence.toFixed(0)}%
            </p>
            <p className="text-[8px] text-muted-foreground uppercase">Confidence</p>
          </div>
        </div>

        {/* Confidence bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[9px]">
            <span className="text-muted-foreground">Prediction Strength</span>
            <span className={cn('font-bold', confidenceColor)}>{prediction.probability.toFixed(0)}% probability</span>
          </div>
          <Progress
            value={prediction.confidence}
            className={cn('h-2', isPositive ? '[&>div]:bg-emerald-500' : '[&>div]:bg-rose-500')}
          />
        </div>

        {/* Recent digits used for prediction */}
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] text-muted-foreground shrink-0">Last {prediction.tickCount}:</span>
          <div className="flex gap-0.5">
            {prediction.recentDigits.map((d, i) => (
              <div
                key={i}
                className={cn(
                  'h-5 w-5 flex items-center justify-center rounded text-[9px] font-bold',
                  d === prediction.lastDigit
                    ? 'bg-primary text-primary-foreground ring-1 ring-primary/30'
                    : d % 2 === 0
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/20 text-rose-400'
                )}
              >
                {d}
              </div>
            ))}
            <div className="flex items-center justify-center h-5 w-5">
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
            </div>
            <div className={cn(
              'h-5 w-5 flex items-center justify-center rounded text-[9px] font-bold animate-pulse',
              isPositive ? 'bg-emerald-500/30 text-emerald-300' : 'bg-rose-500/30 text-rose-300'
            )}>
              ?
            </div>
          </div>
        </div>

        {/* Streak info */}
        {prediction.streakInfo && (
          <div className="flex items-center gap-1.5 text-[9px]">
            <Zap className="h-3 w-3 text-amber-400" />
            <span className="text-muted-foreground">{prediction.streakInfo}</span>
          </div>
        )}

        {/* Reasoning */}
        <p className="text-[9px] text-muted-foreground leading-relaxed italic">
          {prediction.reasoning}
        </p>

        {/* For Differs: show Match vs Differs comparison */}
        {marketType === 'differs' && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className={cn(
              'flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold',
              prediction.prediction === 'Differs'
                ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30'
                : 'bg-muted/30 text-muted-foreground'
            )}>
              {prediction.prediction === 'Differs' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
              Differs
            </div>
            <div className={cn(
              'flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold',
              prediction.prediction === 'Matches'
                ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30'
                : 'bg-muted/30 text-muted-foreground'
            )}>
              {prediction.prediction === 'Matches' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
              Matches
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Analysis Panel ──────────────────────────────────────────────
interface AnalysisPanelProps {
  marketType: MarketType
}

export function AnalysisPanel({ marketType }: AnalysisPanelProps) {
  const config = MARKET_TYPES[marketType]
  const {
    activeSymbol, stake, setStake, duration, setDuration,
    selectedPrediction, setSelectedPrediction, barrier, setBarrier,
    multiplier, setMultiplier,
    accumulatorLegs, addLeg
  } = useTradingStore()

  // Live tick data
  const digitAnalysis = useTickStore((s) => s.digitAnalyses[activeSymbol])
  const connected = useTickStore((s) => s.connected)
  const livePrice = useTickStore((s) => s.livePrices[activeSymbol])

  const [sortBy, setSortBy] = useState<'confidence' | 'returnPercent'>('confidence')
  const [selectedCategory, setSelectedCategory] = useState<string>('synthetic')

  const categorySymbols = useMemo(() => {
    const cat = SYMBOL_CATEGORIES.find(c => c.id === selectedCategory)
    return cat ? cat.symbols.slice(0, 10) : SYMBOL_CATEGORIES[0].symbols.slice(0, 10)
  }, [selectedCategory])

  // Determine highlight mode for digit bar
  const highlightMode = useMemo(() => {
    switch (marketType) {
      case 'even_odd': return selectedPrediction === 'Even' ? 'even' as const : 'odd' as const
      case 'differs': return 'differs' as const
      case 'over_under': return selectedPrediction === 'Over' ? 'over' as const : 'under' as const
      default: return 'even' as const
    }
  }, [marketType, selectedPrediction])

  // Number of recent ticks to show (5 for differs/matches, 25 for others)
  const recentTicksLimit = marketType === 'differs' ? 5 : 25

  // Fetch prediction
  const fetchPrediction = useCallback(async (): Promise<PredictionData | null> => {
    try {
      const params = new URLSearchParams({
        action: 'predict',
        symbol: activeSymbol,
        marketType,
        window: '5',
      })
      if (barrier !== undefined) params.set('barrier', String(barrier))
      if (marketType === 'differs') {
        const dDigit = parseInt(selectedPrediction.replace('Differs ', ''))
        if (!isNaN(dDigit)) params.set('differsDigit', String(dDigit))
      }
      const res = await fetch(`/api/ticks?${params.toString()}`)
      if (!res.ok) return null
      return await res.json()
    } catch {
      return null
    }
  }, [activeSymbol, marketType, barrier, selectedPrediction])

  const { data: prediction } = useQuery({
    queryKey: ['prediction', activeSymbol, marketType, barrier, selectedPrediction],
    queryFn: fetchPrediction,
    refetchInterval: 2000,
  })

  // Fetch active symbol analysis (uses real tick data in backend)
  const { data: analysis, isLoading } = useQuery({
    queryKey: ['analysis', activeSymbol, marketType, stake, multiplier, barrier],
    queryFn: async () => {
      const params = new URLSearchParams({ symbol: activeSymbol, marketType, stake: String(stake) })
      if (multiplier) params.set('multiplier', String(multiplier))
      if (barrier !== undefined) params.set('barrier', String(barrier))
      const res = await fetch(`/api/analysis?${params}`)
      return res.json() as Promise<AnalysisSignal>
    },
    refetchInterval: 10000,
  })

  // Batch for category
  const { data: batchData } = useQuery({
    queryKey: ['batch', marketType, selectedCategory],
    queryFn: async () => {
      const res = await fetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols: categorySymbols.map(s => s.symbol), marketType }),
      })
      return res.json()
    },
    refetchInterval: 15000,
  })

  const batchAnalyses = useMemo(() => {
    if (!batchData?.analyses) return []
    return batchData.analyses.sort((a: AnalysisSignal, b: AnalysisSignal) =>
      sortBy === 'confidence' ? b.confidence - a.confidence : b.returnPercent - a.returnPercent
    )
  }, [batchData, sortBy])

  const summary = batchData?.summary
  const isInAccumulator = (symbol: string) => accumulatorLegs.some(l => l.symbol === symbol && l.marketType === marketType)
  const isBuy = analysis?.signal === 'buy' || analysis?.signal === 'strong_buy'

  // Use live price if available, otherwise fall back to analysis data
  const displayPrice = livePrice?.price || analysis?.entryPrice || 0
  const displayDigit = livePrice?.lastDigit ?? analysis?.lastDigit ?? digitAnalysis?.lastDigit ?? 0

  return (
    <div className="space-y-3">
      {/* ── Live Price Header ── */}
      <Card className="border-border/50 overflow-hidden">
        <div className="px-3 py-2 flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2">
            <div className={cn('h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold', config.bg, config.color)}>
              {config.label.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className={cn('text-sm font-bold', config.color)}>{config.label}</p>
                <LivePriceDisplay tvSymbol={activeSymbol} />
              </div>
              <p className="text-[10px] text-muted-foreground truncate">{activeSymbol.split(':').pop()}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {connected ? (
              <Badge variant="outline" className="text-[8px] border-emerald-500/30 text-emerald-400 gap-1">
                <Wifi className="h-2.5 w-2.5" />
                LIVE
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[8px] border-muted-foreground/30 text-muted-foreground gap-1">
                <WifiOff className="h-2.5 w-2.5" />
                OFFLINE
              </Badge>
            )}
            <Badge variant="outline" className={cn('text-[9px]', config.borderColor, config.bg, config.color)}>
              {config.shortDesc}
            </Badge>
          </div>
        </div>

        {/* Live Digit Display + Stats */}
        {digitAnalysis && (
          <CardContent className="p-3 space-y-3">
            <div className="flex items-center justify-between">
              <LastDigitDisplay analysis={digitAnalysis} size="lg" />
              <div className="text-right">
                <p className="text-[9px] text-muted-foreground">Live Price</p>
                <p className="text-lg font-bold font-mono">
                  {displayPrice >= 10000 ? displayPrice.toFixed(2) : displayPrice >= 1 ? displayPrice.toFixed(4) : displayPrice.toFixed(6)}
                </p>
                <p className={cn(
                  'text-[10px] font-mono',
                  (digitAnalysis.priceChangePercent || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                )}>
                  {(digitAnalysis.priceChangePercent || 0) >= 0 ? '+' : ''}{(digitAnalysis.priceChangePercent || 0).toFixed(4)}%
                </p>
              </div>
            </div>

            {/* Digit Frequency Bar */}
            <DigitBar
              analysis={digitAnalysis}
              highlight={highlightMode}
              barrier={barrier}
              differsDigit={parseInt(selectedPrediction.replace('Differs ', '')) || undefined}
            />

            {/* Quick Stats */}
            <DigitStats analysis={digitAnalysis} marketType={marketType} barrier={barrier} differsDigit={parseInt(selectedPrediction.replace('Differs ', '')) || undefined} />

            {/* Recent Ticks — 5 for differs, 25 for others */}
            <RecentTicks analysis={digitAnalysis} limit={recentTicksLimit} />
          </CardContent>
        )}
      </Card>

      {/* ── PREDICTION CARD ── */}
      {(marketType === 'even_odd' || marketType === 'differs' || marketType === 'over_under') && (
        <PredictionCard
          prediction={prediction}
          marketType={marketType}
          config={config}
        />
      )}

      {/* ── Prediction Selector ── */}
      <Card className={cn('border', config.borderColor, config.bg)}>
        <CardContent className="p-3">
          <p className="text-[10px] text-muted-foreground font-medium mb-2 uppercase tracking-wider">Prediction</p>
          <div className="grid grid-cols-3 gap-1.5">
            {config.predictions.map((pred) => (
              <button
                key={pred}
                type="button"
                className={cn(
                  'px-2 py-1.5 rounded-lg text-xs font-medium transition-all border',
                  selectedPrediction === pred
                    ? cn('border-current bg-background shadow-sm', config.color)
                    : 'border-transparent bg-background/50 hover:bg-background text-muted-foreground'
                )}
                onClick={() => setSelectedPrediction(pred)}
              >
                {pred}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Duration ── */}
      <Card>
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Duration</p>
            <Clock className="h-3 w-3 text-muted-foreground" />
          </div>
          <div className="flex gap-1.5">
            <Select
              value={duration.unit}
              onValueChange={(unit) => setDuration({ ...duration, unit: unit as Duration['unit'], label: `${duration.value} ${unit}` })}
            >
              <SelectTrigger className="h-7 text-[10px] w-20"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ticks"><span className="text-[10px]">Ticks</span></SelectItem>
                <SelectItem value="seconds"><span className="text-[10px]">Seconds</span></SelectItem>
                <SelectItem value="minutes"><span className="text-[10px]">Minutes</span></SelectItem>
                <SelectItem value="hours"><span className="text-[10px]">Hours</span></SelectItem>
                <SelectItem value="days"><span className="text-[10px]">Days</span></SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-0.5 flex-wrap">
              {(duration.unit === 'ticks' ? TICK_DURATIONS : TIME_DURATIONS)
                .filter(d => d.unit === duration.unit)
                .slice(0, 8)
                .map(d => (
                  <button
                    key={d.label}
                    type="button"
                    className={cn(
                      'px-2 py-1 rounded text-[10px] font-medium transition-colors',
                      d.value === duration.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-accent text-muted-foreground'
                    )}
                    onClick={() => setDuration(d)}
                  >
                    {d.value}
                  </button>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Over/Under barrier ── */}
      {marketType === 'over_under' && (
        <Card>
          <CardContent className="p-3 space-y-2">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Barrier (Digit)</p>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => (
                <button
                  key={d}
                  type="button"
                  className={cn(
                    'flex-1 py-1.5 rounded text-xs font-bold transition-colors',
                    barrier === d ? 'bg-sky-500 text-white' : 'bg-muted/50 hover:bg-accent text-muted-foreground'
                  )}
                  onClick={() => setBarrier(barrier === d ? undefined : d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Multiplier selector ── */}
      {marketType === 'multiplier' && (
        <Card>
          <CardContent className="p-3 space-y-2">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Multiplier</p>
            <div className="grid grid-cols-4 gap-1">
              {[2, 5, 10, 20, 50, 100, 250, 500].map(m => (
                <button
                  key={m}
                  type="button"
                  className={cn(
                    'py-1.5 rounded text-xs font-bold transition-colors',
                    multiplier === m ? 'bg-purple-500 text-white' : 'bg-muted/50 hover:bg-accent text-muted-foreground'
                  )}
                  onClick={() => setMultiplier(multiplier === m ? undefined : m)}
                >
                  x{m}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Stake + Signal Analysis ── */}
      {isLoading ? (
        <Card>
          <CardContent className="p-4 flex items-center justify-center">
            <div className="animate-pulse flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">Analyzing live data...</span>
            </div>
          </CardContent>
        </Card>
      ) : analysis ? (
        <Card className="overflow-hidden">
          {/* Signal Banner */}
          <div className={cn(
            'px-3 py-2 flex items-center justify-between',
            isBuy ? 'bg-emerald-500/15' : 'bg-red-500/15'
          )}>
            <div className="flex items-center gap-2">
              {isBuy
                ? <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                : <TrendingDown className="h-3.5 w-3.5 text-red-400" />
              }
              <span className={cn('text-xs font-bold', isBuy ? 'text-emerald-400' : 'text-red-400')}>
                {SIGNAL_COLORS[analysis.signal].label}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground">Conf.</span>
              <span className="text-xs font-bold">{analysis.confidence.toFixed(1)}%</span>
            </div>
          </div>

          <CardContent className="p-3 space-y-3">
            {/* Entry Price + Last Digit + Probability */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground">Entry Price</p>
                <p className="text-lg font-bold font-mono tracking-tight">{displayPrice.toFixed(2)}</p>
                {livePrice && (
                  <p className="text-[8px] text-emerald-400">● Live from Deriv</p>
                )}
              </div>
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground">Last Digit</p>
                <div className={cn(
                  'h-10 w-10 rounded-lg flex items-center justify-center text-lg font-bold',
                  displayDigit % 2 === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                )}>
                  {displayDigit}
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">Probability</p>
                <p className="text-lg font-bold">{analysis.probability.toFixed(1)}%</p>
              </div>
            </div>

            <Progress value={analysis.confidence} className="h-1" />

            {/* Stake Input */}
            <div className="space-y-1.5">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Stake</p>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="number"
                  min={config.minStake}
                  max={config.maxStake}
                  step={0.5}
                  value={stake}
                  onChange={(e) => setStake(Math.max(config.minStake, parseFloat(e.target.value) || 0))}
                  className="pl-7 h-9 text-sm font-bold font-mono"
                />
              </div>
              <div className="flex gap-1">
                {[1, 5, 10, 25, 50, 100].map(s => (
                  <button
                    key={s}
                    type="button"
                    className={cn(
                      'flex-1 py-1 rounded text-[10px] font-medium transition-colors',
                      stake === s ? 'bg-primary text-primary-foreground' : 'bg-muted/50 hover:bg-accent'
                    )}
                    onClick={() => setStake(s)}
                  >
                    ${s}
                  </button>
                ))}
              </div>
            </div>

            {/* Payout Display */}
            <div className={cn(
              'rounded-lg p-3 border',
              isBuy ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'
            )}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground">Potential Payout</p>
                  <p className={cn('text-xl font-bold', isBuy ? 'text-emerald-400' : 'text-red-400')}>
                    ${((stake * analysis.returnPercent) / 100 + stake).toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground">Return</p>
                  <p className={cn('text-lg font-bold', isBuy ? 'text-emerald-400' : 'text-red-400')}>
                    +{analysis.returnPercent.toFixed(1)}%
                  </p>
                  {isBuy ? <ArrowUpRight className="h-4 w-4 text-emerald-400" /> : <ArrowDownRight className="h-4 w-4 text-red-400" />}
                </div>
              </div>
              <Separator className="my-2" />
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <p className="text-[9px] text-muted-foreground">Target</p>
                  <p className="text-[10px] font-bold text-emerald-400">{analysis.target.toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-muted-foreground">Stop Loss</p>
                  <p className="text-[10px] font-bold text-red-400">{analysis.stopLoss.toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-muted-foreground">R:R</p>
                  <p className="text-[10px] font-bold">{analysis.riskReward.toFixed(1)}:1</p>
                </div>
              </div>
            </div>

            {/* Indicators */}
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Indicators</p>
              {analysis.indicators.map((ind, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium truncate">{ind.name}</p>
                    <p className="text-[9px] text-muted-foreground">{ind.description}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <span className="text-[10px] font-bold">{String(ind.value)}</span>
                    <Badge variant="outline" className={cn('text-[8px] px-1 py-0', SIGNAL_COLORS[ind.signal].text)}>
                      {SIGNAL_COLORS[ind.signal].label}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {/* Add to Accumulator */}
            <Button
              className={cn('w-full h-8 text-xs font-medium gap-1.5',
                isInAccumulator(analysis.symbol)
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : isBuy ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-emerald-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/30'
              )}
              variant="outline"
              disabled={isInAccumulator(analysis.symbol)}
              onClick={() => addLeg({
                id: `${analysis.symbol}-${marketType}-${Date.now()}`,
                symbol: analysis.symbol,
                name: ALL_SYMBOLS.find(s => s.symbol === analysis.symbol)?.name || analysis.symbol,
                marketType,
                signal: analysis.signal,
                prediction: selectedPrediction,
                confidence: analysis.confidence,
                probability: analysis.probability,
                odds: 1 + analysis.riskReward * 0.5,
                stake,
                payout: parseFloat((stake * analysis.returnPercent / 100 + stake).toFixed(2)),
                entryPrice: displayPrice,
                target: analysis.target,
                barrier: analysis.barrier,
                duration,
                timeframe: '15m',
              })}
            >
              <Layers className="h-3 w-3" />
              {isInAccumulator(analysis.symbol) ? '✓ In Accumulator' : 'Add to Accumulator'}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* ── Market Scan ── */}
      <Card>
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Market Scan</span>
            </div>
            <div className="flex items-center gap-1">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-20 h-6 text-[10px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SYMBOL_CATEGORIES.map(cat => (
                    <SelectItem key={cat.id} value={cat.id} className="text-xs">{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="sm" className={cn('h-6 px-2 text-[9px]', sortBy === 'confidence' && 'bg-accent')} onClick={() => setSortBy('confidence')}>Conf</Button>
              <Button variant="ghost" size="sm" className={cn('h-6 px-2 text-[9px]', sortBy === 'returnPercent' && 'bg-accent')} onClick={() => setSortBy('returnPercent')}>Return</Button>
            </div>
          </div>
          {summary && (
            <div className="flex gap-2 text-[9px] text-muted-foreground">
              <span className={cn(summary.buySignals > summary.sellSignals && 'text-emerald-400 font-medium')}>{summary.buySignals} buy</span>
              <span className="text-border">|</span>
              <span className={cn(summary.sellSignals > summary.buySignals && 'text-red-400 font-medium')}>{summary.sellSignals} sell</span>
              <span className="text-border">|</span>
              <span>{summary.neutralSignals} neutral</span>
            </div>
          )}
          <ScrollArea className="max-h-[280px]">
            <div className="space-y-0.5">
              {batchAnalyses.map((a: AnalysisSignal) => {
                const sym = ALL_SYMBOLS.find(s => s.symbol === a.symbol)
                const inAcc = isInAccumulator(a.symbol)
                const aIsBuy = a.signal === 'buy' || a.signal === 'strong_buy'
                const symLivePrice = useTickStore.getState().livePrices[a.symbol]

                return (
                  <div key={a.symbol} className="flex items-center justify-between p-2 rounded-md hover:bg-accent/30 transition-colors group">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={cn(
                        'h-1.5 w-1.5 rounded-full shrink-0',
                        aIsBuy ? 'bg-emerald-400' : a.signal === 'neutral' ? 'bg-gray-400' : 'bg-red-400'
                      )} />
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium truncate">{sym?.name || a.symbol.split(':').pop()}</p>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-muted-foreground">{sym?.exchange}</span>
                          {symLivePrice ? (
                            <span className="text-[9px] font-mono text-emerald-400">
                              D{symLivePrice.lastDigit} ● {symLivePrice.price >= 1 ? symLivePrice.price.toFixed(2) : symLivePrice.price.toFixed(6)}
                            </span>
                          ) : (
                            <span className="text-[9px] text-muted-foreground">D{a.lastDigit}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn('text-[10px] font-bold w-8 text-right', aIsBuy ? 'text-emerald-400' : 'text-red-400')}>
                        {a.returnPercent.toFixed(0)}%
                      </span>
                      <span className="text-[9px] text-muted-foreground w-6 text-right">{a.confidence.toFixed(0)}%</span>
                      <Button
                        size="sm"
                        variant={inAcc ? 'default' : 'outline'}
                        className={cn('h-5 text-[8px] px-1.5', inAcc && 'bg-emerald-600 hover:bg-emerald-700')}
                        disabled={inAcc}
                        onClick={() => addLeg({
                          id: `${a.symbol}-${marketType}-${Date.now()}`,
                          symbol: a.symbol,
                          name: sym?.name || a.symbol,
                          marketType,
                          signal: a.signal,
                          prediction: selectedPrediction,
                          confidence: a.confidence,
                          probability: a.probability,
                          odds: 1 + a.riskReward * 0.5,
                          stake,
                          payout: parseFloat((stake * a.returnPercent / 100 + stake).toFixed(2)),
                          entryPrice: a.entryPrice,
                          target: a.target,
                          duration,
                          timeframe: '15m',
                        })}
                      >
                        {inAcc ? '✓' : '+'}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
