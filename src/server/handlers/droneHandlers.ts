import { WebSocket } from 'ws'

import { ServerMessage, Position } from '../types'
import { DRONE_STATUS, AIRBORNE_STATUSES } from '../constants'
import { HandlerContext } from './types'

export const handleDroneTakeoff = (
  context: HandlerContext,
  ws: WebSocket,
  message: ServerMessage
): void => {
  const payload = message.payload as { droneId?: string } | undefined
  if (payload && payload.droneId) {
    const drone = context.droneManager.getDrone(payload.droneId)
    if (drone && drone.status === DRONE_STATUS.IDLE) {
      drone.status = DRONE_STATUS.ASCENDING
      console.info(`[Server] Drone ${drone.id} taking off from current position`)

      context.broadcast({
        type: 'drone:updated',
        payload: { drone }
      })
    } else {
      context.sendToClient(ws, {
        type: 'drone:error',
        payload: { error: 'Drone not found or not in idle state' }
      })
    }
  }
}

export const handleDroneMove = (
  context: HandlerContext,
  ws: WebSocket,
  message: ServerMessage
): void => {
  const payload = message.payload as
    | {
        droneId?: string
        waypoints?: Position[]
        append?: boolean
      }
    | undefined

  if (payload && payload.droneId && Array.isArray(payload.waypoints)) {
    const drone = context.droneManager.getDrone(payload.droneId)
    if (drone && AIRBORNE_STATUSES.includes(drone.status)) {
      if (
        payload.append &&
        drone.status !== DRONE_STATUS.RETURNING &&
        drone.status !== DRONE_STATUS.RETURNING_AUTO
      ) {
        drone.waypoints.push(...payload.waypoints)
      } else {
        drone.waypoints = [...payload.waypoints]
      }
      drone.status = DRONE_STATUS.MOVING
      console.info(`[Server] Drone ${drone.id} moving to ${drone.waypoints.length} waypoint(s)`)

      context.broadcast({
        type: 'drone:updated',
        payload: { drone }
      })
    } else {
      context.sendToClient(ws, {
        type: 'drone:error',
        payload: { error: 'Drone not found or not in movable state' }
      })
    }
  }
}

export const handleDroneLand = (
  context: HandlerContext,
  ws: WebSocket,
  message: ServerMessage
): void => {
  const payload = message.payload as { droneId?: string } | undefined
  if (payload && payload.droneId) {
    const drone = context.droneManager.getDrone(payload.droneId)
    if (drone && AIRBORNE_STATUSES.includes(drone.status)) {
      drone.status = DRONE_STATUS.LANDING
      drone.waypoints = []
      console.info(`[Server] Drone ${drone.id} landing at current position`)

      context.broadcast({
        type: 'drone:updated',
        payload: { drone }
      })
    } else {
      context.sendToClient(ws, {
        type: 'drone:error',
        payload: { error: 'Drone not found or not in airborne state' }
      })
    }
  }
}

export const handleDroneReturnToBase = (
  context: HandlerContext,
  ws: WebSocket,
  message: ServerMessage
): void => {
  const payload = message.payload as { droneId?: string } | undefined
  if (payload && payload.droneId) {
    const drone = context.droneManager.getDrone(payload.droneId)
    if (drone && AIRBORNE_STATUSES.includes(drone.status)) {
      drone.status = DRONE_STATUS.RETURNING
      drone.waypoints = [{ ...context.basePosition }]
      console.info(`[Server] Drone ${drone.id} returning to base`)

      context.broadcast({
        type: 'drone:updated',
        payload: { drone }
      })
    } else {
      context.sendToClient(ws, {
        type: 'drone:error',
        payload: { error: 'Drone not found or not in airborne state' }
      })
    }
  }
}

export const handleAllTakeoff = (context: HandlerContext): void => {
  context.droneManager.takeoffAll()

  context.broadcast({
    type: 'drones:update',
    payload: { drones: context.droneManager.getDronesArray() }
  })
}

export const handleAllReturnToBase = (context: HandlerContext): void => {
  context.droneManager.returnAllToBase()

  context.broadcast({
    type: 'drones:update',
    payload: { drones: context.droneManager.getDronesArray() }
  })
}

export const handleAllRandomMove = (context: HandlerContext): void => {
  context.droneManager.randomMoveAll()

  context.broadcast({
    type: 'drones:update',
    payload: { drones: context.droneManager.getDronesArray() }
  })
}
