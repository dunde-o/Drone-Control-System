import { useState, ChangeEvent } from 'react'

import { useServerControl } from '@renderer/hooks/mutations'
import { useConnectionStatus, useServerRunning } from '@renderer/hooks/queries'
import { ConnectionStatus } from '@renderer/contexts/WebSocketContext/types'
import { DEFAULT_SERVER_HOST, DEFAULT_SERVER_PORT } from '@renderer/components/App/constants'

interface UseServerConnectionReturn {
  serverHost: string
  serverPort: string
  connectionStatus: ConnectionStatus
  isServerRunning: boolean
  isConnected: boolean
  handleServerHostChange: (e: ChangeEvent<HTMLInputElement>) => void
  handleServerPortChange: (e: ChangeEvent<HTMLInputElement>) => void
  handleStartServer: () => void
  handleStopServer: () => void
}

export const useServerConnection = (): UseServerConnectionReturn => {
  const { data: connectionStatus = 'disconnected' } = useConnectionStatus()
  const { data: isServerRunning = false } = useServerRunning()
  const { startServer, stopServer } = useServerControl()

  const [serverHost, setServerHost] = useState(DEFAULT_SERVER_HOST)
  const [serverPort, setServerPort] = useState(DEFAULT_SERVER_PORT)

  const isConnected = connectionStatus === 'connected'

  const handleServerHostChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setServerHost(e.target.value)
  }

  const handleServerPortChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setServerPort(e.target.value)
  }

  const handleStartServer = (): void => {
    startServer.mutate({ host: serverHost, port: serverPort })
  }

  const handleStopServer = (): void => {
    stopServer.mutate()
  }

  return {
    serverHost,
    serverPort,
    connectionStatus,
    isServerRunning,
    isConnected,
    handleServerHostChange,
    handleServerPortChange,
    handleStartServer,
    handleStopServer
  }
}
