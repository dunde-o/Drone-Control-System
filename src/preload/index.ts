import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Server API types
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

// Custom APIs for renderer
const api = {
  onSwitchTab: (callback: (tabIndex: number) => void) => {
    ipcRenderer.on('switch-tab', (_event, tabIndex: number) => callback(tabIndex))
  },

  // Server control APIs
  server: {
    start: (config: ServerConfig): Promise<ServerResult> => {
      return ipcRenderer.invoke('server:start', config)
    },
    stop: (): Promise<ServerResult> => {
      return ipcRenderer.invoke('server:stop')
    },
    getStatus: (): Promise<ServerStatus> => {
      return ipcRenderer.invoke('server:status')
    },
    broadcast: (message: { type: string; payload?: unknown }): Promise<ServerResult> => {
      return ipcRenderer.invoke('server:broadcast', message)
    },
    onClientCount: (callback: (count: number) => void) => {
      ipcRenderer.on('server:client-count', (_event, count: number) => callback(count))
    },
    onConfigUpdated: (callback: (payload: unknown) => void) => {
      ipcRenderer.on('server:config-updated', (_event, payload: unknown) => callback(payload))
    }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
