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
  droneVerticalSpeed?: number // 수직 속도 (m/s)
  droneFlySpeed?: number // 비행 속도 (m/s)
  baseAltitude?: number // 베이스 적정 비행 고도 (m)
}

export interface ServerMessage {
  type: string
  payload?: unknown
}

export interface Position {
  lat: number
  lng: number
}

// Alias for backward compatibility
export type BasePosition = Position

export type DroneStatus =
  | 'idle' // 대기 - 베이스에서 시작 가능
  | 'ascending' // 이륙 중 - 베이스에서 적정 고도까지 상승 중
  | 'hovering' // 대기 비행 - 적정 고도에서 다음 명령 대기 중
  | 'moving' // 이동 중 - 지정 위치로 이동 중
  | 'mia' // 통신 두절 - 신호 끊김으로 탐지 불가
  | 'returning' // 복귀 중 - 베이스로 이동 중
  | 'landing' // 착륙 중 - 현재 위치에서 착륙 중
  | 'returning_auto' // 자동 복귀 - 고장/배터리 이슈로 자동 복귀 중
  | 'landing_auto' // 자동 착륙 - 고장/배터리 이슈로 자동 착륙 중

export interface Drone {
  id: string
  name: string
  position: Position
  altitude: number // 고도 (m)
  status: DroneStatus
  battery: number
  waypoints: Position[] // 목표 지점 리스트
}

