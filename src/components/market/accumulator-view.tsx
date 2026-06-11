'use client'

import { useMemo } from 'react'
import { useMarketStore } from '@/stores/market-store'
import { SIGNAL_CONFIG, AccumulatorLeg } from '@/lib/market-types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Layers, Trash2, Plus, AlertTriangle, TrendingUp, TrendingDown,
  Target, BarChart3, DollarSign, Shield, X, CheckCircle2,
  ArrowRight, Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'

export function AccumulatorView() {
  const { accumulatorLegs, removeAccumulatorLeg, clearAccumulator } = useMarketStore()

  // Calculate accumulator analysis via API
  const { data: analysisResult, isLoading } = useQuery({
    queryKey: ['accumulator-analysis', accumulatorLegs.length, JSON.stringify(accumulatorLegs.map(l => l.odds))],
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
    return accumulatorLegs.reduce((acc, leg) => acc * leg.odds, 1)
  }, [accumulatorLegs])

  const stakeSimulation = useMemo(() => {
    if (accumulatorLegs.length === 0) return []
    const stakes = [1, 5, 10, 25, 50, 100]
    return stakes.map(stake => ({
      stake,
      return: parseFloat((stake * combinedOdds).toFixed(2)),
      profit: parseFloat(((stake * combinedOdds) - stake).toFixed(2)),
    }))
  }, [accumulatorLegs, combinedOdds])

  const signalBreakdown = useMemo(() => {
    const counts = { strong_buy: 0, buy: 0, neutral: 0, sell: 0, strong_sell: 0 }
    accumulatorLegs.forEach(leg => {
      counts[leg.signal]++
    })
    return counts
  }, [accumulatorLegs])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">Accumulator Builder</h2>
          <Badge variant="secondary" className="text-xs">
            {accumulatorLegs.length}/10 legs
          </Badge>
        </div>
        {accumulatorLegs.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearAccumulator} className="text-red-600 hover:text-red-700">
            <Trash2 className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {accumulatorLegs.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Layers className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">No Legs Added</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              Browse market types and click the &quot;+ Acc&quot; button on any market to add it as a leg to your accumulator.
              You can add up to 10 legs.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Legs List */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Accumulator Legs</CardTitle>
              <CardDescription className="text-xs">
                {accumulatorLegs.length} selection{accumulatorLegs.length !== 1 ? 's' : ''} • Combined Odds: <span className="font-bold text-foreground">{combinedOdds.toFixed(2)}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[500px]">
                <div className="space-y-2">
                  {accumulatorLegs.map((leg, index) => (
                    <div key={`${leg.eventId}-${leg.marketLabel}`} className="p-3 rounded-lg border bg-card">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-primary">{index + 1}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{leg.marketLabel}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {leg.homeTeam} vs {leg.awayTeam}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <Badge
                            variant="outline"
                            className={cn('text-[10px] px-1.5 py-0 font-semibold', SIGNAL_CONFIG[leg.signal].textColor)}
                          >
                            {SIGNAL_CONFIG[leg.signal].label}
                          </Badge>
                          <span className="text-sm font-bold">{leg.odds.toFixed(2)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600"
                            onClick={() => removeAccumulatorLeg(leg.eventId)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Running total */}
                      <div className="mt-2 pt-2 border-t flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">Running total:</span>
                        <span className="text-xs font-bold">
                          {parseFloat(accumulatorLegs.slice(0, index + 1).reduce((a, l) => a * l.odds, 1).toFixed(2))}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Analysis Panel */}
          <div className="space-y-4">
            {/* Combined Odds */}
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Combined Odds</p>
                  <p className="text-3xl font-bold mt-1">{combinedOdds.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(1 / combinedOdds * 100).toFixed(2)}% implied probability
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Analysis Results */}
            {isLoading ? (
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3 animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ) : analysis && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Combined Prob.</p>
                      <p className="text-sm font-bold">{analysis.combinedProbability.toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Avg Confidence</p>
                      <p className="text-sm font-bold">{(analysis.avgConfidence * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Kelly Criterion</p>
                      <p className="text-sm font-bold">{(analysis.kellyCriterion * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Optimal Stake</p>
                      <p className="text-sm font-bold text-emerald-600">{analysis.optimalStake}%</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">Risk Level</p>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs',
                        analysis.riskLevel === 'Low' && 'text-emerald-600 border-emerald-200 bg-emerald-50',
                        analysis.riskLevel === 'Medium' && 'text-amber-600 border-amber-200 bg-amber-50',
                        (analysis.riskLevel === 'High' || analysis.riskLevel === 'Very High') && 'text-red-600 border-red-200 bg-red-50'
                      )}
                    >
                      {analysis.riskLevel}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">Signal Summary</p>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'text-sm font-bold',
                        analysis.signalSummary === 'Favorable' ? 'text-emerald-600' :
                        analysis.signalSummary === 'Caution' ? 'text-red-600' : 'text-amber-600'
                      )}>
                        {analysis.signalSummary}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        ({analysis.buySignals} buy / {analysis.sellSignals} sell)
                      </span>
                    </div>
                  </div>

                  {analysis.recommendations.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Notes</p>
                        {analysis.recommendations.map((rec: string, i: number) => (
                          <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
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
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Stake Simulation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stakeSimulation.map((sim) => (
                    <div key={sim.stake} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">${sim.stake}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs font-bold text-emerald-600">${sim.return.toFixed(2)}</span>
                      </div>
                      <span className={cn(
                        'text-xs font-medium',
                        sim.profit >= 0 ? 'text-emerald-600' : 'text-red-600'
                      )}>
                        {sim.profit >= 0 ? '+' : ''}{sim.profit.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Signal Breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Signal Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {Object.entries(signalBreakdown).filter(([, count]) => count > 0).map(([signal, count]) => (
                    <div key={signal} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className={cn('w-2 h-2 rounded-full', SIGNAL_CONFIG[signal as keyof typeof SIGNAL_CONFIG].bgClass)} />
                        <span className="capitalize">{signal.replace('_', ' ')}</span>
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
