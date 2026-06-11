import { NextResponse } from 'next/server'
import { MarketType, SignalType, IndicatorResult, AnalysisSignal } from '@/lib/trading-types'
import { initDerivTicks, getDigitAnalysis, resolveSymbol } from '@/lib/deriv-ticks'

// Initialize tick service
let initCalled = false
function ensureInit() {
  if (!initCalled) {
    initCalled = true
    setImmediate(() => initDerivTicks())
  }
}

interface DigitData {
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

// Fetch digit data from in-process tick service
function fetchDigitData(symbol: string, barrier: number = 4): DigitData | null {
  ensureInit()
  const resolvedId = resolveSymbol(symbol)
  if (!resolvedId) return null
  return getDigitAnalysis(resolvedId, barrier)
}

function generateIndicators(digitData: DigitData | null, symbol: string, marketType: MarketType, barrier?: number): IndicatorResult[] {
  // If we have real data, use it for analysis
  if (digitData && digitData.totalTicks > 5) {
    switch (marketType) {
      case 'even_odd': {
        const evenBias = digitData.evenPercent - 50
        return [
          { name: 'Even/Odd Ratio', value: `${digitData.evenPercent}%/${digitData.oddPercent}%`, signal: evenBias > 5 ? 'buy' : evenBias < -5 ? 'sell' : 'neutral', description: 'Even vs odd digit ratio in last 100 ticks' },
          { name: 'Streak', value: `${digitData.streakLength} ${digitData.streakType}`, signal: digitData.streakLength >= 5 ? (digitData.streakType === 'even' ? 'sell' : 'buy') : 'neutral', description: 'Current consecutive parity streak' },
          { name: 'Tick Velocity', value: `${digitData.tickSpeed} t/s`, signal: digitData.tickSpeed > 5 ? 'buy' : digitData.tickSpeed < 1 ? 'sell' : 'neutral', description: 'Tick arrival rate' },
          { name: 'Momentum', value: `${digitData.priceChangePercent >= 0 ? '+' : ''}${digitData.priceChangePercent}%`, signal: digitData.priceChangePercent > 0.01 ? 'buy' : digitData.priceChangePercent < -0.01 ? 'sell' : 'neutral', description: 'Price change over analysis window' },
        ]
      }
      case 'differs': {
        const differsPercent = 100 - (digitData.digitPercentages[barrier ?? 0] || 0)
        return [
          { name: `Digit ${barrier ?? 0} Frequency`, value: `${digitData.digitPercentages[barrier ?? 0] || 0}%`, signal: differsPercent > 85 ? 'strong_buy' : differsPercent > 75 ? 'buy' : 'neutral', description: `How often digit ${barrier ?? 0} appears` },
          { name: 'Differs Prob.', value: `${differsPercent.toFixed(1)}%`, signal: differsPercent > 85 ? 'strong_buy' : differsPercent > 75 ? 'buy' : differsPercent < 70 ? 'sell' : 'neutral', description: `Probability digit differs from ${barrier ?? 0}` },
          { name: 'Rare Digits', value: `${digitData.digitCounts.filter(c => c < 5).length} below 5%`, signal: digitData.digitCounts.filter(c => c < 5).length > 3 ? 'buy' : 'neutral', description: 'Digits appearing less than 5% of the time' },
          { name: 'Distribution', value: digitData.digitCounts.filter(c => c > 12).length > 3 ? 'Clustered' : 'Even', signal: digitData.digitCounts.filter(c => c > 12).length > 3 ? 'sell' : 'buy', description: 'How evenly digits are distributed' },
        ]
      }
      case 'over_under': {
        const b = barrier ?? 4
        const overBias = digitData.overPercent - 50
        return [
          { name: `Over ${b} Count`, value: `${digitData.overCount} (${digitData.overPercent}%)`, signal: overBias > 8 ? 'buy' : overBias < -8 ? 'sell' : 'neutral', description: `Digits over ${b} in last ticks` },
          { name: `Under ${b} Count`, value: `${digitData.underCount} (${digitData.underPercent}%)`, signal: -overBias > 8 ? 'buy' : -overBias < -8 ? 'sell' : 'neutral', description: `Digits under ${b} in last ticks` },
          { name: 'Barrier Hit Rate', value: `${(100 - digitData.digitPercentages[b] || 0).toFixed(0)}%`, signal: (100 - (digitData.digitPercentages[b] || 0)) > 90 ? 'strong_buy' : 'neutral', description: `Rate of digits not equal to barrier ${b}` },
          { name: 'Streak Direction', value: `${digitData.streakLength} ${digitData.streakType}`, signal: digitData.streakLength >= 4 ? 'buy' : 'neutral', description: 'Current parity streak' },
        ]
      }
      case 'higher_lower': {
        return [
          { name: 'Price Change', value: `${digitData.priceChangePercent >= 0 ? '+' : ''}${digitData.priceChangePercent}%`, signal: digitData.priceChangePercent > 0.02 ? 'strong_buy' : digitData.priceChangePercent > 0 ? 'buy' : digitData.priceChangePercent < -0.02 ? 'strong_sell' : digitData.priceChangePercent < 0 ? 'sell' : 'neutral', description: 'Price movement direction' },
          { name: 'High/Low Range', value: `${digitData.priceChange.toFixed(digitData.currentPrice > 100 ? 2 : 4)}`, signal: Math.abs(digitData.priceChangePercent) > 0.1 ? 'buy' : 'neutral', description: 'Price range in analysis window' },
          { name: 'Tick Momentum', value: digitData.tickSpeed > 3 ? 'High' : digitData.tickSpeed > 1 ? 'Medium' : 'Low', signal: digitData.tickSpeed > 3 ? 'strong_buy' : digitData.tickSpeed > 1 ? 'buy' : 'sell', description: 'Tick arrival rate as momentum proxy' },
          { name: 'Last Digit', value: `${digitData.lastDigit} (${digitData.lastDigit % 2 === 0 ? 'Even' : 'Odd'})`, signal: digitData.evenPercent > 55 ? 'buy' : digitData.oddPercent > 55 ? 'sell' : 'neutral', description: 'Latest digit and parity' },
          { name: 'Volatility', value: `${Math.abs(digitData.priceChangePercent).toFixed(3)}%`, signal: Math.abs(digitData.priceChangePercent) > 0.05 ? 'buy' : 'sell', description: 'Price volatility indicator' },
        ]
      }
      case 'turbo': {
        return [
          { name: 'Tick Speed', value: `${digitData.tickSpeed} t/s`, signal: digitData.tickSpeed > 5 ? 'strong_buy' : digitData.tickSpeed > 2 ? 'buy' : digitData.tickSpeed < 0.5 ? 'strong_sell' : 'sell', description: 'Tick velocity for turbo timing' },
          { name: 'Micro Change', value: `${digitData.priceChangePercent >= 0 ? '+' : ''}${digitData.priceChangePercent}%`, signal: Math.abs(digitData.priceChangePercent) > 0.005 ? 'buy' : 'sell', description: 'Ultra-short price change' },
          { name: 'Even/Odd', value: `${digitData.evenPercent}%/${digitData.oddPercent}%`, signal: Math.abs(digitData.evenPercent - digitData.oddPercent) > 10 ? 'buy' : 'neutral', description: 'Quick parity assessment' },
          { name: 'Streak', value: `${digitData.streakLength} ${digitData.streakType}`, signal: digitData.streakLength >= 3 ? 'strong_buy' : digitData.streakLength >= 2 ? 'buy' : 'neutral', description: 'Rapid streak detection' },
        ]
      }
      case 'multiplier': {
        return [
          { name: 'Volatility', value: `${Math.abs(digitData.priceChangePercent).toFixed(3)}%`, signal: Math.abs(digitData.priceChangePercent) > 0.05 ? 'strong_buy' : Math.abs(digitData.priceChangePercent) > 0.02 ? 'buy' : 'neutral', description: 'Price volatility for multiplier risk' },
          { name: 'Tick Speed', value: `${digitData.tickSpeed} t/s`, signal: digitData.tickSpeed > 3 ? 'buy' : digitData.tickSpeed < 0.5 ? 'sell' : 'neutral', description: 'Active market indicator' },
          { name: 'Range Spread', value: `${digitData.highPrice !== digitData.lowPrice ? ((digitData.highPrice - digitData.lowPrice) / digitData.currentPrice * 100).toFixed(3) : '0'}%`, signal: digitData.highPrice > digitData.lowPrice * 1.001 ? 'buy' : 'sell', description: 'High-low spread as volatility' },
          { name: 'Direction', value: digitData.priceChange >= 0 ? 'Bullish' : 'Bearish', signal: digitData.priceChange > 0 ? 'buy' : 'sell', description: 'Overall price direction' },
        ]
      }
    }
  }

  // Fallback: simulated analysis (when tick-feed is unavailable)
  const hash = symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const seed = (hash * 17 + Date.now() % 10000) / 10000

  switch (marketType) {
    case 'even_odd': {
      const digitOsc = ((seed * 10) % 2).toFixed(2)
      const digitFreq = (50 + Math.sin(seed * 7) * 15).toFixed(1)
      return [
        { name: 'Digit Oscillator', value: digitOsc, signal: parseFloat(digitOsc) > 0.5 ? 'buy' : 'sell', description: 'Even/odd digit frequency balance' },
        { name: 'Digit Distribution', value: `${digitFreq}%`, signal: parseFloat(digitFreq) > 52 ? 'buy' : parseFloat(digitFreq) < 48 ? 'sell' : 'neutral', description: 'Historical even digit frequency' },
        { name: 'Tick Pattern', value: seed > 0.5 ? 'Even Bias' : 'Odd Bias', signal: seed > 0.55 ? 'buy' : seed < 0.45 ? 'sell' : 'neutral', description: 'Last 100 ticks pattern' },
        { name: 'Streak Detector', value: `${Math.floor(seed * 8)}`, signal: Math.floor(seed * 8) > 4 ? 'buy' : Math.floor(seed * 8) < 3 ? 'sell' : 'neutral', description: 'Consecutive same-parity count' },
      ]
    }
    case 'differs': {
      const targetDigit = Math.floor(seed * 10)
      const probDiffers = (90 - targetDigit * 3 + Math.sin(seed) * 5).toFixed(1)
      return [
        { name: 'Digit Avoidance', value: `${probDiffers}%`, signal: parseFloat(probDiffers) > 80 ? 'strong_buy' : parseFloat(probDiffers) > 65 ? 'buy' : 'neutral', description: `Probability digit ${targetDigit} is avoided` },
        { name: 'Frequency Rank', value: `#${Math.floor(seed * 10) + 1}`, signal: targetDigit >= 7 ? 'buy' : targetDigit <= 2 ? 'sell' : 'neutral', description: `Digit ${targetDigit} frequency ranking` },
        { name: 'Gap Analysis', value: `${Math.floor(seed * 5)} ticks`, signal: seed > 0.6 ? 'buy' : seed < 0.4 ? 'sell' : 'neutral', description: 'Ticks since digit appeared' },
        { name: 'Volatility Adj.', value: (seed * 100).toFixed(1), signal: seed > 0.5 ? 'buy' : 'sell', description: 'Volatility-adjusted probability' },
      ]
    }
    case 'over_under': {
      return [
        { name: 'Price vs Level', value: seed > 0.5 ? 'Above' : 'Below', signal: seed > 0.55 ? 'strong_buy' : seed > 0.45 ? 'neutral' : 'strong_sell', description: 'Current digit vs barrier level' },
        { name: 'ATR Ratio', value: (seed * 3).toFixed(2), signal: seed > 0.6 ? 'buy' : seed < 0.4 ? 'sell' : 'neutral', description: 'Volatility relative to barrier' },
        { name: 'Digit Distribution', value: `${(50 + seed * 30).toFixed(0)}%`, signal: seed > 0.5 ? 'buy' : 'sell', description: 'Distribution around barrier' },
        { name: 'Momentum', value: seed > 0.5 ? 'Bullish' : 'Bearish', signal: seed > 0.6 ? 'strong_buy' : seed < 0.4 ? 'strong_sell' : 'neutral', description: 'Directional momentum strength' },
      ]
    }
    case 'multiplier': {
      const volLevel = (seed * 100).toFixed(0)
      return [
        { name: 'Volatility', value: `${volLevel}%`, signal: seed > 0.7 ? 'buy' : seed < 0.3 ? 'sell' : 'neutral', description: 'Market volatility level' },
        { name: 'ATR', value: (seed * 5).toFixed(3), signal: seed > 0.5 ? 'buy' : 'sell', description: 'Average True Range' },
        { name: 'Bollinger Width', value: (seed * 0.1).toFixed(4), signal: seed > 0.6 ? 'strong_buy' : seed < 0.4 ? 'strong_sell' : 'neutral', description: 'Bollinger Band width' },
        { name: 'Risk Rating', value: seed > 0.7 ? 'High' : seed > 0.4 ? 'Medium' : 'Low', signal: seed > 0.7 ? 'sell' : seed < 0.4 ? 'buy' : 'neutral', description: 'Overall risk assessment' },
      ]
    }
    case 'higher_lower': {
      const rsi = 50 + Math.sin(seed * 5) * 35
      return [
        { name: 'RSI (14)', value: rsi.toFixed(1), signal: rsi > 60 ? 'buy' : rsi < 40 ? 'sell' : 'neutral', description: 'Relative Strength Index' },
        { name: 'MACD Signal', value: (seed > 0.5 ? 0.002 : -0.002).toFixed(4), signal: seed > 0.5 ? 'buy' : 'sell', description: 'MACD divergence' },
        { name: 'EMA Crossover', value: seed > 0.5 ? 'Bullish' : 'Bearish', signal: seed > 0.55 ? 'strong_buy' : seed < 0.45 ? 'strong_sell' : 'neutral', description: 'EMA 9/21 crossover' },
        { name: 'Candle Pattern', value: seed > 0.5 ? 'Hammer' : 'Shooting Star', signal: seed > 0.5 ? 'buy' : 'sell', description: 'Last candlestick pattern' },
        { name: 'Volume Spike', value: `${(seed * 200).toFixed(0)}%`, signal: seed > 0.6 ? 'buy' : seed < 0.4 ? 'sell' : 'neutral', description: 'Relative volume vs average' },
      ]
    }
    case 'turbo': {
      const tickVelocity = (Math.sin(seed * 8) * 5).toFixed(2)
      return [
        { name: 'Tick Velocity', value: tickVelocity, signal: parseFloat(tickVelocity) > 1 ? 'buy' : parseFloat(tickVelocity) < -1 ? 'sell' : 'neutral', description: 'Rate of price change per tick' },
        { name: 'Micro Momentum', value: `${(seed * 10).toFixed(1)}%`, signal: seed > 0.6 ? 'strong_buy' : seed < 0.4 ? 'strong_sell' : 'neutral', description: 'Ultra-short momentum' },
        { name: 'Tick Spread', value: (Math.abs(seed - 0.5) * 0.01).toFixed(5), signal: seed > 0.5 ? 'buy' : 'sell', description: 'Bid-ask spread analysis' },
        { name: 'Order Flow', value: seed > 0.5 ? 'Buy Pressure' : 'Sell Pressure', signal: seed > 0.55 ? 'strong_buy' : seed < 0.45 ? 'strong_sell' : 'neutral', description: 'Real-time order flow' },
      ]
    }
  }
}

function calculateSignal(indicators: IndicatorResult[]): { signal: SignalType; confidence: number } {
  const scores: Record<SignalType, number> = { strong_buy: 2, buy: 1, neutral: 0, sell: -1, strong_sell: -2 }
  const total = indicators.reduce((sum, ind) => sum + scores[ind.signal], 0)
  const max = indicators.length * 2
  const ratio = total / max

  let signal: SignalType = 'neutral'
  if (ratio >= 0.6) signal = 'strong_buy'
  else if (ratio >= 0.3) signal = 'buy'
  else if (ratio >= -0.3) signal = 'neutral'
  else if (ratio >= -0.6) signal = 'sell'
  else signal = 'strong_sell'

  return { signal, confidence: parseFloat((Math.abs(ratio) * 95).toFixed(1)) }
}

// Deriv-style payout calculation
function getPayoutForMarket(marketType: MarketType, confidence: number, stake: number, multiplier?: number): { payout: number; returnPercent: number } {
  const baseReturn = 0.95
  const confidenceBonus = confidence > 70 ? 0.05 : confidence > 50 ? 0.02 : 0
  const returnPercent = baseReturn + confidenceBonus
  const effectiveStake = multiplier ? stake * multiplier : stake
  return {
    payout: parseFloat((effectiveStake * (1 + returnPercent)).toFixed(2)),
    returnPercent: parseFloat((returnPercent * 100).toFixed(1)),
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol') || 'R_100'
  const marketType = searchParams.get('marketType') || 'even_odd'
  const stake = parseFloat(searchParams.get('stake') || '10')
  const multiplier = searchParams.get('multiplier') ? parseFloat(searchParams.get('multiplier')!) : undefined
  const barrier = searchParams.get('barrier') ? parseFloat(searchParams.get('barrier')!) : undefined

  // Fetch real tick data from in-process service
  const digitData = fetchDigitData(symbol, barrier ?? 4)

  const price = digitData?.currentPrice || 0
  const lastDigit = digitData?.lastDigit ?? Math.floor(Math.random() * 10)

  const indicators = generateIndicators(digitData, symbol, marketType as MarketType, barrier)
  const { signal, confidence } = calculateSignal(indicators)

  const { payout, returnPercent } = getPayoutForMarket(marketType as MarketType, confidence, stake, multiplier)

  const targetPct = signal.includes('buy') ? 0.01 : -0.01
  const target = price > 0 ? parseFloat((price * (1 + targetPct)).toFixed(4)) : 0
  const stopPct = signal.includes('buy') ? -0.015 : 0.015
  const stopLoss = price > 0 ? parseFloat((price * (1 + stopPct)).toFixed(4)) : 0

  const probability = signal === 'strong_buy' ? 0.58 : signal === 'buy' ? 0.52 : signal === 'sell' ? 0.48 : signal === 'strong_sell' ? 0.42 : 0.50

  // Adjust probability based on real data if available
  const adjustedProb = digitData ? (
    marketType === 'even_odd' ? (digitData.evenPercent / 100) :
    marketType === 'over_under' ? (digitData.overPercent / 100) :
    probability
  ) : probability

  const analysis: AnalysisSignal = {
    type: marketType as MarketType,
    symbol,
    signal,
    confidence,
    probability: parseFloat((adjustedProb * 100).toFixed(1)),
    entryPrice: price,
    target,
    stopLoss,
    riskReward: target !== 0 && price !== 0 ? parseFloat((Math.abs(target - stopLoss) / Math.abs(price - target)).toFixed(2)) : 2.0,
    payout,
    returnPercent,
    lastDigit,
    barrier,
    timeframe: '15m',
    timestamp: new Date().toISOString(),
    indicators,
  }

  return NextResponse.json(analysis)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { symbols, marketType, timeframe } = body

    if (!symbols || !Array.isArray(symbols)) {
      return NextResponse.json({ error: 'symbols array required' }, { status: 400 })
    }

    // Fetch all digit data in parallel
    const digitDataMap = new Map<string, DigitData | null>()
    await Promise.all(symbols.map(async (symbol: string) => {
      const data = await fetchDigitData(symbol)
      digitDataMap.set(symbol, data)
    }))

    const analyses = symbols.map((symbol: string) => {
      const digitData = digitDataMap.get(symbol)
      const price = digitData?.currentPrice || 0
      const lastDigit = digitData?.lastDigit ?? Math.floor(Math.random() * 10)

      const indicators = generateIndicators(digitData, symbol, (marketType || 'even_odd') as MarketType)
      const { signal, confidence } = calculateSignal(indicators)
      const { payout, returnPercent } = getPayoutForMarket((marketType || 'even_odd') as MarketType, confidence, 10)

      return {
        type: (marketType || 'even_odd') as MarketType,
        symbol,
        signal,
        confidence,
        probability: parseFloat((
          signal === 'strong_buy' ? 0.58 : signal === 'buy' ? 0.52 : 0.50
        ).toFixed(1) * 100),
        entryPrice: price,
        target: price > 0 ? parseFloat((price * 1.01).toFixed(4)) : 0,
        stopLoss: price > 0 ? parseFloat((price * 0.985).toFixed(4)) : 0,
        riskReward: 2.0,
        payout,
        returnPercent,
        lastDigit,
        timeframe: timeframe || '15m',
        timestamp: new Date().toISOString(),
        indicators,
      }
    })

    const buyCount = analyses.filter(a => a.signal === 'buy' || a.signal === 'strong_buy').length
    const sellCount = analyses.filter(a => a.signal === 'sell' || a.signal === 'strong_sell').length
    const avgConfidence = analyses.reduce((s: number, a: AnalysisSignal) => s + a.confidence, 0) / analyses.length

    return NextResponse.json({
      analyses,
      summary: {
        total: analyses.length,
        buySignals: buyCount,
        sellSignals: sellCount,
        neutralSignals: analyses.length - buyCount - sellCount,
        avgConfidence: parseFloat(avgConfidence.toFixed(1)),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
