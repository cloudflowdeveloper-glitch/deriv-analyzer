/**
 * Deriv Tick Feed Service — runs inside the Next.js process.
 * Connects to Deriv WebSocket API and maintains in-memory tick data.
 * Singleton pattern: call `initDerivTicks()` once at server startup.
 */

// ─── Types ─────────────────────────────────────────────────────────
interface Tick {
  price: number
  timestamp: number
  lastDigit: number
}

interface SymbolData {
  symbol: string
  tvSymbol: string
  name: string
  category: string
  pipSize: number
  ticks: Tick[]
  currentPrice: number
  prevPrice: number
  highPrice: number
  lowPrice: number
  priceChange: number
  priceChangePercent: number
  tickSpeed: number
  lastDigit: number
  digitCounts: number[]
  digitPercentages: number[]
  evenCount: number
  oddCount: number
  streakType: string
  streakLength: number
  lastTickTime: number
}

export interface DigitAnalysis {
  symbol: string
  tvSymbol: string
  name: string
  category: string
  currentPrice: number
  lastDigit: number
  digitCounts: number[]
  digitPercentages: number[]
  evenCount: number
  oddCount: number
  evenPercent: number
  oddPercent: number
  overCount: number
  underCount: number
  overPercent: number
  underPercent: number
  streakType: string
  streakLength: number
  highPrice: number
  lowPrice: number
  priceChange: number
  priceChangePercent: number
  tickSpeed: number
  recentTicks: Array<{ price: number; timestamp: number; lastDigit: number }>
  totalTicks: number
  pipSize: number
}

