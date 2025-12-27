import { WebSocketServer, WebSocket } from 'ws'
import { EventEmitter } from 'events'

export interface ServerConfig {
  host: string
  port: number
  basePosition?: {
    lat: number
    lng: number
  }
  baseMoveDuration?: number
  heartbeatInterval?: number
  droneUpdateInterval?: number
}

export interface ServerMessage {
  type: string
  payload?: unknown
}

export interface BasePosition {
  lat: number
  lng: number
}

export interface Drone {
  id: string
  name: string
  position: {
    lat: number
    lng: number
  }
  status: 'idle' | 'flying' | 'returning' | 'charging'
  battery: number
}

const DEFAULT_HEARTBEAT_INTERVAL = 3000 // 3 seconds
const DEFAULT_BASE_MOVE_DURATION = 1000 // 1 second
const DEFAULT_DRONE_UPDATE_INTERVAL = 200 // 0.2 seconds

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
  private baseMoveTimeout: NodeJS.Timeout | null = null
  private drones: Map<string, Drone> = new Map()
  private droneIdCounter: number = 0

  constructor(config: ServerConfig) {
    super()
    this.config = config
    this.basePosition = config.basePosition || { lat: 0, lng: 0 }
    this.baseMoveDuration = config.baseMoveDuration ?? DEFAULT_BASE_MOVE_DURATION
    this.heartbeatInterval = config.heartbeatInterval ?? DEFAULT_HEARTBEAT_INTERVAL
    this.droneUpdateInterval = config.droneUpdateInterval ?? DEFAULT_DRONE_UPDATE_INTERVAL
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
          console.log(
            `[Server] WebSocket server started on ws://${this.config.host}:${this.config.port}`
          )
          this.startHeartbeat()
          this.startDroneUpdates()
          this.emit('started')
          resolve()
        })

        this.wss.on('connection', (ws: WebSocket) => {
          console.log('[Server] Client connected')
          this.clients.add(ws)
          this.emit('clientConnected', this.clients.size)

          // Send initial heartbeat with init flag immediately
          this.sendToClient(ws, {
            type: 'heartbeat',
            payload: {
              init: true,
              timestamp: Date.now(),
              basePosition: this.basePosition,
              drones: this.getDronesArray(),
              config: {
                baseMoveDuration: this.baseMoveDuration,
                heartbeatInterval: this.heartbeatInterval,
                droneUpdateInterval: this.droneUpdateInterval
              }
            }
          })

          ws.on('message', (data: Buffer) => {
            try {
              const message: ServerMessage = JSON.parse(data.toString())
              this.handleMessage(ws, message)
            } catch (error) {
              console.error('[Server] Invalid message format:', error)
            }
          })

          ws.on('close', () => {
            console.log('[Server] Client disconnected')
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
        console.log('[Server] WebSocket server stopped')
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
            heartbeatInterval: this.heartbeatInterval
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
      if (this.drones.size > 0) {
        this.broadcast({
          type: 'drones:update',
          payload: { drones: this.getDronesArray() }
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

  private handleMessage(ws: WebSocket, message: ServerMessage): void {
    console.log('[Server] Received message:', message)

    switch (message.type) {
      case 'health':
        this.sendToClient(ws, {
          type: 'health',
          payload: { status: 'ok', timestamp: Date.now() }
        })
        break

      case 'basePosition:update': {
        const payload = message.payload as { lat?: number; lng?: number } | undefined
        if (payload && typeof payload.lat === 'number' && typeof payload.lng === 'number') {
          // Cancel any pending move
          if (this.baseMoveTimeout) {
            clearTimeout(this.baseMoveTimeout)
          }

          const targetPosition = { lat: payload.lat, lng: payload.lng }
          console.log(
            `[Server] Base position moving to:`,
            targetPosition,
            `(duration: ${this.baseMoveDuration}ms)`
          )

          // Broadcast that move started
          this.broadcast({
            type: 'basePosition:moving',
            payload: { target: targetPosition, duration: this.baseMoveDuration }
          })

          // Update position after duration
          this.baseMoveTimeout = setTimeout(() => {
            this.basePosition = targetPosition
            console.log('[Server] Base position updated:', this.basePosition)

            // Broadcast the update to all clients
            this.broadcast({
              type: 'basePosition:updated',
              payload: this.basePosition
            })
            this.baseMoveTimeout = null
          }, this.baseMoveDuration)
        } else {
          this.sendToClient(ws, {
            type: 'basePosition:error',
            payload: { error: 'Invalid lat/lng values' }
          })
        }
        break
      }

      case 'baseMoveDuration:update': {
        const payload = message.payload as { duration?: number } | undefined
        if (payload && typeof payload.duration === 'number' && payload.duration >= 0) {
          this.baseMoveDuration = payload.duration
          console.log('[Server] Base move duration updated:', this.baseMoveDuration)

          this.broadcast({
            type: 'baseMoveDuration:updated',
            payload: { duration: this.baseMoveDuration }
          })
        } else {
          this.sendToClient(ws, {
            type: 'baseMoveDuration:error',
            payload: { error: 'Invalid duration value' }
          })
        }
        break
      }

      case 'heartbeatInterval:update': {
        const payload = message.payload as { interval?: number } | undefined
        if (payload && typeof payload.interval === 'number' && payload.interval >= 1000) {
          this.heartbeatInterval = payload.interval
          console.log('[Server] Heartbeat interval updated:', this.heartbeatInterval)

          // Restart heartbeat with new interval
          this.restartHeartbeat()

          this.broadcast({
            type: 'heartbeatInterval:updated',
            payload: { interval: this.heartbeatInterval }
          })
        } else {
          this.sendToClient(ws, {
            type: 'heartbeatInterval:error',
            payload: { error: 'Invalid interval value (minimum 1000ms)' }
          })
        }
        break
      }

      case 'droneCount:update': {
        const payload = message.payload as { count?: number } | undefined
        if (payload && typeof payload.count === 'number' && payload.count >= 0) {
          this.setDroneCount(payload.count)

          this.broadcast({
            type: 'droneCount:updated',
            payload: { count: this.drones.size, drones: this.getDronesArray() }
          })
        } else {
          this.sendToClient(ws, {
            type: 'droneCount:error',
            payload: { error: 'Invalid count value (minimum 0)' }
          })
        }
        break
      }

      case 'droneUpdateInterval:update': {
        const payload = message.payload as { interval?: number } | undefined
        if (payload && typeof payload.interval === 'number' && payload.interval >= 100) {
          this.droneUpdateInterval = payload.interval
          console.log('[Server] Drone update interval updated:', this.droneUpdateInterval)

          // Restart drone updates with new interval
          this.restartDroneUpdates()

          this.broadcast({
            type: 'droneUpdateInterval:updated',
            payload: { interval: this.droneUpdateInterval }
          })
        } else {
          this.sendToClient(ws, {
            type: 'droneUpdateInterval:error',
            payload: { error: 'Invalid interval value (minimum 100ms)' }
          })
        }
        break
      }

      case 'drone:start': {
        const payload = message.payload as { droneId?: string } | undefined
        if (payload && payload.droneId) {
          const drone = this.drones.get(payload.droneId)
          if (drone && drone.status === 'idle') {
            drone.status = 'flying'
            drone.position = { ...this.basePosition }
            console.log(`[Server] Drone ${drone.id} started flying from base`)

            this.broadcast({
              type: 'drone:updated',
              payload: { drone }
            })
          } else {
            this.sendToClient(ws, {
              type: 'drone:error',
              payload: { error: 'Drone not found or not in idle state' }
            })
          }
        }
        break
      }

      case 'config:update':
        this.emit('configUpdate', message.payload)
        this.broadcast({
          type: 'config:updated',
          payload: message.payload
        })
        break

      default:
        this.emit('message', message)
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
    return Array.from(this.drones.values())
  }

  getDroneCount(): number {
    return this.drones.size
  }

  private createDrone(): Drone {
    const id = `drone-${++this.droneIdCounter}`
    // Random position near base
    const offsetLat = (Math.random() - 0.5) * 0.01
    const offsetLng = (Math.random() - 0.5) * 0.01

    return {
      id,
      name: `Drone ${this.droneIdCounter}`,
      position: {
        lat: this.basePosition.lat + offsetLat,
        lng: this.basePosition.lng + offsetLng
      },
      status: 'idle',
      battery: 100
    }
  }

  setDroneCount(count: number): void {
    const currentCount = this.drones.size
    const diff = count - currentCount

    if (diff > 0) {
      // Add drones
      for (let i = 0; i < diff; i++) {
        const drone = this.createDrone()
        this.drones.set(drone.id, drone)
      }
    } else if (diff < 0) {
      // Remove drones (remove from the end)
      const droneIds = Array.from(this.drones.keys())
      for (let i = 0; i < Math.abs(diff); i++) {
        const idToRemove = droneIds.pop()
        if (idToRemove) {
          this.drones.delete(idToRemove)
        }
      }
    }

    console.log(`[Server] Drone count updated: ${this.drones.size}`)
  }
}

export default DroneServer
