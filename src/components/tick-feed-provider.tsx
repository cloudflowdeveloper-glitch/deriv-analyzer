'use client'

import { useEffect } from 'react'
import { useTickFeed } from '@/hooks/use-tick-feed'

/**
 * Initializes the tick-feed WebSocket connection.
 * Place this inside Providers so it runs once at app startup.
 */
export function TickFeedProvider({ children }: { children: React.ReactNode }) {
  const { connected } = useTickFeed()

  // The hook handles connection lifecycle internally
  // We just render children - connection happens automatically
  return <>{children}</>
}
