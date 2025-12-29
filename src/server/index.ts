import { WebSocketServer, WebSocket } from 'ws'
import { EventEmitter } from 'events'

import { ServerConfig, ServerMessage, BasePosition, Drone, DroneStatus, Position } from './types'
import {
  DEFAULT_HEARTBEAT_INTERVAL,
  DEFAULT_BASE_MOVE_DURATION,
  DEFAULT_DRONE_UPDATE_INTERVAL,
  DEFAULT_DRONE_VERTICAL_SPEED,
  DEFAULT_DRONE_FLY_SPEED,
  DEFAULT_BASE_ALTITUDE
} from './constants'
import { DroneManager } from './DroneManager'
import { MessageHandler } from './MessageHandler'

// Re-export types for backward compatibility
export type { ServerConfig, ServerMessage, Position, BasePosition, DroneStatus, Drone }

class DroneServer extends EventEmitter {
  private wss: WebSocketServer | null = null
  private config: ServerConfig
  private clients: Set<WebSocket> = new Set()
  private heartbeatTimer: NodeJS.Timeout | null = null
  private droneUpdateTimer: NodeJS.Timeout | null = null
  private basePosition: BasePosition
  private baseMoveDuration: number
  private heartbeatInterval: number
  private droneUpdateInterval: number
  private droneVerticalSpeed: number
  private droneFlySpeed: number
  private baseAltitude: number
  private baseMoveTimeout: NodeJS.Timeout | null = null
  private droneManager: DroneManager
  private messageHandler: MessageHandler

  constructor(config: ServerConfig) {
    super()
    this.config = config
    this.basePosition = config.basePosition || { lat: 0, lng: 0 }
    this.baseMoveDuration = config.baseMoveDuration ?? DEFAULT_BASE_MOVE_DURATION
    this.heartbeatInterval = config.heartbeatInterval ?? DEFAULT_HEARTBEAT_INTERVAL
    this.droneUpdateInterval = config.droneUpdateInterval ?? DEFAULT_DRONE_UPDATE_INTERVAL
    this.droneVerticalSpeed = config.droneVerticalSpeed ?? DEFAULT_DRONE_VERTICAL_SPEED
    this.droneFlySpeed = config.droneFlySpeed ?? DEFAULT_DRONE_FLY_SPEED
    this.baseAltitude = config.baseAltitude ?? DEFAULT_BASE_ALTITUDE

    this.droneManager = new DroneManager(this.basePosition)
    this.messageHandler = new MessageHandler({
      droneManager: this.droneManager,
      basePosition: this.basePosition,
      baseMoveDuration: this.baseMoveDuration,
      heartbeatInterval: this.heartbeatInterval,
      droneUpdateInterval: this.droneUpdateInterval,
      droneVerticalSpeed: this.droneVerticalSpeed,
      droneFlySpeed: this.droneFlySpeed,
      baseAltitude: this.baseAltitude,
      baseMoveTimeout: this.baseMoveTimeout,
      setBasePosition: (position) => {
        this.basePosition = position
        this.droneManager.setBasePosition(position)
      },
      setBaseMoveDuration: (duration) => {
        this.baseMoveDuration = duration
      },
      setHeartbeatInterval: (interval) => {
        this.heartbeatInterval = interval
      },
      setDroneUpdateInterval: (interval) => {
        this.droneUpdateInterval = interval
      },
      setDroneVerticalSpeed: (speed) => {
        this.droneVerticalSpeed = speed
      },
      setDroneFlySpeed: (speed) => {
        this.droneFlySpeed = speed
      },
      setBaseAltitude: (altitude) => {
        this.baseAltitude = altitude
      },
      setBaseMoveTimeout: (timeout) => {
        this.baseMoveTimeout = timeout
      },
      restartHeartbeat: () => this.restartHeartbeat(),
      restartDroneUpdates: () => this.restartDroneUpdates(),
      broadcast: (message) => this.broadcast(message),
      sendToClient: (ws, message) => this.sendToClient(ws, message),
      emit: (event, payload) => this.emit(event, payload)
    })
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.wss) {
        reject(new Error('Server is already running'))
        return
      }

