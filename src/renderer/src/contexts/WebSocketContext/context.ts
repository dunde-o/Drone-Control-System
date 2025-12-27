import { createContext } from 'react'

import { WebSocketContextValue } from './types'

export const WebSocketContext = createContext<WebSocketContextValue | null>(null)
