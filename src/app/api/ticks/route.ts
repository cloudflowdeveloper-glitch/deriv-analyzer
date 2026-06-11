import { NextResponse } from 'next/server'
import {
  initDerivTicks,
  getDigitAnalysis,
  getPrice,
  getAllPrices,
  resolveSymbol,
  getHealth,
  getPrediction,
  DERIV_SYMBOLS,
} from '@/lib/deriv-ticks'

// Initialize on first API call
let initCalled = false

function ensureInit() {
  if (!initCalled) {
    initCalled = true
    // Initialize in the background so it doesn't block the response
    setTimeout(() => initDerivTicks(), 0)
  }
}

// ─── GET /api/ticks?action=health|all-prices|price|digits|symbols ──
export async function GET(request: Request) {
  ensureInit()

  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'health'

  switch (action) {
    case 'health':
      return NextResponse.json(getHealth())

    case 'all-prices': {
      const prices = getAllPrices()
      return NextResponse.json({ prices, total: prices.length, timestamp: new Date().toISOString() })
    }

    case 'price': {
      const symbol = searchParams.get('symbol') || ''
      const resolvedId = resolveSymbol(symbol)
      if (!resolvedId) {
        return NextResponse.json({ error: 'Symbol not found', symbol }, { status: 404 })
      }
      const data = getPrice(resolvedId)
      if (!data) {
        return NextResponse.json({ error: 'No price data yet', symbol }, { status: 404 })
      }
      return NextResponse.json({
        symbol: data.tvSymbol,
        name: data.name,
        price: data.price,
        lastDigit: data.lastDigit,
        timestamp: new Date().toISOString(),
      })
    }

    case 'digits': {
      const symbol = searchParams.get('symbol') || ''
      const barrier = parseInt(searchParams.get('barrier') || '4')
      const resolvedId = resolveSymbol(symbol)
      if (!resolvedId) {
        return NextResponse.json({ error: 'Symbol not found', symbol }, { status: 404 })
      }
      const analysis = getDigitAnalysis(resolvedId, barrier)
      if (!analysis) {
        return NextResponse.json({ error: 'No data yet for symbol', symbol }, { status: 404 })
      }
      return NextResponse.json(analysis)
    }

    case 'symbols': {
      return NextResponse.json({
        symbols: DERIV_SYMBOLS.map(s => ({ id: s.id, deriv: s.deriv, tv: s.tv, name: s.name, category: s.category, pipSize: s.pipSize })),
        total: DERIV_SYMBOLS.length,
      })
    }

    case 'predict': {
      const symbol = searchParams.get('symbol') || ''
      const marketType = searchParams.get('marketType') || 'even_odd'
      const barrier = parseInt(searchParams.get('barrier') || '4')
      const differsDigit = searchParams.has('differsDigit')
        ? parseInt(searchParams.get('differsDigit')!)
        : undefined
      const windowSize = parseInt(searchParams.get('window') || '5')
      const resolvedId = resolveSymbol(symbol)
      if (!resolvedId) {
        return NextResponse.json({ error: 'Symbol not found', symbol }, { status: 404 })
      }
      const prediction = getPrediction(resolvedId, marketType, barrier, differsDigit, windowSize)
      if (!prediction) {
        return NextResponse.json({ error: 'Insufficient data', symbol }, { status: 404 })
      }
      return NextResponse.json(prediction)
    }

    default:
      return NextResponse.json({ error: 'Unknown action', available: ['health', 'all-prices', 'price', 'digits', 'symbols', 'predict'] }, { status: 400 })
  }
}