      try {
        this.wss = new WebSocketServer({
          host: this.config.host,
          port: this.config.port
        })

        this.wss.on('listening', () => {
          console.info(
            `[Server] WebSocket server started on ws://${this.config.host}:${this.config.port}`
          )
          this.startHeartbeat()
          this.startDroneUpdates()
          this.emit('started')
          resolve()
        })

        this.wss.on('connection', (ws: WebSocket) => {
          console.info('[Server] Client connected')
          this.clients.add(ws)
          this.emit('clientConnected', this.clients.size)

          // Send initial heartbeat with init flag immediately
          this.sendToClient(ws, {
            type: 'heartbeat',
            payload: {
              init: true,
              timestamp: Date.now(),
              basePosition: this.basePosition,
              drones: this.droneManager.getDronesArray(),
              config: {
                baseMoveDuration: this.baseMoveDuration,
                heartbeatInterval: this.heartbeatInterval,
                droneUpdateInterval: this.droneUpdateInterval,
                droneVerticalSpeed: this.droneVerticalSpeed,
                droneFlySpeed: this.droneFlySpeed,
                baseAltitude: this.baseAltitude
              }
            }
          })

          ws.on('message', (data: Buffer) => {
            try {
              const message: ServerMessage = JSON.parse(data.toString())
              this.messageHandler.handle(ws, message)
            } catch (error) {
              console.error('[Server] Invalid message format:', error)
            }
          })

          ws.on('close', () => {
            console.info('[Server] Client disconnected')
            this.clients.delete(ws)
            this.emit('clientDisconnected', this.clients.size)
          })

          ws.on('error', (error) => {
            console.error('[Server] WebSocket error:', error)
            this.clients.delete(ws)
          })
        })

        this.wss.on('error', (error) => {
          console.error('[Server] Server error:', error)
          this.emit('error', error)
          reject(error)
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      this.stopHeartbeat()
      this.stopDroneUpdates()

      if (!this.wss) {
        resolve()
        return
      }

      // Close all client connections
      this.clients.forEach((client) => {
        client.close()
      })
      this.clients.clear()

      this.wss.close(() => {
        console.info('[Server] WebSocket server stopped')
        this.wss = null
        this.emit('stopped')
        resolve()
      })
    })
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.broadcast({
        type: 'heartbeat',
        payload: {
          timestamp: Date.now(),
          basePosition: this.basePosition,
          config: {
            baseMoveDuration: this.baseMoveDuration,
            heartbeatInterval: this.heartbeatInterval,
            droneUpdateInterval: this.droneUpdateInterval,
            droneVerticalSpeed: this.droneVerticalSpeed,
            droneFlySpeed: this.droneFlySpeed,
            baseAltitude: this.baseAltitude
          }
        }
      })
    }, this.heartbeatInterval)
  }

  private restartHeartbeat(): void {
    this.stopHeartbeat()
    this.startHeartbeat()
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private startDroneUpdates(): void {
    this.droneUpdateTimer = setInterval(() => {
      if (this.droneManager.hasDrones()) {
        // 드론 상태 시뮬레이션
        const deltaTime = this.droneUpdateInterval / 1000
        this.droneManager.simulateDrones(
          deltaTime,
          this.droneVerticalSpeed,
          this.droneFlySpeed,
          this.baseAltitude
        )

        this.broadcast({
          type: 'drones:update',
          payload: { drones: this.droneManager.getDronesArray() }
        })
      }
    }, this.droneUpdateInterval)
  }

  private restartDroneUpdates(): void {
    this.stopDroneUpdates()
    this.startDroneUpdates()
  }

  private stopDroneUpdates(): void {
    if (this.droneUpdateTimer) {
      clearInterval(this.droneUpdateTimer)
      this.droneUpdateTimer = null
    }
  }

  private sendToClient(ws: WebSocket, message: ServerMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
    }
  }

  broadcast(message: ServerMessage): void {
    const data = JSON.stringify(message)
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data)
      }
    })
  }

  updateConfig(config: ServerConfig): void {
    this.config = config
  }

  isRunning(): boolean {
    return this.wss !== null
  }

  getClientCount(): number {
    return this.clients.size
  }

  getBasePosition(): BasePosition {
    return this.basePosition
  }

  getBaseMoveDuration(): number {
    return this.baseMoveDuration
  }

  getDronesArray(): Drone[] {
    return this.droneManager.getDronesArray()
  }

  getDroneCount(): number {
    return this.droneManager.getDroneCount()
  }

  setDroneCount(count: number): void {
    this.droneManager.setDroneCount(count)
  }
}

export default DroneServer
