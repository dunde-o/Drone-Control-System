import { useState, useEffect, useRef, useCallback } from 'react'

import { APIProvider, Map, MapMouseEvent, useMap } from '@vis.gl/react-google-maps'

import { useApiKey, useBaseMovement, useBasePosition } from '@renderer/hooks/queries'
import { useWebSocket } from '@renderer/contexts/WebSocketContext'
import { Drone } from '@renderer/contexts/WebSocketContext/types'
import ConfirmDialog from '@renderer/components/ConfirmDialog'
import Drawer from '@renderer/components/Drawer'
import DroneMarkersLayer from '@renderer/components/DroneMarkersLayer'
import BaseMarker from '@renderer/components/markers/BaseMarker'
import MovementPath from '@renderer/components/MovementPath'
import SelectedMarkerInfo from '@renderer/components/SelectedMarkerInfo'
import TabContent from '@renderer/components/tabs'
import { TABS } from '@renderer/components/tabs/constants'
import { Cluster } from '@renderer/utils/mapClustering'

import { DEFAULT_MAP_CENTER } from './constants'

interface MapControllerProps {
  onPanToBase: (panTo: (position: { lat: number; lng: number }) => void) => void
  onDroneMove: (droneId: string, lat: number, lng: number, append: boolean) => void
  onMapStateChange: (zoom: number, bounds: google.maps.LatLngBounds | null) => void
}

