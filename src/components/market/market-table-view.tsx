'use client'

import { useMemo, useState } from 'react'
import { useMarketStore } from '@/stores/market-store'
import { MarketType, MARKET_TYPE_CONFIG, SIGNAL_CONFIG, MarketData, MarketEvent } from '@/lib/market-types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import {
  TrendingUp, TrendingDown, Minus, Search, Filter,
  ArrowUpRight, ArrowDownRight, Signal, Target,
  BarChart3, Activity, AlertTriangle, CheckCircle2,
  ChevronDown, ChevronUp
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts'
import { useQuery } from '@tanstack/react-query'

interface MarketTableViewProps {
  marketType: MarketType
}

export function MarketTableView({ marketType }: MarketTableViewProps) {
  const { events, addAccumulatorLeg, accumulatorLegs } = useMarketStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null)
  const [sortField, setSortField] = useState<'odds' | 'confidence' | 'volume'>('confidence')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const config = MARKET_TYPE_CONFIG[marketType]

  // Fetch analysis insights from API
  const { data: analysisData, isLoading: analysisLoading } = useQuery({
    queryKey: ['analysis', marketType],
    queryFn: async () => {
      const res = await fetch(`/api/analysis?marketType=${marketType}`)
      return res.json()
    },
    refetchInterval: 30000,
  })

  const filteredEvents = useMemo(() => {
    let filtered = events.filter(e => 
      e.status === 'live' || e.status === 'upcoming'
    )

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(e =>
        e.homeTeam.toLowerCase().includes(q) ||
        e.awayTeam.toLowerCase().includes(q) ||
        e.league.toLowerCase().includes(q)
      )
    }

    // Sort events by live first
    filtered.sort((a, b) => {
      if (a.status === 'live' && b.status !== 'live') return -1
      if (a.status !== 'live' && b.status === 'live') return 1
      return 0
    })

    return filtered
  }, [events, searchQuery])

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return <ChevronDown className="h-3 w-3 opacity-30" />
    return sortDir === 'desc'
      ? <ChevronDown className="h-3 w-3" />
      : <ChevronUp className="h-3 w-3" />
  }

  const analysis = analysisData?.analysis

  const marketDistribution = useMemo(() => {
    const markets = events.flatMap(e => e.markets).filter(m => m.marketType === marketType && m.status === 'active')
    const signals = ['strong_buy', 'buy', 'neutral', 'sell', 'strong_sell']
    return signals.map(s => ({
      name: SIGNAL_CONFIG[s as keyof typeof SIGNAL_CONFIG].label,
      value: markets.filter(m => m.analysis?.signal === s).length,
      color: SIGNAL_CONFIG[s as keyof typeof SIGNAL_CONFIG].color,
    }))
  }, [events, marketType])

  return (
    <div className="space-y-6">
      {/* Market Type Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className={cn('text-xl font-bold', config.color)}>{config.label}</h2>
            <Badge variant="outline" className="text-xs">
              {events.flatMap(e => e.markets).filter(m => m.marketType === marketType && m.status === 'active').length} markets
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Analysis Panel */}
      {analysisLoading ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : analysis && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {config.label} Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Win Rate</p>
                <p className="text-lg font-bold">{analysis.winRate}%</p>
                <Progress value={analysis.winRate} className="h-1.5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Avg ROI</p>
                <p className={cn('text-lg font-bold', analysis.avgROI >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                  {analysis.avgROI >= 0 ? '+' : ''}{analysis.avgROI}%
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Risk Level</p>
                <Badge
                  variant="outline"
                  className={cn(
                    analysis.riskLevel === 'Low' && 'text-emerald-600 border-emerald-200 bg-emerald-50',
                    (analysis.riskLevel === 'Medium' || analysis.riskLevel === 'Low-Medium') && 'text-amber-600 border-amber-200 bg-amber-50',
                    analysis.riskLevel === 'High' && 'text-red-600 border-red-200 bg-red-50'
                  )}
                >
                  {analysis.riskLevel}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Market Efficiency</p>
                <p className="text-lg font-bold">{analysis.marketEfficiency}%</p>
                <Progress value={analysis.marketEfficiency} className="h-1.5" />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Insights */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Key Insights</p>
                <div className="space-y-1.5">
                  {analysis.insights.map((insight: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{insight}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recommendations</p>
                <div className="space-y-1.5">
                  {analysis.recommendations.map((rec: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Market Events List */}
      <div className="space-y-3">
        {/* Sort controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Sort by:</span>
          {(['confidence', 'odds', 'volume'] as const).map(field => (
            <Button
              key={field}
              variant="ghost"
              size="sm"
              className={cn(
                'h-7 text-xs px-2',
                sortField === field && 'bg-accent'
              )}
              onClick={() => toggleSort(field)}
            >
              {field.charAt(0).toUpperCase() + field.slice(1)}
              <SortIcon field={field} />
            </Button>
          ))}
        </div>

        {filteredEvents.map(event => {
          const typeMarkets = event.markets
            .filter(m => m.marketType === marketType && m.status === 'active')
            .sort((a, b) => {
              const aVal = sortField === 'odds' ? a.odds : sortField === 'confidence' ? (a.analysis?.confidence || 0) : a.volume
              const bVal = sortField === 'odds' ? b.odds : sortField === 'confidence' ? (b.analysis?.confidence || 0) : b.volume
              return sortDir === 'desc' ? bVal - aVal : aVal - bVal
            })

          if (typeMarkets.length === 0) return null

          const isExpanded = expandedEvent === event.id

          return (
            <Card key={event.id}>
              <CardContent className="p-4">
                {/* Event Header */}
                <button
                  className="w-full flex items-center justify-between"
                  onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                >
                  <div className="flex items-center gap-3">
                    {event.status === 'live' && (
                      <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-emerald-600">{event.minute}&apos;</span>
                      </div>
                    )}
                    <div className="text-left">
                      <p className="text-sm font-semibold">
                        {event.homeTeam} vs {event.awayTeam}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{event.league}</span>
                        <span>•</span>
                        <span>{event.sport}</span>
                        {event.status === 'live' && (
                          <>
                            <span>•</span>
                            <span className="font-medium text-emerald-600">{event.currentScore}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px]',
                        event.status === 'live' && 'text-emerald-600 border-emerald-200 bg-emerald-50',
                        event.status === 'upcoming' && 'text-amber-600 border-amber-200 bg-amber-50'
                      )}
                    >
                      {event.status === 'live' ? `Live ${event.minute}'` : event.status}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {typeMarkets.length} markets
                    </Badge>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </button>

                {/* Expanded Markets */}
                {isExpanded && (
                  <div className="mt-4 border-t pt-4">
                    <ScrollArea className="max-h-96">
                      <div className="space-y-2">
                        {typeMarkets.map(market => {
                          const isInAccumulator = accumulatorLegs.some(l => l.eventId === event.id && l.marketLabel === market.marketLabel)
                          
                          return (
                            <div key={market.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                              <div className="flex-1 min-w-0 mr-3">
                                <p className="text-sm font-medium">{market.marketLabel}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  {market.analysis && (
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        'text-[10px] px-1.5 py-0 font-semibold',
                                        SIGNAL_CONFIG[market.analysis.signal].textColor
                                      )}
                                    >
                                      {SIGNAL_CONFIG[market.analysis.signal].label}
                                    </Badge>
                                  )}
                                  <span className="text-[10px] text-muted-foreground">
                                    Vol: {market.volume.toLocaleString()}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 shrink-0">
                                {/* Confidence */}
                                <div className="text-right hidden sm:block">
                                  <p className="text-[10px] text-muted-foreground">Confidence</p>
                                  <p className="text-sm font-semibold">
                                    {market.analysis ? `${(market.analysis.confidence * 100).toFixed(1)}%` : '—'}
                                  </p>
                                </div>

                                {/* EV */}
                                <div className="text-right hidden md:block">
                                  <p className="text-[10px] text-muted-foreground">EV</p>
                                  <p className={cn(
                                    'text-sm font-semibold',
                                    market.analysis && market.analysis.expectedValue >= 0 ? 'text-emerald-600' : 'text-red-600'
                                  )}>
                                    {market.analysis ? `${market.analysis.expectedValue >= 0 ? '+' : ''}${(market.analysis.expectedValue * 100).toFixed(1)}%` : '—'}
                                  </p>
                                </div>

                                {/* Kelly */}
                                <div className="text-right hidden lg:block">
                                  <p className="text-[10px] text-muted-foreground">Kelly</p>
                                  <p className="text-sm font-semibold">
                                    {market.analysis ? `${(market.analysis.kellyCriterion * 100).toFixed(1)}%` : '—'}
                                  </p>
                                </div>

                                {/* Odds with trend */}
                                <div className="flex items-center gap-1.5">
                                  <div className={cn(
                                    'p-0.5 rounded',
                                    market.trend === 'rising' ? 'bg-emerald-100 text-emerald-700' :
                                    market.trend === 'falling' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
                                  )}>
                                    {market.trend === 'rising' ? <ArrowUpRight className="h-3 w-3" /> :
                                     market.trend === 'falling' ? <ArrowDownRight className="h-3 w-3" /> :
                                     <Minus className="h-3 w-3" />}
                                  </div>
                                  <span className="text-sm font-bold min-w-[40px] text-right">{market.odds.toFixed(2)}</span>
                                </div>

                                {/* Add to Accumulator */}
                                <Button
                                  size="sm"
                                  variant={isInAccumulator ? 'default' : 'outline'}
                                  className={cn(
                                    'h-7 text-[10px] px-2',
                                    isInAccumulator && 'bg-emerald-600 hover:bg-emerald-700'
                                  )}
                                  disabled={isInAccumulator || accumulatorLegs.length >= 10}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (market.analysis && !isInAccumulator) {
                                      addAccumulatorLeg({
                                        eventId: event.id,
                                        homeTeam: event.homeTeam,
                                        awayTeam: event.awayTeam,
                                        marketLabel: market.marketLabel,
                                        selection: market.selection,
                                        odds: market.odds,
                                        signal: market.analysis.signal,
                                        confidence: market.analysis.confidence,
                                        impliedProb: market.impliedProb,
                                      })
                                    }
                                  }}
                                >
                                  {isInAccumulator ? 'Added' : '+ Acc'}
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}

        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No events found for this market type</p>
          </div>
        )}
      </div>
    </div>
  )
}
