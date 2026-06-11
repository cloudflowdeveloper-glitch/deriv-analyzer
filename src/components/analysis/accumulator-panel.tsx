'use client'

import { useTradingStore } from '@/stores/trading-store'
import { SIGNAL_COLORS, MARKET_TYPES, AccumulatorLeg } from '@/lib/trading-types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useQuery } from '@tanstack/react-query'
import { Layers, Trash2, AlertTriangle, Target, DollarSign, X, ArrowRight, CheckCircle2, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMemo } from 'react'

export function AccumulatorPanel() {
  const { accumulatorLegs, removeLeg, clearAccumulator } = useTradingStore()

  const { data: analysisResult, isLoading } = useQuery({
    queryKey: ['acc-analysis', accumulatorLegs.length, JSON.stringify(accumulatorLegs.map(l => l.id))],
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

  const totalStake = useMemo(() => accumulatorLegs.reduce((s, l) => s + l.stake, 0), [accumulatorLegs])
  const totalPayout = useMemo(() => accumulatorLegs.reduce((s, l) => s + l.payout, 0), [accumulatorLegs])
  const totalProfit = useMemo(() => totalPayout - totalStake, [totalPayout, totalStake])

  const combinedOdds = useMemo(() => {
    if (accumulatorLegs.length === 0) return 1
    return accumulatorLegs.reduce((a, l) => a * l.odds, 1)
  }, [accumulatorLegs])

  const stakeSim = useMemo(() => {
    if (accumulatorLegs.length === 0) return []
    const perLeg = totalStake / accumulatorLegs.length
    return [
      { label: 'Min', stake: 1 },
      { label: 'Low', stake: 5 },
      { label: 'Med', stake: 10 },
      { label: 'High', stake: 25 },
      { label: 'Max', stake: 50 },
    ].map(s => ({
      ...s,
      perLeg: perLeg || s.stake,
      potential: parseFloat((s.stake * combinedOdds).toFixed(2)),
      profit: parseFloat(((s.stake * combinedOdds) - s.stake).toFixed(2)),
    }))
  }, [accumulatorLegs, combinedOdds, totalStake])

  const signalCounts = useMemo(() => {
    const c = { strong_buy: 0, buy: 0, neutral: 0, sell: 0, strong_sell: 0 }
    accumulatorLegs.forEach(l => c[l.signal]++)
    return c
  }, [accumulatorLegs])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Accumulator</h2>
          <Badge variant="secondary" className="text-xs">{accumulatorLegs.length}/10</Badge>
        </div>
        {accumulatorLegs.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAccumulator} className="text-red-500 hover:text-red-600 h-7">
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear
          </Button>
        )}
      </div>

      {accumulatorLegs.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Layers className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-base font-semibold text-muted-foreground">No Legs Added</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Select a market type, configure your contract, and click &quot;Add to Accumulator&quot; to build a multi-leg accumulator.
            </p>
            <div className="flex flex-wrap justify-center gap-1.5 mt-4">
              {(Object.keys(MARKET_TYPES) as Array<keyof typeof MARKET_TYPES>).map((type) => (
                <Badge key={type} variant="outline" className={cn('text-[10px]', MARKET_TYPES[type].color, MARKET_TYPES[type].bg, MARKET_TYPES[type].borderColor)}>
                  {MARKET_TYPES[type].label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Legs List */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Contract Legs</CardTitle>
                <div className="flex gap-2 text-[10px]">
                  <span className="text-muted-foreground">Stake: <span className="font-bold text-foreground">${totalStake.toFixed(2)}</span></span>
                  <span className="text-muted-foreground">Payout: <span className="font-bold text-emerald-400">${totalPayout.toFixed(2)}</span></span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[500px]">
                <div className="space-y-1.5">
                  {accumulatorLegs.map((leg, idx) => {
                    const mt = MARKET_TYPES[leg.marketType]
                    const isBuy = leg.signal === 'buy' || leg.signal === 'strong_buy'

                    return (
                      <div key={leg.id} className={cn('p-2.5 rounded-lg border', mt.borderColor, mt.bg)}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">{idx + 1}</div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-medium">{leg.name}</p>
                                <Badge variant="outline" className={cn('text-[8px] px-1 py-0', mt.color, mt.bg, mt.borderColor)}>
                                  {mt.label}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
                                <span className="font-mono">{leg.symbol.split(':').pop()}</span>
                                <span>• {leg.prediction}</span>
                                <span>• {leg.duration.label}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="outline" className={cn('text-[8px] px-1 py-0 font-semibold', SIGNAL_COLORS[leg.signal].text)}>
                              {SIGNAL_COLORS[leg.signal].label}
                            </Badge>
                            <div className="text-right">
                              <p className="text-[10px] text-muted-foreground">${leg.stake}</p>
                              <p className={cn('text-xs font-bold', isBuy ? 'text-emerald-400' : 'text-red-400')}>
                                ${leg.payout.toFixed(2)}
                              </p>
                            </div>
                            <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-muted-foreground hover:text-red-500" onClick={() => removeLeg(leg.id)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        {/* Running total */}
                        <div className="mt-1.5 pt-1.5 border-t border-border/50 flex items-center gap-1.5">
                          <span className="text-[9px] text-muted-foreground">Running:</span>
                          <span className="text-[10px] font-bold">
                            ${accumulatorLegs.slice(0, idx + 1).reduce((a, l) => a + l.payout, 0).toFixed(2)}
                          </span>
                          <span className="text-[9px] text-muted-foreground">
                            ({accumulatorLegs.slice(0, idx + 1).reduce((a, l) => a + l.stake, 0).toFixed(2)})
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Analysis Column */}
          <div className="space-y-3">
            {/* Combined Stats */}
            <Card>
              <CardContent className="p-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">Total Payout</p>
                    <p className="text-2xl font-bold text-emerald-400">${totalPayout.toFixed(2)}</p>
                    <p className={cn('text-[10px] font-medium', totalProfit > 0 ? 'text-emerald-400' : 'text-red-400')}>
                      {totalProfit > 0 ? '+' : ''}{totalProfit.toFixed(2)} profit
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">Combined Odds</p>
                    <p className="text-2xl font-bold">{combinedOdds.toFixed(2)}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {((1 / combinedOdds) * 100).toFixed(1)}% implied
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Risk Analysis */}
            {isLoading ? (
              <Card><CardContent className="p-4 animate-pulse space-y-2"><div className="h-4 bg-muted rounded" /><div className="h-4 bg-muted rounded w-2/3" /></CardContent></Card>
            ) : analysis && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs flex items-center gap-1.5"><Target className="h-3.5 w-3.5" /> Risk Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[9px] text-muted-foreground">Combined Prob.</p>
                      <p className="text-sm font-bold">{analysis.combinedProbability.toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground">Avg Confidence</p>
                      <p className="text-sm font-bold">{analysis.avgConfidence.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground">Kelly Criterion</p>
                      <p className="text-sm font-bold">{(analysis.kellyCriterion * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground">Optimal Stake</p>
                      <p className="text-sm font-bold text-emerald-400">{analysis.optimalStake.toFixed(1)}%</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">Risk Level</span>
                    </div>
                    <Badge variant="outline" className={cn('text-[10px]',
                      analysis.riskLevel === 'Low' && 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
                      analysis.riskLevel === 'Medium' && 'text-amber-400 border-amber-500/30 bg-amber-500/10',
                      ['High', 'Very High'].includes(analysis.riskLevel) && 'text-red-400 border-red-500/30 bg-red-500/10'
                    )}>{analysis.riskLevel}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">Summary</span>
                    <span className={cn('text-xs font-bold',
                      analysis.signalSummary === 'Favorable' ? 'text-emerald-400' :
                      analysis.signalSummary === 'Caution' ? 'text-red-400' : 'text-amber-400'
                    )}>{analysis.signalSummary}</span>
                  </div>
                  {analysis.recommendations?.length > 0 && (
                    <div className="space-y-1">
                      {analysis.recommendations.map((rec: string, i: number) => (
                        <div key={i} className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                          <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Stake Simulation */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" /> Payout Table</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {stakeSim.map(s => (
                    <div key={s.label} className="flex items-center justify-between p-2 rounded-md bg-muted/30">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-medium w-6">{s.label}</span>
                        <span className="text-muted-foreground">${s.stake}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="font-bold text-emerald-400">${s.potential.toFixed(2)}</span>
                      </div>
                      <span className={cn('text-[10px] font-medium', s.profit >= 0 ? 'text-emerald-400' : 'text-red-400')}>
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
                <CardTitle className="text-xs">Signal Mix</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {Object.entries(signalCounts).filter(([, c]) => c > 0).map(([signal, count]) => (
                    <div key={signal} className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-2">
                        <div className={cn('w-2 h-2 rounded-full', SIGNAL_COLORS[signal as keyof typeof SIGNAL_COLORS].bg)} />
                        <span className="capitalize">{String(signal).replace('_', ' ')}</span>
                      </div>
                      <span className="font-bold">{count}</span>
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
