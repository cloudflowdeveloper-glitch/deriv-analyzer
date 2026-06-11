import { createServer } from 'http'
import { URL } from 'url'
import WebSocket from 'ws'

const PORT = 3004
const DERIV_APP_ID = 1089
const DERIV_WS_URL = `wss://ws.derivws.com/websockets/v3?app_id=${DERIV_APP_ID}`

// Types
interface Tick { price: number; timestamp: number; lastDigit: number }

interface SymbolData {
  symbol: string; tvSymbol: string; name: string; category: string
  pipSize: number; ticks: Tick[]
  currentPrice: number; prevPrice: number; highPrice: number; lowPrice: number
  priceChange: number; priceChangePercent: number; tickSpeed: number
  lastDigit: number; digitCounts: number[]; digitPercentages: number[]
  evenCount: number; oddCount: number; overCount: number; underCount: number
  streakType: string; streakLength: number; lastTickTime: number
}

interface DigitAnalysis {
  symbol: string; tvSymbol: string; name: string; category: string
  currentPrice: number; lastDigit: number; digitCounts: number[]; digitPercentages: number[]
  evenCount: number; oddCount: number; evenPercent: number; oddPercent: number
  overCount: number; underCount: number; overPercent: number; underPercent: number
  streakType: string; streakLength: number; highPrice: number; lowPrice: number
  priceChange: number; priceChangePercent: number; tickSpeed: number
  recentTicks: Array<{ price: number; timestamp: number; lastDigit: number }>
  totalTicks: number; pipSize: number
}

interface Prediction {
  symbol: string
  marketType: string
  prediction: string        // e.g., "Even", "Odd", "Differs", "Matches", "Over", "Under"
  confidence: number        // 0-100
  probability: number       // 0-100
  lastDigit: number
  recentDigits: number[]    // last 5 digits used for prediction
  tickCount: number         // how many ticks used
  streakInfo: string        // streak description
  reasoning: string         // why this prediction
  timestamp: string
}

