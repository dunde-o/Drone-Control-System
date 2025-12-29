import { ConnectionStatus } from '@renderer/contexts/WebSocketContext/types'

export const CONNECTION_STATUS_TEXT: Record<ConnectionStatus, string> = {
  connecting: 'Connecting...',
  connected: 'Connected',
  disconnected: 'Disconnected'
}

export const CONNECTION_STATUS_CLASS: Record<ConnectionStatus, string> = {
  connecting: 'connecting',
  connected: 'connected',
  disconnected: 'disconnected'
}
