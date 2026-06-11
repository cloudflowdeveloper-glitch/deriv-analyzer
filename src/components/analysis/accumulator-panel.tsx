'use client'

import { useTradingStore } from '@/stores/trading-store'
import { SIGNAL_COLORS, AccumulatorLeg, ALL_SYMBOLS, MARKET_TYPES } from '@/lib/trading-types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useQuery } from '@tanstack/react-query'
import {
  Layers, Trash2, AlertTriangle, Target, DollarSign, Shield,
  X, ArrowRight, BarChart3, CheckCircle2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMemo } from 'react'

export function AccumulatorPanel() {
  const { accumulatorLegs, removeLeg, clearAccumulator } = useTradingStore()

  const { data: analysisResult, isLoading } = useQuery({
    queryKey: ['acc-analysis', accumulatorLegs.length, JSON.stringify(accumulatorLegs.map(l => `${l.symbol}-${l.marketType}`))],
    queryFn: async () => {
      if (accumulatorLegs.length === 0) return null
      const res = await fetch('/api/analysis/accumulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ legs: accumulatorLegs }),
      })
      return res.json()
    },
    enabled: accumulatorLegs.length > 0,
  })

  const analysis = analysisResult?.analysis

  const combinedOdds = useMemo(() => {
    if (accumulatorLegs.length === 0) return 1
    return accumulatorLegs.reduce((a: number, l: AccumulatorLeg) => a * l.odds, 1)
  }, [accumulatorLegs])

  const stakeSimulation = useMemo(() => {
    if (accumulatorLegs.length === 0) return []
    const stakes = [1, 5, 10, 25, 50, 100]
    return stakes.map(s => ({
      stake: s,
      potential: parseFloat((s * combinedOdds).toFixed(2)),
      profit: parseFloat(((s * combinedOdds) - s).toFixed(2)),
    }))
  }, [accumulatorLegs, combinedOdds])

  const signalBreakdown = useMemo(() => {
    const counts: Record<string, number> = { strong_buy: 0, buy: 0, neutral: 0, sell: 0, strong_sell: 0 }
    accumulatorLegs.forEach(leg => { counts[leg.signal]++ })
    return counts
  }, [accumulatorLegs])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Accumulator Builder</h2>
          <Badge variant="secondary" className="text-xs">{accumulatorLegs.length}/10</Badge>
        </div>
        {accumulatorLegs.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearAccumulator} className="text-red-600 hover:text-red-700">
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear All
          </Button>
        )}
      </div>

      {accumulatorLegs.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Layers className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">No Legs Added</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              Browse market types and click &quot;+ Add to Accumulator&quot; on any analysis to build your multi-signal accumulator.
              Combine signals from different market types (Even/Odd, Differs, Over/Under, Multipliers, Higher/Lower, Turbos) for up to 10 legs.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {(Object.keys(MARKET_TYPES) as Array<keyof typeof MARKET_TYPES>).map((type) => (
                <Badge key={type} variant="outline" className={cn('text-[10px]', MARKET_TYPES[type].color)}>
                  {MARKET_TYPES[type].label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Legs */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Accumulator Legs</CardTitle>
              <CardDescription className="text-xs">
                {accumulatorLegs.length} selection{accumulatorLegs.length !== 1 ? 's' : ''} • Combined Odds: <span className="font-bold text-foreground">{combinedOdds.toFixed(2)}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[500px]">
                <div className="space-y-2">
                  {accumulatorLegs.map((leg, idx) => {
                    const mtConfig = MARKET_TYPES[leg.marketType]

                    return (
                      <div key={`${leg.symbol}-${leg.marketType}`} className="p-3 rounded-lg border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-7 w-7 rounded bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                              {idx + 1}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium">{leg.name}</p>
                              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                <Badge variant="outline" className={cn('text-[8px] px-1 py-0', mtConfig.color, mtConfig.bg)}>
                                  {mtConfig.label}
                                </Badge>
                                <span className="font-mono">{leg.symbol.split(':').pop()}</span>
                                <span>• {leg.timeframe}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="outline" className={cn('text-[9px] px-1.5 py-0 font-semibold', SIGNAL_COLORS[leg.signal].text)}>
                              {SIGNAL_COLORS[leg.signal].label}
                            </Badge>
                            <span className="text-xs font-medium">{leg.confidence.toFixed(0)}%</span>
                            <span className="text-[10px] text-muted-foreground">×{leg.odds.toFixed(2)}</span>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:text-red-600" onClick={() => removeLeg(leg.symbol)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        {/* Running total */}
                        <div className="mt-2 pt-2 border-t flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">Running odds:</span>
                          <span className="text-xs font-bold">
                            {parseFloat(accumulatorLegs.slice(0, idx + 1).reduce((a, l) => a * l.odds, 1).toFixed(2))}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Analysis */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Combined Odds</p>
                <p className="text-3xl font-bold mt-1">{combinedOdds.toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {((1 / combinedOdds) * 100).toFixed(2)}% implied probability
                </p>
              </CardContent>
            </Card>

            {isLoading ? (
              <Card>
                <CardContent className="p-4 animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </CardContent>
              </Card>
            ) : analysis && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-1.5"><Target className="h-3.5 w-3.5" /> Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Combined Prob.</p>
                      <p className="text-sm font-bold">{analysis.combinedProbability.toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Avg Confidence</p>
                      <p className="text-sm font-bold">{analysis.avgConfidence.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Kelly Criterion</p>
                      <p className="text-sm font-bold">{(analysis.kellyCriterion * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Optimal Stake</p>
                      <p className="text-sm font-bold text-emerald-600">{analysis.optimalStake.toFixed(1)}%</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">Risk Level</p>
                    <Badge variant="outline" className={cn('text-xs',
                      analysis.riskLevel === 'Low' && 'text-emerald-600 border-emerald-200 bg-emerald-50',
                      analysis.riskLevel === 'Medium' && 'text-amber-600 border-amber-200 bg-amber-50',
                      ['High', 'Very High'].includes(analysis.riskLevel) && 'text-red-600 border-red-200 bg-red-50'
                    )}>{analysis.riskLevel}</Badge>
                  </div>

                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">Summary</p>
                    <span className={cn('text-sm font-bold',
                      analysis.signalSummary === 'Favorable' ? 'text-emerald-600' :
                      analysis.signalSummary === 'Caution' ? 'text-red-600' : 'text-amber-600'
                    )}>{analysis.signalSummary}</span>
                    <span className="text-[10px] text-muted-foreground ml-1.5">
                      ({analysis.buySignals} buy / {analysis.sellSignals} sell)
                    </span>
                  </div>

                  {analysis.recommendations && analysis.recommendations.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-1">
                        {analysis.recommendations.map((rec: string, i: number) => (
                          <div key={i} className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                            <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                            <span>{rec}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Stake Simulation */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" /> Stake Simulation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {stakeSimulation.map(s => (
                    <div key={s.stake} className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">${s.stake}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="font-bold text-emerald-600">${s.potential.toFixed(2)}</span>
                      </div>
                      <span className={cn('font-medium', s.profit >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                        +{s.profit.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Signal Breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Signal Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {Object.entries(signalBreakdown).filter(([, count]) => count > 0).map(([signal, count]) => (
                    <div key={signal} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className={cn('w-2 h-2 rounded-full', SIGNAL_COLORS[signal as keyof typeof SIGNAL_COLORS].bg)} />
                        <span className="capitalize">{String(signal).replace('_', ' ')}</span>
                      </div>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
