import { createServer } from 'http'
import { Server } from 'socket.io'
import { URL } from 'url'
import WebSocket from 'ws'

const PORT = 3004

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
  source: 'binance' | 'poll'
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
}

// ─── Symbol Mapping ──────────────────────────────────────────────────
const CRYPTO_SYMBOLS: Array<{ tv: string; binance: string; name: string }> = [
  { tv: 'BINANCE:BTCUSDT', binance: 'btcusdt', name: 'BTC/USDT' },
  { tv: 'BINANCE:ETHUSDT', binance: 'ethusdt', name: 'ETH/USDT' },
  { tv: 'BINANCE:SOLUSDT', binance: 'solusdt', name: 'SOL/USDT' },
  { tv: 'BINANCE:BNBUSDT', binance: 'bnbusdt', name: 'BNB/USDT' },
  { tv: 'BINANCE:XRPUSDT', binance: 'xrpusdt', name: 'XRP/USDT' },
  { tv: 'BINANCE:ADAUSDT', binance: 'adausdt', name: 'ADA/USDT' },
  { tv: 'BINANCE:DOGEUSDT', binance: 'dogeusdt', name: 'DOGE/USDT' },
  { tv: 'BINANCE:AVAXUSDT', binance: 'avaxusdt', name: 'AVAX/USDT' },
  { tv: 'BINANCE:DOTUSDT', binance: 'dotusdt', name: 'DOT/USDT' },
  { tv: 'BINANCE:MATICUSDT', binance: 'maticusdt', name: 'MATIC/USDT' },
  { tv: 'BINANCE:LINKUSDT', binance: 'linkusdt', name: 'LINK/USDT' },
  { tv: 'BINANCE:SHIBUSDT', binance: 'shibusdt', name: 'SHIB/USDT' },
  { tv: 'BINANCE:ATOMUSDT', binance: 'atomusdt', name: 'ATOM/USDT' },
  { tv: 'BINANCE:UNIUSDT', binance: 'uniusdt', name: 'UNI/USDT' },
  { tv: 'BINANCE:NEARUSDT', binance: 'nearusdt', name: 'NEAR/USDT' },
]

const FOREX_SYMBOLS: Array<{ tv: string; name: string; basePrice: number; volatility: number }> = [
  { tv: 'FX:EURUSD', name: 'EUR/USD', basePrice: 1.0850, volatility: 0.0003 },
  { tv: 'FX:GBPUSD', name: 'GBP/USD', basePrice: 1.2650, volatility: 0.0004 },
  { tv: 'FX:USDJPY', name: 'USD/JPY', basePrice: 149.50, volatility: 0.05 },
  { tv: 'FX:USDCHF', name: 'USD/CHF', basePrice: 0.8780, volatility: 0.0003 },
  { tv: 'FX:AUDUSD', name: 'AUD/USD', basePrice: 0.6550, volatility: 0.0003 },
  { tv: 'FX:NZDUSD', name: 'NZD/USD', basePrice: 0.6100, volatility: 0.0003 },
  { tv: 'FX:USDCAD', name: 'USD/CAD', basePrice: 1.3550, volatility: 0.0003 },
  { tv: 'FX:EURGBP', name: 'EUR/GBP', basePrice: 0.8580, volatility: 0.0002 },
  { tv: 'FX:EURJPY', name: 'EUR/JPY', basePrice: 162.20, volatility: 0.05 },
  { tv: 'FX:GBPJPY', name: 'GBP/JPY', basePrice: 189.10, volatility: 0.06 },
  { tv: 'FX:XAUUSD', name: 'Gold', basePrice: 2340.50, volatility: 1.5 },
  { tv: 'FX:XAGUSD', name: 'Silver', basePrice: 29.15, volatility: 0.08 },
  { tv: 'FX:USOIL', name: 'Oil', basePrice: 78.50, volatility: 0.15 },
]

