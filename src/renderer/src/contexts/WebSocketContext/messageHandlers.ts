import { QueryClient } from '@tanstack/react-query'

import { queryKeys } from '@renderer/hooks/queries/queryKeys'
import {
  BaseMoveDurationPayload,
  BaseMovement,
  BaseMovingPayload,
  BasePosition,
  BasePositionPayload,
  HeartbeatIntervalPayload,
  HeartbeatPayload,
  ServerConfig,
  WebSocketMessage
} from './types'

export interface MessageHandlerContext {
  queryClient: QueryClient
  showHeartbeatLogRef: React.RefObject<boolean>
  heartbeatFailCountRef: React.MutableRefObject<number>
  heartbeatTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>
  onHeartbeatTimeout: () => void
}

export const createMessageHandler = (context: MessageHandlerContext) => {
  const {
    queryClient,
    showHeartbeatLogRef,
    heartbeatFailCountRef,
    heartbeatTimeoutRef,
    onHeartbeatTimeout
  } = context

  return (message: WebSocketMessage): void => {
    switch (message.type) {
      case 'heartbeat':
        handleHeartbeat(message as WebSocketMessage<HeartbeatPayload>)
        break
      case 'basePosition:updated':
        handleBasePositionUpdated(message as WebSocketMessage<BasePositionPayload>)
        break
      case 'basePosition:moving':
        handleBasePositionMoving(message as WebSocketMessage<BaseMovingPayload>)
        break
      case 'basePosition:error':
        console.error('[Client] Base position update failed:', message.payload)
        break
      case 'baseMoveDuration:updated':
        handleBaseMoveDurationUpdated(message as WebSocketMessage<BaseMoveDurationPayload>)
        break
      case 'baseMoveDuration:error':
        console.error('[Client] Base move duration update failed:', message.payload)
        break
      case 'heartbeatInterval:updated':
        handleHeartbeatIntervalUpdated(message as WebSocketMessage<HeartbeatIntervalPayload>)
        break
      case 'heartbeatInterval:error':
        console.error('[Client] Heartbeat interval update failed:', message.payload)
        break
      default:
        console.info('[Client] Received:', message)
    }
  }

  function handleHeartbeat(message: WebSocketMessage<HeartbeatPayload>): void {
    if (showHeartbeatLogRef.current) {
      console.info('[Client] Received:', message)
    }

    // Reset fail count on successful heartbeat
    heartbeatFailCountRef.current = 0
    queryClient.setQueryData(queryKeys.connection.status(), 'connected')

    // Only update data on init heartbeat (first message after connection)
    if (message.payload?.init) {
      // Update base position
      if (message.payload?.basePosition) {
        const { lat, lng } = message.payload.basePosition
        queryClient.setQueryData<BasePosition>(queryKeys.map.basePosition(), { lat, lng })
      }

      // Update server config
      if (message.payload?.config) {
        const { baseMoveDuration, heartbeatInterval } = message.payload.config
        queryClient.setQueryData<ServerConfig>(queryKeys.server.config(), {
          baseMoveDuration,
          heartbeatInterval
        })
      }
    }

    // Clear previous timeout
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current)
    }

    // Set timeout for next heartbeat (expect within 5 seconds)
    heartbeatTimeoutRef.current = setTimeout(() => {
      heartbeatFailCountRef.current += 1
      console.info('[Client] Heartbeat missed, fail count:', heartbeatFailCountRef.current)

      if (heartbeatFailCountRef.current >= 3) {
        console.info('[Client] 3 heartbeats missed, disconnecting')
        onHeartbeatTimeout()
      }
    }, 5000)
  }

  function handleBasePositionMoving(message: WebSocketMessage<BaseMovingPayload>): void {
    console.info('[Client] Base position moving:', message.payload)
    if (message.payload) {
      const { target, duration } = message.payload
      const currentPosition = queryClient.getQueryData<BasePosition>(queryKeys.map.basePosition())

      if (currentPosition) {
        queryClient.setQueryData<BaseMovement>(queryKeys.map.baseMovement(), {
          from: currentPosition,
          to: target,
          duration
        })
      }
    }
  }

  function handleBasePositionUpdated(message: WebSocketMessage<BasePositionPayload>): void {
    console.info('[Client] Base position updated:', message.payload)
    if (message.payload) {
      const { lat, lng } = message.payload
      queryClient.setQueryData<BasePosition>(queryKeys.map.basePosition(), { lat, lng })
      // Clear movement when position is updated
      queryClient.setQueryData<BaseMovement | null>(queryKeys.map.baseMovement(), null)
    }
  }

  function handleBaseMoveDurationUpdated(message: WebSocketMessage<BaseMoveDurationPayload>): void {
    console.info('[Client] Base move duration updated:', message.payload)
    if (message.payload) {
      const { duration } = message.payload
      queryClient.setQueryData<ServerConfig>(queryKeys.server.config(), (prev) => ({
        baseMoveDuration: duration,
        heartbeatInterval: prev?.heartbeatInterval ?? 3000
      }))
    }
  }

  function handleHeartbeatIntervalUpdated(
    message: WebSocketMessage<HeartbeatIntervalPayload>
  ): void {
    console.info('[Client] Heartbeat interval updated:', message.payload)
    if (message.payload) {
      const { interval } = message.payload
      queryClient.setQueryData<ServerConfig>(queryKeys.server.config(), (prev) => ({
        baseMoveDuration: prev?.baseMoveDuration ?? 0,
        heartbeatInterval: interval
      }))
    }
  }
}