const DERIV_SYMBOLS = [
  { id: 'R_10',      deriv: 'R_10',      tv: 'DERIV:R_10',      name: 'Volatility 10 Index',     category: 'Synthetic Indices', pipSize: 2 },
  { id: 'R_25',      deriv: 'R_25',      tv: 'DERIV:R_25',      name: 'Volatility 25 Index',     category: 'Synthetic Indices', pipSize: 2 },
  { id: 'R_50',      deriv: 'R_50',      tv: 'DERIV:R_50',      name: 'Volatility 50 Index',     category: 'Synthetic Indices', pipSize: 2 },
  { id: 'R_75',      deriv: 'R_75',      tv: 'DERIV:R_75',      name: 'Volatility 75 Index',     category: 'Synthetic Indices', pipSize: 2 },
  { id: 'R_100',     deriv: 'R_100',     tv: 'DERIV:R_100',     name: 'Volatility 100 Index',    category: 'Synthetic Indices', pipSize: 2 },
  { id: '1HZ10V',    deriv: '1HZ10V',    tv: 'DERIV:1HZ10V',    name: 'Volatility 10 (1s)',       category: '1-Second Indices', pipSize: 2 },
  { id: '1HZ25V',    deriv: '1HZ25V',    tv: 'DERIV:1HZ25V',    name: 'Volatility 25 (1s)',       category: '1-Second Indices', pipSize: 2 },
  { id: '1HZ50V',    deriv: '1HZ50V',    tv: 'DERIV:1HZ50V',    name: 'Volatility 50 (1s)',       category: '1-Second Indices', pipSize: 2 },
  { id: '1HZ75V',    deriv: '1HZ75V',    tv: 'DERIV:1HZ75V',    name: 'Volatility 75 (1s)',       category: '1-Second Indices', pipSize: 2 },
  { id: '1HZ100V',   deriv: '1HZ100V',   tv: 'DERIV:1HZ100V',   name: 'Volatility 100 (1s)',      category: '1-Second Indices', pipSize: 2 },
  { id: 'CRASH300N',  deriv: 'CRASH300N',  tv: 'DERIV:CRASH300N',  name: 'Crash 300 Index',         category: 'Crash/Boom',           pipSize: 2 },
  { id: 'BOOM300N',   deriv: 'BOOM300N',   tv: 'DERIV:BOOM300N',   name: 'Boom 300 Index',          category: 'Crash/Boom',           pipSize: 2 },
  { id: 'stpRNG',    deriv: 'stpRNG',    tv: 'DERIV:stpRNG',    name: 'Step Index',              category: 'Step Indices',         pipSize: 2 },
  { id: 'JD10',      deriv: 'JD10',      tv: 'DERIV:JD10',      name: 'Jump 10 Index',           category: 'Jump Indices',         pipSize: 2 },
  { id: 'JD25',      deriv: 'JD25',      tv: 'DERIV:JD25',      name: 'Jump 25 Index',           category: 'Jump Indices',         pipSize: 2 },
  { id: 'JD50',      deriv: 'JD50',      tv: 'DERIV:JD50',      name: 'Jump 50 Index',           category: 'Jump Indices',         pipSize: 2 },
  { id: 'JD75',      deriv: 'JD75',      tv: 'DERIV:JD75',      name: 'Jump 75 Index',           category: 'Jump Indices',         pipSize: 2 },
  { id: 'JD100',     deriv: 'JD100',     tv: 'DERIV:JD100',     name: 'Jump 100 Index',          category: 'Jump Indices',         pipSize: 2 },
  { id: 'frxEURUSD', deriv: 'frxEURUSD', tv: 'FX:EURUSD',       name: 'EUR/USD',                category: 'Forex',                 pipSize: 5 },
  { id: 'frxGBPUSD', deriv: 'frxGBPUSD', tv: 'FX:GBPUSD',       name: 'GBP/USD',                category: 'Forex',                 pipSize: 5 },
  { id: 'frxUSDJPY', deriv: 'frxUSDJPY', tv: 'FX:USDJPY',       name: 'USD/JPY',                category: 'Forex',                 pipSize: 3 },
  { id: 'frxUSDCHF', deriv: 'frxUSDCHF', tv: 'FX:USDCHF',       name: 'USD/CHF',                category: 'Forex',                 pipSize: 5 },
  { id: 'frxAUDUSD', deriv: 'frxAUDUSD', tv: 'FX:AUDUSD',       name: 'AUD/USD',                category: 'Forex',                 pipSize: 5 },
  { id: 'frxNZDUSD', deriv: 'frxNZDUSD', tv: 'FX:NZDUSD',       name: 'NZD/USD',                category: 'Forex',                 pipSize: 5 },
  { id: 'frxUSDCAD', deriv: 'frxUSDCAD', tv: 'FX:USDCAD',       name: 'USD/CAD',                category: 'Forex',                 pipSize: 5 },
  { id: 'frxEURGBP', deriv: 'frxEURGBP', tv: 'FX:EURGBP',       name: 'EUR/GBP',                category: 'Forex',                 pipSize: 5 },
  { id: 'frxEURJPY', deriv: 'frxEURJPY', tv: 'FX:EURJPY',       name: 'EUR/JPY',                category: 'Forex',                 pipSize: 3 },
  { id: 'frxGBPJPY', deriv: 'frxGBPJPY', tv: 'FX:GBPJPY',       name: 'GBP/JPY',                category: 'Forex',                 pipSize: 3 },
  { id: 'frxAUDJPY', deriv: 'frxAUDJPY', tv: 'FX:AUDJPY',       name: 'AUD/JPY',                category: 'Forex',                 pipSize: 3 },
  { id: 'frxEURAUD', deriv: 'frxEURAUD', tv: 'FX:EURAUD',       name: 'EUR/AUD',                category: 'Forex',                 pipSize: 5 },
  { id: 'frxEURCAD', deriv: 'frxEURCAD', tv: 'FX:EURCAD',       name: 'EUR/CAD',                category: 'Forex',                 pipSize: 5 },
  { id: 'frxEURCHF', deriv: 'frxEURCHF', tv: 'FX:EURCHF',       name: 'EUR/CHF',                category: 'Forex',                 pipSize: 5 },
  { id: 'frxGBPCHF', deriv: 'frxGBPCHF', tv: 'FX:GBPCHF',       name: 'GBP/CHF',                category: 'Forex',                 pipSize: 5 },
  { id: 'frxGBPAUD', deriv: 'frxGBPAUD', tv: 'FX:GBPAUD',       name: 'GBP/AUD',                category: 'Forex',                 pipSize: 5 },
  { id: 'frxGBPCAD', deriv: 'frxGBPCAD', tv: 'FX:GBPCAD',       name: 'GBP/CAD',                category: 'Forex',                 pipSize: 5 },
  { id: 'frxXAUUSD', deriv: 'frxXAUUSD', tv: 'FX:XAUUSD',       name: 'Gold',                   category: 'Commodities',           pipSize: 2 },
  { id: 'frxXAGUSD', deriv: 'frxXAGUSD', tv: 'FX:XAGUSD',       name: 'Silver',                 category: 'Commodities',           pipSize: 3 },
]

