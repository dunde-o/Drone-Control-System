import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

import { APIProvider, Map, MapMouseEvent, useMap } from '@vis.gl/react-google-maps'

import { useApiKey, useBaseMovement, useBasePosition, useDrones } from '@renderer/hooks/queries'
import { useWebSocket } from '@renderer/contexts/WebSocketContext'
import { Drone } from '@renderer/contexts/WebSocketContext/types'
import ConfirmDialog from '@renderer/components/ConfirmDialog'
import Drawer from '@renderer/components/Drawer'
import MarkerInfoDrawer from '@renderer/components/MarkerInfoDrawer'
import DronePath from '@renderer/components/DronePath'
import BaseMarker from '@renderer/components/markers/BaseMarker'
import DroneMarker from '@renderer/components/markers/DroneMarker'
import MovementPath from '@renderer/components/MovementPath'
import TabContent from '@renderer/components/tabs'
import { TABS } from '@renderer/components/tabs/constants'

import { DEFAULT_MAP_CENTER } from './constants'

interface MapControllerProps {
  onPanToBase: (panTo: (position: { lat: number; lng: number }) => void) => void
  onDroneMove: (droneId: string, lat: number, lng: number, append: boolean) => void
}

const MapController = ({ onPanToBase, onDroneMove }: MapControllerProps): null => {
  const map = useMap()

  useEffect(() => {
    if (!map) return

    onPanToBase((position) => {
      map.panTo(position)
      map.setZoom(15)
    })
  }, [map, onPanToBase])

  // 드론 이동 요청 이벤트 처리
  useEffect(() => {
    if (!map) return

    const handleDroneMoveRequest = (e: CustomEvent): void => {
      const { clientX, clientY, droneId, append } = e.detail

      // 맵 컨테이너의 위치 가져오기
      const mapDiv = map.getDiv()
      const rect = mapDiv.getBoundingClientRect()

      // 화면 좌표를 맵 컨테이너 내 상대 좌표로 변환
      const x = clientX - rect.left
      const y = clientY - rect.top

      // 맵 projection을 사용해 화면 좌표를 위경도로 변환
      const projection = map.getProjection()
      if (!projection) return

      const bounds = map.getBounds()
      if (!bounds) return

      const ne = bounds.getNorthEast()
      const sw = bounds.getSouthWest()
      const topRight = projection.fromLatLngToPoint(ne)
      const bottomLeft = projection.fromLatLngToPoint(sw)

      if (!topRight || !bottomLeft) return

      const scale = Math.pow(2, map.getZoom() || 0)
      const worldPoint = new google.maps.Point(
        bottomLeft.x + (((x / scale) * (topRight.x - bottomLeft.x)) / rect.width) * scale,
        topRight.y + (((y / scale) * (bottomLeft.y - topRight.y)) / rect.height) * scale
      )

      const latLng = projection.fromPointToLatLng(worldPoint)
      if (!latLng) return

      onDroneMove(droneId, latLng.lat(), latLng.lng(), append)
    }

    window.addEventListener('drone-move-request', handleDroneMoveRequest as EventListener)
    return () => {
      window.removeEventListener('drone-move-request', handleDroneMoveRequest as EventListener)
    }
  }, [map, onDroneMove])

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

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    type: 'takeoff' | 'land' | null
    droneId: string | null
    droneName: string | null
  }>({ isOpen: false, type: null, droneId: null, droneName: null })

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

  // 선택된 드론 (hovering, moving, returning 상태만 이동 명령 가능)
  const selectedDrone = useMemo(() => {
    if (!selectedMarkerId || selectedMarkerId === 'base') return null
    const drone = drones.find((d) => d.id === selectedMarkerId)
    if (drone && ['hovering', 'moving', 'returning', 'returning_auto'].includes(drone.status)) {
      return drone
    }
    return null
  }, [selectedMarkerId, drones])

  // 드론 선택 시 맵 커서 변경
  useEffect(() => {
    if (selectedDrone) {
      document.body.classList.add('drone-selected')
    } else {
      document.body.classList.remove('drone-selected')
    }
  }, [selectedDrone])

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

  // 드론 위치로 이동하고 드론 선택
  const handleLocateDrone = useCallback(
    (droneId: string): void => {
      const drone = drones.find((d) => d.id === droneId)
      if (drone && panToRef.current) {
        panToRef.current(drone.position)
        setSelectedMarkerId(droneId)
      }
    },
    [drones]
  )

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

  const { sendMessage } = useWebSocket()

  // 드론 이륙 요청 (확인 팝업 표시)
  const handleTakeoffRequest = useCallback(
    (droneId: string): void => {
      const drone = drones.find((d) => d.id === droneId)
      if (drone) {
        setConfirmDialog({
          isOpen: true,
          type: 'takeoff',
          droneId,
          droneName: drone.name
        })
      }
    },
    [drones]
  )

  // 드론 착륙 요청 (확인 팝업 표시)
  const handleLandRequest = useCallback(
    (droneId: string): void => {
      const drone = drones.find((d) => d.id === droneId)
      if (drone) {
        setConfirmDialog({
          isOpen: true,
          type: 'land',
          droneId,
          droneName: drone.name
        })
      }
    },
    [drones]
  )

  // 리턴투베이스 (확인 없이 바로 실행)
  const handleReturnToBase = useCallback(
    (droneId: string): void => {
      sendMessage({
        type: 'drone:returnToBase',
        payload: { droneId }
      })
    },
    [sendMessage]
  )

  // 확인 팝업에서 확인 클릭
  const handleConfirmAction = useCallback((): void => {
    if (confirmDialog.droneId && confirmDialog.type) {
      sendMessage({
        type: confirmDialog.type === 'takeoff' ? 'drone:takeoff' : 'drone:land',
        payload: { droneId: confirmDialog.droneId }
      })
    }
    setConfirmDialog({ isOpen: false, type: null, droneId: null, droneName: null })
  }, [confirmDialog, sendMessage])

  // 확인 팝업에서 취소 클릭
  const handleCancelConfirm = useCallback((): void => {
    setConfirmDialog({ isOpen: false, type: null, droneId: null, droneName: null })
  }, [])

  // 맵 우클릭으로 드론 이동 명령
  const handleMapContextMenu = useCallback(
    (e: MouseEvent): void => {
      if (!selectedDrone) return

      // Google Maps 컨테이너인지 확인
      const target = e.target as HTMLElement
      if (!target.closest('.gm-style')) return

      e.preventDefault()

      // 맵 좌표 계산은 MapController에서 처리해야 하므로
      // 커스텀 이벤트로 전달
      const customEvent = new CustomEvent('drone-move-request', {
        detail: {
          clientX: e.clientX,
          clientY: e.clientY,
          droneId: selectedDrone.id,
          append: e.shiftKey
        }
      })
      window.dispatchEvent(customEvent)
    },
    [selectedDrone]
  )

  // 우클릭 이벤트 리스너 등록
  useEffect(() => {
    document.addEventListener('contextmenu', handleMapContextMenu)
    return () => document.removeEventListener('contextmenu', handleMapContextMenu)
  }, [handleMapContextMenu])

  // 드론 이동 명령 처리
  const handleDroneMove = useCallback(
    (droneId: string, lat: number, lng: number, append: boolean): void => {
      sendMessage({
        type: 'drone:move',
        payload: {
          droneId,
          waypoints: [{ lat, lng }],
          append
        }
      })
    },
    [sendMessage]
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
        {drones.map((drone) =>
          drone.waypoints.length > 0 ? <DronePath key={`path-${drone.id}`} drone={drone} /> : null
        )}
        <MapController onPanToBase={handleSetPanTo} onDroneMove={handleDroneMove} />
      </Map>

      <MarkerInfoDrawer
        marker={selectedMarker}
        onClose={handleCloseMarkerInfo}
        onTakeoff={handleTakeoffRequest}
        onLand={handleLandRequest}
        onReturnToBase={handleReturnToBase}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.type === 'takeoff' ? '이륙 확인' : '착륙 확인'}
        message={
          confirmDialog.type === 'takeoff'
            ? `${confirmDialog.droneName}을(를) 이륙시키시겠습니까?`
            : `${confirmDialog.droneName}을(를) 현재 위치에 착륙시키시겠습니까?`
        }
        confirmText={confirmDialog.type === 'takeoff' ? '이륙' : '착륙'}
        cancelText="취소"
        variant={confirmDialog.type === 'land' ? 'danger' : 'primary'}
        onConfirm={handleConfirmAction}
        onCancel={handleCancelConfirm}
      />

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
            onPanToBase: handlePanToBase,
            onTakeoff: handleTakeoffRequest,
            onLand: handleLandRequest,
            onReturnToBase: handleReturnToBase,
            onLocateDrone: handleLocateDrone
          }}
        />
      </Drawer>
    </APIProvider>
  )
}

export default App