// ─── Symbol List ──────────────────────────────────────────────────
const DERIV_SYMBOLS = [
  { id: 'R_10',      deriv: 'R_10',      tv: 'OANDA:EURUSD',      name: 'Volatility 10 Index',     category: 'Synthetic Indices', pipSize: 2 },
  { id: 'R_25',      deriv: 'R_25',      tv: 'OANDA:GBPUSD',      name: 'Volatility 25 Index',     category: 'Synthetic Indices', pipSize: 2 },
  { id: 'R_50',      deriv: 'R_50',      tv: 'OANDA:EURUSD',      name: 'Volatility 50 Index',     category: 'Synthetic Indices', pipSize: 2 },
  { id: 'R_75',      deriv: 'R_75',      tv: 'OANDA:GBPUSD',      name: 'Volatility 75 Index',     category: 'Synthetic Indices', pipSize: 2 },
  { id: 'R_100',     deriv: 'R_100',     tv: 'OANDA:EURUSD',     name: 'Volatility 100 Index',    category: 'Synthetic Indices', pipSize: 2 },
  { id: '1HZ10V',    deriv: '1HZ10V',    tv: 'OANDA:EURJPY',    name: 'Volatility 10 (1s)',       category: '1-Second Indices', pipSize: 2 },
  { id: '1HZ25V',    deriv: '1HZ25V',    tv: 'OANDA:GBPJPY',    name: 'Volatility 25 (1s)',       category: '1-Second Indices', pipSize: 2 },
  { id: '1HZ50V',    deriv: '1HZ50V',    tv: 'OANDA:EURJPY',    name: 'Volatility 50 (1s)',       category: '1-Second Indices', pipSize: 2 },
  { id: '1HZ75V',    deriv: '1HZ75V',    tv: 'OANDA:GBPJPY',    name: 'Volatility 75 (1s)',       category: '1-Second Indices', pipSize: 2 },
  { id: '1HZ100V',   deriv: '1HZ100V',   tv: 'OANDA:EURJPY',    name: 'Volatility 100 (1s)',      category: '1-Second Indices', pipSize: 2 },
  { id: 'CRASH300N',  deriv: 'CRASH300N',  tv: 'OANDA:EURUSD',  name: 'Crash 300 Index',         category: 'Crash/Boom',           pipSize: 2 },
  { id: 'BOOM300N',   deriv: 'BOOM300N',   tv: 'OANDA:GBPUSD',   name: 'Boom 300 Index',          category: 'Crash/Boom',           pipSize: 2 },
  { id: 'stpRNG',    deriv: 'stpRNG',    tv: 'OANDA:EURUSD',    name: 'Step Index',              category: 'Step Indices',         pipSize: 2 },
  { id: 'JD10',      deriv: 'JD10',      tv: 'OANDA:GBPUSD',      name: 'Jump 10 Index',           category: 'Jump Indices',         pipSize: 2 },
  { id: 'JD25',      deriv: 'JD25',      tv: 'OANDA:EURJPY',      name: 'Jump 25 Index',           category: 'Jump Indices',         pipSize: 2 },
  { id: 'JD50',      deriv: 'JD50',      tv: 'OANDA:GBPJPY',      name: 'Jump 50 Index',           category: 'Jump Indices',         pipSize: 2 },
  { id: 'JD75',      deriv: 'JD75',      tv: 'OANDA:EURUSD',      name: 'Jump 75 Index',           category: 'Jump Indices',         pipSize: 2 },
  { id: 'JD100',     deriv: 'JD100',     tv: 'OANDA:GBPUSD',      name: 'Jump 100 Index',          category: 'Jump Indices',         pipSize: 2 },
  { id: 'frxEURUSD', deriv: 'frxEURUSD', tv: 'OANDA:EURUSD',       name: 'EUR/USD',                category: 'Forex',                 pipSize: 5 },
  { id: 'frxGBPUSD', deriv: 'frxGBPUSD', tv: 'OANDA:GBPUSD',       name: 'GBP/USD',                category: 'Forex',                 pipSize: 5 },
  { id: 'frxUSDJPY', deriv: 'frxUSDJPY', tv: 'OANDA:USDJPY',       name: 'USD/JPY',                category: 'Forex',                 pipSize: 3 },
  { id: 'frxUSDCHF', deriv: 'frxUSDCHF', tv: 'OANDA:USDCHF',       name: 'USD/CHF',                category: 'Forex',                 pipSize: 5 },
  { id: 'frxAUDUSD', deriv: 'frxAUDUSD', tv: 'OANDA:AUDUSD',       name: 'AUD/USD',                category: 'Forex',                 pipSize: 5 },
  { id: 'frxNZDUSD', deriv: 'frxNZDUSD', tv: 'OANDA:NZDUSD',       name: 'NZD/USD',                category: 'Forex',                 pipSize: 5 },
  { id: 'frxUSDCAD', deriv: 'frxUSDCAD', tv: 'OANDA:USDCAD',       name: 'USD/CAD',                category: 'Forex',                 pipSize: 5 },
  { id: 'frxEURGBP', deriv: 'frxEURGBP', tv: 'OANDA:EURGBP',       name: 'EUR/GBP',                category: 'Forex',                 pipSize: 5 },
  { id: 'frxEURJPY', deriv: 'frxEURJPY', tv: 'OANDA:EURJPY',       name: 'EUR/JPY',                category: 'Forex',                 pipSize: 3 },
  { id: 'frxGBPJPY', deriv: 'frxGBPJPY', tv: 'OANDA:GBPJPY',       name: 'GBP/JPY',                category: 'Forex',                 pipSize: 3 },
  { id: 'frxAUDJPY', deriv: 'frxAUDJPY', tv: 'OANDA:AUDJPY',       name: 'AUD/JPY',                category: 'Forex',                 pipSize: 3 },
  { id: 'frxEURAUD', deriv: 'frxEURAUD', tv: 'OANDA:EURAUD',       name: 'EUR/AUD',                category: 'Forex',                 pipSize: 5 },
  { id: 'frxEURCAD', deriv: 'frxEURCAD', tv: 'OANDA:EURCAD',       name: 'EUR/CAD',                category: 'Forex',                 pipSize: 5 },
  { id: 'frxEURCHF', deriv: 'frxEURCHF', tv: 'OANDA:EURCHF',       name: 'EUR/CHF',                category: 'Forex',                 pipSize: 5 },
  { id: 'frxGBPCHF', deriv: 'frxGBPCHF', tv: 'OANDA:GBPCHF',       name: 'GBP/CHF',                category: 'Forex',                 pipSize: 5 },
  { id: 'frxGBPAUD', deriv: 'frxGBPAUD', tv: 'OANDA:GBPAUD',       name: 'GBP/AUD',                category: 'Forex',                 pipSize: 5 },
  { id: 'frxGBPCAD', deriv: 'frxGBPCAD', tv: 'OANDA:GBPCAD',       name: 'GBP/CAD',                category: 'Forex',                 pipSize: 5 },
  { id: 'frxXAUUSD', deriv: 'frxXAUUSD', tv: 'OANDA:XAUUSD',       name: 'Gold',                   category: 'Commodities',           pipSize: 2 },
  { id: 'frxXAGUSD', deriv: 'frxXAGUSD', tv: 'OANDA:XAGUSD',       name: 'Silver',                 category: 'Commodities',           pipSize: 3 },
]

