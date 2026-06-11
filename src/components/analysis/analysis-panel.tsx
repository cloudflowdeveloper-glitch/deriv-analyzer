'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTradingStore } from '@/stores/trading-store'
import { MarketType, MARKET_TYPES, SIGNAL_COLORS, ALL_SYMBOLS, SYMBOL_CATEGORIES, AnalysisSignal, TICK_DURATIONS, TIME_DURATIONS, Duration } from '@/lib/trading-types'
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
  Target, AlertTriangle, Zap, BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'

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

  const [sortBy, setSortBy] = useState<'confidence' | 'returnPercent'>('confidence')
  const [selectedCategory, setSelectedCategory] = useState<string>('crypto')

  const categorySymbols = useMemo(() => {
    const cat = SYMBOL_CATEGORIES.find(c => c.id === selectedCategory)
    return cat ? cat.symbols.slice(0, 10) : SYMBOL_CATEGORIES[0].symbols.slice(0, 10)
  }, [selectedCategory])

  // Fetch active symbol analysis
  const { data: analysis, isLoading } = useQuery({
    queryKey: ['analysis', activeSymbol, marketType, stake, multiplier, barrier],
    queryFn: async () => {
      const params = new URLSearchParams({ symbol: activeSymbol, marketType, stake: String(stake) })
      if (multiplier) params.set('multiplier', String(multiplier))
      if (barrier) params.set('barrier', String(barrier))
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

  return (
    <div className="space-y-3">
      {/* ── Contract Header ── */}
      <div className="flex items-center gap-2">
        <div className={cn('h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold', config.bg, config.color)}>
          {config.label.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-bold', config.color)}>{config.label}</p>
          <p className="text-[10px] text-muted-foreground truncate">{activeSymbol.split(':').pop()}</p>
        </div>
        <Badge variant="outline" className={cn('text-[9px]', config.borderColor, config.bg, config.color)}>
          {config.shortDesc}
        </Badge>
      </div>

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
              <span className="text-[11px] text-muted-foreground">Analyzing...</span>
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
            {/* Last Digit Display */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground">Entry Price</p>
                <p className="text-lg font-bold font-mono tracking-tight">{analysis.entryPrice.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground">Last Digit</p>
                <div className={cn(
                  'h-10 w-10 rounded-lg flex items-center justify-center text-lg font-bold',
                  analysis.lastDigit % 2 === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                )}>
                  {analysis.lastDigit}
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
                entryPrice: analysis.entryPrice,
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
                          <span className="text-[9px] text-muted-foreground">D{a.lastDigit}</span>
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
