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
}

export interface ServerMessage {
  type: string
  payload?: unknown
}

export interface BasePosition {
  lat: number
  lng: number
}

const DEFAULT_HEARTBEAT_INTERVAL = 3000 // 3 seconds
const DEFAULT_BASE_MOVE_DURATION = 1000 // 1 second

class DroneServer extends EventEmitter {
  private wss: WebSocketServer | null = null
  private config: ServerConfig
  private clients: Set<WebSocket> = new Set()
  private heartbeatTimer: NodeJS.Timeout | null = null
  private basePosition: BasePosition
  private baseMoveDuration: number
  private heartbeatInterval: number
  private baseMoveTimeout: NodeJS.Timeout | null = null

  constructor(config: ServerConfig) {
    super()
    this.config = config
    this.basePosition = config.basePosition || { lat: 0, lng: 0 }
    this.baseMoveDuration = config.baseMoveDuration ?? DEFAULT_BASE_MOVE_DURATION
    this.heartbeatInterval = config.heartbeatInterval ?? DEFAULT_HEARTBEAT_INTERVAL
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
              config: {
                baseMoveDuration: this.baseMoveDuration,
                heartbeatInterval: this.heartbeatInterval
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
}

export default DroneServer
