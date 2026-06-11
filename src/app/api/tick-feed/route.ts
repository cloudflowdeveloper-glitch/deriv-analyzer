import { NextResponse } from 'next/server'

const TICK_FEED_PORT = 3004
const TICK_FEED_BASE = `http://localhost:${TICK_FEED_PORT}`

// Proxy all tick-feed REST requests to the tick-feed mini-service
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path') || '/api/health'

  try {
    const url = `${TICK_FEED_BASE}${path}`

    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Tick feed unavailable', status: res.status }, { status: res.status })
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
