import { useContext } from 'react'

import { WebSocketContext } from './context'
import { WebSocketContextValue } from './types'

export const useWebSocket = (): WebSocketContextValue => {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider')
  }
  return context
}
