'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTradingStore } from '@/stores/trading-store'
import { MarketType, MARKET_TYPES, SIGNAL_COLORS, POPULAR_SYMBOLS, AnalysisSignal, AccumulatorLeg } from '@/lib/trading-types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  TrendingUp, TrendingDown, Plus, Trash2, Target, AlertTriangle,
  CheckCircle2, ArrowRight, DollarSign, Shield, Zap, Hash,
  Unlink, ArrowUpDown, X, Layers, Activity, ChevronDown, ChevronUp,
  BarChart3, Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useMemo } from 'react'

interface AnalysisPanelProps {
  marketType: MarketType
}

export function AnalysisPanel({ marketType }: AnalysisPanelProps) {
  const config = MARKET_TYPES[marketType]
  const { activeSymbol, timeframe, setActiveSymbol, accumulatorLegs, addLeg } = useTradingStore()
  const [sortBy, setSortBy] = useState<'confidence' | 'riskReward'>('confidence')

  // Fetch single symbol analysis
  const { data: analysis, isLoading } = useQuery({
    queryKey: ['analysis', activeSymbol, marketType, timeframe],
    queryFn: async () => {
      const res = await fetch(`/api/analysis?symbol=${activeSymbol}&marketType=${marketType}&timeframe=${timeframe}`)
      return res.json() as Promise<AnalysisSignal>
    },
    refetchInterval: 10000,
  })

  // Batch analysis for all symbols
  const { data: batchData } = useQuery({
    queryKey: ['batch-analysis', marketType, timeframe],
    queryFn: async () => {
      const symbols = POPULAR_SYMBOLS.map(s => s.symbol)
      const res = await fetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols, marketType, timeframe }),
      })
      return res.json()
    },
    refetchInterval: 15000,
  })

  const batchAnalyses = useMemo(() => {
    if (!batchData?.analyses) return []
    return batchData.analyses
      .sort((a: AnalysisSignal, b: AnalysisSignal) =>
        sortBy === 'confidence' ? b.confidence - a.confidence : b.riskReward - a.riskReward
      )
  }, [batchData, sortBy])

  const summary = batchData?.summary

  const isInAccumulator = (symbol: string) =>
    accumulatorLegs.some(l => l.symbol === symbol && l.marketType === marketType)

  return (
    <div className="space-y-6">
      {/* Market Type Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', config.bg)}>
              <span className={cn('text-sm font-bold', config.color)}>{config.label.charAt(0)}</span>
            </div>
            <div>
              <h2 className={cn('text-lg font-bold', config.color)}>{config.label}</h2>
              <p className="text-xs text-muted-foreground">{config.shortDesc}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={activeSymbol} onValueChange={setActiveSymbol}>
            <SelectTrigger className="w-48 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {POPULAR_SYMBOLS.map(s => (
                <SelectItem key={s.symbol} value={s.symbol} className="text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{s.name}</span>
                    <span className="text-muted-foreground">{s.exchange}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Description Card */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </CardContent>
      </Card>

      {/* Active Symbol Analysis */}
      {isLoading ? (
        <Card>
          <CardContent className="p-6 flex items-center justify-center">
            <div className="animate-pulse flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Analyzing {activeSymbol}...</span>
            </div>
          </CardContent>
        </Card>
      ) : analysis ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm">Signal for {activeSymbol}</CardTitle>
                <Badge
                  variant="outline"
                  className={cn('text-[10px] font-bold px-2 py-0.5', SIGNAL_COLORS[analysis.signal].text, SIGNAL_COLORS[analysis.signal].bg, SIGNAL_COLORS[analysis.signal].border)}
                >
                  {SIGNAL_COLORS[analysis.signal].label}
                </Badge>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Confidence</p>
                <p className="text-lg font-bold">{analysis.confidence.toFixed(1)}%</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={analysis.confidence} className="h-2" />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-2 rounded-lg bg-muted/50 text-center">
                <p className="text-[10px] text-muted-foreground">Entry Price</p>
                <p className="text-sm font-bold">{analysis.entryPrice.toFixed(4)}</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/50 text-center">
                <p className="text-[10px] text-muted-foreground">Target</p>
                <p className="text-sm font-bold text-emerald-600">{analysis.target.toFixed(4)}</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/50 text-center">
                <p className="text-[10px] text-muted-foreground">Stop Loss</p>
                <p className="text-sm font-bold text-red-600">{analysis.stopLoss.toFixed(4)}</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/50 text-center">
                <p className="text-[10px] text-muted-foreground">Risk/Reward</p>
                <p className="text-sm font-bold">{analysis.riskReward.toFixed(2)}</p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">INDICATORS</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {analysis.indicators.map((ind, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg border">
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{ind.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{ind.description}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-xs font-semibold">{String(ind.value)}</span>
                      <Badge
                        variant="outline"
                        className={cn('text-[9px] px-1 py-0', SIGNAL_COLORS[ind.signal].text)}
                      >
                        {SIGNAL_COLORS[ind.signal].label}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button
              className="w-full"
              variant={isInAccumulator(analysis.symbol) ? 'default' : 'outline'}
              disabled={isInAccumulator(analysis.symbol)}
              onClick={() => addLeg({
                symbol: analysis.symbol,
                name: POPULAR_SYMBOLS.find(s => s.symbol === analysis.symbol)?.name || analysis.symbol,
                marketType,
                signal: analysis.signal,
                confidence: analysis.confidence,
                odds: 1 + analysis.riskReward * 0.5,
                entryPrice: analysis.entryPrice,
                target: analysis.target,
                timeframe,
              })}
            >
              {isInAccumulator(analysis.symbol) ? 'Added to Accumulator' : 'Add to Accumulator'}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* All Symbols Analysis */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">All Symbols — {config.label}</CardTitle>
              <CardDescription className="text-xs">
                {summary ? `${summary.buySignals} buy / ${summary.sellSignals} sell / ${summary.neutralSignals} neutral` : 'Loading...'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className={cn('h-7 text-[10px]', sortBy === 'confidence' && 'bg-accent')}
                onClick={() => setSortBy('confidence')}
              >
                By Confidence
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn('h-7 text-[10px]', sortBy === 'riskReward' && 'bg-accent')}
                onClick={() => setSortBy('riskReward')}
              >
                By R:R
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-1.5">
              {batchAnalyses.map((a: AnalysisSignal) => {
                const sym = POPULAR_SYMBOLS.find(s => s.symbol === a.symbol)
                const inAcc = isInAccumulator(a.symbol)

                return (
                  <div key={a.symbol} className="flex items-center justify-between p-2.5 rounded-lg border hover:bg-accent/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{sym?.name || a.symbol}</p>
                        <p className="text-[10px] text-muted-foreground">{sym?.exchange} • {sym?.type}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <Badge
                        variant="outline"
                        className={cn('text-[9px] px-1.5 py-0 font-semibold', SIGNAL_COLORS[a.signal].text)}
                      >
                        {SIGNAL_COLORS[a.signal].label}
                      </Badge>
                      <span className="text-xs font-medium w-12 text-right">{a.confidence.toFixed(0)}%</span>
                      <span className="text-xs text-muted-foreground w-8 text-right">{a.riskReward.toFixed(1)}:1</span>
                      <Button
                        size="sm"
                        variant={inAcc ? 'default' : 'outline'}
                        className={cn('h-6 text-[9px] px-2', inAcc && 'bg-emerald-600 hover:bg-emerald-700')}
                        disabled={inAcc}
                        onClick={() => addLeg({
                          symbol: a.symbol,
                          name: sym?.name || a.symbol,
                          marketType,
                          signal: a.signal,
                          confidence: a.confidence,
                          odds: 1 + a.riskReward * 0.5,
                          entryPrice: a.entryPrice,
                          target: a.target,
                          timeframe,
                        })}
                      >
                        {inAcc ? 'Added' : '+ Acc'}
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
