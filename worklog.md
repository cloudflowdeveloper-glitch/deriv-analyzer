---
Task ID: 1
Agent: Main Agent
Task: Rebuild market analysis tool as TradingView-powered trading analysis tool

Work Log:
- Planned architecture: TradingView widget integration + custom analysis API + Zustand store
- Created 7 TradingView widget wrapper components (tv-chart, tv-ticker, tv-technical-analysis, tv-screener, tv-market-overview, tv-symbol-info, tv-economic-calendar)
- Built trading analysis API with POST batch analysis and GET single symbol analysis
- Built accumulator analysis API with Kelly criterion and risk assessment
- Created Zustand store for symbol selection, timeframe, theme, watchlist, accumulator legs
- Built AnalysisPanel component with per-market-type indicators and signal generation
- Built AccumulatorPanel with combined odds, stake simulation, and risk analysis
- Built main page with 9 tabs: Chart, Dashboard, Even/Odd, Differs, Over/Under, Multipliers, Higher/Lower, Turbos, Accumulators
- Added scrolling ticker tape with live prices from TradingView
- Added symbol selector (16 symbols across crypto, forex, stocks, commodities)
- Added timeframe selector (1m to 1W)
- Added dark/light theme toggle affecting all TradingView widgets
- Verified with Agent Browser: page loaded with all TradingView widgets rendering, live prices visible

Stage Summary:
- 7 TradingView widget components in /src/components/tradingview/
- 2 analysis components in /src/components/analysis/
- 2 API routes (/api/analysis GET+POST, /api/analysis/accumulator POST)
- 1 Zustand store (/src/stores/trading-store.ts)
- Trading types and constants (/src/lib/trading-types.ts)
- Complete trading analysis dashboard with 9 tabs
- Live TradingView data: ticker tape, charts, technical analysis, screener, economic calendar
- Per-market-type analysis with custom indicators for each type
- Accumulator builder with Kelly criterion and stake simulation
