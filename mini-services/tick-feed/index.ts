import { createServer } from 'http'
import { Server } from 'socket.io'
import { URL } from 'url'
import WebSocket from 'ws'

const PORT = 3004
const DERIV_APP_ID = 1089
const DERIV_WS_URL = `wss://ws.derivws.com/websockets/v3?app_id=${DERIV_APP_ID}`

// ─── Types ───────────────────────────────────────────────────────────
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
  source: 'deriv'
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
  overCount: number
  underCount: number
  streakType: string
  streakLength: number
  lastTickTime: number
}

interface DigitAnalysis {
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

// ─── Deriv Symbol Mapping ──────────────────────────────────────────
const DERIV_SYMBOLS: Array<{
  id: string
  deriv: string
  tv: string
  name: string
  category: string
  pipSize: number
}> = [
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

// ─── In-Memory Storage ──────────────────────────────────────────────
const symbolDataMap = new Map<string, SymbolData>()
const MAX_TICKS = 500
const ANALYSIS_WINDOW = 100

function getLastDigit(price: number): number {
  return Math.abs(Math.floor(price)) % 10
}

function initSymbolData(id: string, deriv: string, tv: string, name: string, category: string, pipSize: number, initialPrice?: number): SymbolData {
  if (symbolDataMap.has(id)) return symbolDataMap.get(id)!

  const data: SymbolData = {
    symbol: deriv,
    tvSymbol: tv,
    name,
    category,
    source: 'deriv',
    pipSize,
    ticks: [],
    currentPrice: initialPrice || 0,
    prevPrice: initialPrice || 0,
    highPrice: initialPrice || 0,
    lowPrice: initialPrice || Infinity,
    priceChange: 0,
    priceChangePercent: 0,
    tickSpeed: 0,
    lastDigit: 0,
    digitCounts: new Array(10).fill(0),
    digitPercentages: new Array(10).fill(0),
    evenCount: 50,
    oddCount: 50,
    overCount: 50,
    underCount: 50,
    streakType: '',
    streakLength: 0,
    lastTickTime: 0,
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

  const tick: Tick = { price, timestamp, lastDigit }
  data.ticks.push(tick)

  if (data.ticks.length > MAX_TICKS) {
    data.ticks = data.ticks.slice(-MAX_TICKS)
  }

  const window = data.ticks.slice(-ANALYSIS_WINDOW)
  data.digitCounts = new Array(10).fill(0)
  data.evenCount = 0
  data.oddCount = 0
  data.overCount = 0
  data.underCount = 0
  data.highPrice = -Infinity
  data.lowPrice = Infinity

  for (const t of window) {
    data.digitCounts[t.lastDigit]++
    if (t.lastDigit % 2 === 0) data.evenCount++
    else data.oddCount++
    if (t.lastDigit > 4) data.overCount++
    else data.underCount++
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
    if (tType === streakType) streakLen++
    else break
  }
  data.streakType = streakType
  data.streakLength = streakLen
}

function getDigitAnalysis(id: string): DigitAnalysis | null {
  const data = symbolDataMap.get(id)
  if (!data) return null

  const window = data.ticks.slice(-ANALYSIS_WINDOW)
  const total = window.length

  return {
    symbol: data.symbol,
    tvSymbol: data.tvSymbol,
    name: data.name,
    category: data.category,
    currentPrice: data.currentPrice,
    lastDigit: data.lastDigit,
    digitCounts: data.digitCounts,
    digitPercentages: data.digitPercentages,
    evenCount: data.evenCount,
    oddCount: data.oddCount,
    evenPercent: total > 0 ? parseFloat(((data.evenCount / total) * 100).toFixed(1)) : 0,
    oddPercent: total > 0 ? parseFloat(((data.oddCount / total) * 100).toFixed(1)) : 0,
    overCount: data.overCount,
    underCount: data.underCount,
    overPercent: total > 0 ? parseFloat(((data.overCount / total) * 100).toFixed(1)) : 0,
    underPercent: total > 0 ? parseFloat(((data.underCount / total) * 100).toFixed(1)) : 0,
    streakType: data.streakType,
    streakLength: data.streakLength,
    highPrice: data.highPrice,
    lowPrice: data.lowPrice,
    priceChange: data.priceChange,
    priceChangePercent: data.priceChangePercent,
    tickSpeed: data.tickSpeed,
    recentTicks: data.ticks.slice(-25).map(t => ({ price: t.price, timestamp: t.timestamp, lastDigit: t.lastDigit })),
    totalTicks: data.ticks.length,
    pipSize: data.pipSize,
  }
}

// ─── Deriv WebSocket ────────────────────────────────────────────────
let derivWs: WebSocket | null = null
let reconnectDelay = 1000
let subscribedSymbols = new Set<string>()

function connectDeriv(): void {
  console.log(`[Deriv] Connecting...`)

  try {
    derivWs = new WebSocket(DERIV_WS_URL)

    derivWs.on('open', () => {
      console.log('[Deriv] Connected!')
      reconnectDelay = 1000
      subscribeAll()
    })

    derivWs.on('message', (raw: Buffer | string) => {
      try {
        const msg = JSON.parse(raw.toString())
        if (!msg) return

        if (msg.tick) {
          try {
            const tick = msg.tick
            const symbol = tick.symbol
            const price = tick.quote
            const epoch = tick.epoch * 1000

            if (!symbolDataMap.has(symbol)) {
              const symConfig = DERIV_SYMBOLS.find(s => s.deriv === symbol)
              if (symConfig) {
                initSymbolData(symConfig.id, symConfig.deriv, symConfig.tv, symConfig.name, symConfig.category, symConfig.pipSize, price)
              }
            }

            addTick(symbol, price, epoch)
            subscribedSymbols.add(symbol)
          } catch (e) { /* skip bad tick */ }
        }

        if (msg.history) {
          try {
            const symbol = msg.echo_req?.ticks_history
            if (!symbol) return

            const prices: Array<[number, number]> = msg.history?.prices || []
            const times: number[] = msg.history?.times || []

            if (!symbolDataMap.has(symbol)) {
              const symConfig = DERIV_SYMBOLS.find(s => s.deriv === symbol)
              if (symConfig) {
                initSymbolData(symConfig.id, symConfig.deriv, symConfig.tv, symConfig.name, symConfig.category, symConfig.pipSize)
              }
            }

            for (let i = 0; i < prices.length; i++) {
              if (prices[i] !== undefined && times[i] !== undefined) {
                addTick(symbol, prices[i], times[i] * 1000)
              }
            }

            subscribedSymbols.add(symbol)
          } catch (e) { /* skip bad history */ }
        }

        if (msg.error) {
          // Silently ignore errors (already subscribed, market closed, etc.)
        }
      } catch {
        // Silently ignore unparseable messages
      }
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

function subscribeAll(): void {
  if (!derivWs || derivWs.readyState !== WebSocket.OPEN) return

  for (const sym of DERIV_SYMBOLS) {
    initSymbolData(sym.id, sym.deriv, sym.tv, sym.name, sym.category, sym.pipSize)
  }

  // Subscribe all at once
  for (const sym of DERIV_SYMBOLS) {
    derivWs!.send(JSON.stringify({ ticks: sym.deriv, subscribe: 1 }))
  }
  console.log(`[Deriv] Sent tick subscriptions for ${DERIV_SYMBOLS.length} symbols`)

  // Request tick history with a delay
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
    console.log(`[Deriv] Requested tick history for ${DERIV_SYMBOLS.length} symbols`)
  }, 2000)
}

// ─── HTTP REST API ──────────────────────────────────────────────────
const httpServer = createServer((req, res) => {
  const parsedUrl = new URL(req.url || '/', `http://localhost:${PORT}`)
  const pathname = parsedUrl.pathname

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  if (req.method === 'GET') {
    if (pathname === '/api/price') {
      const symbol = parsedUrl.searchParams.get('symbol') || ''
      const config = DERIV_SYMBOLS.find(s => s.id === symbol || s.deriv === symbol || s.tv === symbol)
      const key = config?.id || symbol
      const data = symbolDataMap.get(key)
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
      const config = DERIV_SYMBOLS.find(s => s.id === symbol || s.deriv === symbol || s.tv === symbol)
      const key = config?.id || symbol
      const analysis = getDigitAnalysis(key)
      if (analysis) {
        const data = symbolDataMap.get(key)!
        const window = data.ticks.slice(-ANALYSIS_WINDOW)
        let oCount = 0, uCount = 0
        for (const t of window) { if (t.lastDigit > barrier) oCount++; else uCount++ }
        analysis.overCount = oCount
        analysis.underCount = uCount
        analysis.overPercent = window.length > 0 ? parseFloat(((oCount / window.length) * 100).toFixed(1)) : 0
        analysis.underPercent = window.length > 0 ? parseFloat(((uCount / window.length) * 100).toFixed(1)) : 0
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(analysis))
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Symbol not found', symbol }))
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
        status: 'ok',
        symbols: symbolDataMap.size,
        subscribedSymbols: subscribedSymbols.size,
        derivConnected: derivWs?.readyState === WebSocket.OPEN,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      }))
      return
    }
  }

  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not found' }))
})

// ─── Socket.io ──────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 60000,
  pingInterval: 25000,
})

