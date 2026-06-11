'use client'

import { useTradingStore } from '@/stores/trading-store'
import { MarketType, MARKET_TYPES, POPULAR_SYMBOLS, TIMEFRAMES } from '@/lib/trading-types'
import { AnalysisPanel } from '@/components/analysis/analysis-panel'
import { AccumulatorPanel } from '@/components/analysis/accumulator-panel'
import { TvChart } from '@/components/tradingview/tv-chart'
import { TvTicker } from '@/components/tradingview/tv-ticker'
import { TvTechnicalAnalysis } from '@/components/tradingview/tv-technical-analysis'
import { TvMarketOverview } from '@/components/tradingview/tv-market-overview'
import { TvScreener } from '@/components/tradingview/tv-screener'
import { TvEconomicCalendar } from '@/components/tradingview/tv-economic-calendar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  BarChart3, Sun, Moon, Activity, Hash, Unlink, ArrowUpDown,
  X, TrendingUp, Zap, Layers, Monitor
} from 'lucide-react'
import { cn } from '@/lib/utils'

const MARKET_TABS: Array<{ value: MarketType | 'chart' | 'dashboard' | 'accumulators'; label: string; icon: React.ReactNode }> = [
  { value: 'chart', label: 'Chart', icon: <BarChart3 className="h-4 w-4" /> },
  { value: 'dashboard', label: 'Dashboard', icon: <Monitor className="h-4 w-4" /> },
  { value: 'even_odd', label: 'Even/Odd', icon: <Hash className="h-4 w-4" /> },
  { value: 'differs', label: 'Differs', icon: <Unlink className="h-4 w-4" /> },
  { value: 'over_under', label: 'Over/Under', icon: <ArrowUpDown className="h-4 w-4" /> },
  { value: 'multiplier', label: 'Multipliers', icon: <X className="h-4 w-4" /> },
  { value: 'higher_lower', label: 'Higher/Lower', icon: <TrendingUp className="h-4 w-4" /> },
  { value: 'turbo', label: 'Turbos', icon: <Zap className="h-4 w-4" /> },
  { value: 'accumulators', label: 'Accumulators', icon: <Layers className="h-4 w-4" /> },
]


export default function TradingAnalysisPage() {
  const store = useTradingStore()
  const {
    activeSymbol, activeTab, timeframe, theme,
    setActiveSymbol, setActiveTab, setTimeframe, toggleTheme,
    accumulatorLegs
  } = store

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Ticker Tape */}
      <div className="border-b">
        <TvTicker colorTheme={theme} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo + Symbol selector */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary">
                <Activity className="h-4.5 w-4.5 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-sm font-bold leading-tight">TradingView Analyzer</h1>
                <p className="text-[10px] text-muted-foreground">Real-time Market Analysis</p>
              </div>
              <Separator orientation="vertical" className="h-8 mx-1 hidden sm:block" />
              <Select value={activeSymbol} onValueChange={setActiveSymbol}>
                <SelectTrigger className="w-40 lg:w-52 h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POPULAR_SYMBOLS.map(s => (
                    <SelectItem key={s.symbol} value={s.symbol}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{s.name}</span>
                        <span className="text-muted-foreground text-[10px]">{s.exchange}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-16 h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEFRAMES.map(tf => (
                    <SelectItem key={tf.value} value={tf.value}>{tf.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-2">
              {accumulatorLegs.length > 0 && (
                <Badge variant="secondary" className="text-[10px] cursor-pointer" onClick={() => setActiveTab('accumulators')}>
                  <Layers className="h-3 w-3 mr-1" />
                  {accumulatorLegs.length} Acc
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={toggleTheme}
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1920px] w-full mx-auto">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MarketType | 'chart' | 'dashboard' | 'accumulators')}>
          {/* Tab Navigation */}
          <div className="border-b bg-muted/30 px-4 sm:px-6 lg:px-8">
            <div className="max-w-[1920px] mx-auto">
              <TabsList className="h-auto flex flex-wrap gap-0.5 bg-transparent p-0 pt-2">
                {MARKET_TABS.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-2 text-xs rounded-t-md rounded-b-none border-b-2 border-transparent',
                      'data-[state=active]:border-primary data-[state=active]:bg-background data-[state=active]:shadow-sm',
                      'hover:bg-accent/50 transition-colors'
                    )}
                  >
                    {tab.icon}
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>

          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            {/* Chart Tab */}
            <TabsContent value="chart">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-3">
                  <Card>
                    <CardContent className="p-0">
                      <TvChart
                        symbol={activeSymbol}
                        theme={theme}
                        interval={timeframe}
                        height={550}
                      />
                    </CardContent>
                  </Card>
                </div>
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs">Technical Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <TvTechnicalAnalysis symbol={activeSymbol} colorTheme={theme} isTransparent={true} />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs">Market Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0" style={{ height: 450 }}>
                    <TvMarketOverview colorTheme={theme} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs">Crypto Screener</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0" style={{ height: 450 }}>
                    <TvScreener colorTheme={theme} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs">Economic Calendar</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0" style={{ height: 400 }}>
                    <TvEconomicCalendar colorTheme={theme} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs">{activeSymbol} — Technical Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0" style={{ height: 400 }}>
                    <TvTechnicalAnalysis symbol={activeSymbol} colorTheme={theme} isTransparent={true} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Accumulator Tab */}
            <TabsContent value="accumulators">
              <AccumulatorPanel />
            </TabsContent>

            {/* Market Type Tabs */}
            {(Object.keys(MARKET_TYPES) as MarketType[]).map((type) => (
              <TabsContent key={type} value={type}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2">
                    <Card>
                      <CardContent className="p-0">
                        <TvChart symbol={activeSymbol} theme={theme} interval={timeframe} height={400} />
                      </CardContent>
                    </Card>
                  </div>
                  <div>
                    <AnalysisPanel marketType={type} />
                  </div>
                </div>
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background mt-auto">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-muted-foreground">
            <p>TradingView Analyzer — Powered by TradingView • Real-time market analysis</p>
            <div className="flex items-center gap-1">
              <span>⚠</span>
              <span>For educational purposes only. Not financial advice.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