const STOCK_SYMBOLS: Array<{ tv: string; yahoo: string; name: string; basePrice: number; volatility: number }> = [
  { tv: 'NASDAQ:AAPL', yahoo: 'AAPL', name: 'Apple', basePrice: 195.50, volatility: 0.3 },
  { tv: 'NASDAQ:MSFT', yahoo: 'MSFT', name: 'Microsoft', basePrice: 420.80, volatility: 0.5 },
  { tv: 'NASDAQ:GOOGL', yahoo: 'GOOGL', name: 'Alphabet', basePrice: 175.20, volatility: 0.4 },
  { tv: 'NASDAQ:AMZN', yahoo: 'AMZN', name: 'Amazon', basePrice: 185.60, volatility: 0.5 },
  { tv: 'NASDAQ:TSLA', yahoo: 'TSLA', name: 'Tesla', basePrice: 248.30, volatility: 1.0 },
  { tv: 'NASDAQ:META', yahoo: 'META', name: 'Meta', basePrice: 505.20, volatility: 0.8 },
  { tv: 'NASDAQ:NVDA', yahoo: 'NVDA', name: 'NVIDIA', basePrice: 880.40, volatility: 2.0 },
  { tv: 'NASDAQ:NFLX', yahoo: 'NFLX', name: 'Netflix', basePrice: 628.50, volatility: 1.0 },
  { tv: 'NASDAQ:AMD', yahoo: 'AMD', name: 'AMD', basePrice: 165.30, volatility: 0.5 },
  { tv: 'NASDAQ:INTC', yahoo: 'INTC', name: 'Intel', basePrice: 31.20, volatility: 0.2 },
  { tv: 'NASDAQ:PYPL', yahoo: 'PYPL', name: 'PayPal', basePrice: 64.80, volatility: 0.3 },
  { tv: 'NASDAQ:CRM', yahoo: 'CRM', name: 'Salesforce', basePrice: 262.40, volatility: 0.5 },
  { tv: 'NASDAQ:ORCL', yahoo: 'ORCL', name: 'Oracle', basePrice: 126.80, volatility: 0.3 },
  { tv: 'NYSE:JPM', yahoo: 'JPM', name: 'JPMorgan', basePrice: 198.50, volatility: 0.4 },
  { tv: 'NYSE:V', yahoo: 'V', name: 'Visa', basePrice: 279.30, volatility: 0.4 },
  { tv: 'NYSE:WMT', yahoo: 'WMT', name: 'Walmart', basePrice: 67.20, volatility: 0.2 },
  { tv: 'NYSE:DIS', yahoo: 'DIS', name: 'Disney', basePrice: 112.40, volatility: 0.3 },
  { tv: 'NYSE:BA', yahoo: 'BA', name: 'Boeing', basePrice: 178.90, volatility: 0.8 },
  { tv: 'NYSE:KO', yahoo: 'KO', name: 'Coca-Cola', basePrice: 62.50, volatility: 0.1 },
  { tv: 'NYSE:PFE', yahoo: 'PFE', name: 'Pfizer', basePrice: 28.30, volatility: 0.2 },
]

const INDEX_SYMBOLS: Array<{ tv: string; yahoo: string; name: string; basePrice: number; volatility: number }> = [
  { tv: 'TVC:US30', yahoo: '^DJI', name: 'US30', basePrice: 39150.0, volatility: 50 },
  { tv: 'TVC:SPX500', yahoo: '^GSPC', name: 'SPX500', basePrice: 5320.0, volatility: 8 },
  { tv: 'TVC:NDX100', yahoo: '^NDX', name: 'NDX100', basePrice: 18450.0, volatility: 30 },
  { tv: 'TVC:UK100', yahoo: '^FTSE', name: 'UK100', basePrice: 8275.0, volatility: 15 },
  { tv: 'TVC:DE40', yahoo: '^GDAXI', name: 'DE40', basePrice: 18350.0, volatility: 25 },
  { tv: 'TVC:JP225', yahoo: '^N225', name: 'JP225', basePrice: 38450.0, volatility: 80 },
  { tv: 'TVC:HK50', yahoo: '^HSI', name: 'HK50', basePrice: 18250.0, volatility: 50 },
]

// ─── In-Memory Storage ──────────────────────────────────────────────
const symbolDataMap = new Map<string, SymbolData>()
const MAX_TICKS = 500
const ANALYSIS_WINDOW = 100

function getLastDigit(price: number): number {
  // Last digit of the integer part of the price
  // e.g. 63461.36 → 63461 → last digit is 1
  return Math.abs(Math.floor(price)) % 10
}

