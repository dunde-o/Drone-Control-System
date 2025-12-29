import { WebSocket } from 'ws'

import { ServerMessage } from '../types'
import { HandlerContext } from './types'

export const handleHealth = (context: HandlerContext, ws: WebSocket): void => {
  context.sendToClient(ws, {
    type: 'health',
    payload: { status: 'ok', timestamp: Date.now() }
  })
}

export const handleBasePositionUpdate = (
  context: HandlerContext,
  ws: WebSocket,
  message: ServerMessage
): void => {
  const payload = message.payload as { lat?: number; lng?: number } | undefined
  if (payload && typeof payload.lat === 'number' && typeof payload.lng === 'number') {
    // Cancel any pending move
    if (context.baseMoveTimeout) {
      clearTimeout(context.baseMoveTimeout)
    }

    const targetPosition = { lat: payload.lat, lng: payload.lng }
    console.info(
      `[Server] Base position moving to:`,
      targetPosition,
      `(duration: ${context.baseMoveDuration}ms)`
    )

    // Broadcast that move started
    context.broadcast({
      type: 'basePosition:moving',
      payload: { target: targetPosition, duration: context.baseMoveDuration }
    })

    // Update position after duration
    const timeout = setTimeout(() => {
      context.setBasePosition(targetPosition)
      console.info('[Server] Base position updated:', targetPosition)

      // Broadcast the update to all clients
      context.broadcast({
        type: 'basePosition:updated',
        payload: targetPosition
      })
      context.setBaseMoveTimeout(null)
    }, context.baseMoveDuration)

    context.setBaseMoveTimeout(timeout)
  } else {
    context.sendToClient(ws, {
      type: 'basePosition:error',
      payload: { error: 'Invalid lat/lng values' }
    })
  }
}

export const handleBaseMoveDurationUpdate = (
  context: HandlerContext,
  ws: WebSocket,
  message: ServerMessage
): void => {
  const payload = message.payload as { duration?: number } | undefined
  if (payload && typeof payload.duration === 'number' && payload.duration >= 0) {
    context.setBaseMoveDuration(payload.duration)
    console.info('[Server] Base move duration updated:', payload.duration)

    context.broadcast({
      type: 'baseMoveDuration:updated',
      payload: { duration: payload.duration }
    })
  } else {
    context.sendToClient(ws, {
      type: 'baseMoveDuration:error',
      payload: { error: 'Invalid duration value' }
    })
  }
}

export const handleBaseAltitudeUpdate = (
  context: HandlerContext,
  ws: WebSocket,
  message: ServerMessage
): void => {
  const payload = message.payload as { altitude?: number } | undefined
  if (payload && typeof payload.altitude === 'number' && payload.altitude > 0) {
    context.setBaseAltitude(payload.altitude)
    console.info('[Server] Base altitude updated:', payload.altitude)

    context.broadcast({
      type: 'baseAltitude:updated',
      payload: { altitude: payload.altitude }
    })
  } else {
    context.sendToClient(ws, {
      type: 'baseAltitude:error',
      payload: { error: 'Invalid altitude value (must be > 0)' }
    })
  }
}
