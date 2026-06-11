import { createServer } from 'http'
import { Server } from 'socket.io'

const httpServer = createServer()
const io = new Server(httpServer, {
  path: '/',
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// Types
interface MarketEvent {
  id: string
  homeTeam: string
  awayTeam: string
  sport: string
  league: string
  status: 'upcoming' | 'live' | 'completed' | 'suspended'
  startTime: string
  currentScore: string
  minute: number
  markets: MarketData[]
}

interface MarketData {
  id: string
  eventId: string
  marketType: string
  marketLabel: string
  selection: string
  odds: number
  prevOdds: number
  volume: number
  impliedProb: number
  trend: 'rising' | 'falling' | 'neutral'
  status: 'active' | 'suspended' | 'settled'
  analysis?: {
    signal: string
    confidence: number
    kellyCriterion: number
    expectedValue: number
    factors: string[]
  }
}

interface AnalysisSnapshot {
  marketType: string
  timestamp: string
  totalMarkets: number
  buySignals: number
  sellSignals: number
  neutralSignals: number
  avgConfidence: number
  topPick?: MarketData & { analysis: NonNullable<MarketData['analysis']> }
}

// Data generators
const teams = [
  { home: 'Manchester City', away: 'Arsenal', sport: 'Football', league: 'Premier League' },
  { home: 'Real Madrid', away: 'Barcelona', sport: 'Football', league: 'La Liga' },
  { home: 'Bayern Munich', away: 'Dortmund', sport: 'Football', league: 'Bundesliga' },
  { home: 'PSG', away: 'Lyon', sport: 'Football', league: 'Ligue 1' },
  { home: 'Juventus', away: 'Inter Milan', sport: 'Football', league: 'Serie A' },
  { home: 'Lakers', away: 'Warriors', sport: 'Basketball', league: 'NBA' },
  { home: 'Celtics', away: 'Bucks', sport: 'Basketball', league: 'NBA' },
  { home: 'Nadal', away: 'Djokovic', sport: 'Tennis', league: 'ATP Finals' },
  { home: 'Fury', away: 'Usyk', sport: 'Boxing', league: 'Heavyweight' },
  { home: 'Liverpool', away: 'Chelsea', sport: 'Football', league: 'Premier League' },
  { home: 'Milan', away: 'Roma', sport: 'Football', league: 'Serie A' },
  { home: 'Heat', away: 'Nuggets', sport: 'Basketball', league: 'NBA' },
]

const marketTypes = ['even_odd', 'differs', 'over_under', 'multiplier', 'higher_lower', 'turbo'] as const
const signals = ['strong_buy', 'buy', 'neutral', 'sell', 'strong_sell'] as const
const trends = ['rising', 'falling', 'neutral'] as const

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1))
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 12)
}

function generateMarketLabel(type: string, index: number): string {
  switch (type) {
    case 'even_odd':
      return index === 0 ? 'Total Goals - Even' : 'Total Goals - Odd'
    case 'differs':
      const diffs = ['Not 0-0', 'Not 1-1', 'Not 2-0', 'Not 0-2', 'Not 1-0', 'Not 0-1']
      return `Correct Score Differs - ${diffs[index % diffs.length]}`
    case 'over_under':
      const lines = [0.5, 1.5, 2.5, 3.5]
      return index % 2 === 0 ? `Over ${lines[index % lines.length]}` : `Under ${lines[index % lines.length]}`
    case 'multiplier':
      const mults = ['x2', 'x3', 'x5', 'x10', 'x20']
      return `Multiplier ${mults[index % mults.length]}`
    case 'higher_lower':
      return index === 0 ? 'Higher than 2.5' : 'Lower than 2.5'
    case 'turbo':
      const turboTypes = ['Next Goal Home', 'Next Goal Away', 'Next Goal Either', 'No More Goals']
      return `Turbo - ${turboTypes[index % turboTypes.length]}`
    default:
      return 'Unknown'
  }
}

function generateSignal(confidence: number): string {
  const r = Math.random()
  if (confidence > 0.8 && r > 0.4) return 'strong_buy'
  if (confidence > 0.65 && r > 0.3) return 'buy'
  if (confidence < 0.3 && r > 0.4) return 'strong_sell'
  if (confidence < 0.45 && r > 0.3) return 'sell'
  return 'neutral'
}