function initSymbolData(tvSymbol: string, name: string, category: string, source: 'binance' | 'poll', initialPrice?: number): SymbolData {
  if (symbolDataMap.has(tvSymbol)) return symbolDataMap.get(tvSymbol)!

  const data: SymbolData = {
    symbol: tvSymbol.includes('BINANCE:') ? CRYPTO_SYMBOLS.find(c => c.tv === tvSymbol)?.binance || tvSymbol : tvSymbol,
    tvSymbol,
    name,
    category,
    source,
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

  symbolDataMap.set(tvSymbol, data)
  return data
}

function addTick(tvSymbol: string, price: number, timestamp?: number): void {
  const data = symbolDataMap.get(tvSymbol)
  if (!data) return

  const ts = timestamp || Date.now()
  const lastDigit = getLastDigit(price)

  data.prevPrice = data.currentPrice
  data.currentPrice = price
  data.lastDigit = lastDigit
  data.lastTickTime = ts

  const tick: Tick = { price, timestamp: ts, lastDigit }
  data.ticks.push(tick)

  // Trim to max
  if (data.ticks.length > MAX_TICKS) {
    data.ticks = data.ticks.slice(-MAX_TICKS)
  }

  // Compute stats over analysis window
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

  // Percentages
  const total = window.length
  data.digitPercentages = data.digitCounts.map(c => parseFloat(((c / total) * 100).toFixed(1)))

  // Price change
  if (window.length >= 2) {
    data.priceChange = parseFloat((price - window[0].price).toFixed(6))
    data.priceChangePercent = parseFloat(((data.priceChange / window[0].price) * 100).toFixed(4))
  }

  // Tick speed (ticks per second)
  if (window.length >= 2) {
    const timeSpan = (window[window.length - 1].timestamp - window[0].timestamp) / 1000
    data.tickSpeed = timeSpan > 0 ? parseFloat((window.length / timeSpan).toFixed(2)) : 0
  }

  // Streak detection
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

function getDigitAnalysis(tvSymbol: string): DigitAnalysis | null {
  const data = symbolDataMap.get(tvSymbol)
  if (!data) return null

  const window = data.ticks.slice(-ANALYSIS_WINDOW)
  const total = window.length

  return {
    symbol: data.symbol,
    tvSymbol: data.tvSymbol,
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
  }
}

// ─── Binance WebSocket ──────────────────────────────────────────────
let binanceWs: WebSocket | null = null
let reconnectDelay = 1000

function connectBinance(): void {
  const streams = CRYPTO_SYMBOLS.map(s => `${s.binance}@trade`).join('/')
  const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams}`

  console.log(`[Binance] Connecting to ${wsUrl.substring(0, 80)}...`)

  try {
    binanceWs = new WebSocket(wsUrl)

    binanceWs.on('open', () => {
      console.log('[Binance] Connected! Receiving live trades...')
      reconnectDelay = 1000
    })

    binanceWs.on('message', (raw: Buffer | string) => {
      try {
        const msg = JSON.parse(raw.toString())
        if (msg.stream && msg.data && msg.data.e === 'trade') {
          const binanceSymbol = msg.stream.replace('@trade', '')
          const cryptoConfig = CRYPTO_SYMBOLS.find(c => c.binance === binanceSymbol)
          if (!cryptoConfig) return

          const tvSymbol = cryptoConfig.tv
          const price = parseFloat(msg.data.p)

          // Init if needed
          if (!symbolDataMap.has(tvSymbol)) {
            initSymbolData(tvSymbol, cryptoConfig.name, 'Crypto', 'binance', price)
          }

          addTick(tvSymbol, price, msg.data.T)
        }
      } catch {
        // Ignore parse errors
      }
    })

    binanceWs.on('close', () => {
      console.log('[Binance] Disconnected. Reconnecting...')
      setTimeout(connectBinance, reconnectDelay)
      reconnectDelay = Math.min(reconnectDelay * 2, 30000)
    })

    binanceWs.on('error', (err) => {
      console.error('[Binance] Error:', err.message)
    })
  } catch (err) {
    console.error('[Binance] Connection error:', err)
    setTimeout(connectBinance, reconnectDelay)
    reconnectDelay = Math.min(reconnectDelay * 2, 30000)
  }
}

// ─── Poll-based Price Updates (Forex, Stocks, Indices) ─────────────
let pollPrices: Map<string, number> = new Map()

// Try to fetch real prices from Yahoo Finance
async function fetchYahooPrice(yahooSymbol: string): Promise<number | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1m&range=1d`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(5000)
    })
    if (!res.ok) return null
    const json = await res.json()
    const closes = json?.chart?.result?.[0]?.indicators?.quote?.[0]?.close
    if (closes && closes.length > 0) {
      const last = closes[closes.length - 1]
      return last !== null && last !== undefined ? last : null
    }
    return null
  } catch {
    return null
  }
}

