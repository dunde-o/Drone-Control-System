import { QueryClient } from '@tanstack/react-query'

import { queryKeys } from '@renderer/hooks/queries/queryKeys'
import {
  BaseAltitudePayload,
  BaseMoveDurationPayload,
  BaseMovement,
  BaseMovingPayload,
  BasePosition,
  BasePositionPayload,
  Drone,
  DroneCountUpdatedPayload,
  DroneFlySpeedPayload,
  DronesUpdatePayload,
  DroneUpdatedPayload,
  DroneUpdateIntervalPayload,
  DroneVerticalSpeedPayload,
  HeartbeatIntervalPayload,
  HeartbeatPayload,
  ServerConfig,
  WebSocketMessage
} from './types'

export interface MessageHandlerContext {
  queryClient: QueryClient
  showHeartbeatLogRef: React.RefObject<boolean>
  showDroneLogRef: React.RefObject<boolean>
  heartbeatFailCountRef: React.MutableRefObject<number>
  heartbeatTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>
  onHeartbeatTimeout: () => void
}

export const createMessageHandler = (context: MessageHandlerContext) => {
  const {
    queryClient,
    showHeartbeatLogRef,
    showDroneLogRef,
    heartbeatFailCountRef,
    heartbeatTimeoutRef,
    onHeartbeatTimeout
  } = context

  const handleHeartbeat = (message: WebSocketMessage<HeartbeatPayload>): void => {
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

      // Update drones list
      if (message.payload?.drones) {
        queryClient.setQueryData<Drone[]>(queryKeys.drones.list(), message.payload.drones)
      }

      // Update server config
      if (message.payload?.config) {
        queryClient.setQueryData<ServerConfig>(queryKeys.server.config(), message.payload.config)
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

  const handleBasePositionMoving = (message: WebSocketMessage<BaseMovingPayload>): void => {
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

  const handleBasePositionUpdated = (message: WebSocketMessage<BasePositionPayload>): void => {
    console.info('[Client] Base position updated:', message.payload)
    if (message.payload) {
      const { lat, lng } = message.payload
      queryClient.setQueryData<BasePosition>(queryKeys.map.basePosition(), { lat, lng })
      // Clear movement when position is updated
      queryClient.setQueryData<BaseMovement | null>(queryKeys.map.baseMovement(), null)
    }
  }

  const handleBaseMoveDurationUpdated = (
    message: WebSocketMessage<BaseMoveDurationPayload>
  ): void => {
    console.info('[Client] Base move duration updated:', message.payload)
    if (message.payload) {
      const { duration } = message.payload
      queryClient.setQueryData<ServerConfig>(queryKeys.server.config(), (prev) => ({
        baseMoveDuration: duration,
        heartbeatInterval: prev?.heartbeatInterval ?? 3000,
        droneUpdateInterval: prev?.droneUpdateInterval ?? 200,
        droneVerticalSpeed: prev?.droneVerticalSpeed ?? 5,
        droneFlySpeed: prev?.droneFlySpeed ?? 10,
        baseAltitude: prev?.baseAltitude ?? 50
      }))
    }
  }

  const handleHeartbeatIntervalUpdated = (
    message: WebSocketMessage<HeartbeatIntervalPayload>
  ): void => {
    console.info('[Client] Heartbeat interval updated:', message.payload)
    if (message.payload) {
      const { interval } = message.payload
      queryClient.setQueryData<ServerConfig>(queryKeys.server.config(), (prev) => ({
        baseMoveDuration: prev?.baseMoveDuration ?? 0,
        heartbeatInterval: interval,
        droneUpdateInterval: prev?.droneUpdateInterval ?? 200,
        droneVerticalSpeed: prev?.droneVerticalSpeed ?? 5,
        droneFlySpeed: prev?.droneFlySpeed ?? 10,
        baseAltitude: prev?.baseAltitude ?? 50
      }))
    }
  }

  const handleDroneCountUpdated = (message: WebSocketMessage<DroneCountUpdatedPayload>): void => {
    console.info('[Client] Drone count updated:', message.payload)
    if (message.payload) {
      const { drones } = message.payload
      queryClient.setQueryData<Drone[]>(queryKeys.drones.list(), drones)
    }
  }

  const handleDroneUpdated = (message: WebSocketMessage<DroneUpdatedPayload>): void => {
    console.info('[Client] Drone updated:', message.payload)
    if (message.payload) {
      const { drone } = message.payload
      queryClient.setQueryData<Drone[]>(queryKeys.drones.list(), (prev) => {
        if (!prev) return [drone]
        return prev.map((d) => (d.id === drone.id ? drone : d))
      })
    }
  }

  const handleDronesUpdate = (message: WebSocketMessage<DronesUpdatePayload>): void => {
    if (showDroneLogRef.current) {
      console.info('[Client] Drones update:', message.payload)
    }
    if (message.payload) {
      const { drones: newDrones } = message.payload
      queryClient.setQueryData<Drone[]>(queryKeys.drones.list(), (prev) => {
        if (!prev) return newDrones

        // 변경된 드론이 있는지 확인
        let hasChanges = false
        const updatedDrones = prev.map((prevDrone) => {
          const newDrone = newDrones.find((d) => d.id === prevDrone.id)
          if (!newDrone) return prevDrone

          // 변경 감지: 위치, 상태, 배터리, 고도 비교
          const changed =
            prevDrone.position.lat !== newDrone.position.lat ||
            prevDrone.position.lng !== newDrone.position.lng ||
            prevDrone.status !== newDrone.status ||
            prevDrone.battery !== newDrone.battery ||
            prevDrone.altitude !== newDrone.altitude

          if (changed) {
            hasChanges = true
            return newDrone
          }
          return prevDrone
        })

        // 변경이 없으면 이전 배열 참조 유지 (리렌더링 방지)
        return hasChanges ? updatedDrones : prev
      })
    }
  }

  const handleDroneUpdateIntervalUpdated = (
    message: WebSocketMessage<DroneUpdateIntervalPayload>
  ): void => {
    console.info('[Client] Drone update interval updated:', message.payload)
    if (message.payload) {
      const { interval } = message.payload
      queryClient.setQueryData<ServerConfig>(queryKeys.server.config(), (prev) => ({
        baseMoveDuration: prev?.baseMoveDuration ?? 0,
        heartbeatInterval: prev?.heartbeatInterval ?? 3000,
        droneUpdateInterval: interval,
        droneVerticalSpeed: prev?.droneVerticalSpeed ?? 5,
        droneFlySpeed: prev?.droneFlySpeed ?? 10,
        baseAltitude: prev?.baseAltitude ?? 50
      }))
    }
  }

  const handleDroneVerticalSpeedUpdated = (
    message: WebSocketMessage<DroneVerticalSpeedPayload>
  ): void => {
    console.info('[Client] Drone vertical speed updated:', message.payload)
    if (message.payload) {
      const { speed } = message.payload
      queryClient.setQueryData<ServerConfig>(queryKeys.server.config(), (prev) => ({
        baseMoveDuration: prev?.baseMoveDuration ?? 0,
        heartbeatInterval: prev?.heartbeatInterval ?? 3000,
        droneUpdateInterval: prev?.droneUpdateInterval ?? 200,
        droneVerticalSpeed: speed,
        droneFlySpeed: prev?.droneFlySpeed ?? 10,
        baseAltitude: prev?.baseAltitude ?? 50
      }))
    }
  }

  const handleDroneFlySpeedUpdated = (message: WebSocketMessage<DroneFlySpeedPayload>): void => {
    console.info('[Client] Drone fly speed updated:', message.payload)
    if (message.payload) {
      const { speed } = message.payload
      queryClient.setQueryData<ServerConfig>(queryKeys.server.config(), (prev) => ({
        baseMoveDuration: prev?.baseMoveDuration ?? 0,
        heartbeatInterval: prev?.heartbeatInterval ?? 3000,
        droneUpdateInterval: prev?.droneUpdateInterval ?? 200,
        droneVerticalSpeed: prev?.droneVerticalSpeed ?? 5,
        droneFlySpeed: speed,
        baseAltitude: prev?.baseAltitude ?? 50
      }))
    }
  }

  const handleBaseAltitudeUpdated = (message: WebSocketMessage<BaseAltitudePayload>): void => {
    console.info('[Client] Base altitude updated:', message.payload)
    if (message.payload) {
      const { altitude } = message.payload
      queryClient.setQueryData<ServerConfig>(queryKeys.server.config(), (prev) => ({
        baseMoveDuration: prev?.baseMoveDuration ?? 0,
        heartbeatInterval: prev?.heartbeatInterval ?? 3000,
        droneUpdateInterval: prev?.droneUpdateInterval ?? 200,
        droneVerticalSpeed: prev?.droneVerticalSpeed ?? 5,
        droneFlySpeed: prev?.droneFlySpeed ?? 10,
        baseAltitude: altitude
      }))
    }
  }

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
      case 'droneCount:updated':
        handleDroneCountUpdated(message as WebSocketMessage<DroneCountUpdatedPayload>)
        break
      case 'droneCount:error':
        console.error('[Client] Drone count update failed:', message.payload)
        break
      case 'drone:updated':
        handleDroneUpdated(message as WebSocketMessage<DroneUpdatedPayload>)
        break
      case 'drone:error':
        console.error('[Client] Drone update failed:', message.payload)
        break
      case 'drones:update':
        handleDronesUpdate(message as WebSocketMessage<DronesUpdatePayload>)
        break
      case 'droneUpdateInterval:updated':
        handleDroneUpdateIntervalUpdated(message as WebSocketMessage<DroneUpdateIntervalPayload>)
        break
      case 'droneUpdateInterval:error':
        console.error('[Client] Drone update interval update failed:', message.payload)
        break
      case 'droneVerticalSpeed:updated':
        handleDroneVerticalSpeedUpdated(message as WebSocketMessage<DroneVerticalSpeedPayload>)
        break
      case 'droneVerticalSpeed:error':
        console.error('[Client] Drone vertical speed update failed:', message.payload)
        break
      case 'droneFlySpeed:updated':
        handleDroneFlySpeedUpdated(message as WebSocketMessage<DroneFlySpeedPayload>)
        break
      case 'droneFlySpeed:error':
        console.error('[Client] Drone fly speed update failed:', message.payload)
        break
      case 'baseAltitude:updated':
        handleBaseAltitudeUpdated(message as WebSocketMessage<BaseAltitudePayload>)
        break
      case 'baseAltitude:error':
        console.error('[Client] Base altitude update failed:', message.payload)
        break
      default:
        console.info('[Client] Received:', message)
    }
  }
}