// ─── In-Memory Storage ──────────────────────────────────────────────
const symbolDataMap = new Map<string, SymbolData>()
const MAX_TICKS = 500
const ANALYSIS_WINDOW = 100

// ─── Helpers ────────────────────────────────────────────────────────
function getLastDigit(price: number, pipSize: number = 2): number {
  // Use toFixed with pipSize to get the correct number of decimal places
  // e.g. 100.56 with pipSize=2 → "100.56" → last char '6' → returns 6
  // e.g. 1.05623 with pipSize=5 → "1.05623" → last char '3' → returns 3
  const str = price.toFixed(pipSize)
  return parseInt(str[str.length - 1]) || 0
}

function initSymbolData(id: string, cfg: typeof DERIV_SYMBOLS[0], initialPrice?: number): SymbolData {
  if (symbolDataMap.has(id)) return symbolDataMap.get(id)!
  const data: SymbolData = {
    symbol: cfg.deriv, tvSymbol: cfg.tv, name: cfg.name, category: cfg.category,
    pipSize: cfg.pipSize, ticks: [],
    currentPrice: initialPrice || 0, prevPrice: initialPrice || 0,
    highPrice: initialPrice || 0, lowPrice: initialPrice ? initialPrice : Infinity,
    priceChange: 0, priceChangePercent: 0, tickSpeed: 0,
    lastDigit: 0, digitCounts: new Array(10).fill(0), digitPercentages: new Array(10).fill(0),
    evenCount: 0, oddCount: 0,
    streakType: '', streakLength: 0, lastTickTime: 0,
  }
  if (initialPrice) {
    data.lastDigit = getLastDigit(initialPrice, cfg.pipSize)
    data.highPrice = initialPrice
    data.lowPrice = initialPrice
  }
  symbolDataMap.set(id, data)
  return data
}

function addTick(id: string, price: number, timestamp: number): void {
  const data = symbolDataMap.get(id)
  if (!data) return
  const lastDigit = getLastDigit(price, data.pipSize)
  data.prevPrice = data.currentPrice
  data.currentPrice = price
  data.lastDigit = lastDigit
  data.lastTickTime = timestamp
  if (data.ticks.length > 0 && data.ticks[data.ticks.length - 1].price === price) return
  data.ticks.push({ price, timestamp, lastDigit })
  if (data.ticks.length > MAX_TICKS) data.ticks = data.ticks.slice(-MAX_TICKS)
  const window = data.ticks.slice(-ANALYSIS_WINDOW)
  data.digitCounts = new Array(10).fill(0)
  data.evenCount = 0; data.oddCount = 0
  data.highPrice = -Infinity; data.lowPrice = Infinity
  for (const t of window) {
    data.digitCounts[t.lastDigit]++
    if (t.lastDigit % 2 === 0) data.evenCount++; else data.oddCount++
    if (t.price > data.highPrice) data.highPrice = t.price
    if (t.price < data.lowPrice) data.lowPrice = t.price
  }
  const total = window.length
  data.digitPercentages = data.digitCounts.map(c => parseFloat(((c / total) * 100).toFixed(1)))
  if (window.length >= 2) {
    data.priceChange = parseFloat((price - window[0].price).toFixed(6))
    data.priceChangePercent = parseFloat(((data.priceChange / window[0].price) * 100).toFixed(4))
  }
  if (window.length >= 2) {
    const timeSpan = (window[window.length - 1].timestamp - window[0].timestamp) / 1000
    data.tickSpeed = timeSpan > 0 ? parseFloat((window.length / timeSpan).toFixed(2)) : 0
  }
  let streakType = lastDigit % 2 === 0 ? 'even' : 'odd'
  let streakLen = 1
  for (let i = window.length - 2; i >= 0; i--) {
    const tType = window[i].lastDigit % 2 === 0 ? 'even' : 'odd'
    if (tType === streakType) streakLen++; else break
  }
  data.streakType = streakType; data.streakLength = streakLen
}

