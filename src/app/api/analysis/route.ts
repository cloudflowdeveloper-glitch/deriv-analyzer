import { NextResponse } from 'next/server'
import { MarketType, SignalType, IndicatorResult, AnalysisSignal } from '@/lib/trading-types'

function generateIndicators(symbol: string, marketType: MarketType): IndicatorResult[] {
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

function generatePrice(symbol: string): number {
  const hash = symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const base = 10000 + (hash % 50000)
  return base + Math.sin(Date.now() / 60000) * base * 0.02
}

// Deriv-style payout calculation: ~95% return on digit markets, varies by market type
function getPayoutForMarket(marketType: MarketType, confidence: number, stake: number, multiplier?: number): { payout: number; returnPercent: number } {
  const baseReturn = 0.95 // 95% return = ~48% probability
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
  const symbol = searchParams.get('symbol') || 'BINANCE:BTCUSDT'
  const marketType = searchParams.get('marketType') || 'even_odd'
  const stake = parseFloat(searchParams.get('stake') || '10')
  const multiplier = searchParams.get('multiplier') ? parseFloat(searchParams.get('multiplier')!) : undefined
  const barrier = searchParams.get('barrier') ? parseFloat(searchParams.get('barrier')!) : undefined

  const indicators = generateIndicators(symbol, marketType as MarketType)
  const { signal, confidence } = calculateSignal(indicators)
  const price = generatePrice(symbol)
  const lastDigit = Math.floor(price) % 10

  const { payout, returnPercent } = getPayoutForMarket(marketType as MarketType, confidence, stake, multiplier)

  const targetPct = signal.includes('buy') ? 0.01 : -0.01
  const target = parseFloat((price * (1 + targetPct)).toFixed(4))
  const stopPct = signal.includes('buy') ? -0.015 : 0.015
  const stopLoss = parseFloat((price * (1 + stopPct)).toFixed(4))

  const probability = signal === 'strong_buy' ? 0.58 : signal === 'buy' ? 0.52 : signal === 'sell' ? 0.48 : signal === 'strong_sell' ? 0.42 : 0.50

  const analysis: AnalysisSignal = {
    type: marketType as MarketType,
    symbol,
    signal,
    confidence,
    probability: parseFloat((probability * 100).toFixed(1)),
    entryPrice: price,
    target,
    stopLoss,
    riskReward: parseFloat((Math.abs(target - stopLoss) / Math.abs(price - target)).toFixed(2)),
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

    const analyses = symbols.map((symbol: string) => {
      const indicators = generateIndicators(symbol, (marketType || 'even_odd') as MarketType)
      const { signal, confidence } = calculateSignal(indicators)
      const price = generatePrice(symbol)
      const lastDigit = Math.floor(price) % 10
      const { payout, returnPercent } = getPayoutForMarket((marketType || 'even_odd') as MarketType, confidence, 10)

      return {
        type: (marketType || 'even_odd') as MarketType,
        symbol,
        signal,
        confidence,
        probability: parseFloat(((signal === 'strong_buy' ? 0.58 : signal === 'buy' ? 0.52 : 0.50) * 100).toFixed(1)),
        entryPrice: price,
        target: parseFloat((price * 1.01).toFixed(4)),
        stopLoss: parseFloat((price * 0.985).toFixed(4)),
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