const MapController = ({
  onPanToBase,
  onDroneMove,
  onMapStateChange
}: MapControllerProps): null => {
  const map = useMap()

  useEffect(() => {
    if (!map) return

    onPanToBase((position) => {
      map.panTo(position)
      map.setZoom(15)
    })
  }, [map, onPanToBase])

  // 줌/바운드 변경 감지
  useEffect(() => {
    if (!map) return

    const updateMapState = (): void => {
      const zoom = map.getZoom() ?? 12
      const bounds = map.getBounds() ?? null
      onMapStateChange(zoom, bounds)
    }

    // 초기 상태
    updateMapState()

    // 이벤트 리스너
    const zoomListener = map.addListener('zoom_changed', updateMapState)
    const boundsListener = map.addListener('bounds_changed', updateMapState)

    return () => {
      google.maps.event.removeListener(zoomListener)
      google.maps.event.removeListener(boundsListener)
    }
  }, [map, onMapStateChange])

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
    type: 'takeoff' | 'land' | 'allTakeoff' | 'allReturnToBase' | 'allRandomMove' | null
    droneId: string | null
    droneName: string | null
    onBulkConfirm?: () => void
  }>({ isOpen: false, type: null, droneId: null, droneName: null })

  // Path visibility state (드론별 경로 표시 여부)
  const [pathVisibility, setPathVisibility] = useState<Record<string, boolean>>({})

  // Map state for clustering
  const [mapZoom, setMapZoom] = useState(12)
  const [mapBounds, setMapBounds] = useState<google.maps.LatLngBounds | null>(null)

  // Refs for closures
  const activeTabRef = useRef(activeTab)
  const drawerOpenRef = useRef(drawerOpen)
  const panToRef = useRef<((position: { lat: number; lng: number }) => void) | null>(null)

  // Selected drone for context menu (set by DroneMarkersLayer)
  const [selectedDrone, setSelectedDrone] = useState<Drone | null>(null)

  // React Query hooks
  const { apiKey } = useApiKey()
  const { data: basePosition } = useBasePosition()
  const { data: baseMovement } = useBaseMovement()


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

  const handleDroneMarkerClick = useCallback((droneId: string): void => {
    setSelectedMarkerId(droneId)
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
      setSelectedMarkerId('base')
    }
  }, [basePosition])

  // 드론 위치로 이동하고 드론 선택
  const handleLocateDrone = useCallback((droneId: string): void => {
    const helpers = (window as unknown as Record<string, unknown>).__droneHelpers as
      | { locateDrone: (id: string) => void }
      | undefined
    if (helpers?.locateDrone) {
      helpers.locateDrone(droneId)
    }
    setSelectedMarkerId(droneId)
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

  const { sendMessage } = useWebSocket()

  // 드론 이륙/착륙 확인 다이얼로그 표시 (SelectedMarkerInfo, MainTab에서 호출)
  const handleShowDroneConfirmDialog = useCallback(
    (type: 'takeoff' | 'land', droneId: string, droneName: string): void => {
      setConfirmDialog({
        isOpen: true,
        type,
        droneId,
        droneName
      })
    },
    []
  )

  // 드론 이륙 요청 (MainTab에서 호출)
  const handleTakeoffRequest = useCallback(
    (droneId: string, droneName: string): void => {
      handleShowDroneConfirmDialog('takeoff', droneId, droneName)
    },
    [handleShowDroneConfirmDialog]
  )

  // 드론 착륙 요청 (MainTab에서 호출)
  const handleLandRequest = useCallback(
    (droneId: string, droneName: string): void => {
      handleShowDroneConfirmDialog('land', droneId, droneName)
    },
    [handleShowDroneConfirmDialog]
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
    // Bulk 액션 처리
    if (confirmDialog.onBulkConfirm) {
      confirmDialog.onBulkConfirm()
    } else if (confirmDialog.droneId && confirmDialog.type) {
      // 개별 드론 액션 처리
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

  // Bulk 액션 확인 다이얼로그 표시 (서버 전체 명령 호출)
  const handleShowBulkConfirmDialog = useCallback(
    (type: 'allTakeoff' | 'allReturnToBase' | 'allRandomMove'): void => {
      setConfirmDialog({
        isOpen: true,
        type,
        droneId: null,
        droneName: null,
        onBulkConfirm: () => {
          // 서버에 전체 명령 전송
          sendMessage({
            type:
              type === 'allTakeoff'
                ? 'drone:allTakeoff'
                : type === 'allReturnToBase'
                  ? 'drone:allReturnToBase'
                  : 'drone:allRandomMove'
          })
        }
      })
    },
    [sendMessage]
  )

  // 개별 드론 경로 표시 토글
  const handleTogglePath = useCallback((droneId: string): void => {
    setPathVisibility((prev) => ({
      ...prev,
      [droneId]: !prev[droneId]
    }))
  }, [])

  // 전체 드론 경로 표시 토글
  const handleToggleAllPaths = useCallback((show: boolean): void => {
    const helpers = (window as unknown as Record<string, unknown>).__droneHelpers as
      | { getAllDroneIds: () => string[] }
      | undefined
    const droneIds = helpers?.getAllDroneIds?.() ?? []
    const newVisibility: Record<string, boolean> = {}
    droneIds.forEach((id) => {
      newVisibility[id] = show
    })
    setPathVisibility(newVisibility)
  }, [])

  // 맵 상태 변경 핸들러
  const handleMapStateChange = useCallback(
    (zoom: number, bounds: google.maps.LatLngBounds | null): void => {
      setMapZoom(zoom)
      setMapBounds(bounds)
    },
    []
  )

  // 클러스터 클릭 시 확대
  const handleClusterClick = useCallback((cluster: Cluster): void => {
    if (panToRef.current) {
      panToRef.current(cluster.center)
    }
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
    <APIProvider key={apiKey} apiKey={apiKey}>
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
            isSelected={selectedMarkerId === 'base'}
            onClick={handleBaseMarkerClick}
          />
        )}
        <DroneMarkersLayer
          mapZoom={mapZoom}
          mapBounds={mapBounds}
          selectedMarkerId={selectedMarkerId}
          pathVisibility={pathVisibility}
          panToRef={panToRef}
          onDroneMarkerClick={handleDroneMarkerClick}
          onClusterClick={handleClusterClick}
          onSelectedDroneChange={setSelectedDrone}
        />
        {baseMovement && <MovementPath movement={baseMovement} />}
        <MapController
          onPanToBase={handleSetPanTo}
          onDroneMove={handleDroneMove}
          onMapStateChange={handleMapStateChange}
        />
      </Map>

      <SelectedMarkerInfo
        selectedMarkerId={selectedMarkerId}
        onClose={handleCloseMarkerInfo}
        onShowConfirmDialog={handleShowDroneConfirmDialog}
        isPickingBase={isPickingBase}
        onTogglePickBase={handleTogglePickBase}
        pickingLat={pickingLat}
        pickingLng={pickingLng}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={
          confirmDialog.type === 'takeoff'
            ? '이륙 확인'
            : confirmDialog.type === 'land'
              ? '착륙 확인'
              : confirmDialog.type === 'allTakeoff'
                ? '전체 이륙 확인'
                : confirmDialog.type === 'allReturnToBase'
                  ? '전체 복귀 확인'
                  : confirmDialog.type === 'allRandomMove'
                    ? '전체 랜덤 이동 확인'
                    : '확인'
        }
        message={
          confirmDialog.type === 'takeoff'
            ? `${confirmDialog.droneName}을(를) 이륙시키시겠습니까?`
            : confirmDialog.type === 'land'
              ? `${confirmDialog.droneName}을(를) 현재 위치에 착륙시키시겠습니까?`
              : confirmDialog.type === 'allTakeoff'
                ? '대기 중인 모든 드론을 이륙시키시겠습니까?'
                : confirmDialog.type === 'allReturnToBase'
                  ? '비행 중인 모든 드론을 베이스로 복귀시키시겠습니까?'
                  : confirmDialog.type === 'allRandomMove'
                    ? '비행 중인 모든 드론을 베이스 기준 5~10km 반경 내 랜덤 위치로 이동시키시겠습니까?'
                    : ''
        }
        confirmText={
          confirmDialog.type === 'takeoff' || confirmDialog.type === 'allTakeoff'
            ? '이륙'
            : confirmDialog.type === 'land'
              ? '착륙'
              : confirmDialog.type === 'allReturnToBase'
                ? '복귀'
                : confirmDialog.type === 'allRandomMove'
                  ? '이동'
                  : '확인'
        }
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
            onPanToBase: handlePanToBase,
            onTakeoff: handleTakeoffRequest,
            onLand: handleLandRequest,
            onReturnToBase: handleReturnToBase,
            onLocateDrone: handleLocateDrone,
            onShowConfirmDialog: handleShowBulkConfirmDialog,
            pathVisibility,
            onTogglePath: handleTogglePath,
            onToggleAllPaths: handleToggleAllPaths
          }}
        />
      </Drawer>
    </APIProvider>
  )
}

export default App