function generateMarkets(eventId: string): MarketData[] {
  const markets: MarketData[] = []

  for (const type of marketTypes) {
    const numMarkets = type === 'over_under' ? 4 : type === 'differs' ? 3 : 2
    for (let i = 0; i < numMarkets; i++) {
      const odds = parseFloat(rand(1.2, 12.5).toFixed(2))
      const impliedProb = parseFloat((1 / odds * 100).toFixed(1))
      const confidence = rand(0.15, 0.95)
      const signal = generateSignal(confidence)
      const ev = parseFloat((rand(-0.15, 0.35)).toFixed(3))
      const kelly = parseFloat((Math.max(0, ev) / (odds - 1)).toFixed(3))
      const factors: string[] = []

      if (confidence > 0.6) factors.push('Strong historical trend')
      if (impliedProb > 40) factors.push('High probability implied')
      if (Math.random() > 0.5) factors.push('Form data favorable')
      if (Math.random() > 0.7) factors.push('Market movement supportive')
      if (Math.random() > 0.6) factors.push('Volume imbalance detected')

      markets.push({
        id: generateId(),
        eventId,
        marketType: type,
        marketLabel: generateMarketLabel(type, i),
        selection: i === 0 ? 'Yes' : 'No',
        odds,
        prevOdds: odds,
        volume: parseFloat(rand(100, 50000).toFixed(0)),
        impliedProb,
        trend: trends[randInt(0, 2)],
        status: 'active',
        analysis: {
          signal,
          confidence: parseFloat(confidence.toFixed(3)),
          kellyCriterion: kelly,
          expectedValue: ev,
          factors
        }
      })
    }
  }

  return markets
}

// Generate initial events
const events: Map<string, MarketEvent> = new Map()

function generateEvents(): MarketEvent[] {
  const result: MarketEvent[] = []
  const now = new Date()

  for (const team of teams) {
    const id = generateId()
    const isLive = Math.random() > 0.3
    const minute = isLive ? randInt(1, 90) : 0
    const homeGoals = isLive ? randInt(0, 3) : 0
    const awayGoals = isLive ? randInt(0, 3) : 0

    const event: MarketEvent = {
      id,
      homeTeam: team.home,
      awayTeam: team.away,
      sport: team.sport,
      league: team.league,
      status: isLive ? 'live' : 'upcoming',
      startTime: new Date(now.getTime() + randInt(-5400000, 3600000)).toISOString(),
      currentScore: isLive ? `${homeGoals} - ${awayGoals}` : '-',
      minute: isLive ? minute : 0,
      markets: generateMarkets(id),
    }

    events.set(id, event)
    result.push(event)
  }

  return result
}

// Simulate market changes
function simulateMarketUpdate(event: MarketEvent): MarketData | null {
  const activeMarkets = event.markets.filter(m => m.status === 'active')
  if (activeMarkets.length === 0) return null

  // Pick a random market to update
  const market = activeMarkets[randInt(0, activeMarkets.length - 1)]
  market.prevOdds = market.odds

  // Simulate odds movement
  const movement = rand(-0.3, 0.3)
  market.odds = parseFloat(Math.max(1.01, market.odds + movement).toFixed(2))
  market.impliedProb = parseFloat((1 / market.odds * 100).toFixed(1))

  // Update volume
  market.volume += parseFloat(rand(50, 500).toFixed(0))

  // Update trend
  if (market.odds > market.prevOdds + 0.05) {
    market.trend = 'rising'
  } else if (market.odds < market.prevOdds - 0.05) {
    market.trend = 'falling'
  } else {
    market.trend = 'neutral'
  }

  // Recalculate analysis
  const confidence = rand(0.15, 0.95)
  market.analysis = {
    signal: generateSignal(confidence),
    confidence: parseFloat(confidence.toFixed(3)),
    kellyCriterion: parseFloat((Math.max(0, rand(-0.15, 0.35)) / (market.odds - 1)).toFixed(3)),
    expectedValue: parseFloat(rand(-0.15, 0.35).toFixed(3)),
    factors: market.analysis?.factors || ['Market data updated']
  }

  // Update score for live events
  if (event.status === 'live') {
    event.minute = Math.min(90, event.minute + 1)
    if (event.minute >= 90) {
      event.status = 'completed'
    }
  }

  return market
}

