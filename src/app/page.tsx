'use client'

import { useTradingStore } from '@/stores/trading-store'
import { MarketType, MARKET_TYPES, ALL_SYMBOLS, TIMEFRAMES } from '@/lib/trading-types'
import { AnalysisPanel } from '@/components/analysis/analysis-panel'
import { AccumulatorPanel } from '@/components/analysis/accumulator-panel'
import { TvChart } from '@/components/tradingview/tv-chart'
import { TvTicker } from '@/components/tradingview/tv-ticker'
import { TvTechnicalAnalysis } from '@/components/tradingview/tv-technical-analysis'
import { TvMarketOverview } from '@/components/tradingview/tv-market-overview'
import { TvScreener } from '@/components/tradingview/tv-screener'
import { TvEconomicCalendar } from '@/components/tradingview/tv-economic-calendar'
import { SymbolSearch } from '@/components/tradingview/symbol-search'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  { value: 'even_odd', label: 'Even/Odd', icon: <Hash className="h-4 w-4" /> },
  { value: 'differs', label: 'Differs', icon: <Unlink className="h-4 w-4" /> },
  { value: 'over_under', label: 'Over/Under', icon: <ArrowUpDown className="h-4 w-4" /> },
  { value: 'multiplier', label: 'Multiplier', icon: <X className="h-4 w-4" /> },
  { value: 'higher_lower', label: 'Rise/Fall', icon: <TrendingUp className="h-4 w-4" /> },
  { value: 'turbo', label: 'Turbo', icon: <Zap className="h-4 w-4" /> },
  { value: 'accumulators', label: 'Accumulator', icon: <Layers className="h-4 w-4" /> },
  { value: 'chart', label: 'Chart', icon: <BarChart3 className="h-4 w-4" /> },
  { value: 'dashboard', label: 'Overview', icon: <Monitor className="h-4 w-4" /> },
]