// ─── Public Data Access ──────────────────────────────────────────────
export function getDigitAnalysis(id: string, barrier: number = 4): DigitAnalysis | null {
  const data = symbolDataMap.get(id)
  if (!data) return null
  const window = data.ticks.slice(-ANALYSIS_WINDOW)
  const total = window.length
  let oCount = 0, uCount = 0
  for (const t of window) { if (t.lastDigit > barrier) oCount++; else uCount++ }
  return {
    symbol: data.symbol, tvSymbol: data.tvSymbol, name: data.name, category: data.category,
    currentPrice: data.currentPrice, lastDigit: data.lastDigit,
    digitCounts: [...data.digitCounts], digitPercentages: [...data.digitPercentages],
    evenCount: data.evenCount, oddCount: data.oddCount,
    evenPercent: total > 0 ? parseFloat(((data.evenCount / total) * 100).toFixed(1)) : 0,
    oddPercent: total > 0 ? parseFloat(((data.oddCount / total) * 100).toFixed(1)) : 0,
    overCount: oCount, underCount: uCount,
    overPercent: total > 0 ? parseFloat(((oCount / total) * 100).toFixed(1)) : 0,
    underPercent: total > 0 ? parseFloat(((uCount / total) * 100).toFixed(1)) : 0,
    streakType: data.streakType, streakLength: data.streakLength,
    highPrice: data.highPrice, lowPrice: data.lowPrice,
    priceChange: data.priceChange, priceChangePercent: data.priceChangePercent,
    tickSpeed: data.tickSpeed,
    recentTicks: data.ticks.slice(-25).map(t => ({ price: t.price, timestamp: t.timestamp, lastDigit: t.lastDigit })),
    totalTicks: data.ticks.length, pipSize: data.pipSize,
  }
}

export function getPrice(id: string): { price: number; lastDigit: number; name: string; tvSymbol: string } | null {
  const data = symbolDataMap.get(id)
  if (!data || data.currentPrice === 0) return null
  return { price: data.currentPrice, lastDigit: data.lastDigit, name: data.name, tvSymbol: data.tvSymbol }
}

export function getAllPrices(): Array<{
  symbol: string; name: string; category: string; price: number;
  change: number; changePercent: number; lastDigit: number; tickSpeed: number;
}> {
  const prices: Array<{
    symbol: string; name: string; category: string; price: number;
    change: number; changePercent: number; lastDigit: number; tickSpeed: number;
  }> = []
  for (const [id, data] of symbolDataMap) {
    if (data.currentPrice > 0) {
      prices.push({
        symbol: id, name: data.name, category: data.category,
        price: data.currentPrice, change: data.priceChange,
        changePercent: data.priceChangePercent,
        lastDigit: data.lastDigit, tickSpeed: data.tickSpeed,
      })
    }
  }
  return prices
}

export function getHealth() {
  return {
    status: 'ok',
    symbols: symbolDataMap.size,
    derivConnected: derivWs ? derivWs.readyState === WebSocket.OPEN : false,
    startTime: startTime,
    uptime: process.uptime(),
  }
}

// ─── Symbol Resolution ───────────────────────────────────────────────
export function resolveSymbol(input: string): string | null {
  // Try id, deriv, or tv format
  const cfg = DERIV_SYMBOLS.find(s => s.id === input || s.deriv === input || s.tv === input)
  return cfg ? cfg.id : null
}

export function getSymbolConfig(id: string) {
  return DERIV_SYMBOLS.find(s => s.id === id || s.deriv === id || s.tv === id) || null
}

export { DERIV_SYMBOLS }

// ─── Prediction Engine ──────────────────────────────────────────────
export interface Prediction {
  symbol: string
  marketType: string
  prediction: string
  confidence: number
  probability: number
  lastDigit: number
  recentDigits: number[]
  tickCount: number
  streakInfo: string
  reasoning: string
  timestamp: string
}

