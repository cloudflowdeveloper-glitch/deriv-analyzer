'use client'

import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useMarketStore } from '@/stores/market-store'
import { MarketEvent, AnalysisSnapshot, MarketUpdatePayload } from '@/lib/market-types'

export function useMarketSocket() {
  const socketRef = useRef<Socket | null>(null)
  const {
    setEvents,
    setConnected,
    updateMarket,
    setSnapshot,
    isConnected,
  } = useMarketStore()

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return

    const socket = io('/?XTransformPort=3003', {
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 15000,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('Market feed connected')
      setConnected(true)
    })

    socket.on('disconnect', () => {
      console.log('Market feed disconnected')
      setConnected(false)
    })

    socket.on('init', (data: { events: MarketEvent[]; snapshot: AnalysisSnapshot; timestamp: string }) => {
      setEvents(data.events)
      setSnapshot(data.snapshot)
    })

    socket.on('market-update', (data: MarketUpdatePayload) => {
      updateMarket(data)
    })

    socket.on('snapshot', (data: AnalysisSnapshot) => {
      setSnapshot(data)
    })

    socket.on('event-live', (event: MarketEvent) => {
      // Refresh all events when one goes live
      useMarketStore.getState().setEvents(
        useMarketStore.getState().events.map(e =>
          e.id === event.id ? event : e
        )
      )
    })
  }, [setEvents, setConnected, updateMarket, setSnapshot])

  const subscribe = useCallback((marketType: string) => {
    socketRef.current?.emit('subscribe', { marketType })
  }, [])

  useEffect(() => {
    connect()
    return () => {
      socketRef.current?.disconnect()
    }
  }, [connect])

  return { isConnected, subscribe }
}
