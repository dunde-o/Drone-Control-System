import { app, shell, BrowserWindow, ipcMain, globalShortcut, Menu } from 'electron'
import { join } from 'path'
import { electronApp, is } from '@electron-toolkit/utils'
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer'
import icon from '../../resources/icon.png?asset'
import DroneServer from '../server'
import * as dotenv from 'dotenv'

// Load .env file
dotenv.config()

let mainWindow: BrowserWindow | null = null
let droneServer: DroneServer | null = null
let isQuitting = false

// Default base position (한양대학교 ERICA)
// Environment variables override these defaults
const DEFAULT_BASE_POSITION = {
  lat: parseFloat(process.env.BASE_POSITION_LAT || '37.2939'),
  lng: parseFloat(process.env.BASE_POSITION_LNG || '126.8349')
}

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.dronecontrol.app')

  // 빈 메뉴로 기본 단축키 비활성화 (Ctrl+R, Ctrl+Shift+I 등)
  Menu.setApplicationMenu(Menu.buildFromTemplate([]))

  // 개발 모드에서 React DevTools 설치
  if (is.dev) {
    try {
      await installExtension(REACT_DEVELOPER_TOOLS)
      console.log('[Main] React DevTools installed')
    } catch (err) {
      console.error('[Main] Failed to install React DevTools:', err)
    }
  }

  // F12로 DevTools 토글 (개발 모드에서만)
  app.on('browser-window-created', (_, window) => {
    if (is.dev) {
      window.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'F12') {
          window.webContents.toggleDevTools()
          event.preventDefault()
        }
      })
    }
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Server IPC handlers
  ipcMain.handle('server:start', async (_, config: { host: string; port: number }) => {
    try {
      if (droneServer?.isRunning()) {
        await droneServer.stop()
      }

      droneServer = new DroneServer({
        ...config,
        basePosition: DEFAULT_BASE_POSITION
      })

      droneServer.on('clientConnected', (count) => {
        if (!isQuitting && mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('server:client-count', count)
        }
      })

      droneServer.on('clientDisconnected', (count) => {
        if (!isQuitting && mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('server:client-count', count)
        }
      })

      droneServer.on('configUpdate', (payload) => {
        if (!isQuitting && mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('server:config-updated', payload)
        }
      })

      await droneServer.start()
      return { success: true }
    } catch (error) {
      console.error('[Main] Failed to start server:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('server:stop', async () => {
    try {
      if (droneServer) {
        await droneServer.stop()
        droneServer = null
      }
      return { success: true }
    } catch (error) {
      console.error('[Main] Failed to stop server:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('server:status', () => {
    return {
      running: droneServer?.isRunning() ?? false,
      clientCount: droneServer?.getClientCount() ?? 0
    }
  })

  ipcMain.handle('server:broadcast', (_, message: { type: string; payload?: unknown }) => {
    if (droneServer?.isRunning()) {
      droneServer.broadcast(message)
      return { success: true }
    }
    return { success: false, error: 'Server is not running' }
  })

  createWindow()

  // Register global shortcuts for Ctrl+1,2,3,4
  for (let i = 1; i <= 4; i++) {
    globalShortcut.register(`CommandOrControl+${i}`, () => {
      if (mainWindow) {
        mainWindow.webContents.send('switch-tab', i)
      }
    })
  }

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Handle app closing - set flag before cleanup
app.on('before-quit', () => {
  isQuitting = true
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  isQuitting = true

  // Stop server before quitting (fire and forget)
  if (droneServer?.isRunning()) {
    droneServer.stop().catch(() => {})
  }

  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
