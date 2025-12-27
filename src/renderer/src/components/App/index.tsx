import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

import { APIProvider, Map, MapMouseEvent, useMap } from '@vis.gl/react-google-maps'

import { useApiKey, useBaseMovement, useBasePosition, useDrones } from '@renderer/hooks/queries'
import { Drone } from '@renderer/contexts/WebSocketContext/types'
import Drawer from '@renderer/components/Drawer'
import MarkerInfoDrawer from '@renderer/components/MarkerInfoDrawer'
import BaseMarker from '@renderer/components/markers/BaseMarker'
import DroneMarker from '@renderer/components/markers/DroneMarker'
import MovementPath from '@renderer/components/MovementPath'
import TabContent from '@renderer/components/tabs'
import { TABS } from '@renderer/components/tabs/constants'

import { DEFAULT_MAP_CENTER } from './constants'

interface MapControllerProps {
  onPanToBase: (panTo: (position: { lat: number; lng: number }) => void) => void
}

const MapController = ({ onPanToBase }: MapControllerProps): null => {
  const map = useMap()

  useEffect(() => {
    if (!map) return

    onPanToBase((position) => {
      map.panTo(position)
      map.setZoom(15)
    })
  }, [map, onPanToBase])

  return null
}

const App = (): React.JSX.Element => {
  // UI state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('main')
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null)

  // Map picking state
  const [isPickingBase, setIsPickingBase] = useState(false)
  const [pickingLat, setPickingLat] = useState('')
  const [pickingLng, setPickingLng] = useState('')

  // Refs for closures
  const activeTabRef = useRef(activeTab)
  const drawerOpenRef = useRef(drawerOpen)
  const panToRef = useRef<((position: { lat: number; lng: number }) => void) | null>(null)

  // React Query hooks
  const { apiKey } = useApiKey()
  const { data: basePosition } = useBasePosition()
  const { data: baseMovement } = useBaseMovement()
  const { data: drones = [] } = useDrones()

  // Compute selected marker info from real-time data
  const selectedMarker = useMemo(() => {
    if (!selectedMarkerId) return null

    if (selectedMarkerId === 'base' && basePosition) {
      return {
        id: 'base' as const,
        type: 'base' as const,
        name: 'Base Station',
        position: basePosition
      }
    }

    const drone = drones.find((d) => d.id === selectedMarkerId)
    if (drone) {
      return {
        id: drone.id,
        type: 'drone' as const,
        name: drone.name,
        position: drone.position,
        status: drone.status,
        battery: drone.battery,
        altitude: drone.altitude
      }
    }

    return null
  }, [selectedMarkerId, basePosition, drones])

  useEffect(() => {
    activeTabRef.current = activeTab
    drawerOpenRef.current = drawerOpen
  }, [activeTab, drawerOpen])

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

  const handleTogglePickBase = (): void => {
    if (isPickingBase) {
      // Cancel: reset picking coords
      setPickingLat('')
      setPickingLng('')
      setIsPickingBase(false)
    } else {
      // Start picking
      setIsPickingBase(true)
    }
  }

  const handleMapClick = useCallback(
    (e: MapMouseEvent): void => {
      if (isPickingBase && e.detail.latLng) {
        const lat = e.detail.latLng.lat
        const lng = e.detail.latLng.lng
        setPickingLat(String(lat))
        setPickingLng(String(lng))
        setIsPickingBase(false)
      } else {
        setSelectedMarkerId(null)
      }
    },
    [isPickingBase]
  )

  const handleBaseMarkerClick = useCallback((): void => {
    setSelectedMarkerId('base')
  }, [])

  const handleDroneMarkerClick = useCallback((drone: Drone): void => {
    setSelectedMarkerId(drone.id)
  }, [])

  const handleCloseMarkerInfo = useCallback((): void => {
    setSelectedMarkerId(null)
  }, [])

  const handleSetPanTo = useCallback(
    (panTo: (position: { lat: number; lng: number }) => void): void => {
      panToRef.current = panTo
    },
    []
  )

  const handlePanToBase = useCallback((): void => {
    if (basePosition && panToRef.current) {
      panToRef.current(basePosition)
    }
  }, [basePosition])

  const handleMapMouseMove = useCallback(
    (e: MapMouseEvent): void => {
      if (isPickingBase && e.detail.latLng) {
        const lat = e.detail.latLng.lat
        const lng = e.detail.latLng.lng
        setPickingLat(String(lat))
        setPickingLng(String(lng))
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
        {drones.map((drone) => (
          <DroneMarker
            key={drone.id}
            drone={drone}
            isSelected={selectedMarker?.id === drone.id}
            onClick={() => handleDroneMarkerClick(drone)}
          />
        ))}
        {baseMovement && <MovementPath movement={baseMovement} />}
        <MapController onPanToBase={handleSetPanTo} />
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
          mainTabProps={{
            isPickingBase,
            onTogglePickBase: handleTogglePickBase,
            pickingLat,
            pickingLng,
            onPanToBase: handlePanToBase
          }}
        />
      </Drawer>
    </APIProvider>
  )
}

export default App
