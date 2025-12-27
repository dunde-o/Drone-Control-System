export type ConnectionStatus = 'disconnected' | 'connected' | 'connecting'

export interface BasePosition {
  lat: number
  lng: number
}

export interface ServerConfig {
  baseMoveDuration: number
  heartbeatInterval: number
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

// Outgoing message types to server
export type WebSocketOutgoingMessageType =
  | 'basePosition:update'
  | 'baseMoveDuration:update'
  | 'heartbeatInterval:update'

export interface HeartbeatPayload {
  init?: boolean
  timestamp: number
  basePosition?: BasePosition
  config?: ServerConfig
}

export interface BasePositionPayload {
  lat: number
  lng: number
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
