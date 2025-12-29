import { WebSocket } from 'ws'

import { ServerMessage } from '../types'
import { HandlerContext } from './types'

export const handleHeartbeatIntervalUpdate = (
  context: HandlerContext,
  ws: WebSocket,
  message: ServerMessage
): void => {
  const payload = message.payload as { interval?: number } | undefined
  if (payload && typeof payload.interval === 'number' && payload.interval >= 1000) {
    context.setHeartbeatInterval(payload.interval)
    console.info('[Server] Heartbeat interval updated:', payload.interval)

    // Restart heartbeat with new interval
    context.restartHeartbeat()

    context.broadcast({
      type: 'heartbeatInterval:updated',
      payload: { interval: payload.interval }
    })
  } else {
    context.sendToClient(ws, {
      type: 'heartbeatInterval:error',
      payload: { error: 'Invalid interval value (minimum 1000ms)' }
    })
  }
}

export const handleDroneCountUpdate = (
  context: HandlerContext,
  ws: WebSocket,
  message: ServerMessage
): void => {
  const payload = message.payload as { count?: number } | undefined
  if (payload && typeof payload.count === 'number' && payload.count >= 0) {
    context.droneManager.setDroneCount(payload.count)

    context.broadcast({
      type: 'droneCount:updated',
      payload: {
        count: context.droneManager.getDroneCount(),
        drones: context.droneManager.getDronesArray()
      }
    })
  } else {
    context.sendToClient(ws, {
      type: 'droneCount:error',
      payload: { error: 'Invalid count value (minimum 0)' }
    })
  }
}

export const handleDroneUpdateIntervalUpdate = (
  context: HandlerContext,
  ws: WebSocket,
  message: ServerMessage
): void => {
  const payload = message.payload as { interval?: number } | undefined
  if (payload && typeof payload.interval === 'number' && payload.interval >= 100) {
    context.setDroneUpdateInterval(payload.interval)
    console.info('[Server] Drone update interval updated:', payload.interval)

    // Restart drone updates with new interval
    context.restartDroneUpdates()

    context.broadcast({
      type: 'droneUpdateInterval:updated',
      payload: { interval: payload.interval }
    })
  } else {
    context.sendToClient(ws, {
      type: 'droneUpdateInterval:error',
      payload: { error: 'Invalid interval value (minimum 100ms)' }
    })
  }
}

export const handleDroneVerticalSpeedUpdate = (
  context: HandlerContext,
  ws: WebSocket,
  message: ServerMessage
): void => {
  const payload = message.payload as { speed?: number } | undefined
  if (payload && typeof payload.speed === 'number' && payload.speed > 0) {
    context.setDroneVerticalSpeed(payload.speed)
    console.info('[Server] Drone vertical speed updated:', payload.speed)

    context.broadcast({
      type: 'droneVerticalSpeed:updated',
      payload: { speed: payload.speed }
    })
  } else {
    context.sendToClient(ws, {
      type: 'droneVerticalSpeed:error',
      payload: { error: 'Invalid speed value (must be > 0)' }
    })
  }
}

export const handleDroneFlySpeedUpdate = (
  context: HandlerContext,
  ws: WebSocket,
  message: ServerMessage
): void => {
  const payload = message.payload as { speed?: number } | undefined
  if (payload && typeof payload.speed === 'number' && payload.speed > 0) {
    context.setDroneFlySpeed(payload.speed)
    console.info('[Server] Drone fly speed updated:', payload.speed)

    context.broadcast({
      type: 'droneFlySpeed:updated',
      payload: { speed: payload.speed }
    })
  } else {
    context.sendToClient(ws, {
      type: 'droneFlySpeed:error',
      payload: { error: 'Invalid speed value (must be > 0)' }
    })
  }
}