const symbolDataMap = new Map<string, SymbolData>()
const MAX_TICKS = 500
const ANALYSIS_WINDOW = 100

function getLastDigit(price: number): number {
  return Math.abs(Math.floor(price)) % 10
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
    evenCount: 50, oddCount: 50, overCount: 50, underCount: 50,
    streakType: '', streakLength: 0, lastTickTime: 0,
  }
  if (initialPrice) {
    data.lastDigit = getLastDigit(initialPrice)
    data.highPrice = initialPrice
    data.lowPrice = initialPrice
  }
  symbolDataMap.set(id, data)
  return data
}

function addTick(id: string, price: number, timestamp: number): void {
  const data = symbolDataMap.get(id)
  if (!data) return
  const lastDigit = getLastDigit(price)
  data.prevPrice = data.currentPrice
  data.currentPrice = price
  data.lastDigit = lastDigit
  data.lastTickTime = timestamp
  if (data.ticks.length > 0 && data.ticks[data.ticks.length - 1].price === price) return
  data.ticks.push({ price, timestamp, lastDigit })
  if (data.ticks.length > MAX_TICKS) data.ticks = data.ticks.slice(-MAX_TICKS)
  const window = data.ticks.slice(-ANALYSIS_WINDOW)
  data.digitCounts = new Array(10).fill(0)
  data.evenCount = 0; data.oddCount = 0; data.overCount = 0; data.underCount = 0
  data.highPrice = -Infinity; data.lowPrice = Infinity
  for (const t of window) {
    data.digitCounts[t.lastDigit]++
    if (t.lastDigit % 2 === 0) data.evenCount++; else data.oddCount++
    if (t.lastDigit > 4) data.overCount++; else data.underCount++
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

function getDigitAnalysis(id: string, barrier: number = 4, windowSize?: number): DigitAnalysis | null {
  const data = symbolDataMap.get(id)
  if (!data) return null
  const winSize = windowSize || ANALYSIS_WINDOW
  const window = data.ticks.slice(-winSize)
  const total = window.length
  if (total === 0) return null
  let oCount = 0, uCount = 0
  for (const t of window) { if (t.lastDigit > barrier) oCount++; else uCount++ }
  return {
    symbol: data.symbol, tvSymbol: data.tvSymbol, name: data.name, category: data.category,
    currentPrice: data.currentPrice, lastDigit: data.lastDigit,
    digitCounts: data.digitCounts, digitPercentages: data.digitPercentages,
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

// ─── PREDICTION ENGINE ─────────────────────────────────────────────
function generatePrediction(id: string, marketType: string, barrier: number = 4, differsDigit?: number, windowSize: number = 5): Prediction | null {
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

    // Regression to mean: predict the less frequent one
    if (evenCount > oddCount) {
      prediction = 'Odd'
      confidence = Math.min(50 + evenCount * 7, 88)
      probability = Math.min(55 + evenCount * 5, 82)
      reasoning = `Last ${n} ticks: ${evenCount} even, ${oddCount} odd. ${streakLen}-${streakType} streak. Predicting regression to ${prediction.toLowerCase()}.`
    } else if (oddCount > evenCount) {
      prediction = 'Even'
      confidence = Math.min(50 + oddCount * 7, 88)
      probability = Math.min(55 + oddCount * 5, 82)
      reasoning = `Last ${n} ticks: ${evenCount} even, ${oddCount} odd. ${streakLen}-${streakType} streak. Predicting regression to ${prediction.toLowerCase()}.`
    } else {
      prediction = evenCount >= oddCount ? 'Even' : 'Odd'
      confidence = 52
      probability = 52
      reasoning = `Last ${n} ticks are balanced (${evenCount} even, ${oddCount} odd). Weak ${prediction.toLowerCase()} signal.`
    }

    // Adjust for streaks: long streaks increase confidence for break
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
      // Target digit appeared often — regression says it'll differ
      prediction = 'Differs'
      confidence = Math.min(60 + matchCount * 8, 90)
      probability = Math.min(65 + matchCount * 5, 88)
      reasoning = `Digit ${target} appeared ${matchCount}/${n} times recently. Regression suggests it will differ next.`
    } else {
      prediction = 'Differs'
      confidence = 55
      probability = 55
      reasoning = `Digit ${target} appeared ${matchCount}/${n} times. Slight edge for differs.`
    }

    // Also provide a "matches" assessment
    if (matchCount === 0) {
      prediction = 'Differs'
      confidence = Math.min(70, 82)
      probability = 78
      reasoning = `Digit ${target} hasn't appeared in last ${n} ticks. High probability it will differ.`
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

// Deriv WebSocket
let derivWs: WebSocket | null = null
let reconnectDelay = 1000

function connectDeriv(): void {
  console.log(`[Deriv] Connecting...`)
  try {
    derivWs = new WebSocket(DERIV_WS_URL)
    derivWs.on('open', () => {
      console.log('[Deriv] Connected!')
      reconnectDelay = 1000
      for (const sym of DERIV_SYMBOLS) initSymbolData(sym.id, sym)
      for (const sym of DERIV_SYMBOLS) derivWs!.send(JSON.stringify({ ticks: sym.deriv, subscribe: 1 }))
      console.log(`[Deriv] Subscribed to ${DERIV_SYMBOLS.length} symbols`)
      setTimeout(() => {
        if (!derivWs || derivWs.readyState !== WebSocket.OPEN) return
        for (const sym of DERIV_SYMBOLS) {
          derivWs!.send(JSON.stringify({ ticks_history: sym.deriv, count: 100, end: 'latest', style: 'ticks' }))
        }
        console.log(`[Deriv] Requested history for ${DERIV_SYMBOLS.length} symbols`)
      }, 2000)
    })
    derivWs.on('message', (raw: Buffer | string) => {
      try {
        const msg = JSON.parse(raw.toString())
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
          for (let i = 0; i < prices.length; i++) {
            if (prices[i] !== undefined && times[i] !== undefined) addTick(symbol, prices[i], times[i] * 1000)
          }
        }
        if (msg.error) {
          // Ignore subscription errors
        }
      } catch { /* skip */ }
    })
    derivWs.on('close', () => {
      console.log('[Deriv] Disconnected. Reconnecting...')
      setTimeout(connectDeriv, reconnectDelay)
      reconnectDelay = Math.min(reconnectDelay * 2, 30000)
    })
    derivWs.on('error', (err) => {
      console.error('[Deriv] Error:', err.message)
    })
  } catch (err) {
    console.error('[Deriv] Connection error:', err)
    setTimeout(connectDeriv, reconnectDelay)
    reconnectDelay = Math.min(reconnectDelay * 2, 30000)
  }
}

// Keep alive
const keepAliveInterval = setInterval(() => {
  if (derivWs && derivWs.readyState === WebSocket.OPEN) {
    derivWs.ping()
  }
}, 15000)

// HTTP Server
const httpServer = createServer((req, res) => {
  const parsedUrl = new URL(req.url || '/', `http://localhost:${PORT}`)
  const pathname = parsedUrl.pathname
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }
  if (req.method === 'GET') {
    if (pathname === '/api/price') {
      const symbol = parsedUrl.searchParams.get('symbol') || ''
      const config = DERIV_SYMBOLS.find(s => s.id === symbol || s.deriv === symbol || s.tv === symbol)
      const data = symbolDataMap.get(config?.id || symbol)
      if (data) {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          symbol: data.tvSymbol, derivSymbol: data.symbol, name: data.name,
          price: data.currentPrice, prevPrice: data.prevPrice,
          change: data.priceChange, changePercent: data.priceChangePercent,
          high: data.highPrice, low: data.lowPrice,
          lastDigit: data.lastDigit, tickSpeed: data.tickSpeed,
          totalTicks: data.ticks.length, source: 'deriv', pipSize: data.pipSize,
          timestamp: new Date().toISOString(),
        }))
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Symbol not found', symbol }))
      }
      return
    }
    if (pathname === '/api/ticks') {
      const symbol = parsedUrl.searchParams.get('symbol') || ''
      const limit = parseInt(parsedUrl.searchParams.get('limit') || '100')
      const config = DERIV_SYMBOLS.find(s => s.id === symbol || s.deriv === symbol || s.tv === symbol)
      const data = symbolDataMap.get(config?.id || symbol)
      if (data) {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ symbol: data.tvSymbol, ticks: data.ticks.slice(-limit), count: data.ticks.length }))
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Symbol not found', symbol }))
      }
      return
    }
    if (pathname === '/api/digits') {
      const symbol = parsedUrl.searchParams.get('symbol') || ''
      const barrier = parseInt(parsedUrl.searchParams.get('barrier') || '4')
      const windowSize = parseInt(parsedUrl.searchParams.get('window') || String(ANALYSIS_WINDOW))
      const config = DERIV_SYMBOLS.find(s => s.id === symbol || s.deriv === symbol || s.tv === symbol)
      const analysis = getDigitAnalysis(config?.id || symbol, barrier, windowSize)
      if (analysis) {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(analysis))
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Symbol not found', symbol }))
      }
      return
    }
    // ─── PREDICTION ENDPOINT ──────────────────────────────────────
    if (pathname === '/api/predict') {
      const symbol = parsedUrl.searchParams.get('symbol') || ''
      const marketType = parsedUrl.searchParams.get('marketType') || 'even_odd'
      const barrier = parseInt(parsedUrl.searchParams.get('barrier') || '4')
      const differsDigit = parsedUrl.searchParams.has('differsDigit')
        ? parseInt(parsedUrl.searchParams.get('differsDigit')!) : undefined
      const windowSize = parseInt(parsedUrl.searchParams.get('window') || '5')
      const config = DERIV_SYMBOLS.find(s => s.id === symbol || s.deriv === symbol || s.tv === symbol)
      const prediction = generatePrediction(config?.id || symbol, marketType, barrier, differsDigit, windowSize)
      if (prediction) {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(prediction))
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Insufficient data', symbol }))
      }
      return
    }
    if (pathname === '/api/all-prices') {
      const prices: any[] = []
      for (const [id, data] of symbolDataMap) {
        if (data.currentPrice > 0) {
          prices.push({
            symbol: id, name: data.name, category: data.category,
            price: data.currentPrice, change: data.priceChange, changePercent: data.priceChangePercent,
            lastDigit: data.lastDigit, source: 'deriv', tickSpeed: data.tickSpeed,
          })
        }
      }
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ prices, total: prices.length, timestamp: new Date().toISOString() }))
      return
    }
    if (pathname === '/api/symbols') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        symbols: DERIV_SYMBOLS.map(s => ({ id: s.id, deriv: s.deriv, tv: s.tv, name: s.name, category: s.category, pipSize: s.pipSize })),
        total: DERIV_SYMBOLS.length,
      }))
      return
    }
    if (pathname === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        status: 'ok', symbols: symbolDataMap.size,
        derivConnected: derivWs?.readyState === WebSocket.OPEN,
        uptime: process.uptime(), timestamp: new Date().toISOString(),
      }))
      return
    }
  }
  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not found' }))
})

process.on('uncaughtException', (err) => {
  console.error('[TickFeed] Uncaught:', err.message || err)
})
process.on('unhandledRejection', (reason) => {
  console.error('[TickFeed] Unhandled:', reason)
})

console.log('[TickFeed] Starting...')
connectDeriv()
httpServer.listen(PORT, () => {
  console.log(`[TickFeed] Running on port ${PORT} (${DERIV_SYMBOLS.length} symbols)`)
})

process.on('SIGTERM', () => { if (derivWs) derivWs.close(); clearInterval(keepAliveInterval); httpServer.close(() => process.exit(0)) })
process.on('SIGINT', () => { if (derivWs) derivWs.close(); clearInterval(keepAliveInterval); httpServer.close(() => process.exit(0)) })
