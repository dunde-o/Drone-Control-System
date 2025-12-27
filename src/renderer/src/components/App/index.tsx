import { useState, useEffect, useRef, ChangeEvent, useCallback } from 'react'

import { APIProvider, Map, MapMouseEvent } from '@vis.gl/react-google-maps'

import Drawer from '../Drawer'
import MarkerInfoDrawer, { MarkerInfo } from '../MarkerInfoDrawer'
import BaseMarker from '../markers/BaseMarker'
import TabContent from '../tabs'
import { TABS } from '../tabs/constants'

import {
  DEFAULT_API_KEY,
  DEFAULT_BASE_POSITION,
  DEFAULT_SERVER_HOST,
  DEFAULT_SERVER_PORT
} from './constants'

const App = (): React.JSX.Element => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('main')
  const [apiKey, setApiKey] = useState(DEFAULT_API_KEY)
  const [apiKeyInput, setApiKeyInput] = useState(DEFAULT_API_KEY)
  const [basePosition, setBasePosition] = useState(DEFAULT_BASE_POSITION)
  const [baseLatInput, setBaseLatInput] = useState(String(DEFAULT_BASE_POSITION.lat))
  const [baseLngInput, setBaseLngInput] = useState(String(DEFAULT_BASE_POSITION.lng))
  const [isPickingBase, setIsPickingBase] = useState(false)
  const [savedBaseInputs, setSavedBaseInputs] = useState({ lat: '', lng: '' })
  const [selectedMarker, setSelectedMarker] = useState<MarkerInfo | null>(null)
  const [serverHost, setServerHost] = useState(DEFAULT_SERVER_HOST)
  const [serverPort, setServerPort] = useState(DEFAULT_SERVER_PORT)
  const [isServerRunning, setIsServerRunning] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connected' | 'connecting'>('disconnected')
  const [showHeartbeatLog, setShowHeartbeatLog] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const heartbeatFailCountRef = useRef(0)
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const showHeartbeatLogRef = useRef(showHeartbeatLog)
  const activeTabRef = useRef(activeTab)
  const drawerOpenRef = useRef(drawerOpen)

  useEffect(() => {
    activeTabRef.current = activeTab
    drawerOpenRef.current = drawerOpen
    showHeartbeatLogRef.current = showHeartbeatLog
  }, [activeTab, drawerOpen, showHeartbeatLog])

  useEffect(() => {
    if (isPickingBase) {
      document.body.classList.add('picking-base')
    } else {
      document.body.classList.remove('picking-base')
    }
  }, [isPickingBase])

  const handleToggleDrawerByTab = (tabId: string): (() => void) => {
    return (): void => {
      if (activeTab === tabId && drawerOpen) {
        setDrawerOpen(false)
      } else {
        setActiveTab(tabId)
        setDrawerOpen(true)
      }
    }
  }

  const handleChangeApiKeyInput = (e: ChangeEvent<HTMLInputElement>): void => {
    setApiKeyInput(e.target.value)
  }

  const handleApplyApiKey = (): void => {
    setApiKey(apiKeyInput)
  }

  const handleChangeServerHost = (e: ChangeEvent<HTMLInputElement>): void => {
    setServerHost(e.target.value)
  }

  const handleChangeServerPort = (e: ChangeEvent<HTMLInputElement>): void => {
    setServerPort(e.target.value)
  }

  const connectToServer = useCallback((): void => {
    if (wsRef.current) {
      wsRef.current.close()
    }

    setConnectionStatus('connecting')
    heartbeatFailCountRef.current = 0

    const ws = new WebSocket(`ws://${serverHost}:${serverPort}`)
    wsRef.current = ws

    ws.onopen = (): void => {
      console.info('[Client] Connected to server')
      setConnectionStatus('connected')
      heartbeatFailCountRef.current = 0
    }

    ws.onmessage = (event): void => {
      try {
        const message = JSON.parse(event.data)

        if (message.type === 'heartbeat') {
          if (showHeartbeatLogRef.current) {
            console.info('[Client] Received:', message)
          }
          // Reset fail count on successful heartbeat
          heartbeatFailCountRef.current = 0
          setConnectionStatus('connected')

          // Clear previous timeout
          if (heartbeatTimeoutRef.current) {
            clearTimeout(heartbeatTimeoutRef.current)
          }

          // Set timeout for next heartbeat (expect within 5 seconds)
          heartbeatTimeoutRef.current = setTimeout(() => {
            heartbeatFailCountRef.current += 1
            console.info('[Client] Heartbeat missed, fail count:', heartbeatFailCountRef.current)

            if (heartbeatFailCountRef.current >= 3) {
              console.info('[Client] 3 heartbeats missed, disconnecting')
              setConnectionStatus('disconnected')
              ws.close()
            }
          }, 5000)
        } else {
          // Log non-heartbeat messages always
          console.info('[Client] Received:', message)
        }
      } catch {
        console.error('[Client] Failed to parse message')
      }
    }

    ws.onerror = (): void => {
      console.error('[Client] WebSocket error')
      setConnectionStatus('disconnected')
    }

    ws.onclose = (): void => {
      console.info('[Client] Disconnected from server')
      wsRef.current = null
      if (heartbeatTimeoutRef.current) {
        clearTimeout(heartbeatTimeoutRef.current)
        heartbeatTimeoutRef.current = null
      }
    }
  }, [serverHost, serverPort])

  const disconnectFromServer = useCallback((): void => {
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current)
      heartbeatTimeoutRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setConnectionStatus('disconnected')
  }, [])

  const handleStartServer = async (): Promise<void> => {
    const result = await window.api.server.start({
      host: serverHost,
      port: parseInt(serverPort, 10)
    })
    if (result.success) {
      setIsServerRunning(true)
      // Connect to server after starting
      setTimeout(() => connectToServer(), 500)
    } else {
      console.error('Failed to start server:', result.error)
    }
  }

  const handleStopServer = async (): Promise<void> => {
    // Disconnect WebSocket client first
    disconnectFromServer()

    const result = await window.api.server.stop()
    if (result.success) {
      setIsServerRunning(false)
    } else {
      console.error('Failed to stop server:', result.error)
    }
  }

  const handleChangeBaseLatInput = (e: ChangeEvent<HTMLInputElement>): void => {
    setBaseLatInput(e.target.value)
  }

  const handleChangeBaseLngInput = (e: ChangeEvent<HTMLInputElement>): void => {
    setBaseLngInput(e.target.value)
  }

  const handleApplyBase = (): void => {
    const lat = parseFloat(baseLatInput)
    const lng = parseFloat(baseLngInput)
    if (!isNaN(lat) && !isNaN(lng)) {
      setBasePosition({ lat, lng })
    }
  }

  const handleTogglePickBase = (): void => {
    if (isPickingBase) {
      // 취소: 원래 값으로 복원
      setBaseLatInput(savedBaseInputs.lat)
      setBaseLngInput(savedBaseInputs.lng)
      setIsPickingBase(false)
    } else {
      // 시작: 현재 값 저장
      setSavedBaseInputs({ lat: baseLatInput, lng: baseLngInput })
      setIsPickingBase(true)
    }
  }

  const handleMapClick = useCallback(
    (e: MapMouseEvent): void => {
      if (isPickingBase && e.detail.latLng) {
        const lat = e.detail.latLng.lat
        const lng = e.detail.latLng.lng
        setBaseLatInput(String(lat))
        setBaseLngInput(String(lng))
        setIsPickingBase(false)
      } else {
        setSelectedMarker(null)
      }
    },
    [isPickingBase]
  )

  const handleBaseMarkerClick = useCallback((): void => {
    setSelectedMarker({
      id: 'base',
      type: 'base',
      name: 'Base Station',
      position: basePosition
    })
  }, [basePosition])

  const handleCloseMarkerInfo = useCallback((): void => {
    setSelectedMarker(null)
  }, [])

  const handleMapMouseMove = useCallback(
    (e: MapMouseEvent): void => {
      if (isPickingBase && e.detail.latLng) {
        const lat = e.detail.latLng.lat
        const lng = e.detail.latLng.lng
        setBaseLatInput(String(lat))
        setBaseLngInput(String(lng))
      }
    },
    [isPickingBase]
  )

  useEffect(() => {
    const handleToggleDrawerByKeyboard = (e: KeyboardEvent): void => {
      if (e.key === 'Tab') {
        e.preventDefault()
        setDrawerOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleToggleDrawerByKeyboard)

    window.api.onSwitchTab((tabIndex: number) => {
      if (tabIndex <= TABS.length) {
        const targetTabId = TABS[tabIndex - 1].id
        if (drawerOpenRef.current && activeTabRef.current === targetTabId) {
          setDrawerOpen(false)
        } else {
          setActiveTab(targetTabId)
          setDrawerOpen(true)
        }
      }
    })

    return () => window.removeEventListener('keydown', handleToggleDrawerByKeyboard)
  }, [])

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        style={{ width: '100%', height: '100%' }}
        defaultCenter={DEFAULT_BASE_POSITION}
        defaultZoom={12}
        gestureHandling="greedy"
        disableDefaultUI
        mapId="drone-control-map"
        clickableIcons={false}
        onClick={handleMapClick}
        onMousemove={handleMapMouseMove}
      >
        <BaseMarker
          position={basePosition}
          isSelected={selectedMarker?.id === 'base'}
          onClick={handleBaseMarkerClick}
        />
      </Map>

      <MarkerInfoDrawer marker={selectedMarker} onClose={handleCloseMarkerInfo} />

      <Drawer
        isOpen={drawerOpen}
        tabs={TABS}
        activeTabId={activeTab}
        onTabClick={handleToggleDrawerByTab}
      >
        <TabContent
          activeTabId={activeTab}
          tabProps={{
            baseLat: baseLatInput,
            baseLng: baseLngInput,
            currentBaseLat: basePosition.lat,
            currentBaseLng: basePosition.lng,
            onBaseLatChange: handleChangeBaseLatInput,
            onBaseLngChange: handleChangeBaseLngInput,
            onApplyBase: handleApplyBase,
            isPickingBase,
            onTogglePickBase: handleTogglePickBase,
            apiKeyInput,
            onApiKeyInputChange: handleChangeApiKeyInput,
            onApplyApiKey: handleApplyApiKey,
            serverHost,
            serverPort,
            onServerHostChange: handleChangeServerHost,
            onServerPortChange: handleChangeServerPort,
            isServerRunning,
            connectionStatus,
            onStartServer: handleStartServer,
            onStopServer: handleStopServer,
            showHeartbeatLog,
            onToggleHeartbeatLog: () => setShowHeartbeatLog((prev) => !prev)
          }}
        />
      </Drawer>
    </APIProvider>
  )
}

export default App