export default function TradingAnalysisPage() {
  const {
    activeSymbol, activeTab, timeframe, theme,
    setActiveSymbol, setActiveTab, setTimeframe, toggleTheme,
    accumulatorLegs,
  } = useTradingStore()

  const currentSymbol = ALL_SYMBOLS.find(s => s.symbol === activeSymbol)

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Ticker Tape */}
      <div className="border-b border-border/50">
        <TvTicker colorTheme={theme} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-3 sm:px-4">
          <div className="flex items-center justify-between h-12">
            {/* Left */}
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500 shrink-0">
                <Activity className="h-4 w-4 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xs font-bold leading-tight">Deriv Analyzer</h1>
                <p className="text-[9px] text-muted-foreground">{ALL_SYMBOLS.length} markets • Synthetic trading</p>
              </div>
              <Separator orientation="vertical" className="h-6 mx-0.5 hidden sm:block" />
              <SymbolSearch
                value={activeSymbol}
                onChange={setActiveSymbol}
                className="w-44 lg:w-56"
              />
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-14 h-8 text-[10px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIMEFRAMES.map(tf => (
                    <SelectItem key={tf.value} value={tf.value}><span className="text-[10px]">{tf.label}</span></SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Right */}
            <div className="flex items-center gap-1.5">
              {currentSymbol && (
                <Badge variant="outline" className="text-[9px] hidden md:inline-flex border-border/50">
                  <span className="font-mono">{currentSymbol.category}</span>
                </Badge>
              )}
              {accumulatorLegs.length > 0 && (
                <Badge
                  className="text-[9px] bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer transition-colors"
                  onClick={() => setActiveTab('accumulators')}
                >
                  <Layers className="h-2.5 w-2.5 mr-1" />
                  {accumulatorLegs.length}
                </Badge>
              )}
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={toggleTheme}>
                {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MarketType | 'chart' | 'dashboard' | 'accumulators')}>
          {/* Tab Navigation */}
          <div className="border-b border-border/50 bg-muted/20 px-3 sm:px-4">
            <div className="overflow-x-auto">
              <TabsList className="h-auto flex flex-nowrap gap-0.5 bg-transparent p-0 pt-1.5 min-w-max">
                {MARKET_TABS.map((tab) => {
                  const isMarketTab = tab.value !== 'chart' && tab.value !== 'dashboard' && tab.value !== 'accumulators'
                  const tabConfig = isMarketTab ? MARKET_TYPES[tab.value as MarketType] : null
                  return (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className={cn(
                        'flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium rounded-t-md rounded-b-none border-b-2 border-transparent shrink-0 transition-colors',
                        'data-[state=active]:bg-background data-[state=active]:shadow-sm',
                        isMarketTab && tabConfig
                          ? `data-[state=active]:${tabConfig.borderColor}`
                          : 'data-[state=active]:border-emerald-500',
                        'hover:bg-accent/30'
                      )}
                    >
                      {tab.icon}
                      <span className="hidden sm:inline">{tab.label}</span>
                      {isMarketTab && tabConfig && (
                        <span className={cn('hidden lg:inline text-[9px]', tabConfig.color)}>({tabConfig.shortDesc})</span>
                      )}
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            </div>
          </div>

          <div className="px-3 sm:px-4 py-3 sm:py-4">
            {/* Market Type Tabs — Chart + Analysis Panel side-by-side */}
            {(Object.keys(MARKET_TYPES) as MarketType[]).map((type) => (
              <TabsContent key={type} value={type}>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
                  {/* Chart takes 3/5 */}
                  <div className="lg:col-span-3">
                    <Card className="border-border/50">
                      <CardContent className="p-0">
                        <TvChart symbol={activeSymbol} theme={theme} interval={timeframe} height={420} />
                      </CardContent>
                    </Card>
                  </div>
                  {/* Analysis Panel takes 2/5 */}
                  <div className="lg:col-span-2">
                    <AnalysisPanel marketType={type} />
                  </div>
                </div>
              </TabsContent>
            ))}

            {/* Accumulator Tab */}
            <TabsContent value="accumulators">
              <AccumulatorPanel />
            </TabsContent>

            {/* Chart Tab — Full width */}
            <TabsContent value="chart">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
                <div className="lg:col-span-3">
                  <Card className="border-border/50">
                    <CardContent className="p-0">
                      <TvChart symbol={activeSymbol} theme={theme} interval={timeframe} height={520} />
                    </CardContent>
                  </Card>
                </div>
                <div>
                  <Card className="border-border/50">
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <Card className="border-border/50">
                  <CardHeader className="pb-1.5">
                    <CardTitle className="text-xs">Market Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0" style={{ height: 420 }}>
                    <TvMarketOverview colorTheme={theme} />
                  </CardContent>
                </Card>
                <Card className="border-border/50">
                  <CardHeader className="pb-1.5">
                    <CardTitle className="text-xs">Screener</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0" style={{ height: 420 }}>
                    <TvScreener colorTheme={theme} />
                  </CardContent>
                </Card>
                <Card className="border-border/50">
                  <CardHeader className="pb-1.5">
                    <CardTitle className="text-xs">Economic Calendar</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0" style={{ height: 380 }}>
                    <TvEconomicCalendar colorTheme={theme} />
                  </CardContent>
                </Card>
                <Card className="border-border/50">
                  <CardHeader className="pb-1.5">
                    <CardTitle className="text-xs">{currentSymbol?.name || activeSymbol} — Technicals</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0" style={{ height: 380 }}>
                    <TvTechnicalAnalysis symbol={activeSymbol} colorTheme={theme} isTransparent={true} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-background mt-auto">
        <div className="px-3 sm:px-4 py-2">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-1.5 text-[9px] text-muted-foreground">
            <p>Deriv Analyzer • {ALL_SYMBOLS.length} markets • Synthetic trading analysis</p>
            <p>⚠ For educational purposes only. Not financial advice.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