export function getPrediction(id: string, marketType: string, barrier: number = 4, differsDigit?: number, windowSize: number = 5): Prediction | null {
  const data = symbolDataMap.get(id)
  if (!data || data.ticks.length < 3) return null

  const recent = data.ticks.slice(-windowSize)
  if (recent.length < 3) return null

  const lastDigit = data.lastDigit
  const digits = recent.map(t => t.lastDigit)
  const n = digits.length

  // Compute streak
  let streakType = lastDigit % 2 === 0 ? 'even' : 'odd'
  let streakLen = 1
  for (let i = recent.length - 2; i >= 0; i--) {
    const t = recent[i].lastDigit % 2 === 0 ? 'even' : 'odd'
    if (t === streakType) streakLen++; else break
  }
  const streakInfo = `${streakLen} consecutive ${streakType}`

  let prediction = ''
  let confidence = 50
  let probability = 50
  let reasoning = ''

  if (marketType === 'even_odd') {
    const evenCount = digits.filter(d => d % 2 === 0).length
    const oddCount = n - evenCount

    if (evenCount > oddCount) {
      prediction = 'Odd'
      confidence = Math.min(50 + evenCount * 7, 88)
      probability = Math.min(55 + evenCount * 5, 82)
      reasoning = `Last ${n} ticks: ${evenCount} even, ${oddCount} odd. ${streakLen}-${streakType} streak. Predicting regression to odd.`
    } else if (oddCount > evenCount) {
      prediction = 'Even'
      confidence = Math.min(50 + oddCount * 7, 88)
      probability = Math.min(55 + oddCount * 5, 82)
      reasoning = `Last ${n} ticks: ${evenCount} even, ${oddCount} odd. ${streakLen}-${streakType} streak. Predicting regression to even.`
    } else {
      prediction = evenCount >= oddCount ? 'Even' : 'Odd'
      confidence = 52
      probability = 52
      reasoning = `Last ${n} ticks balanced (${evenCount} even, ${oddCount} odd). Weak ${prediction.toLowerCase()} signal.`
    }

    // Adjust for long streaks
    if (streakLen >= 3) {
      const breakPrediction = streakType === 'even' ? 'Odd' : 'Even'
      prediction = breakPrediction
      confidence = Math.min(confidence + streakLen * 5, 92)
      probability = Math.min(probability + streakLen * 3, 85)
      reasoning += ` Streak break likely after ${streakLen} consecutive.`
    }
  }

  else if (marketType === 'differs') {
    const target = differsDigit ?? lastDigit
    const matchCount = digits.filter(d => d === target).length

    if (matchCount >= 2) {
      prediction = 'Differs'
      confidence = Math.min(60 + matchCount * 8, 90)
      probability = Math.min(65 + matchCount * 5, 88)
      reasoning = `Digit ${target} appeared ${matchCount}/${n} times recently. Regression suggests it will differ next.`
    } else if (matchCount === 0) {
      prediction = 'Differs'
      confidence = Math.min(72, 82)
      probability = 78
      reasoning = `Digit ${target} hasn't appeared in last ${n} ticks. High probability it will differ.`
    } else {
      prediction = 'Differs'
      confidence = 55
      probability = 55
      reasoning = `Digit ${target} appeared ${matchCount}/${n} times. Slight edge for differs.`
    }
  }

  else if (marketType === 'matches') {
    const target = differsDigit ?? lastDigit
    const matchCount = digits.filter(d => d === target).length

    if (matchCount >= 2) {
      prediction = 'Matches'
      confidence = Math.min(45 + matchCount * 8, 78)
      probability = Math.min(40 + matchCount * 6, 72)
      reasoning = `Digit ${target} is hot — appeared ${matchCount}/${n} times. May match again.`
    } else if (matchCount === 1) {
      prediction = 'Matches'
      confidence = 35
      probability = 30
      reasoning = `Digit ${target} appeared once in last ${n} ticks. Low match probability.`
    } else {
      prediction = 'Matches'
      confidence = 22
      probability = 18
      reasoning = `Digit ${target} hasn't appeared in last ${n} ticks. Unlikely to match.`
    }
  }

  else if (marketType === 'over_under') {
    const overCount = digits.filter(d => d > barrier).length
    const underCount = n - overCount

    if (overCount > underCount) {
      prediction = 'Under'
      confidence = Math.min(50 + overCount * 7, 88)
      probability = Math.min(55 + overCount * 5, 82)
      reasoning = `Last ${n} ticks: ${overCount} over ${barrier}, ${underCount} under. Regression predicts under.`
    } else if (underCount > overCount) {
      prediction = 'Over'
      confidence = Math.min(50 + underCount * 7, 88)
      probability = Math.min(55 + underCount * 5, 82)
      reasoning = `Last ${n} ticks: ${overCount} over ${barrier}, ${underCount} under. Regression predicts over.`
    } else {
      prediction = overCount >= underCount ? 'Over' : 'Under'
      confidence = 52
      probability = 52
      reasoning = `Last ${n} ticks balanced around ${barrier}. Weak signal.`
    }

    // Adjust for digit streaks near barrier
    if (streakLen >= 3) {
      const lastDigits = digits.slice(-3)
      const allOver = lastDigits.every(d => d > barrier)
      const allUnder = lastDigits.every(d => d <= barrier)
      if (allOver || allUnder) {
        const breakPred = allOver ? 'Under' : 'Over'
        prediction = breakPred
        confidence = Math.min(confidence + streakLen * 4, 90)
        reasoning += ` Streak break expected.`
      }
    }
  }

  return {
    symbol: data.symbol,
    marketType,
    prediction,
    confidence: parseFloat(confidence.toFixed(1)),
    probability: parseFloat(probability.toFixed(1)),
    lastDigit,
    recentDigits: digits,
    tickCount: n,
    streakInfo,
    reasoning,
    timestamp: new Date().toISOString(),
  }
}

