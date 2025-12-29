import { WebSocket } from 'ws'

import { ServerMessage, BasePosition } from '../types'
import { DroneManager } from '../DroneManager'

export interface HandlerContext {
  droneManager: DroneManager
  basePosition: BasePosition
  baseMoveDuration: number
  heartbeatInterval: number
  droneUpdateInterval: number
  droneVerticalSpeed: number
  droneFlySpeed: number
  baseAltitude: number
  baseMoveTimeout: NodeJS.Timeout | null
  setBasePosition: (position: BasePosition) => void
  setBaseMoveDuration: (duration: number) => void
  setHeartbeatInterval: (interval: number) => void
  setDroneUpdateInterval: (interval: number) => void
  setDroneVerticalSpeed: (speed: number) => void
  setDroneFlySpeed: (speed: number) => void
  setBaseAltitude: (altitude: number) => void
  setBaseMoveTimeout: (timeout: NodeJS.Timeout | null) => void
  restartHeartbeat: () => void
  restartDroneUpdates: () => void
  broadcast: (message: ServerMessage) => void
  sendToClient: (ws: WebSocket, message: ServerMessage) => void
  emit: (event: string, payload?: unknown) => void
}
