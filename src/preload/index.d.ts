import { ElectronAPI } from '@electron-toolkit/preload'

interface Api {
  onSwitchTab: (callback: (tabIndex: number) => void) => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
