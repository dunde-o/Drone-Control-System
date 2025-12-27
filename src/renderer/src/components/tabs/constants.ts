import { ChangeEvent } from 'react'

export interface TabConfig {
  id: string
  label: string
}

export interface TabProps {
  // Main tab props
  baseLat: string
  baseLng: string
  baseLatServer: string
  baseLngServer: string
  onBaseLatChange: (e: ChangeEvent<HTMLInputElement>) => void
  onBaseLngChange: (e: ChangeEvent<HTMLInputElement>) => void
  onApplyBase: () => void
  isPickingBase: boolean
  onTogglePickBase: () => void
  isBaseEnabled: boolean
  isBaseUpdating: boolean
  // API settings tab props
  apiKeyInput: string
  onApiKeyInputChange: (e: ChangeEvent<HTMLInputElement>) => void
  onApplyApiKey: () => void
  // Server settings tab props
  serverHost: string
  serverPort: string
  onServerHostChange: (e: ChangeEvent<HTMLInputElement>) => void
  onServerPortChange: (e: ChangeEvent<HTMLInputElement>) => void
  isServerRunning: boolean
  connectionStatus: 'disconnected' | 'connected' | 'connecting'
  onStartServer: () => void
  onStopServer: () => void
  showHeartbeatLog: boolean
  onToggleHeartbeatLog: () => void
  baseMoveDuration: string
  baseMoveDurationServer: string
  onBaseMoveDurationChange: (e: ChangeEvent<HTMLInputElement>) => void
  onApplyBaseMoveDuration: () => void
  isBaseMoveDurationUpdating: boolean
  heartbeatInterval: string
  heartbeatIntervalServer: string
  onHeartbeatIntervalChange: (e: ChangeEvent<HTMLInputElement>) => void
  onApplyHeartbeatInterval: () => void
  isHeartbeatIntervalUpdating: boolean
}

export const TABS: TabConfig[] = [
  { id: 'main', label: 'MAIN' },
  { id: 'server', label: 'SERVER' },
  { id: 'api', label: 'API' },
  { id: 'help', label: 'HELP' }
]
