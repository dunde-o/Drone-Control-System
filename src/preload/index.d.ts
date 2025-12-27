import { ElectronAPI } from '@electron-toolkit/preload'

interface ServerConfig {
  host: string
  port: number
}

interface ServerResult {
  success: boolean
  error?: string
}

interface ServerStatus {
  running: boolean
  clientCount: number
}

interface ServerApi {
  start: (config: ServerConfig) => Promise<ServerResult>
  stop: () => Promise<ServerResult>
  getStatus: () => Promise<ServerStatus>
  broadcast: (message: { type: string; payload?: unknown }) => Promise<ServerResult>
  onClientCount: (callback: (count: number) => void) => void
  onConfigUpdated: (callback: (payload: unknown) => void) => void
}

interface Api {
  onSwitchTab: (callback: (tabIndex: number) => void) => void
  server: ServerApi
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
