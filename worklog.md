---
Task ID: 1
Agent: Main Agent
Task: Fix "symbol doesn't exist" error when selecting Deriv symbols

Work Log:
- Diagnosed issue: TradingView chart widget receiving raw Deriv symbol IDs (e.g., `R_100`) instead of TradingView-compatible format
- Fixed `page.tsx` to convert `activeSymbol` to `tvSymbol` using `currentSymbol?.tv || activeSymbol` for all TvChart and TvTechnicalAnalysis instances
- Fixed `use-tick-feed.ts` health check from `health.binanceConnected` to `health.derivConnected ?? health.status === 'ok'`
- Discovered that the tick-feed mini-service (port 3004) was unstable in the sandbox environment (Bun background processes kept dying)
- Created in-process Deriv tick service at `src/lib/deriv-ticks.ts` that connects directly to `wss://ws.derivws.com/websockets/v3?app_id=1089`
- Created new API route at `src/app/api/ticks/route.ts` with actions: health, all-prices, price, digits, symbols
- Updated `src/app/api/analysis/route.ts` to use in-process tick service instead of proxying to port 3004
- Updated `src/hooks/use-tick-feed.ts` to call `/api/ticks` directly (no proxy needed)
- Updated TradingView symbol mappings to use `OANDA:` exchange prefix for chart compatibility
- All 37 Deriv symbols (volatility indices, 1-second indices, crash/boom, step/jump, forex, commodities) now have live prices
- Digit extraction: `Math.abs(Math.floor(price)) % 10` (user-specified rule)

Stage Summary:
- All 37 symbols streaming live prices from Deriv WebSocket API
- TradingView charts load without "Invalid symbol" errors
- Digit analysis panel shows live data for all symbols
- All 9 tabs (Even/Odd, Differs, Over/Under, Multiplier, Rise/Fall, Turbo, Accumulator, Chart, Overview) working