const DEFAULT_HEARTBEAT_INTERVAL = 3000 // 3 seconds
const DEFAULT_BASE_MOVE_DURATION = 1000 // 1 second
const DEFAULT_DRONE_UPDATE_INTERVAL = 200 // 0.2 seconds
const DEFAULT_DRONE_VERTICAL_SPEED = 5 // 5 m/s
const DEFAULT_DRONE_FLY_SPEED = 10 // 10 m/s
const DEFAULT_BASE_ALTITUDE = 50 // 50 m

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
  private drones: Map<string, Drone> = new Map()
  private droneIdCounter: number = 0

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
      if (this.drones.size > 0) {
        // 드론 상태 시뮬레이션
        this.simulateDrones()

        this.broadcast({
          type: 'drones:update',
          payload: { drones: this.getDronesArray() }
        })
      }
    }, this.droneUpdateInterval)
  }

  private simulateDrones(): void {
    const deltaTime = this.droneUpdateInterval / 1000 // 초 단위로 변환

    this.drones.forEach((drone) => {
      switch (drone.status) {
        case 'ascending':
          // 수직 속도에 따라 고도 상승
          drone.altitude += this.droneVerticalSpeed * deltaTime

          // 적정 고도 도달 시 hovering 상태로 전환
          if (drone.altitude >= this.baseAltitude) {
            drone.altitude = this.baseAltitude
            drone.status = 'hovering'
            console.log(
              `[Server] Drone ${drone.id} reached target altitude (${this.baseAltitude}m), now hovering`
            )
          }
          break

        case 'moving':
        case 'returning':
        case 'returning_auto':
          this.simulateDroneMovement(drone, deltaTime)
          break

        case 'landing':
        case 'landing_auto':
          // 착륙 시 고도 하강
          drone.altitude -= this.droneVerticalSpeed * deltaTime

          // 지상 도달 시 idle 상태로 전환
          if (drone.altitude <= 0) {
            drone.altitude = 0
            drone.status = 'idle'
            drone.waypoints = []
            console.log(`[Server] Drone ${drone.id} landed, now idle`)
          }
          break
      }
    })
  }

  // 두 좌표 사이의 거리 계산 (Haversine formula, 미터 단위)
  private calculateDistance(from: Position, to: Position): number {
    const R = 6371000 // 지구 반지름 (미터)
    const dLat = ((to.lat - from.lat) * Math.PI) / 180
    const dLng = ((to.lng - from.lng) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((from.lat * Math.PI) / 180) *
        Math.cos((to.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // 드론 이동 시뮬레이션
  private simulateDroneMovement(drone: Drone, deltaTime: number): void {
    if (drone.waypoints.length === 0) {
      // 목표 지점이 없으면 hovering으로 전환
      drone.status = 'hovering'
      console.log(`[Server] Drone ${drone.id} has no waypoints, now hovering`)
      return
    }

    const target = drone.waypoints[0]
    const distance = this.calculateDistance(drone.position, target)
    const moveDistance = this.droneFlySpeed * deltaTime

    if (distance <= moveDistance) {
      // 목표 지점에 도달
      drone.position = { ...target }
      drone.waypoints.shift() // 첫 번째 waypoint 제거

      if (drone.waypoints.length === 0) {
        // returning 상태면 베이스에 도착했으므로 착륙
        if (drone.status === 'returning' || drone.status === 'returning_auto') {
          drone.status = 'landing'
          console.log(`[Server] Drone ${drone.id} reached base, now landing`)
        } else {
          drone.status = 'hovering'
          console.log(`[Server] Drone ${drone.id} reached final waypoint, now hovering`)
        }
      } else {
        console.log(
          `[Server] Drone ${drone.id} reached waypoint, ${drone.waypoints.length} remaining`
        )
      }
    } else {
      // 목표 지점으로 이동
      const ratio = moveDistance / distance
      const dLat = target.lat - drone.position.lat
      const dLng = target.lng - drone.position.lng

      drone.position = {
        lat: drone.position.lat + dLat * ratio,
        lng: drone.position.lng + dLng * ratio
      }
    }
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
            drone.status = 'ascending'
            // 현재 위치에서 이륙 (위치 변경하지 않음)
            console.log(`[Server] Drone ${drone.id} ascending from current position`)

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

      case 'drone:move': {
        const payload = message.payload as
          | {
              droneId?: string
              waypoints?: Position[]
              append?: boolean // true면 기존 waypoints에 추가 (Shift+우클릭)
            }
          | undefined

        if (payload && payload.droneId && Array.isArray(payload.waypoints)) {
          const drone = this.drones.get(payload.droneId)
          // hovering, moving, returning 상태에서 이동 명령 허용
          if (
            drone &&
            ['hovering', 'moving', 'returning', 'returning_auto'].includes(drone.status)
          ) {
            if (
              payload.append &&
              drone.status !== 'returning' &&
              drone.status !== 'returning_auto'
            ) {
              // Shift+우클릭: 기존 경로에 추가 (복귀 중에는 append 무시하고 덮어쓰기)
              drone.waypoints.push(...payload.waypoints)
            } else {
              // 일반 우클릭 또는 복귀 중: 기존 경로 덮어쓰기
              drone.waypoints = [...payload.waypoints]
            }
            drone.status = 'moving'
            console.log(
              `[Server] Drone ${drone.id} moving to ${drone.waypoints.length} waypoint(s)`
            )

            this.broadcast({
              type: 'drone:updated',
              payload: { drone }
            })
          } else {
            this.sendToClient(ws, {
              type: 'drone:error',
              payload: { error: 'Drone not found or not in movable state' }
            })
          }
        }
        break
      }

      case 'drone:takeoff': {
        const payload = message.payload as { droneId?: string } | undefined
        if (payload && payload.droneId) {
          const drone = this.drones.get(payload.droneId)
          if (drone && drone.status === 'idle') {
            drone.status = 'ascending'
            // 현재 위치에서 이륙 (위치 변경하지 않음)
            console.log(`[Server] Drone ${drone.id} taking off from current position`)

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

      case 'drone:land': {
        const payload = message.payload as { droneId?: string } | undefined
        if (payload && payload.droneId) {
          const drone = this.drones.get(payload.droneId)
          if (
            drone &&
            ['hovering', 'moving', 'returning', 'returning_auto'].includes(drone.status)
          ) {
            drone.status = 'landing'
            drone.waypoints = [] // 모든 웨이포인트 제거
            console.log(`[Server] Drone ${drone.id} landing at current position`)

            this.broadcast({
              type: 'drone:updated',
              payload: { drone }
            })
          } else {
            this.sendToClient(ws, {
              type: 'drone:error',
              payload: { error: 'Drone not found or not in airborne state' }
            })
          }
        }
        break
      }

      case 'drone:returnToBase': {
        const payload = message.payload as { droneId?: string } | undefined
        if (payload && payload.droneId) {
          const drone = this.drones.get(payload.droneId)
          if (
            drone &&
            ['hovering', 'moving', 'returning', 'returning_auto'].includes(drone.status)
          ) {
            drone.status = 'returning'
            drone.waypoints = [{ ...this.basePosition }] // 베이스로 웨이포인트 설정
            console.log(`[Server] Drone ${drone.id} returning to base`)

            this.broadcast({
              type: 'drone:updated',
              payload: { drone }
            })
          } else {
            this.sendToClient(ws, {
              type: 'drone:error',
              payload: { error: 'Drone not found or not in airborne state' }
            })
          }
        }
        break
      }

      case 'droneVerticalSpeed:update': {
        const payload = message.payload as { speed?: number } | undefined
        if (payload && typeof payload.speed === 'number' && payload.speed > 0) {
          this.droneVerticalSpeed = payload.speed
          console.log('[Server] Drone vertical speed updated:', this.droneVerticalSpeed)

          this.broadcast({
            type: 'droneVerticalSpeed:updated',
            payload: { speed: this.droneVerticalSpeed }
          })
        } else {
          this.sendToClient(ws, {
            type: 'droneVerticalSpeed:error',
            payload: { error: 'Invalid speed value (must be > 0)' }
          })
        }
        break
      }

      case 'droneFlySpeed:update': {
        const payload = message.payload as { speed?: number } | undefined
        if (payload && typeof payload.speed === 'number' && payload.speed > 0) {
          this.droneFlySpeed = payload.speed
          console.log('[Server] Drone fly speed updated:', this.droneFlySpeed)

          this.broadcast({
            type: 'droneFlySpeed:updated',
            payload: { speed: this.droneFlySpeed }
          })
        } else {
          this.sendToClient(ws, {
            type: 'droneFlySpeed:error',
            payload: { error: 'Invalid speed value (must be > 0)' }
          })
        }
        break
      }

      case 'baseAltitude:update': {
        const payload = message.payload as { altitude?: number } | undefined
        if (payload && typeof payload.altitude === 'number' && payload.altitude > 0) {
          this.baseAltitude = payload.altitude
          console.log('[Server] Base altitude updated:', this.baseAltitude)

          this.broadcast({
            type: 'baseAltitude:updated',
            payload: { altitude: this.baseAltitude }
          })
        } else {
          this.sendToClient(ws, {
            type: 'baseAltitude:error',
            payload: { error: 'Invalid altitude value (must be > 0)' }
          })
        }
        break
      }

      case 'drone:allTakeoff': {
        // 모든 idle 상태 드론 이륙
        let count = 0
        this.drones.forEach((drone) => {
          if (drone.status === 'idle') {
            drone.status = 'ascending'
            count++
          }
        })
        console.log(`[Server] All takeoff: ${count} drones ascending`)

        this.broadcast({
          type: 'drones:update',
          payload: { drones: this.getDronesArray() }
        })
        break
      }

      case 'drone:allReturnToBase': {
        // 모든 공중 상태 드론 복귀
        let count = 0
        this.drones.forEach((drone) => {
          if (['hovering', 'moving', 'returning', 'returning_auto'].includes(drone.status)) {
            drone.status = 'returning'
            drone.waypoints = [{ ...this.basePosition }]
            count++
          }
        })
        console.log(`[Server] All return to base: ${count} drones returning`)

        this.broadcast({
          type: 'drones:update',
          payload: { drones: this.getDronesArray() }
        })
        break
      }

      case 'drone:allRandomMove': {
        // 모든 공중 상태 드론 랜덤 위치로 이동
        let count = 0
        this.drones.forEach((drone) => {
          if (['hovering', 'moving', 'returning', 'returning_auto'].includes(drone.status)) {
            const randomPos = this.generateRandomPosition()
            drone.status = 'moving'
            drone.waypoints = [randomPos]
            count++
          }
        })
        console.log(`[Server] All random move: ${count} drones moving`)

        this.broadcast({
          type: 'drones:update',
          payload: { drones: this.getDronesArray() }
        })
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

    return {
      id,
      name: `Drone ${this.droneIdCounter}`,
      position: {
        lat: this.basePosition.lat,
        lng: this.basePosition.lng
      },
      altitude: 0,
      status: 'idle',
      battery: 100,
      waypoints: []
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

  // 베이스 기준 5km ~ 10km 반경 내 랜덤 좌표 생성
  private generateRandomPosition(): Position {
    const minDistance = 5000
    const maxDistance = 10000
    const distance = minDistance + Math.random() * (maxDistance - minDistance)

    const bearing = Math.random() * 360

    const earthRadius = 6371000
    const latOffset = (distance * Math.cos((bearing * Math.PI) / 180)) / earthRadius
    const lngOffset =
      (distance * Math.sin((bearing * Math.PI) / 180)) /
      (earthRadius * Math.cos((this.basePosition.lat * Math.PI) / 180))

    return {
      lat: this.basePosition.lat + (latOffset * 180) / Math.PI,
      lng: this.basePosition.lng + (lngOffset * 180) / Math.PI
    }
  }
}

export default DroneServer