// ─── WebSocket Connection ───────────────────────────────────────────
const DERIV_APP_ID = 1089
const DERIV_WS_URL = `wss://ws.derivws.com/websockets/v3?app_id=${DERIV_APP_ID}`
let derivWs: any = null
let initialized = false
let startTime = Date.now()

export function initDerivTicks(): void {
  if (initialized) return
  initialized = true
  startTime = Date.now()

  // Initialize symbol data structures
  for (const cfg of DERIV_SYMBOLS) {
    initSymbolData(cfg.id, cfg)
  }

  connectDeriv()
}

function connectDeriv(): void {
  try {
    // Use native WebSocket (Node 18+, Deno, Bun, Cloudflare Workers all support it)
    // This avoids the need for the 'ws' npm package which isn't bundled in standalone builds
    derivWs = new WebSocket(DERIV_WS_URL)

    derivWs.onopen = () => {
      // Subscribe to all symbols
      for (const sym of DERIV_SYMBOLS) {
        derivWs!.send(JSON.stringify({ ticks: sym.deriv, subscribe: 1 }))
      }
      // Request tick history after delay
      setTimeout(() => {
        if (!derivWs || derivWs.readyState !== WebSocket.OPEN) return
        for (const sym of DERIV_SYMBOLS) {
          derivWs!.send(JSON.stringify({
            ticks_history: sym.deriv,
            count: 100,
            end: 'latest',
            style: 'ticks',
          }))
        }
      }, 2000)
    }

    derivWs.onmessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(typeof event.data === 'string' ? event.data : (event.data as any).toString())
        if (!msg) return

        if (msg.tick) {
          const tick = msg.tick
          const symbol = tick.symbol
          const price = tick.quote
          const epoch = tick.epoch * 1000
          if (!symbolDataMap.has(symbol)) {
            const cfg = DERIV_SYMBOLS.find(s => s.deriv === symbol)
            if (cfg) initSymbolData(cfg.id, cfg, price)
          }
          addTick(symbol, price, epoch)
        }

        if (msg.history) {
          const symbol = msg.echo_req?.ticks_history
          if (!symbol) return
          if (!symbolDataMap.has(symbol)) {
            const cfg = DERIV_SYMBOLS.find(s => s.deriv === symbol)
            if (cfg) initSymbolData(cfg.id, cfg)
          }
          const prices: Array<[number, number]> = msg.history?.prices || []
          const times: number[] = msg.history?.times || []
          for (let i = 0; i < Math.min(prices.length, times.length); i++) {
            if (prices[i] !== undefined && times[i] !== undefined) {
              addTick(symbol, prices[i], times[i] * 1000)
            }
          }
        }

        // Ignore errors silently
      } catch {
        // Skip unparseable messages
      }
    }

    derivWs.onclose = () => {
      // Reconnect after delay
      setTimeout(connectDeriv, 3000)
    }

    derivWs.onerror = () => {
      // Connection error will trigger close event
    }
  } catch {
    // Retry after delay
    setTimeout(connectDeriv, 5000)
  }
}
