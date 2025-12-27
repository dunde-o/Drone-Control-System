import { useState, useEffect, useRef, ChangeEvent, useCallback } from 'react'

import { APIProvider, Map, MapMouseEvent } from '@vis.gl/react-google-maps'

import Drawer from '../Drawer'
import MarkerInfoDrawer, { MarkerInfo } from '../MarkerInfoDrawer'
import BaseMarker from '../markers/BaseMarker'
import TabContent from '../tabs'
import { TABS } from '../tabs/constants'

import {
  DEFAULT_API_KEY,
  DEFAULT_MAP_CENTER,
  DEFAULT_SERVER_HOST,
  DEFAULT_SERVER_PORT
} from './constants'

interface BasePosition {
  lat: number
  lng: number
}

const App = (): React.JSX.Element => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('main')
  const [apiKey, setApiKey] = useState(DEFAULT_API_KEY)
  const [apiKeyInput, setApiKeyInput] = useState(DEFAULT_API_KEY)
  const [basePosition, setBasePosition] = useState<BasePosition | null>(null)
  const [baseLatInput, setBaseLatInput] = useState('')
  const [baseLngInput, setBaseLngInput] = useState('')
  const [baseLatServer, setBaseLatServer] = useState('')
  const [baseLngServer, setBaseLngServer] = useState('')
  const [isPickingBase, setIsPickingBase] = useState(false)
  const [savedBaseInputs, setSavedBaseInputs] = useState({ lat: '', lng: '' })
  const [selectedMarker, setSelectedMarker] = useState<MarkerInfo | null>(null)
  const [serverHost, setServerHost] = useState(DEFAULT_SERVER_HOST)
  const [serverPort, setServerPort] = useState(DEFAULT_SERVER_PORT)
  const [isServerRunning, setIsServerRunning] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<
    'disconnected' | 'connected' | 'connecting'
  >('disconnected')
  const [showHeartbeatLog, setShowHeartbeatLog] = useState(false)
  const [isBaseUpdating, setIsBaseUpdating] = useState(false)
  const [baseMoveDurationInput, setBaseMoveDurationInput] = useState('')
  const [baseMoveDurationServer, setBaseMoveDurationServer] = useState('')
  const [heartbeatIntervalInput, setHeartbeatIntervalInput] = useState('')
  const [heartbeatIntervalServer, setHeartbeatIntervalServer] = useState('')
  const [isBaseMoveDurationUpdating, setIsBaseMoveDurationUpdating] = useState(false)
  const [isHeartbeatIntervalUpdating, setIsHeartbeatIntervalUpdating] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const heartbeatFailCountRef = useRef(0)
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const showHeartbeatLogRef = useRef(showHeartbeatLog)
  const activeTabRef = useRef(activeTab)
  const drawerOpenRef = useRef(drawerOpen)

  const isBaseEnabled = connectionStatus === 'connected'

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

          // Only update data on init heartbeat (first message after connection)
          if (message.payload?.init) {
            // Update base position
            if (message.payload?.basePosition) {
              const { lat, lng } = message.payload.basePosition
              const latStr = String(lat)
              const lngStr = String(lng)
              setBasePosition({ lat, lng })
              setBaseLatInput(latStr)
              setBaseLngInput(lngStr)
              setBaseLatServer(latStr)
              setBaseLngServer(lngStr)
            }

            // Update config
            if (message.payload?.config) {
              const { baseMoveDuration, heartbeatInterval } = message.payload.config
              if (typeof baseMoveDuration === 'number') {
                const durationStr = String(baseMoveDuration)
                setBaseMoveDurationInput(durationStr)
                setBaseMoveDurationServer(durationStr)
              }
              if (typeof heartbeatInterval === 'number') {
                const intervalStr = String(heartbeatInterval)
                setHeartbeatIntervalInput(intervalStr)
                setHeartbeatIntervalServer(intervalStr)
              }
            }
          }

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
        } else if (message.type === 'basePosition:updated') {
          // Handle base position update response
          console.info('[Client] Base position updated:', message.payload)
          const { lat, lng } = message.payload
          const latStr = String(lat)
          const lngStr = String(lng)
          setBasePosition({ lat, lng })
          setBaseLatInput(latStr)
          setBaseLngInput(lngStr)
          setBaseLatServer(latStr)
          setBaseLngServer(lngStr)
          setIsBaseUpdating(false)
        } else if (message.type === 'basePosition:moving') {
          console.info('[Client] Base position moving:', message.payload)
        } else if (message.type === 'basePosition:error') {
          console.error('[Client] Base position update failed:', message.payload)
          setIsBaseUpdating(false)
        } else if (message.type === 'baseMoveDuration:updated') {
          console.info('[Client] Base move duration updated:', message.payload)
          const { duration } = message.payload
          const durationStr = String(duration)
          setBaseMoveDurationInput(durationStr)
          setBaseMoveDurationServer(durationStr)
          setIsBaseMoveDurationUpdating(false)
        } else if (message.type === 'baseMoveDuration:error') {
          console.error('[Client] Base move duration update failed:', message.payload)
          setIsBaseMoveDurationUpdating(false)
        } else if (message.type === 'heartbeatInterval:updated') {
          console.info('[Client] Heartbeat interval updated:', message.payload)
          const { interval } = message.payload
          const intervalStr = String(interval)
          setHeartbeatIntervalInput(intervalStr)
          setHeartbeatIntervalServer(intervalStr)
          setIsHeartbeatIntervalUpdating(false)
        } else if (message.type === 'heartbeatInterval:error') {
          console.error('[Client] Heartbeat interval update failed:', message.payload)
          setIsHeartbeatIntervalUpdating(false)
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
      // Clear all server values when disconnected
      setBasePosition(null)
      setBaseLatInput('')
      setBaseLngInput('')
      setBaseLatServer('')
      setBaseLngServer('')
      setBaseMoveDurationInput('')
      setBaseMoveDurationServer('')
      setHeartbeatIntervalInput('')
      setHeartbeatIntervalServer('')
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
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return

    const lat = parseFloat(baseLatInput)
    const lng = parseFloat(baseLngInput)
    if (isNaN(lat) || isNaN(lng)) return

    setIsBaseUpdating(true)
    wsRef.current.send(
      JSON.stringify({
        type: 'basePosition:update',
        payload: { lat, lng }
      })
    )
  }

  const handleChangeBaseMoveDurationInput = (e: ChangeEvent<HTMLInputElement>): void => {
    setBaseMoveDurationInput(e.target.value)
  }

  const handleApplyBaseMoveDuration = (): void => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return

    const duration = parseInt(baseMoveDurationInput, 10)
    if (isNaN(duration) || duration < 0) return

    setIsBaseMoveDurationUpdating(true)
    wsRef.current.send(
      JSON.stringify({
        type: 'baseMoveDuration:update',
        payload: { duration }
      })
    )
  }

  const handleChangeHeartbeatIntervalInput = (e: ChangeEvent<HTMLInputElement>): void => {
    setHeartbeatIntervalInput(e.target.value)
  }

  const handleApplyHeartbeatInterval = (): void => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return

    const interval = parseInt(heartbeatIntervalInput, 10)
    if (isNaN(interval) || interval < 1000) return

    setIsHeartbeatIntervalUpdating(true)
    wsRef.current.send(
      JSON.stringify({
        type: 'heartbeatInterval:update',
        payload: { interval }
      })
    )
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
    if (!basePosition) return
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
        defaultCenter={DEFAULT_MAP_CENTER}
        defaultZoom={12}
        gestureHandling="greedy"
        disableDefaultUI
        mapId="drone-control-map"
        clickableIcons={false}
        onClick={handleMapClick}
        onMousemove={handleMapMouseMove}
      >
        {basePosition && (
          <BaseMarker
            position={basePosition}
            isSelected={selectedMarker?.id === 'base'}
            onClick={handleBaseMarkerClick}
          />
        )}
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
            baseLatServer,
            baseLngServer,
            onBaseLatChange: handleChangeBaseLatInput,
            onBaseLngChange: handleChangeBaseLngInput,
            onApplyBase: handleApplyBase,
            isPickingBase,
            onTogglePickBase: handleTogglePickBase,
            isBaseEnabled,
            isBaseUpdating,
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
            onToggleHeartbeatLog: () => setShowHeartbeatLog((prev) => !prev),
            baseMoveDuration: baseMoveDurationInput,
            baseMoveDurationServer,
            onBaseMoveDurationChange: handleChangeBaseMoveDurationInput,
            onApplyBaseMoveDuration: handleApplyBaseMoveDuration,
            isBaseMoveDurationUpdating,
            heartbeatInterval: heartbeatIntervalInput,
            heartbeatIntervalServer,
            onHeartbeatIntervalChange: handleChangeHeartbeatIntervalInput,
            onApplyHeartbeatInterval: handleApplyHeartbeatInterval,
            isHeartbeatIntervalUpdating
          }}
        />
      </Drawer>
    </APIProvider>
  )
}

export default App