// Initialize forex/stocks/indices with base prices and start polling
function initPollSymbols(): void {
  // Forex
  for (const f of FOREX_SYMBOLS) {
    initSymbolData(f.tv, f.name, 'Forex', 'poll', f.basePrice)
    pollPrices.set(f.tv, f.basePrice)
  }

  // Stocks
  for (const s of STOCK_SYMBOLS) {
    initSymbolData(s.tv, s.name, 'Stocks', 'poll', s.basePrice)
    pollPrices.set(s.tv, s.basePrice)
  }

  // Indices
  for (const i of INDEX_SYMBOLS) {
    initSymbolData(i.tv, i.name, 'Indices', 'poll', i.basePrice)
    pollPrices.set(i.tv, i.basePrice)
  }
}

async function pollAndUpdatePrices(): Promise<void> {
  const allPollSymbols = [
    ...FOREX_SYMBOLS.map(f => ({ tv: f.tv, yahoo: f.tv.replace('FX:', ''), vol: f.volatility })),
    ...STOCK_SYMBOLS.map(s => ({ tv: s.tv, yahoo: s.yahoo, vol: s.volatility })),
    ...INDEX_SYMBOLS.map(i => ({ tv: i.tv, yahoo: i.yahoo, vol: i.volatility })),
  ]

  // Try to fetch a few real prices (rate limited)
  const batch = allPollSymbols.slice(0, 5)
  for (const sym of batch) {
    try {
      const realPrice = await fetchYahooPrice(sym.yahoo)
      if (realPrice && realPrice > 0) {
        pollPrices.set(sym.tv, realPrice)
        console.log(`[Yahoo] ${sym.tv} = ${realPrice}`)
      }
    } catch {
      // ignore
    }
  }

  // Generate tick variations for all poll-based symbols
  const now = Date.now()
  for (const sym of allPollSymbols) {
    const base = pollPrices.get(sym.tv) || 0
    if (base <= 0) continue

    // Simulate small price movements
    const change = (Math.random() - 0.5) * 2 * sym.vol
    const newPrice = parseFloat((base + change).toFixed(
      base > 1000 ? 2 : base > 1 ? 4 : 6
    ))
    pollPrices.set(sym.tv, newPrice)
    addTick(sym.tv, newPrice, now)
  }
}

// ─── Socket.io Server ───────────────────────────────────────────────
const httpServer = createServer((req, res) => {
  // Simple REST API handler
  const parsedUrl = new URL(req.url || '/', `http://localhost:${PORT}`)
  const pathname = parsedUrl.pathname

  // CORS headers
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
      const symbol = parsedUrl.searchParams.get('symbol')
      const data = symbol ? symbolDataMap.get(symbol) : null
      if (data) {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          symbol: data.tvSymbol,
          price: data.currentPrice,
          prevPrice: data.prevPrice,
          change: data.priceChange,
          changePercent: data.priceChangePercent,
          high: data.highPrice,
          low: data.lowPrice,
          lastDigit: data.lastDigit,
          tickSpeed: data.tickSpeed,
          totalTicks: data.ticks.length,
          source: data.source,
          timestamp: new Date().toISOString(),
        }))
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Symbol not found', symbol }))
      }
      return
    }

    if (pathname === '/api/ticks') {
      const symbol = parsedUrl.searchParams.get('symbol')
      const limit = parseInt(parsedUrl.searchParams.get('limit') || '100')
      const data = symbol ? symbolDataMap.get(symbol) : null
      if (data) {
        const ticks = data.ticks.slice(-limit)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          symbol: data.tvSymbol,
          ticks,
          count: ticks.length,
        }))
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Symbol not found', symbol }))
      }
      return
    }

    if (pathname === '/api/digits') {
      const symbol = parsedUrl.searchParams.get('symbol')
      const barrier = parseInt(parsedUrl.searchParams.get('barrier') || '4')
      const analysis = symbol ? getDigitAnalysis(symbol) : null
      if (analysis) {
        // Recompute over/under for the requested barrier
        const data = symbolDataMap.get(symbol)!
        const window = data.ticks.slice(-ANALYSIS_WINDOW)
        let oCount = 0
        let uCount = 0
        for (const t of window) {
          if (t.lastDigit > barrier) oCount++
          else uCount++
        }
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
      const prices: Array<{
        symbol: string
        name: string
        category: string
        price: number
        change: number
        changePercent: number
        lastDigit: number
        source: string
        tickSpeed: number
      }> = []
      for (const [tvSymbol, data] of symbolDataMap) {
        if (data.currentPrice > 0) {
          prices.push({
            symbol: data.tvSymbol,
            name: data.name,
            category: data.category,
            price: data.currentPrice,
            change: data.priceChange,
            changePercent: data.priceChangePercent,
            lastDigit: data.lastDigit,
            source: data.source,
            tickSpeed: data.tickSpeed,
          })
        }
      }
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ prices, total: prices.length, timestamp: new Date().toISOString() }))
      return
    }

    if (pathname === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        status: 'ok',
        symbols: symbolDataMap.size,
        binanceConnected: binanceWs?.readyState === WebSocket.OPEN,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      }))
      return
    }
  }

  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not found' }))
})

