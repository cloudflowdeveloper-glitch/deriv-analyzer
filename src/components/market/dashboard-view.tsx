'use client'

import { useMemo } from 'react'
import { useMarketStore } from '@/stores/market-store'
import { MARKET_TYPE_CONFIG, MarketType, SIGNAL_CONFIG, SignalType } from '@/lib/market-types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, TrendingDown, Activity, Target, Shield, 
  AlertTriangle, BarChart3, Zap, Hash, ArrowUpDown, X, Unlink,
  Layers, CheckCircle2, XCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'

const ICON_MAP: Record<string, React.ReactNode> = {
  Hash: <Hash className="h-4 w-4" />,
  NotEqual: <Unlink className="h-4 w-4" />,
  ArrowUpDown: <ArrowUpDown className="h-4 w-4" />,
  X: <X className="h-4 w-4" />,
  TrendingUp: <TrendingUp className="h-4 w-4" />,
  Zap: <Zap className="h-4 w-4" />,
}

export function DashboardView() {
  const { events, snapshot } = useMarketStore()

  const stats = useMemo(() => {
    const allMarkets = events.flatMap(e => e.markets).filter(m => m.status === 'active')
    const liveEvents = events.filter(e => e.status === 'live')
    const upcomingEvents = events.filter(e => e.status === 'upcoming')

    const signals = { strong_buy: 0, buy: 0, neutral: 0, sell: 0, strong_sell: 0 }
    allMarkets.forEach(m => {
      if (m.analysis) signals[m.analysis.signal] = (signals[m.analysis.signal] || 0) + 1
    })

    const avgOdds = allMarkets.length > 0
      ? allMarkets.reduce((s, m) => s + m.odds, 0) / allMarkets.length
      : 0

    const totalVolume = allMarkets.reduce((s, m) => s + m.volume, 0)

    return { allMarkets, liveEvents, upcomingEvents, signals, avgOdds, totalVolume }
  }, [events])

  const marketTypeBreakdown = useMemo(() => {
    return (Object.keys(MARKET_TYPE_CONFIG) as MarketType[]).map(type => {
      const markets = events.flatMap(e => e.markets).filter(m => m.marketType === type && m.status === 'active')
      const buySignals = markets.filter(m => m.analysis?.signal === 'buy' || m.analysis?.signal === 'strong_buy').length
      const sellSignals = markets.filter(m => m.analysis?.signal === 'sell' || m.analysis?.signal === 'strong_sell').length
      const avgConf = markets.length > 0
        ? markets.reduce((s, m) => s + (m.analysis?.confidence || 0), 0) / markets.length
        : 0

      return {
        type,
        label: MARKET_TYPE_CONFIG[type].label,
        color: MARKET_TYPE_CONFIG[type].color,
        count: markets.length,
        buySignals,
        sellSignals,
        avgConfidence: parseFloat((avgConf * 100).toFixed(1)),
      }
    })
  }, [events])

  const signalPieData = useMemo(() => [
    { name: 'Strong Buy', value: stats.signals.strong_buy, color: '#16a34a' },
    { name: 'Buy', value: stats.signals.buy, color: '#4ade80' },
    { name: 'Neutral', value: stats.signals.neutral, color: '#9ca3af' },
    { name: 'Sell', value: stats.signals.sell, color: '#f87171' },
    { name: 'Strong Sell', value: stats.signals.strong_sell, color: '#dc2626' },
  ].filter(d => d.value > 0), [stats.signals])

  const liveEventsData = useMemo(() => {
    return stats.liveEvents.map(e => ({
      name: `${e.homeTeam} vs ${e.awayTeam}`,
      minute: e.minute,
      markets: e.markets.filter(m => m.status === 'active').length,
      score: e.currentScore,
    }))
  }, [stats.liveEvents])

  const topMarkets = useMemo(() => {
    return events
      .flatMap(e => e.markets.filter(m => m.analysis && m.status === 'active'))
      .sort((a, b) => (b.analysis?.confidence || 0) - (a.analysis?.confidence || 0))
      .slice(0, 6)
      .map(m => {
        const event = events.find(e => e.id === m.eventId)
        return {
          ...m,
          eventLabel: event ? `${event.homeTeam} vs ${event.awayTeam}` : 'Unknown',
          league: event?.league || '',
        }
      })
  }, [events])

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Live Events</p>
                <p className="text-2xl font-bold mt-1">{stats.liveEvents.length}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stats.upcomingEvents.length} upcoming</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Activity className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Active Markets</p>
                <p className="text-2xl font-bold mt-1">{stats.allMarkets.length}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Across all types</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-sky-50 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-sky-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Buy Signals</p>
                <p className="text-2xl font-bold mt-1 text-emerald-600">{stats.signals.strong_buy + stats.signals.buy}</p>
                <p className="text-xs text-red-500 mt-0.5">{stats.signals.strong_sell + stats.signals.sell} sell signals</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Avg Confidence</p>
                <p className="text-2xl font-bold mt-1">
                  {snapshot ? `${(snapshot.avgConfidence * 100).toFixed(1)}%` : '—'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Avg odds: {stats.avgOdds.toFixed(2)}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <Target className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Market Type Breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Market Type Breakdown</CardTitle>
            <CardDescription className="text-xs">Signal distribution by market type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={marketTypeBreakdown} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                    formatter={(value: number, name: string) => [value, name.charAt(0).toUpperCase() + name.slice(1)]}
                  />
                  <Bar dataKey="buySignals" name="Buy" fill="#4ade80" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="sellSignals" name="Sell" fill="#f87171" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Signal Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Signal Distribution</CardTitle>
            <CardDescription className="text-xs">Overall market signals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={signalPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {signalPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {signalPieData.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground">{item.name}</span>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Events + Top Picks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Live Events */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Events
            </CardTitle>
            <CardDescription className="text-xs">{stats.liveEvents.length} events currently live</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {stats.liveEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No live events at the moment</p>
              ) : (
                stats.liveEvents.map(event => (
                  <div key={event.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">{event.minute}&apos;</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{event.homeTeam} vs {event.awayTeam}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{event.league}</span>
                          <span>•</span>
                          <span>{event.sport}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-lg font-bold">{event.currentScore}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {event.markets.filter(m => m.status === 'active').length} markets
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Picks */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-amber-500" />
              Top Confidence Picks
            </CardTitle>
            <CardDescription className="text-xs">Highest confidence analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {topMarkets.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Loading picks...</p>
              ) : (
                topMarkets.map(market => (
                  <div key={market.id} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-1.5">
                      <Badge
                        variant="outline"
                        className={cn('text-[10px] px-1.5 py-0 font-semibold', SIGNAL_CONFIG[market.analysis!.signal].textColor)}
                      >
                        {SIGNAL_CONFIG[market.analysis!.signal].label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{market.analysis!.confidence.toFixed(1)}%</span>
                    </div>
                    <p className="text-xs font-medium truncate">{market.marketLabel}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{market.eventLabel}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-semibold">{market.odds.toFixed(2)}</span>
                      <div className={cn(
                        'flex items-center gap-0.5 text-[10px] font-medium',
                        market.trend === 'rising' ? 'text-emerald-600' : market.trend === 'falling' ? 'text-red-600' : 'text-muted-foreground'
                      )}>
                        {market.trend === 'rising' ? <TrendingUp className="h-3 w-3" /> : market.trend === 'falling' ? <TrendingDown className="h-3 w-3" /> : null}
                        {market.trend}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