// Generate initial data
let initialEvents = generateEvents()

// Snapshot data
function generateSnapshot(): AnalysisSnapshot {
  let totalMarkets = 0
  let buySignals = 0
  let sellSignals = 0
  let neutralSignals = 0
  let totalConfidence = 0
  let topPick: MarketData & { analysis: NonNullable<MarketData['analysis']> } | undefined

  for (const event of events.values()) {
    for (const market of event.markets) {
      if (market.status !== 'active' || !market.analysis) continue
      totalMarkets++
      totalConfidence += market.analysis.confidence

      if (market.analysis.signal === 'strong_buy' || market.analysis.signal === 'buy') {
        buySignals++
      } else if (market.analysis.signal === 'strong_sell' || market.analysis.signal === 'sell') {
        sellSignals++
      } else {
        neutralSignals++
      }

      if (market.analysis.signal === 'strong_buy' && market.analysis.confidence > 0.8) {
        if (!topPick || market.analysis.confidence > topPick.analysis.confidence) {
          topPick = market as MarketData & { analysis: NonNullable<MarketData['analysis']> }
        }
      }
    }
  }

  return {
    marketType: 'all',
    timestamp: new Date().toISOString(),
    totalMarkets,
    buySignals,
    sellSignals,
    neutralSignals,
    avgConfidence: totalMarkets > 0 ? parseFloat((totalConfidence / totalMarkets).toFixed(3)) : 0,
    topPick
  }
}

// Socket.io handlers
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`)

  // Send initial data
  socket.emit('init', {
    events: initialEvents,
    snapshot: generateSnapshot(),
    timestamp: new Date().toISOString()
  })

  // Handle subscription to specific market types
  socket.on('subscribe', (data: { marketType: string }) => {
    socket.join(`market:${data.marketType}`)
    console.log(`${socket.id} subscribed to ${data.marketType}`)
    socket.emit('subscribed', { marketType: data.marketType })
  })

  // Handle request for specific event
  socket.on('get-event', (data: { eventId: string }) => {
    const event = events.get(data.eventId)
    if (event) {
      socket.emit('event-data', event)
    }
  })

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`)
  })
})

// Live update loop - update markets every 2-3 seconds
setInterval(() => {
  for (const event of events.values()) {
    if (event.status !== 'live') continue

    // Update 1-3 markets per event per tick
    const updates = randInt(1, 3)
    for (let i = 0; i < updates; i++) {
      const updatedMarket = simulateMarketUpdate(event)
      if (updatedMarket) {
        io.emit('market-update', {
          eventId: event.id,
          market: updatedMarket,
          eventMinute: event.minute,
          eventScore: event.currentScore,
          timestamp: new Date().toISOString()
        })
      }
    }
  }
}, 2500)

// Snapshot broadcast every 10 seconds
setInterval(() => {
  const snapshot = generateSnapshot()
  io.emit('snapshot', snapshot)
}, 10000)

// Occasionally add new live events
setInterval(() => {
  const upcomingEvents = Array.from(events.values()).filter(e => e.status === 'upcoming')
  if (upcomingEvents.length > 0 && Math.random() > 0.5) {
    const event = upcomingEvents[randInt(0, upcomingEvents.length - 1)]
    event.status = 'live'
    event.minute = 1
    event.currentScore = '0 - 0'
    console.log(`Event went live: ${event.homeTeam} vs ${event.awayTeam}`)
    io.emit('event-live', event)
  }
}, 30000)

const PORT = 3003
httpServer.listen(PORT, () => {
  console.log(`Market Feed WebSocket server running on port ${PORT}`)
})

process.on('SIGTERM', () => {
  console.log('Shutting down market feed server...')
  httpServer.close(() => process.exit(0))
})

process.on('SIGINT', () => {
  console.log('Shutting down market feed server...')
  httpServer.close(() => process.exit(0))
})
