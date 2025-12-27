import { WebSocketServer, WebSocket } from 'ws'
import { EventEmitter } from 'events'

export interface ServerConfig {
  host: string
  port: number
}

export interface ServerMessage {
  type: string
  payload?: unknown
}

const HEARTBEAT_INTERVAL = 3000 // 3 seconds

class DroneServer extends EventEmitter {
  private wss: WebSocketServer | null = null
  private config: ServerConfig
  private clients: Set<WebSocket> = new Set()
  private heartbeatInterval: NodeJS.Timeout | null = null

  constructor(config: ServerConfig) {
    super()
    this.config = config
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
    this.heartbeatInterval = setInterval(() => {
      this.broadcast({
        type: 'heartbeat',
        payload: { timestamp: Date.now() }
      })
    }, HEARTBEAT_INTERVAL)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
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
}

export default DroneServer
