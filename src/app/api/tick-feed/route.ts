import { NextResponse } from 'next/server'

const TICK_FEED_PORT = 3004
const TICK_FEED_BASE = `http://localhost:${TICK_FEED_PORT}`

// Proxy all tick-feed REST requests to the tick-feed mini-service
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'health'

  // Map action to tick-feed path, forward other params
  const otherParams = new URLSearchParams()
  for (const [key, value] of searchParams) {
    if (key !== 'action') otherParams.set(key, value)
  }

  const pathMap: Record<string, string> = {
    health: '/api/health',
    price: '/api/price',
    ticks: '/api/ticks',
    digits: '/api/digits',
    'all-prices': '/api/all-prices',
    symbols: '/api/symbols',
    predict: '/api/predict',
  }

  const basePath = pathMap[action] || `/api/${action}`
  const queryStr = otherParams.toString()
  const url = `${TICK_FEED_BASE}${basePath}${queryStr ? `?${queryStr}` : ''}`

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Tick feed error', status: res.status, path: basePath }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { error: 'Tick feed service unavailable', message: err instanceof Error ? err.message : 'Unknown error' },
      { status: 503 }
    )
  }
}
