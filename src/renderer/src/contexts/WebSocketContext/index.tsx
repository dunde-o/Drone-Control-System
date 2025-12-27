import { useRef, useCallback, useEffect, PropsWithChildren } from 'react'

import { useQueryClient, useQuery } from '@tanstack/react-query'

import { queryKeys } from '@renderer/hooks/queries/queryKeys'
import { WebSocketContext } from './context'
import { createMessageHandler } from './messageHandlers'
import { ConnectionStatus, WebSocketMessage } from './types'

export const WebSocketProvider = ({ children }: PropsWithChildren): React.JSX.Element => {
  const queryClient = useQueryClient()
  const wsRef = useRef<WebSocket | null>(null)
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const heartbeatFailCountRef = useRef(0)

  // Get showHeartbeatLog from query cache
  const { data: showHeartbeatLog = false } = useQuery({
    queryKey: queryKeys.settings.heartbeatLog(),
    queryFn: () => false,
    staleTime: Infinity
  })
  const showHeartbeatLogRef = useRef(showHeartbeatLog)

  // Update ref in effect to avoid lint error
  useEffect(() => {
    showHeartbeatLogRef.current = showHeartbeatLog
  }, [showHeartbeatLog])

  const clearConnection = useCallback((): void => {
    queryClient.setQueryData(queryKeys.connection.status(), 'disconnected')
    queryClient.setQueryData(queryKeys.map.basePosition(), null)
    queryClient.setQueryData(queryKeys.server.config(), null)
  }, [queryClient])

  const handleHeartbeatTimeout = useCallback((): void => {
    clearConnection()
    if (wsRef.current) {
      wsRef.current.close()
    }
  }, [clearConnection])

  const handleMessage = useCallback(
    (event: MessageEvent): void => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage
        const handler = createMessageHandler({
          queryClient,
          showHeartbeatLogRef,
          heartbeatFailCountRef,
          heartbeatTimeoutRef,
          onHeartbeatTimeout: handleHeartbeatTimeout
        })
        handler(message)
      } catch {
        console.error('[Client] Failed to parse message')
      }
    },
    [queryClient, handleHeartbeatTimeout]
  )

  const connect = useCallback(
    (host: string, port: string): void => {
      if (wsRef.current) {
        wsRef.current.close()
      }

      queryClient.setQueryData<ConnectionStatus>(queryKeys.connection.status(), 'connecting')
      heartbeatFailCountRef.current = 0

      const ws = new WebSocket(`ws://${host}:${port}`)
      wsRef.current = ws

      ws.onopen = (): void => {
        console.info('[Client] Connected to server')
        queryClient.setQueryData<ConnectionStatus>(queryKeys.connection.status(), 'connected')
        heartbeatFailCountRef.current = 0
      }

      ws.onmessage = handleMessage

      ws.onerror = (): void => {
        console.error('[Client] WebSocket error')
        queryClient.setQueryData<ConnectionStatus>(queryKeys.connection.status(), 'disconnected')
      }

      ws.onclose = (): void => {
        console.info('[Client] Disconnected from server')
        wsRef.current = null
        if (heartbeatTimeoutRef.current) {
          clearTimeout(heartbeatTimeoutRef.current)
          heartbeatTimeoutRef.current = null
        }
        clearConnection()
      }
    },
    [queryClient, handleMessage, clearConnection]
  )

  const disconnect = useCallback((): void => {
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current)
      heartbeatTimeoutRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    queryClient.setQueryData<ConnectionStatus>(queryKeys.connection.status(), 'disconnected')
  }, [queryClient])

  const sendMessage = useCallback(<T,>(message: WebSocketMessage<T>): void => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    }
  }, [])

  return (
    <WebSocketContext.Provider value={{ sendMessage, connect, disconnect }}>
      {children}
    </WebSocketContext.Provider>
  )
}

// Re-export hook for convenience
// eslint-disable-next-line react-refresh/only-export-components
export { useWebSocket } from './useWebSocket'
