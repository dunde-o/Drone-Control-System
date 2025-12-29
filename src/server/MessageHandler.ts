import { WebSocket } from 'ws'

import { ServerMessage } from './types'
import {
  HandlerContext,
  handleHealth,
  handleBasePositionUpdate,
  handleBaseMoveDurationUpdate,
  handleBaseAltitudeUpdate,
  handleHeartbeatIntervalUpdate,
  handleDroneCountUpdate,
  handleDroneUpdateIntervalUpdate,
  handleDroneVerticalSpeedUpdate,
  handleDroneFlySpeedUpdate,
  handleDroneTakeoff,
  handleDroneMove,
  handleDroneLand,
  handleDroneReturnToBase,
  handleAllTakeoff,
  handleAllReturnToBase,
  handleAllRandomMove
} from './handlers'

export type { HandlerContext }

export class MessageHandler {
  private context: HandlerContext

  constructor(context: HandlerContext) {
    this.context = context
  }

  handle(ws: WebSocket, message: ServerMessage): void {
    console.info('[Server] Received message:', message)

    switch (message.type) {
      case 'health':
        handleHealth(this.context, ws)
        break

      case 'basePosition:update':
        handleBasePositionUpdate(this.context, ws, message)
        break

      case 'baseMoveDuration:update':
        handleBaseMoveDurationUpdate(this.context, ws, message)
        break

      case 'heartbeatInterval:update':
        handleHeartbeatIntervalUpdate(this.context, ws, message)
        break

      case 'droneCount:update':
        handleDroneCountUpdate(this.context, ws, message)
        break

      case 'droneUpdateInterval:update':
        handleDroneUpdateIntervalUpdate(this.context, ws, message)
        break

      case 'drone:start':
      case 'drone:takeoff':
        handleDroneTakeoff(this.context, ws, message)
        break

      case 'drone:move':
        handleDroneMove(this.context, ws, message)
        break

      case 'drone:land':
        handleDroneLand(this.context, ws, message)
        break

      case 'drone:returnToBase':
        handleDroneReturnToBase(this.context, ws, message)
        break

      case 'droneVerticalSpeed:update':
        handleDroneVerticalSpeedUpdate(this.context, ws, message)
        break

      case 'droneFlySpeed:update':
        handleDroneFlySpeedUpdate(this.context, ws, message)
        break

      case 'baseAltitude:update':
        handleBaseAltitudeUpdate(this.context, ws, message)
        break

      case 'drone:allTakeoff':
        handleAllTakeoff(this.context)
        break

      case 'drone:allReturnToBase':
        handleAllReturnToBase(this.context)
        break

      case 'drone:allRandomMove':
        handleAllRandomMove(this.context)
        break

      case 'config:update':
        this.context.emit('configUpdate', message.payload)
        this.context.broadcast({
          type: 'config:updated',
          payload: message.payload
        })
        break

      default:
        this.context.emit('message', message)
    }
  }
}
