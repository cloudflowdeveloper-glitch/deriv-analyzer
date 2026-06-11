'use client'

import { useTradingStore } from '@/stores/trading-store'
import { SIGNAL_COLORS, AccumulatorLeg, POPULAR_SYMBOLS } from '@/lib/trading-types'
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

  const combinedOdds = accumulatorLegs.length === 0
    ? 1
    : accumulatorLegs.reduce((a: number, l: AccumulatorLeg) => a * l.odds, 1)

  const stakeSimulation = [
    { stake: 1 }, { stake: 5 }, { stake: 10 }, { stake: 25 }, { stake: 50 }, { stake: 100 }
  ].map(s => ({
    ...s,
    potential: parseFloat((s.stake * combinedOdds).toFixed(2)),
    profit: parseFloat(((s.stake * combinedOdds) - s.stake).toFixed(2)),
  }))

  return (
    <div className="space-y-6">
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
              Browse market types and click &quot;Add to Accumulator&quot; to build your multi-signal accumulator. You can add up to 10 legs from different market types.
            </p>
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
                    const mtConfig = {
                      even_odd: { label: 'Even/Odd', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                      differs: { label: 'Differs', color: 'text-orange-600', bg: 'bg-orange-50' },
                      over_under: { label: 'Over/Under', color: 'text-sky-600', bg: 'bg-sky-50' },
                      multiplier: { label: 'Multiplier', color: 'text-purple-600', bg: 'bg-purple-50' },
                      higher_lower: { label: 'Higher/Lower', color: 'text-rose-600', bg: 'bg-rose-50' },
                      turbo: { label: 'Turbo', color: 'text-amber-600', bg: 'bg-amber-50' },
                    }[leg.marketType]

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
                                <Badge variant="outline" className={cn('text-[9px] px-1 py-0', mtConfig.color, mtConfig.bg)}>
                                  {mtConfig.label}
                                </Badge>
                                <span>{leg.timeframe}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <Badge variant="outline" className={cn('text-[9px] px-1.5 py-0 font-semibold', SIGNAL_COLORS[leg.signal].text)}>
                              {SIGNAL_COLORS[leg.signal].label}
                            </Badge>
                            <span className="text-xs font-medium">{leg.confidence.toFixed(0)}%</span>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:text-red-600" onClick={() => removeLeg(leg.symbol)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
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
                  </div>

                  {analysis.recommendations.length > 0 && (
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
          </div>
        </div>
      )}
    </div>
  )
}