const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// Socket.io event handlers
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`)

  // Send initial state for all symbols
  const allAnalysis: Record<string, DigitAnalysis> = {}
  for (const [tvSymbol] of symbolDataMap) {
    const analysis = getDigitAnalysis(tvSymbol)
    if (analysis) allAnalysis[tvSymbol] = analysis
  }
  socket.emit('init', {
    symbols: Object.keys(symbolDataMap.size > 0 ? allAnalysis : {}).length,
    analyses: allAnalysis,
    timestamp: new Date().toISOString(),
  })

  // Subscribe to specific symbol
  socket.on('subscribe', (symbol: string) => {
    socket.join(`symbol:${symbol}`)
    console.log(`[Socket.io] ${socket.id} subscribed to ${symbol}`)
    // Send current analysis
    const analysis = getDigitAnalysis(symbol)
    if (analysis) socket.emit('digit-update', analysis)
  })

  socket.on('unsubscribe', (symbol: string) => {
    socket.leave(`symbol:${symbol}`)
  })

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`)
  })
})

// Forward tick events to subscribed clients
function broadcastTick(tvSymbol: string): void {
  const data = symbolDataMap.get(tvSymbol)
  if (!data) return

  const analysis = getDigitAnalysis(tvSymbol)
  if (!analysis) return

  // Send to symbol-specific rooms
  io.to(`symbol:${tvSymbol}`).emit('tick', {
    symbol: tvSymbol,
    price: data.currentPrice,
    prevPrice: data.prevPrice,
    lastDigit: data.lastDigit,
    change: data.priceChange,
    changePercent: data.priceChangePercent,
    timestamp: Date.now(),
  })
}

// Periodic digit-update broadcast
setInterval(() => {
  const updates: Record<string, DigitAnalysis> = {}
  for (const [tvSymbol, data] of symbolDataMap) {
    if (data.ticks.length > 0) {
      const analysis = getDigitAnalysis(tvSymbol)
      if (analysis) updates[tvSymbol] = analysis
    }
  }
  if (Object.keys(updates).length > 0) {
    io.emit('digit-update-all', updates)
  }
}, 2000)

// ─── Start ───────────────────────────────────────────────────────────
console.log('[TickFeed] Initializing...')

// Init poll-based symbols
initPollSymbols()

// Connect to Binance
connectBinance()

// Start polling non-crypto prices every 5 seconds
setInterval(pollAndUpdatePrices, 5000)

// Start HTTP + Socket.io server
httpServer.listen(PORT, () => {
  console.log(`[TickFeed] Server running on port ${PORT}`)
  console.log(`[TickFeed] REST API: http://localhost:${PORT}/api/price?symbol=BINANCE:BTCUSDT`)
  console.log(`[TickFeed] Digit Analysis: http://localhost:${PORT}/api/digits?symbol=BINANCE:BTCUSDT`)
  console.log(`[TickFeed] All Prices: http://localhost:${PORT}/api/all-prices`)
  console.log(`[TickFeed] Health: http://localhost:${PORT}/api/health`)
})

process.on('SIGTERM', () => {
  console.log('[TickFeed] Shutting down...')
  if (binanceWs) binanceWs.close()
  httpServer.close(() => process.exit(0))
})

process.on('SIGINT', () => {
  console.log('[TickFeed] Shutting down...')
  if (binanceWs) binanceWs.close()
  httpServer.close(() => process.exit(0))
})