io.on('connection', (socket) => {
  console.log(`[io] Client connected: ${socket.id}`)
  const allAnalysis: Record<string, DigitAnalysis> = {}
  for (const [id] of symbolDataMap) {
    const a = getDigitAnalysis(id)
    if (a && a.totalTicks > 0) allAnalysis[id] = a
  }
  socket.emit('init', { symbols: Object.keys(allAnalysis).length, analyses: allAnalysis, timestamp: new Date().toISOString() })
  socket.on('subscribe', (symbol: string) => { socket.join(`symbol:${symbol}`); const a = getDigitAnalysis(symbol); if (a) socket.emit('digit-update', a) })
  socket.on('unsubscribe', (symbol: string) => { socket.leave(`symbol:${symbol}`) })
  socket.on('disconnect', () => { console.log(`[io] Client disconnected: ${socket.id}`) })
})

setInterval(() => {
  const updates: Record<string, DigitAnalysis> = {}
  for (const [id, data] of symbolDataMap) {
    if (data.ticks.length > 0) { const a = getDigitAnalysis(id); if (a) updates[id] = a }
  }
  if (Object.keys(updates).length > 0) io.emit('digit-update-all', updates)
}, 2000)

process.on('uncaughtException', (err) => {
  console.error('[TickFeed] Uncaught error:', err)
  // Don't exit — keep running
})

process.on('unhandledRejection', (reason) => {
  console.error('[TickFeed] Unhandled rejection:', reason)
})

// ─── Start ───────────────────────────────────────────────────────
console.log('[TickFeed] Initializing with Deriv API...')
connectDeriv()

httpServer.listen(PORT, () => {
  console.log(`[TickFeed] Running on port ${PORT}`)
  console.log(`[TickFeed] Deriv API: ${DERIV_WS_URL}`)
  console.log(`[TickFeed] ${DERIV_SYMBOLS.length} symbols`)
})

process.on('SIGTERM', () => { console.log('[TickFeed] Shutting down...'); if (derivWs) derivWs.close(); httpServer.close(() => process.exit(0)) })
process.on('SIGINT', () => { console.log('[TickFeed] Shutting down...'); if (derivWs) derivWs.close(); httpServer.close(() => process.exit(0)) })
