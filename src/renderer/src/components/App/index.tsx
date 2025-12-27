import { useState, useEffect, useRef, useCallback } from 'react'

import { APIProvider, Map, MapMouseEvent } from '@vis.gl/react-google-maps'

import { useApiKey, useBasePosition } from '@renderer/hooks/queries'
import Drawer from '@renderer/components/Drawer'
import MarkerInfoDrawer, { MarkerInfo } from '@renderer/components/MarkerInfoDrawer'
import BaseMarker from '@renderer/components/markers/BaseMarker'
import TabContent from '@renderer/components/tabs'
import { TABS } from '@renderer/components/tabs/constants'

import { DEFAULT_MAP_CENTER } from './constants'

const App = (): React.JSX.Element => {
  // UI state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('main')
  const [selectedMarker, setSelectedMarker] = useState<MarkerInfo | null>(null)

  // Map picking state
  const [isPickingBase, setIsPickingBase] = useState(false)
  const [pickingLat, setPickingLat] = useState('')
  const [pickingLng, setPickingLng] = useState('')

  // Refs for closures
  const activeTabRef = useRef(activeTab)
  const drawerOpenRef = useRef(drawerOpen)

  // React Query hooks
  const { apiKey } = useApiKey()
  const { data: basePosition } = useBasePosition()

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
            pickingLng
          }}
        />
      </Drawer>
    </APIProvider>
  )
}

export default App
