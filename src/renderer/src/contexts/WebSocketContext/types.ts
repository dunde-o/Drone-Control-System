export type ConnectionStatus = 'disconnected' | 'connected' | 'connecting'

export interface BasePosition {
  lat: number
  lng: number
}

export type DroneStatus = 'idle' | 'flying' | 'returning' | 'charging'

export interface Drone {
  id: string
  name: string
  position: {
    lat: number
    lng: number
  }
  status: DroneStatus
  battery: number
}

export interface ServerConfig {
  baseMoveDuration: number
  heartbeatInterval: number
  droneUpdateInterval: number
}

// Incoming message types from server
export type WebSocketMessageType =
  | 'heartbeat'
  | 'basePosition:updated'
  | 'basePosition:moving'
  | 'basePosition:error'
  | 'baseMoveDuration:updated'
  | 'baseMoveDuration:error'
  | 'heartbeatInterval:updated'
  | 'heartbeatInterval:error'
  | 'droneCount:updated'
  | 'droneCount:error'
  | 'drone:updated'
  | 'drone:error'
  | 'drones:update'
  | 'droneUpdateInterval:updated'
  | 'droneUpdateInterval:error'

// Outgoing message types to server
export type WebSocketOutgoingMessageType =
  | 'basePosition:update'
  | 'baseMoveDuration:update'
  | 'heartbeatInterval:update'
  | 'droneCount:update'
  | 'droneUpdateInterval:update'
  | 'drone:start'
  | 'drone:stop'

export interface HeartbeatPayload {
  init?: boolean
  timestamp: number
  basePosition?: BasePosition
  drones?: Drone[]
  config?: ServerConfig
}

export interface DroneCountUpdatedPayload {
  count: number
  drones: Drone[]
}

export interface DroneUpdatedPayload {
  drone: Drone
}

export interface DronesUpdatePayload {
  drones: Drone[]
}

export interface DroneUpdateIntervalPayload {
  interval: number
}

export interface BasePositionPayload {
  lat: number
  lng: number
}

export interface BaseMovingPayload {
  target: BasePosition
  duration: number
}

export interface BaseMovement {
  from: BasePosition
  to: BasePosition
  duration: number
}

export interface BaseMoveDurationPayload {
  duration: number
}

export interface HeartbeatIntervalPayload {
  interval: number
}

export interface ErrorPayload {
  message?: string
}

export interface WebSocketMessage<T = unknown> {
  type: WebSocketMessageType | WebSocketOutgoingMessageType | string
  payload?: T
}

export interface WebSocketContextValue {
  sendMessage: <T>(message: WebSocketMessage<T>) => void
  connect: (host: string, port: string) => void
  disconnect: () => void
}
