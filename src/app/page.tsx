'use client'

import { useMemo } from 'react'
import { useMarketStore } from '@/stores/market-store'
import { useMarketSocket } from '@/hooks/use-market-socket'
import { MarketType, MARKET_TYPE_CONFIG, AnalysisSnapshot } from '@/lib/market-types'
import { DashboardView } from '@/components/market/dashboard-view'
import { MarketTableView } from '@/components/market/market-table-view'
import { AccumulatorView } from '@/components/market/accumulator-view'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Activity, AlertCircle, BarChart3, Wifi, WifiOff, Zap, TrendingUp, ArrowUpDown, X, Hash, Unlink, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

const TAB_LIST: Array<{ value: MarketType | 'dashboard' | 'accumulators'; label: string; icon: React.ReactNode }> = [
  { value: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="h-4 w-4" /> },
  { value: 'even_odd', label: 'Even/Odd', icon: <Hash className="h-4 w-4" /> },
  { value: 'differs', label: 'Differs', icon: <Unlink className="h-4 w-4" /> },
  { value: 'over_under', label: 'Over/Under', icon: <ArrowUpDown className="h-4 w-4" /> },
  { value: 'multiplier', label: 'Multipliers', icon: <X className="h-4 w-4" /> },
  { value: 'higher_lower', label: 'Higher/Lower', icon: <TrendingUp className="h-4 w-4" /> },
  { value: 'turbo', label: 'Turbos', icon: <Zap className="h-4 w-4" /> },
  { value: 'accumulators', label: 'Accumulators', icon: <Layers className="h-4 w-4" /> },
]

export default function MarketAnalysisTool() {
  const { activeTab, setActiveTab, isConnected, snapshot, events } = useMarketStore()
  useMarketSocket()
  const liveCount = useMemo(() => events.filter(e => e.status === 'live').length, [events])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary">
                <Activity className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-tight">Market Analyzer</h1>
                <p className="text-xs text-muted-foreground">Live Market Analysis Tool</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {snapshot && (
                <div className="hidden sm:flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <div className={cn(
                      'w-2 h-2 rounded-full animate-pulse',
                      liveCount > 0 ? 'bg-emerald-500' : 'bg-gray-400'
                    )} />
                    <span className="text-muted-foreground">{liveCount} Live</span>
                  </div>
                  <div className="text-muted-foreground">
                    {snapshot.totalMarkets} Markets
                  </div>
                  <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
                    {snapshot.buySignals} Buy
                  </Badge>
                  <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                    {snapshot.sellSignals} Sell
                  </Badge>
                </div>
              )}
              <div className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                isConnected
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              )}>
                {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                {isConnected ? 'Live' : 'Offline'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1800px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {!events.length ? (
          <div className="space-y-6">
            <Skeleton className="h-10 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-96 rounded-xl" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MarketType | 'dashboard' | 'accumulators')}>
            <TabsList className="mb-6 flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
              {TAB_LIST.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="dashboard">
              <DashboardView />
            </TabsContent>
            <TabsContent value="accumulators">
              <AccumulatorView />
            </TabsContent>
            {(Object.keys(MARKET_TYPE_CONFIG) as MarketType[]).map((type) => (
              <TabsContent key={type} value={type}>
                <MarketTableView marketType={type} />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <p>Market Analyzer — Real-time market analysis across all market types</p>
            <div className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              <span>For educational and analytical purposes only</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
